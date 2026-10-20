import os
import sys
import json
from typing import Dict, List, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal
from app.schemas import StudentProfile
from app.services.recommendation import recommend_colleges

EVAL_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILES_PATH = os.path.join(EVAL_DIR, "reco_profiles.json")


def check_profile_constraints(profile_data: Dict[str, Any], res) -> Dict[str, Any]:
    max_budget = profile_data.get("max_tuition_budget")
    pref_course = profile_data.get("preferred_course", "").upper()
    loc_pref = profile_data.get("location_preference", "Any")

    # Collect all recommended colleges
    recos = []
    if res.best_match:
        recos.append(("best_match", res.best_match))
    for c in res.target:
        recos.append(("target", c))
    for c in res.reach:
        recos.append(("reach", c))
    for c in res.safer:
        recos.append(("safer", c))
    for c in res.intelligent_alternatives:
        recos.append(("intelligent_alt", c))

    if not recos:
        # If no colleges found, check if that was expected or a failure
        return {
            "passed": False,
            "total_recos": 0,
            "violations": ["No colleges recommended."]
        }

    violations = []
    
    for tier, item in recos:
        # 1. Branch check
        if item.matched_course and item.matched_course.upper() != pref_course:
            # Intelligent alternatives can suggest flagship CSE/ECE if explicit branch not found
            if tier != "intelligent_alt":
                violations.append(f"[{tier}] {item.name}: Matched branch '{item.matched_course}' != preferred '{pref_course}'.")

        # 2. Budget check (Hard filter)
        if max_budget is not None and item.annual_tuition_fee is not None:
            if item.annual_tuition_fee > max_budget:
                violations.append(f"[{tier}] {item.name}: Tuition fee ₹{item.annual_tuition_fee:,.0f} exceeds budget ₹{max_budget:,.0f}.")

        # 3. Location check
        if loc_pref and loc_pref.lower() != "any":
            col_loc = f"{item.state} {item.city}".lower()
            if loc_pref.lower() == "south india":
                south_states = ["tamil nadu", "karnataka", "kerala", "andhra pradesh", "telangana"]
                if not any(s in col_loc for s in south_states):
                    violations.append(f"[{tier}] {item.name}: Located in '{item.state}', outside preferred region 'South India'.")
            elif loc_pref.lower() not in col_loc:
                violations.append(f"[{tier}] {item.name}: Located in '{item.state}', outside preferred location '{loc_pref}'.")

    passed = (len(violations) == 0)
    return {
        "passed": passed,
        "total_recos": len(recos),
        "violations": violations
    }


def run_reco_evaluation():
    with open(PROFILES_PATH, "r", encoding="utf-8") as f:
        profiles = json.load(f)

    db = SessionLocal()
    print("=" * 110)
    print(f"RECOMMENDATION CONSTRAINT SATISFACTION EVALUATION ({len(profiles)} PROFILES)")
    print("=" * 110)

    pass_count = 0
    total = len(profiles)

    for p in profiles:
        prof_obj = StudentProfile(
            student_name=p["student_name"],
            state=p["state"],
            category=p["category"],
            preferred_course=p["preferred_course"],
            entrance_exam=p["entrance_exam"],
            rank_or_score=p["rank_or_score"],
            max_tuition_budget=p.get("max_tuition_budget"),
            preferred_city=p.get("location_preference") if p.get("location_preference") != "Any" else None
        )

        res = recommend_colleges(db, prof_obj)
        check = check_profile_constraints(p, res)

        status_mark = "✓ PASS" if check["passed"] else "✗ FAIL"
        if check["passed"]:
            pass_count += 1

        print(f"[{p['id']}] {status_mark} | {p['student_name']:<18} | Recos: {check['total_recos']:<3} | Exam: {p['entrance_exam']:<10} | Budget: ₹{p.get('max_tuition_budget', 0):,}")
        if not check["passed"]:
            for v in check["violations"][:3]:
                print(f"       -> Violation: {v}")
            if len(check["violations"]) > 3:
                print(f"       -> ... and {len(check['violations']) - 3} more violations")

    pass_rate = (pass_count / total) * 100.0
    print("=" * 110)
    print(f"RECOMMENDATION CONSTRAINT PASS RATE: {pass_rate:.1f}% ({pass_count}/{total} profiles passed all constraints)")
    print("=" * 110)


if __name__ == "__main__":
    run_reco_evaluation()
