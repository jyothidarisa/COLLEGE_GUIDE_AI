import pytest
from app.database import SessionLocal, init_db
from app.schemas import StudentProfile
from app.services.recommendation import recommend_colleges

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    yield db
    db.close()

def test_tnea_cse_top_score_recommendation(db_session):
    # Cutoff 199.2 (very high): Should recommend CEG (Better-matched/Ambitious) and PSG/SSN (Alternative/Safe)
    profile = StudentProfile(
        preferred_course="CSE",
        entrance_exam="TNEA",
        rank_or_score=199.2,
        pcm_percentage=98.0,
        category="OC"
    )
    res = recommend_colleges(db_session, profile)
    assert res.success is True
    assert res.total_found > 0
    all_recs = res.better_matched + res.alternative + res.ambitious
    names = [r.name for r in all_recs]
    assert any("Anna University" in n or "CEG" in n for n in names)

def test_hard_tuition_budget_constraint(db_session):
    # Set a very low tuition budget: 60,000 INR
    # CEG tuition is 50,000 (qualifies)
    # SSN (1,50,000) and PSG self-supported (1,40,000) should be excluded
    profile = StudentProfile(
        preferred_course="CSE",
        entrance_exam="TNEA",
        rank_or_score=198.5,
        pcm_percentage=95.0,
        max_tuition_budget=60000.0,
        category="OC"
    )
    res = recommend_colleges(db_session, profile)
    assert res.success is True
    all_recs = res.better_matched + res.alternative + res.ambitious
    for r in all_recs:
        assert r.annual_tuition_fee is not None
        assert r.annual_tuition_fee <= 60000.0

def test_jee_main_nitt_recommendation(db_session):
    # JEE Main rank 1400: Should qualify for NIT Trichy CSE Other State
    profile = StudentProfile(
        preferred_course="CSE",
        entrance_exam="JEE_MAIN",
        rank_or_score=1400,
        pcm_percentage=85.0,
        category="GEN",
        quota="Other State"
    )
    res = recommend_colleges(db_session, profile)
    assert res.success is True
    all_recs = res.better_matched + res.alternative + res.ambitious
    codes = [r.code for r in all_recs]
    assert "NITT" in codes

def test_unsupported_exam_no_fabricated_colleges(db_session):
    # Searching for exam with no verified college should return 0 colleges without fabricating data
    profile = StudentProfile(
        preferred_course="CIVIL",
        entrance_exam="JEE_ADVANCED",
        rank_or_score=5000,
        pcm_percentage=75.0,
        category="GEN"
    )
    res = recommend_colleges(db_session, profile)
    assert res.success is True
    assert res.total_found == 0
    assert res.relaxations_suggested is not None
