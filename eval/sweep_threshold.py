import os
import sys
import json
from typing import Dict, List, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, BACKEND_DIR)

from app.nlp.intent_classifier import AdmissionIntentClassifier

EVAL_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_QUERIES_PATH = os.path.join(EVAL_DIR, "test_queries.json")
HELDOUT_QUERIES_PATH = os.path.join(EVAL_DIR, "heldout_queries.json")


def run_sweep():
    with open(TEST_QUERIES_PATH, "r", encoding="utf-8") as f:
        test_queries = json.load(f)
    with open(HELDOUT_QUERIES_PATH, "r", encoding="utf-8") as f:
        heldout_queries = json.load(f)

    base_clf = AdmissionIntentClassifier(confidence_threshold=0.18)

    thresholds = [round(t * 0.01, 2) for t in range(15, 26)]
    results = []

    print("=" * 115)
    print("THRESHOLD SWEEP ON ORIGINAL TEST (30), HELD-OUT (15), AND COMBINED (45)")
    print("=" * 115)

    for th in thresholds:
        base_clf.confidence_threshold = th

        def eval_dataset(q_list):
            correct = 0
            oos_total = 0
            oos_fa = 0
            for q in q_list:
                exp = q["expected_intent"]
                is_oos = (q.get("category") == "out_of_scope" or exp == "out_of_scope")
                if is_oos:
                    oos_total += 1
                res = base_clf.predict(q["query"])
                pred = res.intent
                if pred.lower() == exp.lower():
                    correct += 1
                if is_oos and pred != "out_of_scope" and pred != "clarification_request":
                    oos_fa += 1
            return correct, len(q_list), oos_fa, oos_total

        t_corr, t_tot, t_fa, t_oos_tot = eval_dataset(test_queries)
        h_corr, h_tot, h_fa, h_oos_tot = eval_dataset(heldout_queries)

        c_corr = t_corr + h_corr
        c_tot = t_tot + h_tot
        c_fa = t_fa + h_fa
        c_oos_tot = t_oos_tot + h_oos_tot

        t_acc = (t_corr / t_tot) * 100.0
        h_acc = (h_corr / h_tot) * 100.0
        c_acc = (c_corr / c_tot) * 100.0
        c_fa_rate = (c_fa / max(1, c_oos_tot)) * 100.0

        results.append({
            "threshold": th,
            "test_accuracy": round(t_acc, 2),
            "test_correct": t_corr,
            "heldout_accuracy": round(h_acc, 2),
            "heldout_correct": h_corr,
            "combined_accuracy": round(c_acc, 2),
            "combined_correct": c_corr,
            "oos_false_accepts": c_fa,
            "oos_total": c_oos_tot,
            "oos_fa_rate": round(c_fa_rate, 2)
        })

    print(f"{'Threshold':<10} | {'Test (30)':<14} | {'Held-Out (15)':<16} | {'Combined (45)':<16} | {'OOS FA (8 total)':<16} | {'OOS FA Rate'}")
    print("-" * 115)
    for r in results:
        print(
            f"{r['threshold']:<10.2f} | "
            f"{r['test_accuracy']:>5.1f}% ({r['test_correct']}/30) | "
            f"{r['heldout_accuracy']:>5.1f}% ({r['heldout_correct']}/15)   | "
            f"{r['combined_accuracy']:>5.1f}% ({r['combined_correct']}/45)   | "
            f"{r['oos_false_accepts']}/{r['oos_total']:<14} | "
            f"{r['oos_fa_rate']:>6.2f}%"
        )
    print("=" * 115)

    out_path = os.path.join(EVAL_DIR, "combined_threshold_sweep.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Saved combined threshold sweep to {out_path}")


if __name__ == "__main__":
    run_sweep()
