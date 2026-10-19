import sys
sys.path.append(r'c:\Users\jyoth\OneDrive\Desktop\nlp\college-guide-ai\backend')
from app.database import SessionLocal
from app.models import College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic
from app.services.retriever import detect_colleges_in_query, hybrid_retrieve
from app.schemas import RetrievedEvidence, StudentProfile

db = SessionLocal()

test_queries = [
    "What is a closing rank?",
    "What is the difference between average and median package?",
    "What are the fees, placements, and hostel at COEP Pune?",
    "Compare IIT Madras and BITS Pilani",
    "Which college is affordable for me with a budget of 2 lakhs per year?"
]

print("=" * 80)
print("TESTING RETRIEVER FILTERING ON ALL SAMPLE QUERIES")
print("=" * 80)
for q in test_queries:
    cols = detect_colleges_in_query(db, q)
    evidence = hybrid_retrieve(db, q, top_k=5)
    print(f"QUERY: '{q}'")
    print(f"  Detected Colleges: {[c.name for c in cols]}")
    print(f"  Retrieved Evidence Count: {len(evidence)}")
    print(f"  Retrieved College Names: {list({e.college_name for e in evidence if e.college_name})}")
    print("-" * 80)

db.close()
