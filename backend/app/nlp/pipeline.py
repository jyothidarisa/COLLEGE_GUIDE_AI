"""
Master Modular NLP Pipeline Coordinator
=======================================
Orchestrates Stages 1 through 12:
1. Text Preprocessing (normalization, abbreviations, typos)
2. Intent Classification (16 admission intents with confidence)
3. Entity Recognition & Information Extraction (validated constraints)
4. Query Understanding & Rewriting (coreference & pronoun resolution)
5. Conversational Memory & Context State Management
6. Query Representation & Semantic Similarity
7. Evidence Reranking & Hybrid Retrieval
8. Response Generation & Grounding
9. Recommendation Constraints
10. Linguistic Explainability (POS, Lemmatization, N-grams)
11. SLM vs. LLM Comparison Interface
12. Error Handling & Robust Fallback
"""

import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from app.nlp.preprocessor import preprocess_query, analyze_linguistics
from app.nlp.intent_classifier import get_intent_classifier, IntentResult
from app.nlp.entity_extractor import extract_entities, ExtractedEntities, COLLEGE_ALIAS_REGISTRY
from app.nlp.context_manager import get_state_manager, SessionContext, ConversationStateManager
from app.nlp.representation import get_representation_service, TextRepresentationService
from app.nlp.reranker import get_evidence_reranker, HybridEvidenceReranker
from app.nlp.model_interface import SLMModelRunner, LLMModelRunner, ModelOutput, ModelComparisonEvaluator

logger = logging.getLogger(__name__)

@dataclass
class NLPAnalysisBundle:
    raw_query: str
    preprocessed_query: str
    intent: str
    intent_confidence: float
    is_intent_fallback: bool
    entities: ExtractedEntities
    rewritten_query: str
    applied_rewrites: List[str]
    session_context: SessionContext
    linguistic_summary: Dict[str, Any]
    target_colleges: List[str] = field(default_factory=list)


