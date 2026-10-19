import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

questions = [
    "What is a closing rank?",
    "What is the difference between average and median package?",
    "What are the fees, placements, and hostel at COEP Pune?",
    "Which college is affordable for me with a budget of 2 lakhs per year?",
    "Compare IIT Madras and BITS Pilani"
]

for q in questions:
    print("=" * 80)
    print(f"QUERY: '{q}'")
    print("=" * 80)
    req_data = json.dumps({"message": q, "conversation_history": []}).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/chat",
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            reply = data.get("reply", "")
            print("REPLY PREVIEW (First 350 chars):")
            print(reply[:350] + ("..." if len(reply) > 350 else ""))
            print(f"Total Reply Length: {len(reply)} chars")
            print(f"Evidence Chunks: {len(data.get('evidence_used', []))}")
    except Exception as e:
        print("Error:", e)
    print()
