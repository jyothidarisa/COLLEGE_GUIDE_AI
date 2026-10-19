from fastapi.testclient import TestClient
from app.main import app
import json
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

client = TestClient(app)

TEST_QUESTIONS = [
    {
        "id": 1,
        "title": "Terminology: Closing Rank",
        "message": "What is a closing rank?",
        "profile": None
    },
    {
        "id": 2,
        "title": "Terminology: Average vs Median Package",
        "message": "What is the difference between average and median package?",
        "profile": None
    },
    {
        "id": 3,
        "title": "Specific College Facts: COEP Pune",
        "message": "What are the fees, placements, and hostel at COEP Pune?",
        "profile": None
    },
    {
        "id": 4,
        "title": "Budget / Affordability Query",
        "message": "Which college is affordable for me with a budget of 2 lakhs per year?",
        "profile": {"max_tuition_budget": 200000}
    },
    {
        "id": 5,
        "title": "College Comparison: IIT Madras vs BITS Pilani",
        "message": "Compare IIT Madras and BITS Pilani",
        "profile": None
    },
    {
        "id": 6,
        "title": "Admission Chances: NIT Trichy CSE at rank 1200",
        "message": "Can I get CSE at NIT Trichy with rank 1200?",
        "profile": {"rank_or_score": 1200, "category": "General", "preferred_course": "Computer Science and Engineering", "entrance_exam": "JEE_MAIN"}
    },
    {
        "id": 7,
        "title": "Recommendation Rationale / Transparency",
        "message": "Why did you recommend this college?",
        "profile": None
    }
]

def run_tests():
    print("=" * 80)
    print("COLLEGE GUIDE AI - CHAT QUALITY BENCHMARK TEST")
    print("=" * 80)
    
    passed_all = True
    
    for t in TEST_QUESTIONS:
        print(f"\n--- Test #{t['id']}: {t['title']} ---")
        print(f"User Query: \"{t['message']}\"")
        payload = {
            "message": t["message"],
            "student_profile": t["profile"],
            "conversation_history": []
        }
        try:
            resp = client.post("/api/chat", json=payload)
            if resp.status_code != 200:
                print(f"FAILED: HTTP {resp.status_code} - {resp.text}")
                passed_all = False
                continue
            
            data = resp.json()
            reply = data.get("reply", "")
            citations = data.get("citations", [])
            evidence = data.get("evidence_used", [])
            
            print(f"Citations count: {len(citations)}")
            print(f"Evidence chunks: {len(evidence)}")
            
            # Checks:
            # 1. No raw internal SQL tags
            if "VERIFIED SQL" in reply or "DOC_CHUNK" in reply or "DOCUMENT_PASSAGE" in reply:
                print("[ERROR] Found raw internal SQL/DOC markers in response!")
                passed_all = False
            else:
                print("[PASS] Clean formatting - no raw DB markers.")
                
            # 2. Check structure
            has_simple = "### 1. Simple Answer" in reply or "Simple answer" in reply.lower() or "### Simple Answer" in reply
            has_details = "### 2. Important Details" in reply or "important details" in reply.lower()
            has_sources = "Sources" in reply or len(citations) > 0
            
            print(f"  Structure: Simple Answer: {has_simple}, Details: {has_details}, Sources: {has_sources}")
            
            # Check specific expectations
            if t["id"] == 1:
                if "closing rank" in reply.lower() and "last" in reply.lower():
                    print("[PASS] Clear definition and context of closing rank provided.")
                else:
                    print("[WARN] Closing rank definition check failed.")
                    passed_all = False

            if t["id"] == 2:
                if "median" in reply.lower() and "average" in reply.lower() and "skew" in reply.lower():
                    print("[PASS] Clear distinction between average and median with example provided.")
                else:
                    print("[WARN] Average vs Median distinction check failed.")
                    passed_all = False

            if t["id"] == 3: # COEP
                if "COEP" in reply or "College of Engineering Pune" in reply:
                    print("[PASS] COEP Pune specific information returned correctly.")
                else:
                    print("[FAIL] COEP not identified in response.")
                    passed_all = False
            
            if t["id"] == 4: # Budget
                if "affordable" in reply.lower() or "budget" in reply.lower() or "jadavpur" in reply.lower() or "coep" in reply.lower():
                    print("[PASS] Affordable colleges under budget identified.")
                else:
                    print("[FAIL] Budget colleges not found in response.")
                    passed_all = False

            if t["id"] == 5: # IITM vs BITS
                if "|" in reply and ("IIT Madras" in reply or "BITS" in reply):
                    print("[PASS] Comparison Markdown table included.")
                else:
                    print("[WARN] Table not detected in comparison.")

            if t["id"] == 6: # NIT Trichy CSE 1200
                if "NIT Trichy" in reply and "1200" in reply and "assumptions" in reply.lower():
                    print("[PASS] Handled admission query with historical benchmarks and explicit assumptions.")
                else:
                    print("[FAIL] Admission query handling incomplete.")
                    passed_all = False

            if t["id"] == 7: # Rationale
                if "reach" in reply.lower() and "target" in reply.lower() and "safer" in reply.lower():
                    print("[PASS] Transparent recommendation rationale explaining Reach, Target, Safer bands.")
                else:
                    print("[FAIL] Rationale did not explain Reach/Target/Safer.")
                    passed_all = False
            
            print("\nPreview of Response (first 400 chars):")
            print(reply[:400] + ("..." if len(reply) > 400 else ""))
            print("-" * 50)
            
        except Exception as e:
            print(f"EXCEPTION: {e}")
            passed_all = False
            
    print("\n" + "=" * 80)
    print(f"OVERALL STATUS: {'ALL BENCHMARKS PASSED' if passed_all else 'SOME CHECKS FAILED'}")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
