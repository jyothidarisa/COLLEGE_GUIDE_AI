"""
College Guide AI - Modular NLP Pipeline Package
"""

from app.nlp.preprocessor import preprocess_query, analyze_linguistics, clean_text
from app.nlp.intent_classifier import get_intent_classifier, IntentResult, AdmissionIntentClassifier
from app.nlp.entity_extractor import extract_entities, ExtractedEntities
from app.nlp.context_manager import get_state_manager, SessionContext, ConversationStateManager
from app.nlp.representation import get_representation_service, TextRepresentationService
from app.nlp.reranker import get_evidence_reranker, HybridEvidenceReranker
from app.nlp.model_interface import SLMModelRunner, LLMModelRunner, ModelOutput, ModelComparisonEvaluator
from app.nlp.pipeline import get_nlp_pipeline, NLPPipeline, NLPAnalysisBundle

__all__ = [
    "preprocess_query",
    "analyze_linguistics",
    "clean_text",
    "get_intent_classifier",
    "IntentResult",
    "AdmissionIntentClassifier",
    "extract_entities",
    "ExtractedEntities",
    "get_state_manager",
    "SessionContext",
    "ConversationStateManager",
    "get_representation_service",
    "TextRepresentationService",
    "get_evidence_reranker",
    "HybridEvidenceReranker",
    "SLMModelRunner",
    "LLMModelRunner",
    "ModelOutput",
    "ModelComparisonEvaluator",
    "get_nlp_pipeline",
    "NLPPipeline",
    "NLPAnalysisBundle"
]
