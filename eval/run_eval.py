import os
import sys
import json
import time
import urllib.request
import urllib.error
from typing import Dict, List, Any, Optional

# Ensure proper utf-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

EVAL_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_QUERIES_PATH = os.path.join(EVAL_DIR, "test_queries.json")
HELDOUT_QUERIES_PATH = os.path.join(EVAL_DIR, "heldout_queries.json")
RESULTS_PATH = os.path.join(EVAL_DIR, "results.json")
API_URL = "http://127.0.0.1:8000/api/chat"


def query_api(query_text: str) -> Dict[str, Any]:
    payload = json.dumps({"message": query_text, "model_type": "llm"}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            latency_ms = (time.time() - t0) * 1000.0
            data["_latency_ms"] = round(latency_ms, 2)
            data["_status"] = 200
            return data
    except Exception as e:
        latency_ms = (time.time() - t0) * 1000.0
        return {
            "_status": 500,
            "_error": str(e),
            "_latency_ms": round(latency_ms, 2),
            "reply": "",
            "intent": "unknown",
            "intent_confidence": 0.0,
            "is_fallback": True,
            "evidence_used": []
        }


def evaluate_query(item: Dict[str, Any], resp: Dict[str, Any]) -> Dict[str, Any]:
    expected_intent = item["expected_intent"]
    predicted_intent = resp.get("intent", "unknown")
    intent_confidence = resp.get("intent_confidence", 0.0)
    intent_match = (predicted_intent.lower() == expected_intent.lower())

    category = item.get("category", "")
    is_oos = (category == "out_of_scope" or expected_intent == "out_of_scope")

    expected_keywords = [kw.lower() for kw in item.get("expected_source_keywords", [])]
    evidence = resp.get("evidence_used", []) or []
    top_3_evidence = evidence[:3]

    retrieval_hit: Optional[bool] = None
    matched_keywords = []

    # Out-of-scope queries do NOT have retrieval hit rate counted
    if not is_oos and expected_keywords:
        for ev in top_3_evidence:
            combined_text = (
                (ev.get("snippet") or "") + " " +
                (ev.get("college_name") or "") + " " +
                (ev.get("document_title") or "")
            ).lower()
            for kw in expected_keywords:
                if kw in combined_text and kw not in matched_keywords:
                    matched_keywords.append(kw)
        retrieval_hit = len(matched_keywords) > 0

    is_fallback = bool(resp.get("is_fallback", False))

    return {
        "id": item["id"],
        "category": category,
        "query": item["query"],
        "expected_intent": expected_intent,
        "predicted_intent": predicted_intent,
        "intent_confidence": intent_confidence,
        "intent_match": intent_match,
        "expected_keywords": expected_keywords,
        "matched_keywords": matched_keywords,
        "retrieval_hit": retrieval_hit,
        "evidence_count": len(evidence),
        "is_fallback": is_fallback,
        "latency_ms": resp.get("_latency_ms", 0.0)
    }


def run_dataset_eval(name: str, file_path: str) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        print(f"Warning: File not found at {file_path}")
        return {}

    with open(file_path, "r", encoding="utf-8") as f:
        queries = json.load(f)

    print(f"\n>>> Running Evaluation on {name} ({len(queries)} queries) against {API_URL}...")
    print("-" * 110)

    results = []
    for item in queries:
        resp = query_api(item["query"])
        eval_item = evaluate_query(item, resp)
        results.append(eval_item)
        
        hit_str = "N/A" if eval_item["retrieval_hit"] is None else ("True" if eval_item["retrieval_hit"] else "False")
        status_mark = "✓" if eval_item["intent_match"] and (eval_item["retrieval_hit"] is None or eval_item["retrieval_hit"]) else "✗"
        print(
            f"[{eval_item['id']}] {status_mark} | "
            f"Intent: {eval_item['predicted_intent']:<22} (exp: {eval_item['expected_intent']:<22}, conf: {eval_item['intent_confidence']:.2f}) | "
            f"Hit: {hit_str:<5} | "
            f"Fallback: {str(eval_item['is_fallback']):<5} | "
            f"Latency: {eval_item['latency_ms']:>5.1f}ms | "
            f"{item['query'][:35]}..."
        )

    total = len(results)
    intent_correct = sum(1 for r in results if r["intent_match"])
    
    # Strictly count retrieval hit rate ONLY for domain queries where retrieval_hit is not None
    domain_retrieval_queries = [r for r in results if r["retrieval_hit"] is not None]
    domain_hits = sum(1 for r in domain_retrieval_queries if r["retrieval_hit"] is True)
    
    fallback_count = sum(1 for r in results if r["is_fallback"])
    avg_latency = sum(r["latency_ms"] for r in results) / max(1, total)

    intent_accuracy = (intent_correct / total) * 100.0
    retrieval_hit_rate = (domain_hits / max(1, len(domain_retrieval_queries))) * 100.0 if domain_retrieval_queries else 0.0
    fallback_rate = (fallback_count / total) * 100.0

    print("-" * 110)
    print(f"SUMMARY FOR {name.upper()}:")
    print(f"Total Queries:                    {total}")
    print(f"Intent Classification Accuracy:   {intent_accuracy:.2f}% ({intent_correct}/{total})")
    print(f"Domain Retrieval Hit Rate (Top-3):{retrieval_hit_rate:.2f}% ({domain_hits}/{len(domain_retrieval_queries)}) [Out-of-scope excluded]")
    print(f"Fallback Rate:                    {fallback_rate:.2f}% ({fallback_count}/{total})")
    print(f"Average Latency:                  {avg_latency:.2f} ms")
    print("-" * 110)

    return {
        "dataset_name": name,
        "total_queries": total,
        "intent_accuracy": round(intent_accuracy, 2),
        "domain_retrieval_hit_rate": round(retrieval_hit_rate, 2),
        "domain_retrieval_query_count": len(domain_retrieval_queries),
        "fallback_rate": round(fallback_rate, 2),
        "average_latency_ms": round(avg_latency, 2),
        "details": results
    }


def main():
    print("=" * 110)
    print("COLLEGE GUIDE AI EVALUATION HARNESS")
    print("=" * 110)

    test_res = run_dataset_eval("Original Test Set (30 queries)", TEST_QUERIES_PATH)
    heldout_res = run_dataset_eval("Held-Out Test Set (15 queries)", HELDOUT_QUERIES_PATH)

    summary_data = {
        "timestamp": time.time(),
        "test_set": test_res,
        "heldout_set": heldout_res
    }

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)
    print(f"\nSaved combined evaluation results to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
