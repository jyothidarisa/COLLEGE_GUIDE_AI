from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse
from app.services.rag import answer_student_query
from app.nlp import get_nlp_pipeline, get_intent_classifier, get_representation_service
from app.nlp.model_interface import ModelComparisonEvaluator
from app.config import settings

router = APIRouter(tags=["AI Chatbot"])

@router.post("/chat", response_model=ChatResponse, summary="Conversational college guidance powered by RAG")
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Retrieves evidence from verified college documents and database records,
    then generates a grounded response with source citations.
    Supports Stage 1-12 complete NLP pipeline with SLM or LLM execution.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Chat message cannot be empty.")
    return await answer_student_query(db, req)


@router.get("/chat/config", summary="Inspect LLM Provider configuration and availability")
def chat_config():
    """Returns active LLM capability status. Disables LLM mode if no API key is set."""
    api_key = (settings.LLM_API_KEY or "").strip()
    provider = (settings.LLM_PROVIDER or "fallback").lower()
    enabled = bool(api_key) and provider not in ["fallback"]
    if provider == "ollama":
        enabled = True
    return {
        "llm_enabled": enabled,
        "llm_provider": provider,
        "llm_model": settings.LLM_MODEL_NAME,
        "message": (
            f"Active LLM: {settings.LLM_MODEL_NAME} ({provider.upper()})"
            if enabled
            else "LLM mode disabled (no LLM_API_KEY configured in .env). Operating in Local SLM mode."
        )
    }


@router.get("/chat/nlp-status", summary="Inspect NLP Pipeline and Intent Classifier metrics")
def nlp_status():
    """
    Returns diagnostic metrics for the active NLP pipeline:
    - Intent Classifier evaluation accuracy and macro F1
    - Supported intent classes
    - Embedding representation details
    """
    clf = get_intent_classifier()
    eval_metrics = clf.evaluate()
    return {
        "status": "active",
        "pipeline": "Modular 12-Stage NLP Pipeline",
        "supported_intents": clf.classifier.classes_.tolist() if hasattr(clf.classifier, "classes_") else [],
        "intent_evaluation": {
            "accuracy": eval_metrics["accuracy"],
            "macro_f1": eval_metrics["macro_f1"],
            "test_sample_count": eval_metrics["test_sample_count"]
        },
        "embedding_model": "all-MiniLM-L6-v2 (384 dims, dense cosine)",
        "lexical_model": "TF-IDF sublinear n-grams (1, 2)",
        "linguistic_engine": "NLTK tokenization, POS tagging, WordNet lemmatizer"
    }


@router.post("/chat/linguistic-analysis", summary="Educational NLP linguistic inspection of a query")
def linguistic_analysis(query: str = Query(..., description="Student query to analyze")):
    """
    Stage 10: Educational NLP inspection.
    Returns sentence segmentation, tokens, POS tags, lemmas, and n-grams.
    """
    repr_svc = get_representation_service()
    analysis = repr_svc.get_full_nlp_analysis(query)
    return {
        "query": query,
        "analysis": analysis
    }


@router.post("/chat/compare-models", summary="SLM vs LLM empirical benchmark comparison")
def compare_models(db: Session = Depends(get_db)):
    """
    Stage 11: Model Comparison — SLM vs. LLM.
    Runs standardized benchmark queries on identical retrieval context
    and measures latency, faithfulness, constraint satisfaction, and cost.
    """
    evaluator = ModelComparisonEvaluator()

    benchmark_queries = [
        {"query": "What is a closing rank?", "evidence": []},
        {"query": "What is the difference between average and median package?", "evidence": []},
        {"query": "Compare IIT Madras and BITS Pilani", "evidence": []},
        {"query": "Which college is affordable for me with a budget of 2 lakhs per year?", "evidence": []},
        {"query": "Can I get CSE at NIT Trichy with rank 1200?", "evidence": []},
        {"query": "Why did you recommend this college?", "evidence": []}
    ]

    report = evaluator.run_benchmark(benchmark_queries)
    return report