class NLPPipeline:
    """
    Centralized NLP Pipeline instance managing all conversational AI stages.
    """

    def __init__(self):
        self.intent_classifier = get_intent_classifier()
        self.state_manager = get_state_manager()
        self.representation_service = get_representation_service()
        self.reranker = get_evidence_reranker()
        self.slm_runner = SLMModelRunner()
        self.llm_runner = LLMModelRunner()
        self.evaluator = ModelComparisonEvaluator()

    def process(
        self,
        query: str,
        session_id: Optional[str] = None,
        conversation_history: Optional[List[Any]] = None
    ) -> NLPAnalysisBundle:
        """
        Executes complete NLP pipeline stages for an incoming student message.
        """
        raw_query = query or ""
        sid = session_id or "default_session"

        # Stage 1: Text Preprocessing
        preprocessed = preprocess_query(raw_query)

        # Stage 10: Educational Linguistic Analysis
        ling_analysis = analyze_linguistics(raw_query)

        # Stage 2: Intent Classification
        intent_res: IntentResult = self.intent_classifier.predict(preprocessed)

        # Stage 3: Entity Recognition & Information Extraction
        entities: ExtractedEntities = extract_entities(preprocessed)

        # Ambiguity Check: Generic NIT / IIT / IIIT query with no specific campus
        q_lower = raw_query.lower()
        umbrella_match = re.search(r'\b(nit|nits|iit|iits|iiit|iiits)\b', q_lower)
        if umbrella_match and not entities.colleges_mentioned:
            umb_raw = umbrella_match.group(1).rstrip('s').upper()
            matching_campuses = [
                info["name"] for info in COLLEGE_ALIAS_REGISTRY.values()
                if info.get("college_type") == umb_raw or info["name"].upper().startswith(
                    "NATIONAL INSTITUTE OF TECHNOLOGY" if umb_raw == "NIT" else
                    "INDIAN INSTITUTE OF TECHNOLOGY" if umb_raw == "IIT" else
                    "INTERNATIONAL INSTITUTE OF INFORMATION TECHNOLOGY"
                )
            ]
            if len(matching_campuses) > 1:
                intent_res.intent = "clarification_request"
                intent_res.confidence = 1.0
                intent_res.is_fallback = False
                ctx = self.state_manager.get_or_create_session(sid)
                return NLPAnalysisBundle(
                    raw_query=raw_query,
                    preprocessed_query=preprocessed,
                    intent=intent_res.intent,
                    intent_confidence=intent_res.confidence,
                    is_intent_fallback=intent_res.is_fallback,
                    entities=entities,
                    rewritten_query=raw_query,
                    applied_rewrites=[f"Ambiguity detected for {umb_raw}"],
                    session_context=ctx,
                    linguistic_summary={
                        "tokens": ling_analysis["tokens"],
                        "pos_tags": ling_analysis["pos_tags"][:8],
                        "lemmas": ling_analysis["lemmas"][:8],
                        "negations": ling_analysis["negations_found"],
                        "numeric_tokens": ling_analysis["numeric_tokens"]
                    },
                    target_colleges=matching_campuses[:5]
                )

        # Name-Only Overview Routing: strictly when query is college name + <= 2 extra words, with NO question words
        question_words = {"what", "which", "how", "why", "when", "where", "who", "is", "can", "tell", "explain", "does", "do", "should", "good", "best", "worth", "better", "review", "fees", "fee", "cost", "cutoff", "cutoffs", "rank", "ranks", "placement", "placements", "salary", "package", "hostel", "hostels", "scholarship", "compare", "vs"}
        q_tokens = set(re.findall(r'\b\w+\b', q_lower))
        has_question_word = bool(q_tokens & question_words)
        if len(entities.colleges_mentioned) == 1 and not has_question_word:
            matched_alias = entities.colleges_mentioned[0].get("matched_alias", "")
            extra_words = len(re.findall(r'\b\w+\b', q_lower)) - len(matched_alias.split())
            if 0 <= extra_words <= 2:
                intent_res.intent = "college_search"
                intent_res.confidence = 0.95
                intent_res.is_fallback = False

        # Stage 5: Conversational Memory Context Retrieval
        if conversation_history and len(conversation_history) > 0:
            ctx = self.state_manager.build_context_from_history(conversation_history, session_id=sid)
        else:
            ctx = self.state_manager.get_or_create_session(sid)

        # Update context with current turn entities (honors user corrections)
        self.state_manager.update_session_with_entities(ctx, entities, raw_query)

        # Stage 4: Query Understanding & Coreference Rewriting
        rewritten, applied_rewrites = self.state_manager.rewrite_query(
            query=raw_query,
            ctx=ctx,
            intent=intent_res.intent,
            entities=entities
        )

        # Target colleges detected from query and context
        target_colleges = []
        if entities.colleges_mentioned:
            for c in entities.colleges_mentioned:
                target_colleges.append(c["name"])
        elif ctx.discussed_colleges:
            target_colleges.append(ctx.discussed_colleges[-1]["name"])

        return NLPAnalysisBundle(
            raw_query=raw_query,
            preprocessed_query=preprocessed,
            intent=intent_res.intent,
            intent_confidence=intent_res.confidence,
            is_intent_fallback=intent_res.is_fallback,
            entities=entities,
            rewritten_query=rewritten,
            applied_rewrites=applied_rewrites,
            session_context=ctx,
            linguistic_summary={
                "tokens": ling_analysis["tokens"],
                "pos_tags": ling_analysis["pos_tags"][:8],
                "lemmas": ling_analysis["lemmas"][:8],
                "negations": ling_analysis["negations_found"],
                "numeric_tokens": ling_analysis["numeric_tokens"]
            },
            target_colleges=target_colleges
        )


# Global singleton
_nlp_pipeline: Optional[NLPPipeline] = None

def get_nlp_pipeline() -> NLPPipeline:
    global _nlp_pipeline
    if _nlp_pipeline is None:
        _nlp_pipeline = NLPPipeline()
    return _nlp_pipeline
