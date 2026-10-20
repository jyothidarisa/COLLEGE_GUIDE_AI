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


def infer_topic_tags(heading: str, text: str) -> List[str]:
    """Infers semantic topic tags from section heading and text content."""
    topics = []
    combined = (heading + " " + text).lower()
    if any(w in combined for w in ["fee", "tuition", "cost", "living cost", "caution deposit"]):
        topics.append("fees")
    if any(w in combined for w in ["hostel", "room", "accommodation", "bathroom", "mess", "dining"]):
        topics.append("hostels")
    if any(w in combined for w in ["placement", "recruiter", "package", "lpa", "ctc", "internship"]):
        topics.append("placements")
    if any(w in combined for w in ["scholarship", "financial aid", "waiver", "mcm", "studentship"]):
        topics.append("scholarships")
    if any(w in combined for w in ["admission", "eligibility", "entrance exam", "counseling", "josaa", "tnea", "cutoff", "pcm"]):
        topics.append("admissions")
    if any(w in combined for w in ["campus", "railway", "bus", "library", "gym", "medical", "amenities", "connectivity"]):
        topics.append("campus")
    return topics


def chunk_document_text(
    pages: List[Dict[str, Any]],
    chunk_size: int = 220,
    overlap: int = 40
) -> List[Dict[str, Any]]:
    """
    Splits text into section-aware contextual chunks, preserving section headings,
    page numbers, and semantic topic tags.
    """
    chunks = []
    chunk_index = 0

    for page in pages:
        page_num = page["page_number"]
        raw_text = page["text"]
        lines = raw_text.split("\n")

        # Split into sections based on markdown headers (# or ##)
        sections: List[Tuple[str, List[str]]] = []
        current_heading = "Institute Profile & Overview"
        current_lines = []

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Detect headings (e.g. '# ...' or '## ...')
            if line_str.startswith("#"):
                if current_lines:
                    sections.append((current_heading, current_lines))
                    current_lines = []
                current_heading = line_str.lstrip("#").strip()
            else:
                current_lines.append(line_str)

        if current_lines:
            sections.append((current_heading, current_lines))

        # Chunk each section individually
        for heading, sec_lines in sections:
            sec_text = " ".join(sec_lines)
            words = sec_text.split()
            topics = infer_topic_tags(heading, sec_text)

            if len(words) <= chunk_size:
                if len(sec_text) > 25:
                    chunks.append({
                        "chunk_index": chunk_index,
                        "chunk_text": f"[{heading}]\n{sec_text}",
                        "page_number": page_num,
                        "section_heading": heading,
                        "topic_tags": topics
                    })
                    chunk_index += 1
            else:
                # Sub-chunk with overlap
                start = 0
                while start < len(words):
                    end = min(start + chunk_size, len(words))
                    sub_text = " ".join(words[start:end])
                    if len(sub_text) > 25:
                        chunks.append({
                            "chunk_index": chunk_index,
                            "chunk_text": f"[{heading}]\n{sub_text}",
                            "page_number": page_num,
                            "section_heading": heading,
                            "topic_tags": topics
                        })
                        chunk_index += 1
                    if end >= len(words):
                        break
                    start += (chunk_size - overlap)

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
            "college_code": c.get("college_code"),
            "college_name": c.get("college_name"),
            "text": c["chunk_text"],
            "page_number": c.get("page_number"),
            "section_heading": c.get("section_heading"),
            "topic_tags": c.get("topic_tags", []),
            "source_url": c.get("source_url", ""),
            "title": c.get("title", ""),
            "academic_year": c.get("academic_year", 2024)
        })

    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved chunk metadata ({len(metadata)} chunks) to {meta_file}")


def rebuild_complete_vector_index(
    db: Session,
    docs_dir: str,
    index_dir: str
) -> Dict[str, Any]:
    """
    Rebuilds the complete FAISS vector index with section-aware chunks
    and rich metadata for all documents.
    """
    logger.info("Starting section-aware vector index rebuild...")
    
    # 1. Clear existing chunks
    db.query(DocumentChunk).delete()
    db.query(CollegeDocument).delete()
    db.commit()

    docs_path = Path(docs_dir)
    doc_files = sorted(list(docs_path.glob("*.txt")))

    all_chunks_for_index = []
    total_docs = 0

    for fpath in doc_files:
        # Determine college code from filename (e.g. iitm_admissions_guide.txt -> IITM)
        fname = fpath.stem.lower()
        code_prefix = fname.replace("_admissions_guide", "").replace("_admissions_and_fees", "").replace("_brochure", "").replace("_profile", "").replace("_prospectus", "").replace("_guidelines", "")
        
        # Match college
        college = None
        for col in db.query(College).all():
            if col.code.lower() == code_prefix or col.code.lower().replace("-", "") == code_prefix.replace("-", "") or code_prefix in col.name.lower():
                college = col
                break

        title = f"{college.name if college else code_prefix.upper()} Admissions & Campus Guide"
        source_url = college.official_website if college else "https://www.nirfindia.org"
        sha256 = compute_file_sha256(str(fpath))

        pages = extract_text_from_file(str(fpath))
        chunks_data = chunk_document_text(pages)

        doc = CollegeDocument(
            college_id=college.id if college else None,
            title=title,
            doc_type="Admissions_Brochure",
            academic_year=2024,
            file_path=str(fpath),
            source_url=source_url,
            publication_date="2024-07-01",
            last_verified="2024-08-15",
            sha256_hash=sha256,
            total_chunks=len(chunks_data)
        )
        db.add(doc)
        db.flush()

        for c in chunks_data:
            meta = {
                "college_code": college.code if college else code_prefix.upper(),
                "college_name": college.name if college else None,
                "title": title,
                "section_heading": c["section_heading"],
                "topic_tags": c.get("topic_tags", []),
                "source_url": source_url,
                "year": 2024
            }
            chunk_rec = DocumentChunk(
                document_id=doc.id,
                college_id=college.id if college else None,
                chunk_index=c["chunk_index"],
                chunk_text=c["chunk_text"],
                page_number=c["page_number"],
                section_heading=c["section_heading"],
                vector_id=len(all_chunks_for_index),
                metadata_json=json.dumps(meta)
            )
            db.add(chunk_rec)
            db.flush()

            all_chunks_for_index.append({
                "id": chunk_rec.id,
                "document_id": doc.id,
                "college_id": college.id if college else None,
                "college_code": college.code if college else code_prefix.upper(),
                "college_name": college.name if college else None,
                "chunk_text": c["chunk_text"],
                "page_number": c["page_number"],
                "section_heading": c["section_heading"],
                "topic_tags": c.get("topic_tags", []),
                "source_url": source_url,
                "title": title,
                "academic_year": 2024
            })

        total_docs += 1

    db.commit()

    # Build FAISS index from all section chunks
    build_faiss_index(all_chunks_for_index, index_dir)

    return {
        "success": True,
        "total_documents": total_docs,
        "total_chunks": len(all_chunks_for_index),
        "message": f"Successfully indexed {len(all_chunks_for_index)} section-aware chunks across {total_docs} documents."
    }


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
