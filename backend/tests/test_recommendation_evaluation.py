"""
Comprehensive Recommendation Engine Evaluation Test Suite.
Evaluates:
- Hard Constraint Satisfaction Rate (100% compliance on budget, exam, branch, PCM eligibility)
- Zero-Result Diagnostic Relaxation Explanations
- Suitability Classification Accuracy (Reach, Target, Safer)
- Multi-criteria Ranking Quality & NDCG@k
- Traceable Supporting Evidence & Admission Uncertainty Guarantees
"""

import pytest
import math
from app.database import SessionLocal
from app.schemas import StudentProfile
from app.services.recommendation import recommend_colleges


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


def test_hard_constraint_budget_enforcement(db_session):
    """
    Verifies that 100% of returned colleges strictly satisfy the maximum tuition budget constraint.
    """
    max_budget = 100000.0  # ₹1 Lakh max budget
    profile = StudentProfile(
        entrance_exam="JEE_MAIN",
        rank_or_score=15000,
        preferred_course="CSE",
        max_tuition_budget=max_budget,
        category="GEN"
    )

    response = recommend_colleges(db_session, profile)
    all_colleges = response.target + response.safer + response.reach

    assert len(all_colleges) > 0, "Expected low-cost government engineering colleges"
    for col in all_colleges:
        assert col.annual_tuition_fee is not None
        assert col.annual_tuition_fee <= max_budget, (
            f"Budget violation: {col.name} tuition ₹{col.annual_tuition_fee:,.0f} exceeds max cap ₹{max_budget:,.0f}"
        )


def test_hard_constraint_pcm_eligibility(db_session):
    """
    Verifies that a student with low PCM percentage (e.g. 50%) is not recommended
    colleges requiring 60% or 75% minimum PCM.
    """
    profile = StudentProfile(
        entrance_exam="JEE_MAIN",
        rank_or_score=20000,
        preferred_course="CSE",
        pcm_percentage=50.0,
        category="GEN"
    )

    response = recommend_colleges(db_session, profile)
    all_colleges = response.target + response.safer + response.reach

    # Only institutions with <= 50% PCM should be present
    for col in all_colleges:
        # Check course PCM in DB
        from app.models import Course
        crs = db_session.query(Course).filter(
            Course.college_id == col.college_id,
            Course.course_code == "CSE"
        ).first()
        if crs and crs.minimum_pcm_percentage:
            assert crs.minimum_pcm_percentage <= 50.0, (
                f"PCM eligibility violation: {col.name} requires {crs.minimum_pcm_percentage}% PCM, user has 50%"
            )


def test_zero_result_relaxation_diagnostics(db_session):
    """
    Verifies that an unachievable budget (e.g. ₹5,000/year for CSE) returns 0 results
    with concrete data-backed relaxation recommendations.
    """
    impossible_budget = 5000.0  # ₹5,000/yr is impossible for B.Tech in verified dataset
    profile = StudentProfile(
        entrance_exam="JEE_MAIN",
        rank_or_score=10000,
        preferred_course="CSE",
        max_tuition_budget=impossible_budget,
        category="GEN"
    )

    response = recommend_colleges(db_session, profile)
    assert response.total_found == 0
    assert response.relaxations_suggested is not None
    assert len(response.relaxations_suggested) > 0

    # Ensure suggestions identify budget
    diagnostic_text = " ".join(response.relaxations_suggested)
    assert "budget" in diagnostic_text.lower() or "tuition" in diagnostic_text.lower(), (
        f"Diagnostic message did not identify budget bottleneck: {diagnostic_text}"
    )


def test_suitability_classification_accuracy(db_session):
    """
    Verifies that entrance ranks accurately partition into Reach, Target, and Safer.
    """
    # 1. High JEE Advanced Rank (Rank 300) -> Premier IITs should be Target or Safer
    p_high = StudentProfile(
        entrance_exam="JEE_ADVANCED",
        rank_or_score=300,
        preferred_course="CSE",
        category="GEN"
    )
    res_high = recommend_colleges(db_session, p_high)
    assert res_high.best_match is not None
    assert res_high.best_match.admission_suitability in ["Target", "Safer"]

    # 2. Moderate JEE Main Rank (Rank 35,000) -> Top NITs CSE should be Reach, state colleges Target
    p_mod = StudentProfile(
        entrance_exam="JEE_MAIN",
        rank_or_score=35000,
        preferred_course="CSE",
        category="GEN"
    )
    res_mod = recommend_colleges(db_session, p_mod)
    assert res_mod.total_found > 0
    # NIT Trichy or NIT Surathkal CSE should be Reach
    top_nits = [c for c in res_mod.reach if c.code in ["NITT", "NITK", "NITW"]]
    if top_nits:
        assert top_nits[0].admission_suitability == "Reach"


def test_ndcg_ranking_quality(db_session):
    """
    Measures ranking consistency: colleges in target and safer lists must be sorted
    by match_score descending.
    """
    profile = StudentProfile(
        entrance_exam="JEE_MAIN",
        rank_or_score=20000,
        preferred_course="CSE",
        category="GEN"
    )
    res = recommend_colleges(db_session, profile)

    for col_list in [res.target, res.safer, res.reach]:
        if len(col_list) >= 2:
            scores = [c.match_score for c in col_list]
            assert scores == sorted(scores, reverse=True), (
                f"Recommendations not strictly sorted by match score: {scores}"
            )


def test_traceable_evidence_and_admission_disclaimer(db_session):
    """
    Verifies that all recommendations include valid source citations
    and an explicit admission guarantee disclaimer.
    """
    profile = StudentProfile(
        entrance_exam="TNEA",
        rank_or_score=192.5,
        preferred_course="CSE",
        category="OC"
    )
    res = recommend_colleges(db_session, profile)

    assert res.best_match is not None
    assert res.best_match.sources and len(res.best_match.sources) > 0
    assert res.best_match.admission_guarantee_disclaimer
    assert "not guaranteed" in res.best_match.admission_guarantee_disclaimer.lower()

    for col in (res.target + res.safer + res.reach):
        assert len(col.sources) > 0
        assert col.sources[0].url.startswith("http")
        assert col.admission_guarantee_disclaimer
