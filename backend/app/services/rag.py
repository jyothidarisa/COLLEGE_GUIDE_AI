"""
Enhanced RAG Orchestration Service with Modular NLP Pipeline
============================================================
Coordinates:
1. Stage 1 Text Preprocessing and Stage 10 Linguistic Analysis
2. Stage 2 Intent Classification with fallback confidence checks
3. Stage 3 Named Entity Recognition & Constraint Extraction
4. Stage 4 Coreference Resolution & Query Rewriting
5. Stage 5 Session Memory & User Correction State Updates
6. Stage 6 Query Representation (Dense + Lexical)
7. Hybrid SQL & FAISS Retrieval
8. Stage 7 Evidence Reranking with Domain Scoring
9. Stage 8 & 11 Unified Generation via SLM or LLM Runner
10. Grounded Response Assembly with verified Citations & Metadata
"""

import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.schemas import ChatRequest, ChatResponse, RetrievedEvidence
from app.services.retriever import hybrid_retrieve
from app.nlp import get_nlp_pipeline

logger = logging.getLogger(__name__)

async def answer_student_query(
    db: Session,
    chat_request: ChatRequest
) -> ChatResponse:
    """
    End-to-End NLP & RAG Pipeline Execution:
    Transforms raw student messages into grounded, context-aware,
    consistent answers using verified database facts and official documents.
    """
    nlp = get_nlp_pipeline()

    # 1. Complete NLP Pipeline Analysis (Preprocessing, Intent, NER, Context, Rewriting)
    nlp_bundle = nlp.process(
        query=chat_request.message,
        session_id=chat_request.session_id,
        conversation_history=chat_request.conversation_history
    )

    query_for_retrieval = nlp_bundle.rewritten_query or chat_request.message

    # 2. Target college resolution
    selected_col_id = None
    if chat_request.selected_college_ids and len(chat_request.selected_college_ids) == 1:
        selected_col_id = chat_request.selected_college_ids[0]

    # 3. Hybrid Retrieval (SQL facts + FAISS document chunks)
    raw_evidence = hybrid_retrieve(
        db,
        query_text=query_for_retrieval,
        top_k=8,
        college_id=selected_col_id
    )

    # 4. Stage 7: Evidence Reranking (Entity matching + Intent domain alignment)
    reranked_evidence = nlp.reranker.rerank(
        evidence_list=raw_evidence,
        query=query_for_retrieval,
        intent=nlp_bundle.intent,
        entities=nlp_bundle.entities,
        target_colleges=nlp_bundle.target_colleges
    )

    # 5. Model Execution: SLM vs. LLM
    model_type = (chat_request.model_type or "llm").lower()
    if model_type == "slm":
        model_out = nlp.slm_runner.generate(
            query=query_for_retrieval,
            evidence_list=reranked_evidence,
            student_profile=chat_request.student_profile,
            context=nlp_bundle.session_context,
            conversation_history=chat_request.conversation_history
        )
    else:
        model_out = await nlp.llm_runner.generate_async(
            query=query_for_retrieval,
            evidence_list=reranked_evidence,
            student_profile=chat_request.student_profile,
            context=nlp_bundle.session_context,
            conversation_history=chat_request.conversation_history
        )

    # 6. Assemble transparent structured response
    entities_summary = {
        "entrance_exam": nlp_bundle.entities.entrance_exam or nlp_bundle.session_context.confirmed_exam,
        "rank": nlp_bundle.entities.rank or nlp_bundle.session_context.confirmed_rank,
        "preferred_branch": nlp_bundle.entities.preferred_branch or nlp_bundle.session_context.confirmed_branch,
        "budget": nlp_bundle.entities.max_tuition_budget or nlp_bundle.session_context.confirmed_budget,
        "city": nlp_bundle.entities.city or nlp_bundle.session_context.confirmed_city,
        "state": nlp_bundle.entities.state or nlp_bundle.session_context.confirmed_state,
        "colleges_detected": [c["name"] for c in nlp_bundle.entities.colleges_mentioned]
    }

    # Clean out None values from entities summary for neat presentation
    entities_summary = {k: v for k, v in entities_summary.items() if v is not None and v != []}

    return ChatResponse(
        reply=model_out.reply,
        citations=model_out.citations,
        evidence_used=reranked_evidence,
        is_fallback=model_out.is_fallback,
        warning=model_out.warning,
        suggested_follow_ups=model_out.suggested_follow_ups,
        intent=nlp_bundle.intent,
        intent_confidence=nlp_bundle.intent_confidence,
        rewritten_query=nlp_bundle.rewritten_query if nlp_bundle.applied_rewrites else None,
        extracted_entities=entities_summary,
        model_used=model_out.model_name
    )
