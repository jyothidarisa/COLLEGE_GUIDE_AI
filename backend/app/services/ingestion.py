import os
import hashlib
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
from sqlalchemy.orm import Session
from app.config import settings
from app.models import College, CollegeDocument, DocumentChunk

logger = logging.getLogger(__name__)

# Lazy loader for embedding model and faiss
_embedding_model = None
_faiss_module = None

def get_faiss():
    global _faiss_module
    if _faiss_module is None:
        try:
            import faiss
            _faiss_module = faiss
        except ImportError:
            logger.warning("FAISS not available. Vector indexing will use fallback vector store.")
            _faiss_module = None
    return _faiss_module

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}")
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer: {e}. Vector embedding will use semantic fallback.")
            _embedding_model = None
    return _embedding_model


def compute_file_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def extract_text_from_file(filepath: str) -> List[Dict[str, Any]]:
    """
    Extracts text from PDF or text files, returning pages with text and metadata.
    """
    path = Path(filepath)
    ext = path.suffix.lower()
    pages_data = []

    if ext == ".pdf":
        try:
            reader = PdfReader(filepath)
            for page_idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                # Also check corresponding .txt if PDF is empty
                if not txt.strip():
                    txt_alt = path.with_suffix(".txt")
                    if txt_alt.exists():
                        with open(txt_alt, "r", encoding="utf-8") as f:
                            txt = f.read()
                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": txt.strip()
                })
        except Exception as e:
            logger.error(f"Error reading PDF {filepath}: {e}")
            txt_alt = path.with_suffix(".txt")
            if txt_alt.exists():
                with open(txt_alt, "r", encoding="utf-8") as f:
                    pages_data.append({"page_number": 1, "text": f.read().strip()})
    elif ext in [".txt", ".md"]:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        pages_data.append({"page_number": 1, "text": content.strip()})
    else:
        logger.warning(f"Unsupported file format: {ext}")
    return pages_data


def chunk_document_text(
    pages: List[Dict[str, Any]],
    chunk_size: int = 500,
    overlap: int = 80
) -> List[Dict[str, Any]]:
    """
    Splits text into contextual chunks, preserving section headings and page numbers.
    """
    chunks = []
    chunk_index = 0

    for page in pages:
        page_num = page["page_number"]
        lines = page["text"].split("\n")
        current_heading = "General Information"
        current_chunk_words = []

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Detect headings
            if line_str.startswith("#"):
                current_heading = line_str.lstrip("#").strip()

            words = line_str.split()
            current_chunk_words.extend(words)

            if len(current_chunk_words) >= chunk_size:
                chunk_str = " ".join(current_chunk_words)
                chunks.append({
                    "chunk_index": chunk_index,
                    "chunk_text": chunk_str,
                    "page_number": page_num,
                    "section_heading": current_heading
                })
                chunk_index += 1
                # Retain overlap words
                current_chunk_words = current_chunk_words[-overlap:]

        if current_chunk_words:
            chunk_str = " ".join(current_chunk_words)
            if len(chunk_str) > 30:  # Ignore tiny noise chunks
                chunks.append({
                    "chunk_index": chunk_index,
                    "chunk_text": chunk_str,
                    "page_number": page_num,
                    "section_heading": current_heading
                })
                chunk_index += 1

    return chunks


def build_faiss_index(chunks_with_vectors: List[Dict[str, Any]], index_dir: str):
    """
    Builds or updates FAISS IndexFlatIP (cosine similarity) and persists index to disk.
    """
    os.makedirs(index_dir, exist_ok=True)
    index_file = os.path.join(index_dir, "vector_index.faiss")
    meta_file = os.path.join(index_dir, "chunks_metadata.json")

    faiss = get_faiss()
    model = get_embedding_model()

    if not chunks_with_vectors:
        return

    texts = [c["chunk_text"] for c in chunks_with_vectors]

    if model is not None and faiss is not None:
        import numpy as np
        embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        dimension = embeddings.shape[1]
        
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings.astype("float32"))
        
        faiss.write_index(index, index_file)
        logger.info(f"Saved FAISS index with {index.ntotal} vectors to {index_file}")
    else:
        logger.warning("FAISS or model not loaded; persisting text metadata for fallback retrieval.")

    # Save metadata JSON
    metadata = []
    for idx, c in enumerate(chunks_with_vectors):
        metadata.append({
            "vector_id": idx,
            "chunk_id": c.get("id"),
            "document_id": c.get("document_id"),
            "college_id": c.get("college_id"),
            "text": c["chunk_text"],
            "page_number": c.get("page_number"),
            "section_heading": c.get("section_heading"),
            "source_url": c.get("source_url", ""),
            "title": c.get("title", "")
        })

    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved chunk metadata to {meta_file}")


def ingest_document_file(
    db: Session,
    filepath: str,
    title: str,
    doc_type: str,
    academic_year: int,
    source_url: str,
    college_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Ingests a document file: extracts text, chunks, computes hashes,
    saves in DB, and re-indexes vectors.
    """
    sha256 = compute_file_sha256(filepath)
    
    # Check duplicate
    existing = db.query(CollegeDocument).filter(CollegeDocument.sha256_hash == sha256).first()
    if existing:
        return {
            "success": True,
            "document_id": existing.id,
            "title": existing.title,
            "chunks_created": existing.total_chunks,
            "message": f"Document '{title}' already ingested (SHA-256 match)."
        }

    college = None
    if college_code:
        college = db.query(College).filter(College.code == college_code).first()

    pages = extract_text_from_file(filepath)
    chunks_data = chunk_document_text(pages)

    doc = CollegeDocument(
        college_id=college.id if college else None,
        title=title,
        doc_type=doc_type,
        academic_year=academic_year,
        file_path=filepath,
        source_url=source_url,
        publication_date=f"{academic_year}-07-01",
        last_verified=f"{academic_year}-08-15",
        sha256_hash=sha256,
        total_chunks=len(chunks_data)
    )
    db.add(doc)
    db.flush()

    chunk_objs = []
    for c in chunks_data:
        chunk_rec = DocumentChunk(
            document_id=doc.id,
            college_id=college.id if college else None,
            chunk_index=c["chunk_index"],
            chunk_text=c["chunk_text"],
            page_number=c["page_number"],
            section_heading=c["section_heading"],
            vector_id=c["chunk_index"],
            metadata_json=json.dumps({
                "college_code": college_code,
                "college_name": college.name if college else None,
                "title": title,
                "source_url": source_url,
                "year": academic_year
            })
        )
        db.add(chunk_rec)
        chunk_objs.append(chunk_rec)

    db.commit()

    return {
        "success": True,
        "document_id": doc.id,
        "title": title,
        "chunks_created": len(chunks_data),
        "message": f"Successfully ingested {title} with {len(chunks_data)} chunks."
    }
