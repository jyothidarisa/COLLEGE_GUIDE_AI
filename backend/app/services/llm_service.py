import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
import httpx
from app.config import settings
from app.schemas import SourceCitation, RetrievedEvidence, ChatMessage, StudentProfile

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are College Guide AI, an expert, objective, and supportive college admissions assistant specializing in Indian engineering admissions (B.Tech / B.E., TNEA, JEE Main, JEE Advanced).

CRITICAL OPERATIONAL RULES:
1. Grounding in Evidence: Answer ONLY using the retrieved facts and documents provided in the context below. Do not fabricate cutoffs, fees, placement figures, or eligibility criteria.
2. Honest Boundaries: If the provided evidence does not contain the answer, explicitly state: "Based on the verified official documents currently in our database, this information is not documented. Please consult the official university admissions office."
3. No Admission Guarantees: Historical cutoffs are strictly past indicators and not guarantees of future admission. Never promise admission.
4. Distinguish Admission Routes: Do not confuse TNEA cutoffs (Class 12 marks out of 200) with JEE All India Ranks.
5. Official Citations: Factual claims must reference the verified source titles and URLs provided in the context.
6. Tone: Professional, encouraging, clear, and structured. Use bullet points and markdown tables where suitable.
"""

def build_rag_context(
    evidence_list: List[RetrievedEvidence],
    student_profile: Optional[StudentProfile] = None
) -> str:
    """Builds structured context for the prompt from verified evidence and student profile."""
    parts = []
    
    if student_profile:
        profile_str = (
            f"STUDENT PROFILE:\n"
            f"- Preferred Course: {student_profile.preferred_course}\n"
            f"- Exam: {student_profile.entrance_exam} with Score/Rank: {student_profile.rank_or_score}\n"
            f"- Category: {student_profile.category}, Quota: {student_profile.quota}\n"
            f"- Preferred City: {student_profile.preferred_city or 'Any'}\n"
            f"- Max Tuition Budget: ₹{student_profile.max_tuition_budget or 'Not specified'}\n"
            f"- Hostel Required: {'Yes' if student_profile.hostel_required else 'No'}\n"
        )
        parts.append(profile_str)

    parts.append("VERIFIED EVIDENCE & DOCUMENTS:")
    for idx, ev in enumerate(evidence_list, start=1):
        col = f"[{ev.college_name}] " if ev.college_name else ""
        parts.append(
            f"Source #{idx} ({ev.document_title} - {ev.source_url}):\n"
            f"{col}{ev.snippet}\n"
        )

    return "\n".join(parts)


def fallback_evidence_answering(
    query: str,
    evidence_list: List[RetrievedEvidence],
    student_profile: Optional[StudentProfile] = None
) -> Tuple[str, List[SourceCitation], List[str]]:
    """
    Offline evidence-grounded response generator when external LLM API credentials are not set.
    Extracts authentic verified information directly from retrieved evidence and SQL records.
    Never hallucinates.
    """
    if not evidence_list:
        reply = (
            "I could not find verified official records or documents in our database matching your specific question. "
            "Please refine your query or check the official counselling portals (e.g., TNEA at tneaonline.org or JoSAA at josaa.nic.in)."
        )
        return reply, [], ["What is the TNEA cutoff for CEG?", "What are the fees for IIT Madras?"]

    # Build response directly grounded in retrieved snippets
    snippets_text = []
    citations: List[SourceCitation] = []
    seen_urls = set()

    for ev in evidence_list:
        snippets_text.append(f"• **{ev.document_title}** ({ev.college_name or 'General'}):\n  {ev.snippet}")
        if ev.source_url and ev.source_url not in seen_urls:
            seen_urls.add(ev.source_url)
            citations.append(SourceCitation(
                authority="Official Regulatory Authority",
                source_name=ev.document_title,
                url=ev.source_url,
                year=ev.academic_year or 2024,
                verified_date="2024-08-20"
            ))

    reply_parts = [
        "### Verified Admission Information\n",
        "Based on verified database records and official college documents:\n",
        "\n\n".join(snippets_text),
        "\n\n> *Note: Cutoff and fee data are based on verified historical records. Cutoffs vary each year depending on applicant volume, seat matrix, and exam difficulty.*"
    ]

    suggested = [
        "What are the hostel charges?",
        "Which scholarships are available?",
        "Compare top engineering colleges."
    ]

    return "\n".join(reply_parts), citations, suggested


async def generate_llm_response(
    query: str,
    evidence_list: List[RetrievedEvidence],
    student_profile: Optional[StudentProfile] = None,
    conversation_history: Optional[List[ChatMessage]] = None
) -> Tuple[str, List[SourceCitation], bool, Optional[str], List[str]]:
    """
    Routes the query and grounded evidence to the configured LLM provider
    (Gemini, OpenAI, Groq, Ollama, or Fallback).
    Returns (reply_text, citations, is_fallback, warning_message, suggested_follow_ups).
    """
    context_str = build_rag_context(evidence_list, student_profile)
    provider = settings.LLM_PROVIDER.lower()
    api_key = settings.LLM_API_KEY.strip()

    # Build citations from evidence
    citations: List[SourceCitation] = []
    seen_urls = set()
    for ev in evidence_list:
        if ev.source_url and ev.source_url not in seen_urls:
            seen_urls.add(ev.source_url)
            citations.append(SourceCitation(
                authority="Admissions Authority / Institute",
                source_name=ev.document_title,
                url=ev.source_url,
                year=ev.academic_year or 2024,
                verified_date="2024-08-20"
            ))

    suggested = [
        "What are the hostel facilities and charges?",
        "What was the cutoff for CSE in previous years?",
        "What are the median placement packages?"
    ]

    # Check if credentials are missing
    if provider in ["gemini", "openai", "groq"] and not api_key:
        warning = f"Notice: {provider.upper()} API key is not configured in .env (LLM_API_KEY). Serving verified answers using local evidence-grounded engine."
        reply, cit, sug = fallback_evidence_answering(query, evidence_list, student_profile)
        return reply, cit or citations, True, warning, sug

    # 1. Ollama (Local LLM)
    if provider == "ollama":
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                prompt_full = f"{SYSTEM_PROMPT}\n\nContext:\n{context_str}\n\nUser Question:\n{query}"
                resp = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.LLM_MODEL_NAME,
                        "prompt": prompt_full,
                        "stream": False
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("response", ""), citations, False, None, suggested
        except Exception as e:
            logger.warning(f"Ollama local inference failed: {e}. Falling back to evidence engine.")
            reply, cit, sug = fallback_evidence_answering(query, evidence_list, student_profile)
            return reply, cit or citations, True, f"Ollama connection error ({e}). Serving verified evidence.", sug

    # 2. Google Gemini
    if provider == "gemini":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL_NAME}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{SYSTEM_PROMPT}\n\nVerified Context:\n{context_str}\n\nUser Question: {query}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1000
                }
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        reply_text = candidates[0]["content"]["parts"][0]["text"]
                        return reply_text, citations, False, None, suggested
                else:
                    logger.error(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Gemini request failed: {e}. Falling back to evidence engine.")

    # 3. OpenAI / Groq / OpenAI-compatible API
    if provider in ["openai", "groq"]:
        try:
            base_url = "https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            if conversation_history:
                for m in conversation_history[-4:]:
                    messages.append({"role": m.role, "content": m.content})
            messages.append({"role": "user", "content": f"Context:\n{context_str}\n\nQuestion:\n{query}"})

            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": settings.LLM_MODEL_NAME if provider == "groq" else "gpt-4o-mini",
                        "messages": messages,
                        "temperature": 0.2
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    reply_text = data["choices"][0]["message"]["content"]
                    return reply_text, citations, False, None, suggested
        except Exception as e:
            logger.warning(f"{provider.upper()} API request failed: {e}")

    # Fallback to local verified evidence engine
    reply, cit, sug = fallback_evidence_answering(query, evidence_list, student_profile)
    return reply, cit or citations, True, "Operating in local verified evidence mode.", sug
