import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse
from app.services.rag import answer_student_query
from app.nlp import get_nlp_pipeline, get_intent_classifier, get_representation_service
from app.nlp.model_interface import ModelComparisonEvaluator
from app.config import settings, BASE_DIR

router = APIRouter(tags=["AI Chatbot"])


class ChatConfigUpdate(BaseModel):
    api_key: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None


@router.post("/chat", response_model=ChatResponse, summary="Conversational college guidance powered by RAG")
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Accepts student chat request, runs intent classification, context resolution,
    evidence retrieval, reranking, and SLM/LLM inference.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Chat message cannot be empty.")
    return await answer_student_query(db, req)


@router.get("/chat/config", summary="Inspect LLM Provider configuration and availability")
def chat_config():
    """Returns active LLM capability status. Dynamically checks environment and .env files."""
    candidate_paths = [
        BASE_DIR / ".env",
        BASE_DIR / "backend" / ".env",
        BASE_DIR.parent / ".env",
        Path.cwd() / ".env"
    ]
    for p in candidate_paths:
        if p.exists():
            load_dotenv(dotenv_path=p, override=True)

    openrouter_key = os.getenv("OPENROUTER_API_KEY", settings.OPENROUTER_API_KEY or "").strip()
    is_valid_openrouter = bool(openrouter_key and (openrouter_key.startswith("sk-or-") or len(openrouter_key) > 20))
    provider = os.getenv("LLM_PROVIDER", settings.LLM_PROVIDER or "openrouter").strip().lower()
    model = os.getenv("OPENROUTER_MODEL", os.getenv("LLM_MODEL_NAME", settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct")).strip()
    base_url = os.getenv("OPENROUTER_BASE_URL", settings.OPENROUTER_BASE_URL or "https://openrouter.ai/api/v1").strip()

    settings.OPENROUTER_API_KEY = openrouter_key
    settings.OPENROUTER_MODEL = model
    settings.OPENROUTER_BASE_URL = base_url
    settings.LLM_PROVIDER = provider or "openrouter"
    settings.LLM_MODEL_NAME = model

    enabled = (provider in ["openrouter", "groq", "openai"] and is_valid_openrouter) or (provider == "ollama")
    return {
        "llm_enabled": enabled,
        "llm_provider": provider or "openrouter",
        "llm_model": model,
        "message": (
            f"Active LLM: {model} ({provider.upper()})"
            if enabled
            else "LLM mode disabled (no valid OPENROUTER_API_KEY configured in .env). Operating in Local SLM mode."
        )
    }


@router.post("/chat/config", summary="Update LLM Provider configuration at runtime")
def update_chat_config(update: ChatConfigUpdate):
    """Allows setting OpenRouter API Key and provider directly from the UI or API and persisting to .env."""
    target_env = BASE_DIR / ".env"
    existing_lines = []
    if target_env.exists():
        with open(target_env, "r", encoding="utf-8") as f:
            existing_lines = f.readlines()

    keys_to_update = {}
    if update.api_key is not None:
        clean_key = update.api_key.strip()
        keys_to_update["OPENROUTER_API_KEY"] = clean_key
        settings.OPENROUTER_API_KEY = clean_key
        os.environ["OPENROUTER_API_KEY"] = clean_key
    if update.provider is not None:
        clean_prov = update.provider.strip().lower()
        keys_to_update["LLM_PROVIDER"] = clean_prov
        settings.LLM_PROVIDER = clean_prov
        os.environ["LLM_PROVIDER"] = clean_prov
    elif update.api_key and settings.LLM_PROVIDER in ["fallback", ""]:
        keys_to_update["LLM_PROVIDER"] = "openrouter"
        settings.LLM_PROVIDER = "openrouter"
        os.environ["LLM_PROVIDER"] = "openrouter"
    if update.model is not None:
        clean_mod = update.model.strip()
        keys_to_update["OPENROUTER_MODEL"] = clean_mod
        settings.OPENROUTER_MODEL = clean_mod
        os.environ["OPENROUTER_MODEL"] = clean_mod
        settings.LLM_MODEL_NAME = clean_mod
        os.environ["LLM_MODEL_NAME"] = clean_mod
    if update.base_url is not None:
        clean_url = update.base_url.strip()
        keys_to_update["OPENROUTER_BASE_URL"] = clean_url
        settings.OPENROUTER_BASE_URL = clean_url
        os.environ["OPENROUTER_BASE_URL"] = clean_url

    updated_keys = set()
    new_lines = []
    for line in existing_lines:
        if "=" in line and not line.strip().startswith("#"):
            k = line.split("=", 1)[0].strip()
            if k in keys_to_update:
                new_lines.append(f"{k}={keys_to_update[k]}\n")
                updated_keys.add(k)
                continue
        new_lines.append(line)

    for k, v in keys_to_update.items():
        if k not in updated_keys:
            new_lines.append(f"{k}={v}\n")

    with open(target_env, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    is_valid = bool(settings.OPENROUTER_API_KEY and (settings.OPENROUTER_API_KEY.startswith("sk-or-") or len(settings.OPENROUTER_API_KEY) > 20))
    enabled = (settings.LLM_PROVIDER in ["openrouter", "groq", "openai"] and is_valid) or (settings.LLM_PROVIDER == "ollama")
    return {
        "success": True,
        "llm_enabled": enabled,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.OPENROUTER_MODEL,
        "message": f"LLM configuration saved and active ({settings.LLM_PROVIDER.upper()})."
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
