import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from app.schemas import ChatRequest, ChatResponse, RetrievedEvidence
from app.services.retriever import hybrid_retrieve
from app.services.llm_service import generate_llm_response

logger = logging.getLogger(__name__)

async def answer_student_query(
    db: Session,
    chat_request: ChatRequest
) -> ChatResponse:
    """
    Complete RAG workflow:
    1. Hybrid retrieval (exact SQL facts + vector/text document chunks).
    2. Context assembly with student profile and college filters.
    3. LLM generation with strict evidence grounding and citation tracking.
    4. Safe fallback if external LLM credentials are unconfigured.
    """
    selected_col_id = None
    if chat_request.selected_college_ids and len(chat_request.selected_college_ids) == 1:
        selected_col_id = chat_request.selected_college_ids[0]

    # 1. Hybrid Retrieval
    evidence = hybrid_retrieve(
        db,
        query_text=chat_request.message,
        top_k=6,
        college_id=selected_col_id
    )

    # 2. LLM / Grounded Generation
    reply, citations, is_fallback, warning, suggestions = await generate_llm_response(
        query=chat_request.message,
        evidence_list=evidence,
        student_profile=chat_request.student_profile,
        conversation_history=chat_request.conversation_history
    )

    return ChatResponse(
        reply=reply,
        citations=citations,
        evidence_used=evidence,
        is_fallback=is_fallback,
        warning=warning,
        suggested_follow_ups=suggestions
    )
