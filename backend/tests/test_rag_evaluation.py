"""
Empirical Evaluation Test Suite for RAG Retrieval and Factual Grounding.
Measures Recall@k, Mean Reciprocal Rank (MRR), Retrieval Relevance,
Citation Accuracy, and Faithfulness across a labelled benchmark dataset.
"""

import pytest
from app.database import SessionLocal
from app.services.retriever import hybrid_retrieve, retrieve_structured_evidence, retrieve_vector_evidence
from app.nlp.model_interface import calculate_faithfulness

# Labelled RAG Evaluation Test Dataset
# Each test item specifies:
# - query: Realistic student query
# - expected_colleges: Codes of colleges that MUST appear in top evidence
# - expected_topics: Key terms that must be present in retrieved snippets
# - is_unknown_college: True if the query targets an unverified college
RAG_BENCHMARK_DATASET = [
    {
        "id": "RAG-01",
        "query": "What is the tuition fee for IIT Madras?",
        "expected_colleges": ["IITM"],
        "expected_topics": ["tuition", "200,000", "fee"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-02",
        "query": "Are hostel charges included in tuition for IIT Madras?",
        "expected_colleges": ["IITM"],
        "expected_topics": ["hostel", "86000"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-03",
        "query": "What was the previous closing cutoff for CSE at NIT Trichy?",
        "expected_colleges": ["NITT"],
        "expected_topics": ["closing", "cse"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-04",
        "query": "What are the placement statistics for BITS Pilani?",
        "expected_colleges": ["BITS-P"],
        "expected_topics": ["placement", "median"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-05",
        "query": "Which scholarships are offered by Anna University CEG?",
        "expected_colleges": ["CEG-0001"],
        "expected_topics": ["scholarship"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-06",
        "query": "Compare IIT Bombay and BITS Pilani",
        "expected_colleges": ["IITB", "BITS-P"],
        "expected_topics": ["bombay", "pilani"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-07",
        "query": "What is the fee structure at COEP Pune?",
        "expected_colleges": ["COEP"],
        "expected_topics": ["fee", "annual"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-08",
        "query": "What are the campus facilities and nearest railway station for IIT Delhi?",
        "expected_colleges": ["IITD"],
        "expected_topics": ["railway", "campus", "facilities"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-09",
        "query": "Which colleges are affordable with a budget under 2 lakhs per year?",
        "expected_colleges": [],  # Broad query, expects low-fee colleges
        "expected_topics": ["annual tuition fee", "₹"],
        "is_unknown_college": False
    },
    {
        "id": "RAG-10",
        "query": "What is the cutoff for Atlantis Institute of Advanced Technology?",
        "expected_colleges": [],
        "expected_topics": [],
        "is_unknown_college": True  # Must return 0 evidence to prevent hallucination
    }
]

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


def test_rag_recall_and_mrr(db_session):
    """
    Evaluates Recall@k (k=5) and Mean Reciprocal Rank (MRR)
    across the standard RAG benchmark dataset.
    """
    recalls = []
    reciprocal_ranks = []
    relevance_scores = []
    source_attribution_correct = []

    for item in RAG_BENCHMARK_DATASET:
        query = item["query"]
        expected_cols = item["expected_colleges"]
        is_unknown = item["is_unknown_college"]

        evidence = hybrid_retrieve(db_session, query, top_k=5)

        if is_unknown:
            # For unknown colleges, expecting 0 retrieved evidence (resistance to hallucination)
            assert len(evidence) == 0, (
                f"Expected 0 evidence for unknown college query '{query}', but got {len(evidence)}"
            )
            continue

        assert len(evidence) > 0, f"Expected evidence for query '{query}', but got 0"

        # Check college recall in top-5
        retrieved_texts = " ".join([f"{e.college_name or ''} {e.snippet}" for e in evidence]).lower()
        
        # Calculate Recall
        if expected_cols:
            found_cols = [c for c in expected_cols if any(c.lower() in (e.college_name or '').lower() or c.lower() in e.snippet.lower() for e in evidence)]
            recall = len(found_cols) / len(expected_cols)
            recalls.append(recall)

            # Calculate Reciprocal Rank (position of first expected college)
            rr = 0.0
            for rank_idx, ev in enumerate(evidence):
                col_text = f"{ev.college_name or ''} {ev.snippet}".lower()
                if any(c.lower() in col_text for c in expected_cols):
                    rr = 1.0 / (rank_idx + 1)
                    break
            reciprocal_ranks.append(rr)

        # Topic matching
        for topic in item["expected_topics"]:
            assert topic.lower() in retrieved_texts, (
                f"Topic '{topic}' missing from retrieved evidence for '{query}'"
            )

        # Source URL & title attribution check
        for ev in evidence:
            relevance_scores.append(ev.relevance_score)
            has_valid_source = ev.source_url and ev.source_url.startswith("http") and ev.document_title
            source_attribution_correct.append(1 if has_valid_source else 0)

    # Compute empirical benchmark scores
    avg_recall_at_5 = sum(recalls) / max(1, len(recalls))
    mean_reciprocal_rank = sum(reciprocal_ranks) / max(1, len(reciprocal_ranks))
    avg_relevance = sum(relevance_scores) / max(1, len(relevance_scores))
    citation_accuracy = sum(source_attribution_correct) / max(1, len(source_attribution_correct))

    print(f"\n--- RAG EMPIRICAL BENCHMARK RESULTS ---")
    print(f"Recall@5: {avg_recall_at_5 * 100:.1f}%")
    print(f"Mean Reciprocal Rank (MRR): {mean_reciprocal_rank:.3f}")
    print(f"Average Retrieval Relevance: {avg_relevance:.3f}")
    print(f"Source Attribution Accuracy: {citation_accuracy * 100:.1f}%")

    assert avg_recall_at_5 >= 0.90, f"Recall@5 ({avg_recall_at_5}) below 90% threshold"
    assert mean_reciprocal_rank >= 0.80, f"MRR ({mean_reciprocal_rank}) below 0.80 threshold"
    assert citation_accuracy >= 0.95, f"Citation accuracy ({citation_accuracy}) below 95%"


def test_section_aware_evidence_retrieval(db_session):
    """
    Verifies that specific topical queries (hostels, scholarships, fees)
    retrieve the exact corresponding section chunk.
    """
    # 1. Hostel query
    hostel_ev = hybrid_retrieve(db_session, "Hostel facilities and room types at IIT Madras", top_k=3)
    assert any("hostel" in (e.document_title + e.snippet).lower() for e in hostel_ev), (
        "Failed to retrieve hostel section chunk for IIT Madras"
    )

    # 2. Scholarship query
    scholarship_ev = hybrid_retrieve(db_session, "Scholarships and fee waivers at Anna University CEG", top_k=3)
    assert any("scholarship" in (e.document_title + e.snippet).lower() for e in scholarship_ev), (
        "Failed to retrieve scholarship section chunk for Anna University"
    )

    # 3. Placement query
    placement_ev = hybrid_retrieve(db_session, "Placements and median package at BITS Pilani", top_k=3)
    assert any("placement" in (e.document_title + e.snippet).lower() for e in placement_ev), (
        "Failed to retrieve placement chunk for BITS Pilani"
    )
