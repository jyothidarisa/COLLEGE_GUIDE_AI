import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal, init_db
from app.services.ingestion import build_faiss_index
from app.models import DocumentChunk, CollegeDocument
from app.config import settings

def rebuild_index():
    print("Connecting to DB...")
    init_db()
    db = SessionLocal()
    try:
        chunks = db.query(DocumentChunk, CollegeDocument).join(
            CollegeDocument, DocumentChunk.document_id == CollegeDocument.id
        ).all()
        print(f"Retrieved {len(chunks)} chunks from database.")

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

        print(f"Encoding and indexing into FAISS ({settings.FAISS_INDEX_DIR})...")
        build_faiss_index(data_to_index, settings.FAISS_INDEX_DIR)
        print("Vector index rebuilt successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    rebuild_index()
