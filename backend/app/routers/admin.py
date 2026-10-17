import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.schemas import IngestionResponse
from app.services.ingestion import ingest_document_file, build_faiss_index
from app.models import DocumentChunk, CollegeDocument

router = APIRouter(prefix="/admin", tags=["Admin & Ingestion"])

def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    """Validates admin API key for protected operations."""
    if not x_admin_key or x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing X-Admin-Key header."
        )
    return True

@router.post("/ingest", response_model=IngestionResponse, summary="Ingest college PDF or document file (Protected)")
async def ingest_document(
    title: str = Form(...),
    doc_type: str = Form(...),
    academic_year: int = Form(...),
    source_url: str = Form(...),
    college_code: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_admin_key)
):
    """Admin-only endpoint for uploading official brochures and guidelines."""
    docs_dir = Path(settings.DOCUMENTS_DIR)
    os.makedirs(docs_dir, exist_ok=True)
    
    saved_path = docs_dir / file.filename
    with open(saved_path, "wb") as f:
        content = await file.read()
        f.write(content)

    result = ingest_document_file(
        db=db,
        filepath=str(saved_path),
        title=title,
        doc_type=doc_type,
        academic_year=academic_year,
        source_url=source_url,
        college_code=college_code
    )
    return result

@router.post("/reindex", summary="Rebuild vector index from all ingested chunks (Protected)")
def reindex_vectors(
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_admin_key)
):
    """Rebuilds the FAISS vector index from all stored document chunks."""
    chunks = db.query(DocumentChunk, CollegeDocument).join(
        CollegeDocument, DocumentChunk.document_id == CollegeDocument.id
    ).all()
    
    data_to_index = []
    for chunk, doc in chunks:
        data_to_index.append({
            "id": chunk.id,
            "document_id": doc.id,
            "college_id": chunk.college_id,
            "chunk_text": chunk.chunk_text,
            "page_number": chunk.page_number,
            "section_heading": chunk.section_heading,
            "source_url": doc.source_url,
            "title": doc.title
        })

    build_faiss_index(data_to_index, settings.FAISS_INDEX_DIR)
    return {
        "success": True,
        "total_chunks_indexed": len(data_to_index),
        "message": f"Successfully reindexed {len(data_to_index)} chunks into FAISS."
    }

@router.get("/status", summary="Data ingestion status and summary stats (Protected)")
def get_ingestion_status(
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_admin_key)
):
    total_docs = db.query(CollegeDocument).count()
    total_chunks = db.query(DocumentChunk).count()
    return {
        "total_documents": total_docs,
        "total_chunks": total_chunks,
        "index_dir": settings.FAISS_INDEX_DIR,
        "embedding_model": settings.EMBEDDING_MODEL_NAME
    }
