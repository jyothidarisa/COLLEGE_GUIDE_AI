import os
import sys
import json
import time
import urllib.request
from typing import Dict, List, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

EVAL_DIR = os.path.dirname(os.path.abspath(__file__))
ANSWERS_PATH = os.path.join(EVAL_DIR, "answer_queries.json")
API_URL = "http://127.0.0.1:8000/api/chat"


def query_chat(query: str) -> Dict[str, Any]:
    payload = json.dumps({"message": query, "model_type": "llm"}).encode("utf-8")
    req = urllib.request.Request(API_URL, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"reply": "", "citations": [], "evidence_used": [], "is_fallback": True, "error": str(e)}


def run_answer_eval():
    with open(ANSWERS_PATH, "r", encoding="utf-8") as f:
        queries = json.load(f)

    print("=" * 110)
    print(f"CHATBOT FACTUAL ANSWER EVALUATION ({len(queries)} QUERIES)")
    print("=" * 110)

    correct_count = 0
    grounded_count = 0
    cited_count = 0
    total = len(queries)

    for item in queries:
        resp = query_chat(item["query"])
        reply = resp.get("reply", "")
        citations = resp.get("citations", [])
        evidence = resp.get("evidence_used", [])

        # 1. Correctness: checks if expected answer keywords appear in reply
        reply_lower = reply.lower()
        exp_keywords = [k.lower() for k in item["expected_answer_keywords"]]
        is_correct = any(k in reply_lower for k in exp_keywords)

        # 2. Groundedness: checks if evidence contains expected document keywords
        doc_keywords = [k.lower() for k in item["expected_document_keywords"]]
        is_grounded = False
        if not item.get("requires_grounding", True):
            is_grounded = True
        else:
            for ev in evidence:
                combined_ev = (
                    (ev.get("snippet") or "") + " " +
                    (ev.get("college_name") or "") + " " +
                    (ev.get("document_title") or "")
                ).lower()
                if any(dk in combined_ev for dk in doc_keywords):
                    is_grounded = True
                    break

        # 3. Cited: checks if verified citations with source URL are present
        has_citations = len(citations) > 0 and all(c.get("url") for c in citations)

        if is_correct:
            correct_count += 1
        if is_grounded:
            grounded_count += 1
        if has_citations:
            cited_count += 1

        status_mark = "✓ PASS" if (is_correct and is_grounded and has_citations) else "✗ PARTIAL/FAIL"
        print(f"[{item['id']}] {status_mark} | Correct: {str(is_correct):<5} | Grounded: {str(is_grounded):<5} | Cited: {str(has_citations):<5} | Fallback: {resp.get('is_fallback')} | {item['query'][:40]}...")

    print("=" * 110)
    print("ANSWER EVALUATION BASELINE SUMMARY:")
    print(f"Correctness Rate: {correct_count / total * 100:.1f}% ({correct_count}/{total})")
    print(f"Groundedness Rate: {grounded_count / total * 100:.1f}% ({grounded_count}/{total})")
    print(f"Citation Rate:    {cited_count / total * 100:.1f}% ({cited_count}/{total})")
    print("=" * 110)


if __name__ == "__main__":
    run_answer_eval()
