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
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from app.nlp.preprocessor import preprocess_query, analyze_linguistics
from app.nlp.intent_classifier import get_intent_classifier, IntentResult
from app.nlp.entity_extractor import extract_entities, ExtractedEntities
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
