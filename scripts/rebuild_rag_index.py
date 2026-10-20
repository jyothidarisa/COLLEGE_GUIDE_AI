"""
Rebuilds the RAG vector index using section-aware chunks and rich metadata.
"""

import sys
from pathlib import Path

# Set stdout encoding
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal
from app.services.ingestion import rebuild_complete_vector_index

def main():
    print("=" * 80)
    print("REBUILDING SECTION-AWARE RAG FAISS VECTOR INDEX")
    print("=" * 80)

    db = SessionLocal()
    try:
        docs_dir = BASE_DIR / "data" / "documents"
        index_dir = BASE_DIR / "data" / "index"

        res = rebuild_complete_vector_index(db, str(docs_dir), str(index_dir))
        print(f"Status: {res['message']}")
        print(f"Total Documents: {res['total_documents']}")
        print(f"Total Chunks Created: {res['total_chunks']}")

    finally:
        db.close()

if __name__ == "__main__":
    main()
