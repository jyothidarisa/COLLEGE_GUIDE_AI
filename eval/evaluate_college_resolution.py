import os
import sys
import json
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.nlp.entity_extractor import extract_entities, COLLEGE_ALIAS_REGISTRY

# 1. 30 College-Name Variants (typos, abbreviations, partials)
POSITIVE_30 = [
    "amrita", "amritha", "Amrita University", "amrita vishwa vidyapeetham",
    "nit trichy", "nit trichi", "NITT", "anna univ", "anna university", "anna university chennai",
    "iit madras", "IITM", "iit chennai", "cet pune", "coep pune", "coep",
    "bits pilani", "bits pilan", "pilani", "vit vellore", "vit velore",
    "vellore institute of technology", "iiit hyderabad", "iiith", "jadavpur university",
    "jadavpur", "dtu", "delhi college of engineering", "thapar university", "tiet"
]

# 2. 20 Non-College Negative Queries (including name guard 'amit')
NEGATIVE_20 = [
    "what is a closing rank?", "how is placement percentage calculated?",
    "what is the difference between average and median package?", "how does josaa seat allocation work?",
    "can i change my branch after first year?", "what documents are required for engineering counselling?",
    "how much rank is required for cse in general?", "is mechanical engineering good for future?",
    "explain home state vs other state quota", "what is csab special round?",
    "how to calculate cutoff from marks?", "what is the eligibility criteria for btech?",
    "does category certificate expire?", "difference between deemed university and autonomous college",
    "what are the career options after ece?", "hi how are you",
    "thank you for your help", "goodbye", "hire me", "my name is amit and which college is best"
]

print("=" * 80)
print("BENCHMARK 1: 30 COLLEGE-NAME VARIANTS MATCH RATE")
print("=" * 80)
pos_matches = 0
missed = []
for q in POSITIVE_30:
    res = extract_entities(q)
    if res.colleges_mentioned:
        pos_matches += 1
        print(f"✓ PASS | Query: {q:<35} -> {res.colleges_mentioned[0]['name']}")
    else:
        missed.append(q)
        print(f"✗ FAIL | Query: {q:<35} -> [NO MATCH]")

print(f"\nPositive Match Rate: {pos_matches}/30 ({pos_matches/30*100:.1f}%)")
if missed:
    print(f"Missed queries: {missed}")

print("\n" + "=" * 80)
print("BENCHMARK 2: 20 NON-COLLEGE NEGATIVE QUERIES FALSE-MATCH RATE")
print("=" * 80)
neg_false_matches = 0
false_positives = []
for q in NEGATIVE_20:
    res = extract_entities(q)
    if res.colleges_mentioned:
        neg_false_matches += 1
        false_positives.append((q, [c["name"] for c in res.colleges_mentioned]))
        print(f"✗ FALSE MATCH | Query: {q:<45} -> {[c['name'] for c in res.colleges_mentioned]}")
    else:
        print(f"✓ PASS (CLEAN) | Query: {q:<45} -> [NO SPURIOUS MATCH]")

print(f"\nFalse-Match Rate: {neg_false_matches}/20 ({neg_false_matches/20*100:.1f}%)")

print("\n" + "=" * 80)
print("BENCHMARK 3: 75/75 COLLEGES REGRESSION CHECK AGAINST OLD ALIASES")
print("=" * 80)
# Original 75-college mapping keys and sample aliases
passed_colleges = 0
regression_failures = []
for code, info in COLLEGE_ALIAS_REGISTRY.items():
    col_name = info["name"]
    # Test that each alias resolves back to this college
    all_aliases_passed = True
    for a in info["aliases"]:
        res = extract_entities(a)
        matched_codes = [c["code"] for c in res.colleges_mentioned]
        if code not in matched_codes:
            all_aliases_passed = False
            regression_failures.append((code, a))
            break
    if all_aliases_passed:
        passed_colleges += 1

print(f"Colleges passing full alias regression: {passed_colleges}/75 ({passed_colleges/75*100:.1f}%)")
if regression_failures:
    print(f"Failures: {regression_failures[:5]}")

print("\n" + "=" * 80)
print("BENCHMARK 4: LIVE RUNNING API QUERIES")
print("=" * 80)
live_tests = [
    ("amrita", "College overview"),
    ("amritha", "Typo overview"),
    ("Amrita Vishwa Vidyapeetham", "Full name overview"),
    ("anna univ", "Abbreviation overview"),
    ("NIT", "Generic umbrella ambiguity check"),
    ("iit fees", "Category query ambiguity check"),
    ("Is Amrita good for AI?", "Evaluative question (must NOT be name-only overview)")
]

for q, desc in live_tests:
    url = "http://127.0.0.1:8000/api/chat"
    payload = json.dumps({"message": q, "session_id": "eval_session"}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"\n[QUERY] \"{q}\" ({desc})")
        print(f"  Status: {resp.status}")
        print(f"  Intent: {data.get('intent')} (conf: {data.get('intent_confidence')})")
        print(f"  Model Used: {data.get('model_used')}")
        print(f"  Colleges Detected: {data.get('extracted_entities', {}).get('colleges_detected')}")
        print(f"  Is Fallback: {data.get('is_fallback')}")
        print(f"  Reply Preview:\n    {data.get('reply')[:220]}...")
