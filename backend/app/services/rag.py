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
import re
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.schemas import ChatRequest, ChatResponse, RetrievedEvidence
from app.services.retriever import hybrid_retrieve
from app.nlp import get_nlp_pipeline, handle_smalltalk
from app.config import settings

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
    # 0. Rule-based Small-Talk Handler (Runs BEFORE intent classifier and retrieval)
    st_res = handle_smalltalk(
        query=chat_request.message,
        conversation_history=chat_request.conversation_history
    )
    if st_res.is_smalltalk:
        return ChatResponse(
            reply=st_res.reply,
            citations=[],
            evidence_used=[],
            is_fallback=False,
            warning=None,
            suggested_follow_ups=st_res.suggestions,
            intent="small_talk",
            intent_confidence=1.0,
            rewritten_query=None,
            extracted_entities={},
            model_used="Rule Engine"
        )

    effective_query = st_res.cleaned_query or chat_request.message

    nlp = get_nlp_pipeline()

    # 1. Complete NLP Pipeline Analysis (Preprocessing, Intent, NER, Context, Rewriting)
    nlp_bundle = nlp.process(
        query=effective_query,
        session_id=chat_request.session_id,
        conversation_history=chat_request.conversation_history
    )

    if nlp_bundle.applied_rewrites and any("Ambiguity detected" in r for r in nlp_bundle.applied_rewrites):
        targets = nlp_bundle.target_colleges or []
        umb = "institution"
        if targets:
            umb = "NIT" if "National Institute" in targets[0] else ("IIT" if "Indian Institute" in targets[0] else "IIIT")
        options_str = ", ".join(targets[:4])
        reply = (
            f"### 1. Clarification Needed\n"
            f"We found **{len(targets)}** verified **{umb}** campuses in our official admissions archive (including {options_str}).\n\n"
            f"### 2. Available Options\n"
            + "\n".join([f"• **{t}**" for t in targets]) +
            f"\n\n### 3. What to Do Next\n"
            f"Please specify which particular {umb} campus you are interested in (for example, *\"What is the cutoff for {targets[0]}?\"*)."
        )
        return ChatResponse(
            reply=reply,
            citations=[],
            evidence_used=[],
            is_fallback=False,
            warning=None,
            suggested_follow_ups=[f"Cutoffs at {t[:25]}" for t in targets[:3]],
            intent="clarification_request",
            intent_confidence=1.0,
            rewritten_query=None,
            extracted_entities={},
            model_used="Rule Engine"
        )

    query_for_retrieval = nlp_bundle.rewritten_query or effective_query

    # 2. Target college resolution: only when a single college ID is passed (e.g. from /colleges/:id)
    selected_col_id = None
    if chat_request.selected_college_ids and len(chat_request.selected_college_ids) == 1:
        selected_col_id = chat_request.selected_college_ids[0]

    # Page-context rewrite: only on /colleges/:id, and only for pronouns or college-specific intents.
    # Do not append "at <college>" to generic questions.
    college_intents = {
        "college_search",
        "cutoff_inquiry",
        "fee_inquiry",
        "placement_information",
        "hostel_inquiry",
        "scholarship_information",
        "eligibility_check"
    }

    if selected_col_id and not nlp_bundle.target_colleges:
        from app.models import College
        page_college = db.query(College).filter(College.id == selected_col_id).first()
        if page_college:
            pronoun_pat = re.compile(r'\b(it|its|this college|the college|here)\b', re.IGNORECASE)
            has_pronoun = bool(pronoun_pat.search(query_for_retrieval))
            is_college_intent = nlp_bundle.intent in college_intents

            if has_pronoun:
                query_for_retrieval = pronoun_pat.sub(page_college.name, query_for_retrieval)
                nlp_bundle.target_colleges = [page_college.name]
            elif is_college_intent:
                query_for_retrieval = f"{query_for_retrieval} at {page_college.name}"
                nlp_bundle.target_colleges = [page_college.name]

    # For comparisons, expand short acronym queries (e.g. "Compare CEG and SSN") with resolved college names
    if len(nlp_bundle.target_colleges) >= 2 and any(k in query_for_retrieval.lower() for k in ["compare", "vs", "versus", "difference"]):
        query_for_retrieval = f"Compare {nlp_bundle.target_colleges[0]} and {nlp_bundle.target_colleges[1]}"

    # 3. Hybrid Retrieval: SLM uses top 3 chunks (or top 6 if comparing multiple colleges), LLM uses top 8 chunks
    requested_mode = (chat_request.model_type or "slm").lower()
    is_multi_college = len(nlp_bundle.target_colleges) >= 2
    top_k = (6 if is_multi_college else 3) if requested_mode == "slm" else 8

    raw_evidence = hybrid_retrieve(
        db,
        query_text=query_for_retrieval,
        top_k=top_k,
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
    api_key = (settings.LLM_API_KEY or "").strip()
    provider = (settings.LLM_PROVIDER or "fallback").lower()
    llm_configured = bool(api_key) or provider == "ollama"

    if requested_mode == "slm" or not llm_configured:
        is_fallback_llm = (requested_mode == "llm" and not llm_configured)
        warning_msg = "Notice: LLM API key not configured in .env. Response generated using deterministic Local SLM." if is_fallback_llm else None
        model_out = nlp.slm_runner.generate(
            query=query_for_retrieval,
            evidence_list=reranked_evidence[:3],
            student_profile=chat_request.student_profile,
            context=nlp_bundle.session_context,
            conversation_history=chat_request.conversation_history,
            mode="slm" if not is_fallback_llm else "slm_fallback",
            warning=warning_msg
        )
    else:
        model_out = await nlp.llm_runner.generate_async(
            query=query_for_retrieval,
            evidence_list=reranked_evidence[:8],
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
