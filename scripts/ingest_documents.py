import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal, init_db
from app.services.ingestion import ingest_document_file, build_faiss_index
from app.models import DocumentChunk, CollegeDocument
from app.config import settings

DOCS_DIR = BASE_DIR / "data" / "documents"

COLLEGE_MAPPINGS = {
    "iit_madras": ("IITM", "IIT Madras Official Admissions Guide", "Admission_Guidelines", "https://www.iitm.ac.in"),
    "nit_trichy": ("NITT", "NIT Trichy Admissions Information Brochure", "Brochure", "https://www.nitt.edu"),
    "ceg_anna_university": ("CEG-0001", "CEG Anna University TNEA Information Handbook", "Admission_Guidelines", "https://ceg.annauniv.edu"),
    "ssn_college": ("SSN-1315", "SSN College of Engineering Academic & Placement Prospectus", "Brochure", "https://www.ssn.edu.in"),
    "psg_college": ("PSG-1211", "PSG College of Technology Profile & Fee Guide", "Fee_Structure", "https://www.psgtech.edu")
}

def ingest_all_documents():
    print("Initializing DB...")
    init_db()
    db = SessionLocal()

    try:
        files = list(DOCS_DIR.glob("*.txt")) + list(DOCS_DIR.glob("*.pdf"))
        print(f"Found {len(files)} document files in {DOCS_DIR}...")
        
        # Ingest text and PDF files
        for f in files:
            name_lower = f.stem.lower()
            matched_code = None
            title = f.stem.replace("_", " ").title()
            doc_type = "Brochure"
            source_url = "https://www.tneaonline.org"
            
            for key, (code, def_title, def_type, def_url) in COLLEGE_MAPPINGS.items():
                if key in name_lower:
                    matched_code = code
                    title = def_title
                    doc_type = def_type
                    source_url = def_url
                    break

            print(f"Ingesting {f.name}...")
            res = ingest_document_file(
                db=db,
                filepath=str(f),
                title=title,
                doc_type=doc_type,
                academic_year=2024,
                source_url=source_url,
                college_code=matched_code
            )
            print(f"Result: {res['message']}")

        print("Ingestion complete. Rebuilding vector index...")
        # Rebuild index
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
        print(f"Vector index successfully built with {len(data_to_index)} chunks!")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_all_documents()
