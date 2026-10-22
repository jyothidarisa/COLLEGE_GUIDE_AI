import pytest
from app.database import SessionLocal, init_db
from app.services.retriever import retrieve_structured_evidence, hybrid_retrieve
from app.services.llm_service import fallback_evidence_answering

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    yield db
    db.close()

def test_sql_fee_evidence_retrieval(db_session):
    # Querying fee-related question should retrieve exact verified SQL records
    records = retrieve_structured_evidence(db_session, "What is the tuition fee for IIT Madras?")
    assert len(records) > 0
    # Must contain exact verified fee information
    fee_text = " ".join([r["snippet"] for r in records])
    assert "200,000" in fee_text or "2,00,000" in fee_text or "IIT Madras" in fee_text
    assert records[0]["source_url"] != ""

def test_sql_cutoff_evidence_retrieval(db_session):
    # Querying cutoff question should retrieve exact verified SQL cutoff
    records = retrieve_structured_evidence(db_session, "What was the CSE cutoff for CEG Anna University?")
    assert len(records) > 0
    cutoff_text = " ".join([r["snippet"] for r in records])
    assert "199" in cutoff_text or "CEG" in cutoff_text

def test_fallback_answering_no_hallucinations(db_session):
    # Testing that offline evidence-grounded answerer produces citations from real records
    evidence = hybrid_retrieve(db_session, "What are the hostel charges and fees for CEG?", top_k=3)
    reply, citations, is_fallback, suggested = fallback_evidence_answering("What are the fees for CEG?", evidence)
    assert len(reply) > 50
    assert len(citations) > 0
    # URLs must be official, not invented
    for c in citations:
        assert c.url.startswith("http")

def test_recommendation_missing_profile_prompts_user():
    # When student profile is missing, chat must ask for missing fields instead of searching documents
    payload = {
        "message": "Which colleges suit my qualifications?",
        "student_profile": None,
        "model_type": "slm",
        "session_id": str(uuid.uuid4())
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["model_used"] == "Recommendation Engine"
    assert data["is_fallback"] is False
    assert "Entrance Exam" in data["reply"]
    assert "Cutoff Score or Rank" in data["reply"]

def test_recommendation_complete_profile_returns_matches():
    # A complete profile must invoke recommendation engine and NOT prompt for missing fields
    payload = {
        "message": "Which colleges suit my qualifications?",
        "student_profile": {
            "entrance_exam": "JEE_MAIN",
            "rank_or_score": 15000,
            "preferred_course": "Computer Science and Engineering",
            "category": "General",
            "quota": "All India"
        },
        "model_type": "slm",
        "session_id": str(uuid.uuid4())
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["model_used"] == "Recommendation Engine"
    assert data["is_fallback"] is False
    assert "To recommend colleges that suit your qualifications, please provide" not in data["reply"]
    assert "Tailored College Recommendations" in data["reply"]
    assert len(data["citations"]) > 0

def test_recommendation_invalid_rank_validation():
    # JEE Main rank > 1,500,000 must trigger rank validation check
    payload = {
        "message": "Which colleges suit my qualifications?",
        "student_profile": {
            "entrance_exam": "JEE_MAIN",
            "rank_or_score": 2000000,
            "preferred_course": "Computer Science and Engineering",
            "category": "General",
            "quota": "All India"
        },
        "model_type": "slm",
        "session_id": str(uuid.uuid4())
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "exceeds maximum possible candidates" in data["reply"]
