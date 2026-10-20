"""
Stage 7: Evidence Reranking and Context Token-Budget Management
==============================================================
Reranks retrieved hybrid evidence (SQL numerical facts + FAISS document chunks)
by combining semantic vector similarity, college entity matching, intent
domain alignment, and course relevance. Enforces strict token budgets.
"""

from typing import List, Dict, Any, Optional
from app.schemas import RetrievedEvidence
from app.nlp.entity_extractor import ExtractedEntities

class HybridEvidenceReranker:
    """
    Reranks hybrid search results to ensure the most factually relevant
    evidence is prioritized for LLM/SLM context construction.
    """

    def __init__(self, max_context_chunks: int = 5):
        self.max_context_chunks = max_context_chunks

    def rerank(
        self,
        evidence_list: List[RetrievedEvidence],
        query: str,
        intent: str,
        entities: ExtractedEntities,
        target_colleges: Optional[List[str]] = None
    ) -> List[RetrievedEvidence]:
        """
        Reranks evidence items with domain-aware scoring weights:
        1. Base semantic/retrieval score (weight: 0.50)
        2. College entity exact match (bonus: +0.25)
        3. Intent topic alignment (bonus: +0.15)
        4. Course/branch keyword match (bonus: +0.10)
        """
        if not evidence_list:
            return []

        q_lower = query.lower()
        college_names_target = [c.lower() for c in (target_colleges or [])]
        if entities.colleges_mentioned:
            for c in entities.colleges_mentioned:
                college_names_target.append(c["name"].lower())
                college_names_target.append(c["code"].lower())

        scored_items = []

        for ev in evidence_list:
            score = ev.relevance_score * 0.50

            # 1. College entity match bonus
            col_name = (ev.college_name or "").lower()
            if any(t in col_name or col_name in t for t in college_names_target if t):
                score += 0.25

            # 2. Intent domain alignment bonus
            doc_title = ev.document_title.lower()
            snippet = ev.snippet.lower()

            if "fee" in intent and ("fee" in doc_title or "tuition" in snippet):
                score += 0.15
            elif "cutoff" in intent and ("cutoff" in doc_title or "closing" in snippet or "rank" in snippet):
                score += 0.15
            elif ("admission" in intent or "eligibility" in intent) and ("admission" in doc_title or "eligibility" in doc_title or "eligibility" in snippet):
                score += 0.18
            elif "placement" in intent and ("placement" in doc_title or "salary" in snippet or "package" in snippet):
                score += 0.15
            elif "hostel" in intent and ("hostel" in snippet or "living" in snippet):
                score += 0.15
            elif "scholarship" in intent and ("scholarship" in snippet or "waiver" in snippet):
                score += 0.15

            # 3. Preferred branch alignment bonus
            if entities.preferred_branch:
                branch_code = entities.preferred_branch.lower()
                if branch_code in snippet or (entities.branch_name_full and entities.branch_name_full.lower() in snippet):
                    score += 0.10

            # 4. Query term lexical overlap bonus
            query_words = [w for w in q_lower.split() if len(w) > 3 and w not in ["what", "does", "offer", "about", "with", "from", "this", "that"]]
            if query_words:
                term_matches = sum(1 for w in query_words if w in snippet or w in doc_title)
                score += min(0.20, term_matches * 0.05)

            scored_items.append((score, ev))

        # Sort descending by composite score
        scored_items.sort(key=lambda x: x[0], reverse=True)

        # Apply token budget / chunk cutoff
        reranked = [item[1] for item in scored_items[:self.max_context_chunks]]
        return reranked


# Global singleton
_reranker: Optional[HybridEvidenceReranker] = None

def get_evidence_reranker() -> HybridEvidenceReranker:
    global _reranker
    if _reranker is None:
        _reranker = HybridEvidenceReranker()
    return _reranker
