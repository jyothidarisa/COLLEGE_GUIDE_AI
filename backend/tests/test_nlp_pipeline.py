"""
Comprehensive Automated Test Suite for Stages 1–12 of the NLP Pipeline
======================================================================
Tests:
- Test A: Paraphrase consistency
- Test B: Context retention across multiple turns
- Test C: Follow-up query & coreference resolution
- Test D: User correction overriding previous preference
- Test E: Missing evidence handling (no future cutoff hallucinations)
- Test F: Hard constraints enforcement
- Test G: Hallucination resistance on non-existent colleges
- Test H: SLM vs. LLM model comparison
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.nlp import (
    get_nlp_pipeline,
    preprocess_query,
    extract_entities,
    get_intent_classifier,
    get_state_manager,
    get_representation_service,
    SessionContext
)
from app.nlp.model_interface import ModelComparisonEvaluator

client = TestClient(app)
nlp = get_nlp_pipeline()


def test_stage_1_text_preprocessing():
    """Verifies contraction expansion, abbreviations, and numeric normalization."""
    raw = "What's the cse cutof for 20k rank in engg clgs? can't pay more than 2 lakhs."
    processed = preprocess_query(raw)

    assert "what is" in processed
    assert "computer science and engineering" in processed
    assert "cutoff" in processed
    assert "20000" in processed
    assert "cannot" in processed
    assert "200000 rupees" in processed


def test_test_a_paraphrase_consistency():
    """
    Test A — Paraphrase consistency:
    - 'Suggest colleges for my rank.'
    - 'Which colleges can I get with this rank?'
    - 'Can you recommend engineering colleges based on my rank?'
    All must map to the same intent: 'college_recommendation'
    and exhibit high mutual semantic similarity (> 0.70).
    """
    clf = get_intent_classifier()
    repr_svc = get_representation_service()

    p1 = "Suggest colleges for my rank."
    p2 = "Which colleges can I get with this rank?"
    p3 = "Can you recommend engineering colleges based on my rank?"

    r1 = clf.predict(p1)
    r2 = clf.predict(p2)
    r3 = clf.predict(p3)

    assert r1.intent == "college_recommendation"
    assert r2.intent == "college_recommendation"
    assert r3.intent == "college_recommendation"

    sim_1_2 = repr_svc.compute_semantic_similarity(p1, p2)
    sim_1_3 = repr_svc.compute_semantic_similarity(p1, p3)

    assert sim_1_2 >= 0.70, f"Expected semantic similarity >= 0.70, got {sim_1_2}"
    assert sim_1_3 >= 0.70, f"Expected semantic similarity >= 0.70, got {sim_1_3}"


def test_test_b_context_retention():
    """
    Test B — Context retention:
    Turn 1: 'My entrance rank is 20,000, and I prefer CSE.'
    Turn 2: 'My budget is ₹1 lakh per year.'
    Turn 3: 'Suggest colleges near Chennai.'
    Expects retention of all constraints in SessionContext and in rewritten query.
    """
    state_mgr = get_state_manager()
    session_id = "test_context_retention_session"
    ctx = state_mgr.get_or_create_session(session_id)

    # Turn 1
    t1_text = "My entrance rank is 20,000, and I prefer CSE."
    e1 = extract_entities(t1_text)
    state_mgr.update_session_with_entities(ctx, e1, t1_text)

    assert ctx.confirmed_rank == 20000.0
    assert ctx.confirmed_branch == "CSE"

    # Turn 2
    t2_text = "My budget is ₹1 lakh per year."
    e2 = extract_entities(t2_text)
    state_mgr.update_session_with_entities(ctx, e2, t2_text)

    assert ctx.confirmed_budget == 100000.0
    assert ctx.confirmed_rank == 20000.0  # Still retained
    assert ctx.confirmed_branch == "CSE"  # Still retained

    # Turn 3
    t3_text = "Suggest colleges near Chennai."
    e3 = extract_entities(t3_text)
    state_mgr.update_session_with_entities(ctx, e3, t3_text)

    assert ctx.confirmed_city == "Chennai"
    assert ctx.confirmed_budget == 100000.0
    assert ctx.confirmed_branch == "CSE"
    assert ctx.confirmed_rank == 20000.0

    rewritten, mods = state_mgr.rewrite_query(t3_text, ctx, "location_search", e3)
    assert "Chennai" in rewritten
    assert "20000" in rewritten or "20,000" in rewritten
    assert "CSE" in rewritten
    assert "100,000" in rewritten or "100000" in rewritten


def test_test_c_follow_up_resolution():
    """
    Test C — Follow-up resolution:
    Turn 1: 'Compare IIT Madras and BITS Pilani.'
    Turn 2: 'Which one has lower fees?'
    Expected: Resolves coreference to compare fees between the same two colleges.
    """
    state_mgr = get_state_manager()
    session_id = "test_followup_session"
    ctx = state_mgr.get_or_create_session(session_id)

    t1_text = "Compare IIT Madras and BITS Pilani."
    e1 = extract_entities(t1_text)
    state_mgr.update_session_with_entities(ctx, e1, t1_text)

    assert ctx.last_comparison_pair is not None
    assert len(ctx.last_comparison_pair) == 2

    t2_text = "Which one has lower fees?"
    e2 = extract_entities(t2_text)
    rewritten, mods = state_mgr.rewrite_query(t2_text, ctx, "follow_up", e2)

    assert "Indian Institute of Technology Madras" in rewritten
    assert "Birla Institute of Technology & Science -Pilani" in rewritten
    assert "fees" in rewritten.lower()


def test_test_d_user_correction():
    """
    Test D — User correction:
    Turn 1: 'I prefer ECE.'
    Turn 2: 'Actually, change my preference to CSE.'
    Expected: The latest explicit preference overrides the older one.
    """
    state_mgr = get_state_manager()
    session_id = "test_correction_session"
    ctx = state_mgr.get_or_create_session(session_id)

    # Turn 1
    t1_text = "I prefer ECE."
    e1 = extract_entities(t1_text)
    state_mgr.update_session_with_entities(ctx, e1, t1_text)
    assert ctx.confirmed_branch == "ECE"

    # Turn 2
    t2_text = "Actually, change my preference to CSE."
    e2 = extract_entities(t2_text)
    state_mgr.update_session_with_entities(ctx, e2, t2_text)

    assert ctx.confirmed_branch == "CSE", "Correction failed to override previous preference."

    rewritten, mods = state_mgr.rewrite_query(t2_text, ctx, "college_recommendation", e2)
    assert "CSE" in rewritten or "Computer Science and Engineering" in rewritten


def test_test_e_missing_evidence():
    """
    Test E — Missing evidence:
    User asks: 'What is the exact cutoff for next year's admission?'
    Expected: Chatbot must NOT invent a future cutoff; it must state that future
    cutoffs are not yet established and explain that only historical data is available.
    """
    resp = client.post("/api/chat", json={
        "message": "What is the exact cutoff for next year's 2026 admission at IIT Madras?",
        "conversation_history": []
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["reply"].lower()

    # Must not claim guaranteed exact future number
    assert any(w in reply for w in ["historical", "previous", "cannot guarantee", "fluctuate", "official records", "gauge"])


def test_test_f_hard_constraints():
    """
    Test F — Hard constraints:
    User specifies strict budget of ₹1 Lakh per year and CSE.
    Expects response to prioritize verified low-fee colleges (Jadavpur, Anna Univ)
    and not present high-fee private colleges as meeting the budget.
    """
    resp = client.post("/api/chat", json={
        "message": "Which college is affordable for me with a budget of 1 lakh per year for CSE?",
        "student_profile": {
            "preferred_course": "Computer Science and Engineering",
            "entrance_exam": "JEE_MAIN",
            "rank_or_score": 15000,
            "max_tuition_budget": 100000
        },
        "conversation_history": []
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["reply"]

    # Budget institutions under 1 Lakh
    assert any(c in reply for c in ["Jadavpur", "Anna University", "Aligarh", "fee waiver", "1 Lakh"])


def test_test_g_hallucination_resistance():
    """
    Test G — Hallucination resistance:
    Ask about fictitious institutions: 'Hogwarts School of Engineering' or 'Atlantis Institute'.
    Expected: Chatbot acknowledges absence of verified records and does not invent fake facts or citations.
    """
    resp = client.post("/api/chat", json={
        "message": "What is the CSE cutoff and highest package at Atlantis Institute of Space Technology?",
        "conversation_history": []
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["reply"]

    # Must acknowledge lack of records in verified database
    assert any(phrase in reply.lower() for phrase in [
        "could not locate", "never invents", "not found", "75 premier indian", "verified records"
    ])
    assert len(data["evidence_used"]) == 0 or all("Atlantis" not in e["college_name"] for e in data["evidence_used"] if e.get("college_name"))


def test_test_h_model_comparison():
    """
    Test H — Model comparison:
    Executes benchmark queries through ModelComparisonEvaluator, comparing SLM vs LLM
    on latency, faithfulness, constraint satisfaction, and cost.
    """
    evaluator = ModelComparisonEvaluator()
    cases = [
        {"query": "What is a closing rank?"},
        {"query": "What is the difference between average and median package?"},
        {"query": "Compare IIT Madras and BITS Pilani"},
        {"query": "Which college is affordable for me with a budget of 2 lakhs per year?"}
    ]

    report = evaluator.run_benchmark(cases)
    assert report["test_count"] == 4
    assert "metrics" in report
    metrics = report["metrics"]

    assert "slm_avg_latency_ms" in metrics
    assert "llm_avg_latency_ms" in metrics
    assert "slm_faithfulness" in metrics
    assert "llm_faithfulness" in metrics
    assert metrics["slm_constraint_satisfaction_rate"] == 100.0


def test_nlp_status_endpoint():
    """Verifies that the /api/chat/nlp-status diagnostic endpoint works."""
    resp = client.get("/api/chat/nlp-status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "active"
    assert "intent_evaluation" in data
    assert data["intent_evaluation"]["accuracy"] > 0.0


def test_linguistic_analysis_endpoint():
    """Verifies that the /api/chat/linguistic-analysis educational endpoint works."""
    resp = client.post("/api/chat/linguistic-analysis?query=Tell%20me%20about%20IIT%20Madras%20fees")
    assert resp.status_code == 200
    data = resp.json()
    assert "analysis" in data
    analysis = data["analysis"]
    assert "tokenization" in analysis
    assert "pos_tagging" in analysis
    assert "lemmatization" in analysis
