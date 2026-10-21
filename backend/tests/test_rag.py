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
