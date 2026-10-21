import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal
from app.services.retriever import detect_colleges_in_query
from app.nlp.entity_extractor import extract_entities

db = SessionLocal()
test_names = [
    "amrita", "Amrita University", "amrita vishwa vidyapeetham",
    "nit trichy", "NITT", "anna univ", "iit madras", "IITM", "cet pune"
]

print("=" * 80)
print("DIAGNOSIS: CURRENT COLLEGE RESOLUTION")
print("=" * 80)

print("\n--- 1. RETRIEVER: detect_colleges_in_query ---")
for name in test_names:
    detected = detect_colleges_in_query(db, name)
    cols = [f"{c.name} ({c.code})" for c in detected]
    status = "✓ PASS" if len(cols) == 1 else ("✗ FAIL (EMPTY)" if len(cols) == 0 else "⚠ MULTIPLE")
    print(f"{status:15} | Query: {name:28} -> {cols}")

print("\n--- 2. NLP ENTITY EXTRACTOR: extract_entities ---")
for name in test_names:
    ents = extract_entities(name)
    cols = [f"{c['name']} ({c['code']})" for c in ents.colleges_mentioned]
    status = "✓ PASS" if len(cols) == 1 else ("✗ FAIL (EMPTY)" if len(cols) == 0 else "⚠ MULTIPLE")
    print(f"{status:15} | Query: {name:28} -> {cols}")

db.close()
