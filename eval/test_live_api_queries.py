import urllib.request
import json

queries = [
    "hi",
    "hi how are you",
    "thanks",
    "bye",
    "which college is best?",
    "hi what are the cutoffs for CSE at NIT Trichy?"
]

url = "http://127.0.0.1:8000/api/chat"

for i, q in enumerate(queries, 1):
    payload = json.dumps({"message": q, "session_id": f"batch1_live_{i}"}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print("=" * 80)
        print(f"TEST {i}: \"{q}\"")
        print(f"HTTP Status: {resp.status}")
        print(f"Intent: {data.get('intent')}")
        print(f"Intent Confidence: {data.get('intent_confidence')}")
        print(f"Model Used: {data.get('model_used')}")
        print(f"Is Fallback: {data.get('is_fallback')}")
        print(f"Rewritten Query: {data.get('rewritten_query')}")
        print(f"Suggestions: {data.get('suggested_follow_ups')}")
        print("Reply:")
        print(data.get("reply"))
