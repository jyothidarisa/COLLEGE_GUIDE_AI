import os
import sys
import json
from typing import Dict, List, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

EVAL_DIR = os.path.dirname(os.path.abspath(__file__))
QUERIES_PATH = os.path.join(EVAL_DIR, "smalltalk_queries.json")
BACKEND_DIR = os.path.abspath(os.path.join(EVAL_DIR, "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from app.nlp.smalltalk import handle_smalltalk
except ImportError:
    handle_smalltalk = None

def run_evaluation():
    with open(QUERIES_PATH, "r", encoding="utf-8") as f:
        cases = json.load(f)

    print("=" * 105)
    print(f"SMALL-TALK HANDLER EVALUATION ({len(cases)} TEST CASES)")
    print("=" * 105)

    if handle_smalltalk is None:
        print("ERROR: app.nlp.smalltalk not yet implemented.")
        return

    passed_count = 0
    total = len(cases)

    for case in cases:
        cid = case["id"]
        query = case["query"]
        history = case.get("conversation_history", [])
        exp_is_st = case["expected_is_smalltalk"]
        exp_cat = case.get("expected_category")
        exp_stripped = case.get("expected_stripped_query")

        res = handle_smalltalk(query=query, conversation_history=history)

        is_st_match = (res.is_smalltalk == exp_is_st)
        cat_match = (not exp_is_st) or (res.category == exp_cat)
        strip_match = True
        if exp_stripped is not None:
            strip_match = (res.cleaned_query and res.cleaned_query.strip().lower() == exp_stripped.strip().lower())

        case_passed = is_st_match and cat_match and strip_match

        if case_passed:
            passed_count += 1
            status = "✓ PASS"
        else:
            status = "✗ FAIL"

        info = f"is_st={res.is_smalltalk} (exp {exp_is_st})"
        if exp_is_st:
            info += f", cat={res.category} (exp {exp_cat})"
        if exp_stripped:
            info += f", stripped='{res.cleaned_query}'"

        print(f"[{cid}] {status} | Query: {query[:36]:<36} | {info}")

    pass_rate = (passed_count / total) * 100.0
    print("=" * 105)
    print(f"SMALL-TALK EVALUATION PASS RATE: {pass_rate:.1f}% ({passed_count}/{total} test cases passed)")
    print("=" * 105)

if __name__ == "__main__":
    run_evaluation()
