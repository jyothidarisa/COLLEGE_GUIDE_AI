import os
import sys
import json
from collections import defaultdict
from typing import Dict, List, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.nlp.intent_classifier import AdmissionIntentClassifier

EVAL_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_PATH = os.path.join(EVAL_DIR, "test_queries.json")
DEV_PATH = os.path.join(EVAL_DIR, "heldout_queries.json")


def evaluate_dataset_at_threshold(clf: AdmissionIntentClassifier, q_list: List[Dict[str, Any]], threshold: float) -> Dict[str, Any]:
    clf.confidence_threshold = threshold
    
    total = len(q_list)
    correct = 0
    accepted_but_wrong = 0
    clarification_count = 0
    in_domain_to_oos = 0
    
    per_intent_total = defaultdict(int)
    per_intent_correct = defaultdict(int)

    for item in q_list:
        query = item["query"]
        expected = item["expected_intent"]
        category = item.get("category", expected)
        is_in_domain = (category != "out_of_scope" and expected != "out_of_scope")

        res = clf.predict(query)
        pred = res.intent
        
        per_intent_total[expected] += 1

        if pred.lower() == expected.lower():
            correct += 1
            per_intent_correct[expected] += 1
        else:
            if pred != "clarification_request":
                accepted_but_wrong += 1
            if is_in_domain and pred == "out_of_scope":
                in_domain_to_oos += 1

        if pred == "clarification_request":
            clarification_count += 1

    per_intent_acc = {}
    for intent, count in per_intent_total.items():
        c_corr = per_intent_correct[intent]
        per_intent_acc[intent] = {
            "correct": c_corr,
            "total": count,
            "accuracy": round((c_corr / count) * 100.0, 1)
        }

    return {
        "total": total,
        "correct": correct,
        "accuracy": round((correct / total) * 100.0, 2),
        "accepted_but_wrong_count": accepted_but_wrong,
        "accepted_but_wrong_rate": round((accepted_but_wrong / total) * 100.0, 2),
        "clarification_count": clarification_count,
        "clarification_rate": round((clarification_count / total) * 100.0, 2),
        "in_domain_to_oos_errors": in_domain_to_oos,
        "per_intent": per_intent_acc
    }


def run_full_report(title: str):
    with open(TEST_PATH, "r", encoding="utf-8") as f:
        test_queries = json.load(f)
    with open(DEV_PATH, "r", encoding="utf-8") as f:
        dev_queries = json.load(f)

    clf = AdmissionIntentClassifier(confidence_threshold=0.18)

    print("=" * 110)
    print(f"EVALUATION REPORT: {title.upper()}")
    print("=" * 110)

    for th in [0.15, 0.18]:
        print(f"\n>>> METRICS AT THRESHOLD {th}:")
        print("-" * 110)

        t_res = evaluate_dataset_at_threshold(clf, test_queries, th)
        d_res = evaluate_dataset_at_threshold(clf, dev_queries, th)

        print(f"{'Metric':<32} | {'Original Test (30)':<25} | {'Dev Set Held-Out (15)':<25}")
        print("-" * 88)
        print(f"{'Accuracy':<32} | {t_res['accuracy']:>5.2f}% ({t_res['correct']}/{t_res['total']}){'':<11} | {d_res['accuracy']:>5.2f}% ({d_res['correct']}/{d_res['total']})")
        print(f"{'Accepted-but-Wrong Rate':<32} | {t_res['accepted_but_wrong_rate']:>5.2f}% ({t_res['accepted_but_wrong_count']}/{t_res['total']}){'':<11} | {d_res['accepted_but_wrong_rate']:>5.2f}% ({d_res['accepted_but_wrong_count']}/{d_res['total']})")
        print(f"{'Clarification Fallback Rate':<32} | {t_res['clarification_rate']:>5.2f}% ({t_res['clarification_count']}/{t_res['total']}){'':<11} | {d_res['clarification_rate']:>5.2f}% ({d_res['clarification_count']}/{d_res['total']})")
        print(f"{'In-Domain to Out-of-Scope Errors':<32} | {t_res['in_domain_to_oos_errors']:>5}{'':<20} | {d_res['in_domain_to_oos_errors']:>5}")

        print("\n  Per-Intent Breakdown (Dev Set):")
        for it, data in d_res["per_intent"].items():
            print(f"    - {it:<24}: {data['accuracy']:>5.1f}% ({data['correct']}/{data['total']})")

    out_file = os.path.join(EVAL_DIR, f"eval_snapshot_{title.lower().replace(' ', '_')}.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({"title": title}, f, indent=2)


if __name__ == "__main__":
    title_arg = sys.argv[1] if len(sys.argv) > 1 else "Current State"
    run_full_report(title_arg)
