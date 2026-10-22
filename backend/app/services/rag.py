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
    # Canonical labels from INTENT_CLASSES in intent_classifier.py
    college_intents = {
        "college_search",
        "cutoff_and_rank",
        "fees_and_budget",
        "placement_information",
        "hostel_and_facilities",
        "scholarship_information",
        "admission_eligibility",
        "admission_procedure",
        "branch_selection"
    }

    pronoun_pat = re.compile(r'\b(it|its|this college|the college|here|there)\b', re.IGNORECASE)
    has_pronoun = bool(pronoun_pat.search(query_for_retrieval))

    if selected_col_id:
        from app.models import College
        page_college = db.query(College).filter(College.id == selected_col_id).first()
        if page_college:
            is_college_intent = nlp_bundle.intent in college_intents

            if has_pronoun:
                query_for_retrieval = pronoun_pat.sub(page_college.name, query_for_retrieval)
                nlp_bundle.target_colleges = [page_college.name]
            elif is_college_intent or not nlp_bundle.target_colleges:
                query_for_retrieval = f"{query_for_retrieval} at {page_college.name}"
                nlp_bundle.target_colleges = [page_college.name]
    elif not nlp_bundle.target_colleges and has_pronoun:
        # Pronoun without any college context in query, session, or page
        return ChatResponse(
            reply="Which college do you mean? Please specify the institution name (for example: *'What are the fees for NIT Trichy?'* or *'What is the placement at BITS Pilani?'*).",
            citations=[],
            evidence_used=[],
            is_fallback=False,
            warning=None,
            suggested_follow_ups=[
                "What are the fees for NIT Trichy?",
                "What are the fees for PSG Tech?",
                "What are the fees for SSN College?"
            ],
            intent=nlp_bundle.intent,
            intent_confidence=nlp_bundle.intent_confidence,
            rewritten_query=query_for_retrieval,
            extracted_entities={},
            model_used="Rule Engine"
        )

    # Direct Recommendation Engine Bypass for "suit my qualifications" queries
    # Check if the query itself explicitly mentions a college; do not let old session history hijack a fresh recommendation inquiry
    query_has_explicit_college = bool(nlp_bundle.entities.colleges_mentioned)
    is_rec_phrase = any(k in chat_request.message.lower() for k in [
        "suit my qualifications", "which colleges suit", "colleges for my rank",
        "which colleges can i get", "colleges i can get", "colleges for 20k"
    ])
    if (nlp_bundle.intent == "college_recommendation" or is_rec_phrase) and not query_has_explicit_college:
        profile = chat_request.student_profile
        if not profile or not profile.entrance_exam or not profile.rank_or_score or not profile.preferred_course:
            return ChatResponse(
                reply=(
                    "To recommend colleges that suit your qualifications, please provide your profile details:\n\n"
                    "1. **Entrance Exam**: (e.g. JEE Main, TNEA, BITSAT)\n"
                    "2. **Cutoff Score or Rank**: (e.g. JEE Rank 15,000 or TNEA Cutoff 195.00/200)\n"
                    "3. **Preferred Course / Branch**: (e.g. Computer Science and Engineering, ECE)\n\n"
                    "*You can enter these in the Student Profile tab or type them directly.*"
                ),
                citations=[],
                evidence_used=[],
                is_fallback=False,
                warning=None,
                suggested_follow_ups=[
                    "Recommend colleges for JEE rank 15000",
                    "Suggest colleges for TNEA 195 cutoff"
                ],
                intent="college_recommendation",
                intent_confidence=0.95,
                rewritten_query=query_for_retrieval,
                extracted_entities={},
                model_used="Recommendation Engine"
            )

        from app.services.recommendation import validate_student_profile, recommend_colleges
        is_valid, err_msg = validate_student_profile(profile)
        if not is_valid:
            return ChatResponse(
                reply=f"⚠️ {err_msg}",
                citations=[],
                evidence_used=[],
                is_fallback=False,
                warning=err_msg,
                suggested_follow_ups=[
                    "Recommend colleges for JEE rank 15000",
                    "Suggest colleges for TNEA 195 cutoff"
                ],
                intent="college_recommendation",
                intent_confidence=0.95,
                rewritten_query=query_for_retrieval,
                extracted_entities={},
                model_used="Recommendation Engine"
            )

        rec_res = recommend_colleges(db, profile)

        def format_rec_item(item, label: str) -> str:
            fee_str = f"₹{item.annual_tuition_fee:,.0f}/yr" if item.annual_tuition_fee else "N/A"
            cutoff_str = "N/A"
            if item.historical_cutoff and "closing_value" in item.historical_cutoff:
                val = item.historical_cutoff["closing_value"]
                if "TNEA" in str(item.historical_cutoff.get("exam_route", "")).upper() or val <= 200:
                    cutoff_str = f"{val:.2f}"
                else:
                    cutoff_str = f"{int(val):,}"
            return f"• **{label}**: **{item.name}** ({item.matched_course}) — Closing: {cutoff_str} | Fee: {fee_str}"

        reply_lines = ["### Tailored College Recommendations for Your Profile\n"]
        if rec_res.reach:
            reply_lines.append(format_rec_item(rec_res.reach[0], "Ambitious Match"))
        if rec_res.target:
            reply_lines.append(format_rec_item(rec_res.target[0], "Better-Matched Target"))
        elif rec_res.better_matched:
            reply_lines.append(format_rec_item(rec_res.better_matched[0], "Better-Matched Target"))
        if rec_res.intelligent_alternatives:
            reply_lines.append(format_rec_item(rec_res.intelligent_alternatives[0], "Intelligent Alternative"))

        rec_cits = []
        seen_c_urls = set()
        all_candidates = (rec_res.reach or []) + (rec_res.target or []) + (rec_res.intelligent_alternatives or [])
        for cand in all_candidates:
            for s in (cand.sources or []):
                if s.url and s.url not in seen_c_urls:
                    seen_c_urls.add(s.url)
                    rec_cits.append(s)

        return ChatResponse(
            reply="\n".join(reply_lines),
            citations=rec_cits[:3],
            evidence_used=[],
            is_fallback=False,
            warning=None,
            suggested_follow_ups=[
                "Compare these recommended colleges",
                "Check fee details for target match"
            ],
            intent="college_recommendation",
            intent_confidence=0.95,
            rewritten_query=query_for_retrieval,
            extracted_entities={},
            model_used="Recommendation Engine"
        )

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
            evidence_list=reranked_evidence[:top_k],
            student_profile=chat_request.student_profile,
            context=nlp_bundle.session_context,
            conversation_history=chat_request.conversation_history,
            mode="slm" if not is_fallback_llm else "slm_fallback",
            warning=warning_msg,
            target_colleges=nlp_bundle.target_colleges
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
