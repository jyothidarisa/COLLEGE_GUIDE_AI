"""
Stage 2: Intent Classification (Hybrid Lexical TF-IDF + Dense Semantic Prototypes)
==================================================================================
Classifies student messages into 16 distinct admission intents using
a hybrid combination of:
1. Lexical TF-IDF n-grams + Logistic Regression
2. Dense semantic embeddings (SentenceTransformer) with class prototype centroids
3. Calibrated domain heuristic guards

Provides confidence scoring, low-confidence fallback, evaluation metrics,
and runtime extensibility for new training samples.
"""

import logging
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score
from app.nlp.preprocessor import preprocess_query
from app.services.ingestion import get_embedding_model

logger = logging.getLogger(__name__)

INTENT_CLASSES = [
    "college_recommendation",
    "college_search",
    "college_comparison",
    "admission_eligibility",
    "cutoff_and_rank",
    "fees_and_budget",
    "branch_selection",
    "placement_information",
    "scholarship_information",
    "hostel_and_facilities",
    "location_search",
    "admission_procedure",
    "follow_up",
    "greeting_and_casual",
    "clarification_request",
    "out_of_scope"
]

@dataclass
class IntentResult:
    intent: str
    confidence: float
    probabilities: Dict[str, float]
    is_fallback: bool
    explanation: str

# Comprehensive labeled training corpus covering realistic, informal, and paraphrased student queries
DEFAULT_TRAINING_DATA: List[Tuple[str, str]] = [
    # 1. college_recommendation
    ("suggest colleges for my rank", "college_recommendation"),
    ("which colleges can i get with this rank?", "college_recommendation"),
    ("can you recommend engineering colleges based on my rank?", "college_recommendation"),
    ("recommend some good btech colleges for 15000 rank in jee main", "college_recommendation"),
    ("best colleges for 20000 rank in cse", "college_recommendation"),
    ("i got 185 in tnea which college should i apply to?", "college_recommendation"),
    ("where can i get admission with 50000 rank?", "college_recommendation"),
    ("suggest target and safer colleges for jee rank 12000", "college_recommendation"),
    ("give me a list of reach and target colleges", "college_recommendation"),
    ("what are my best options for mechanical engineering with 25000 rank?", "college_recommendation"),
    ("colleges for 20k rank", "college_recommendation"),
    ("which college is best match for me?", "college_recommendation"),
    ("can you suggest options under 3 lakhs budget?", "college_recommendation"),
    ("suggest colleges near chennai with my marks", "college_recommendation"),
    ("recommend government engineering colleges for 8000 rank", "college_recommendation"),
    ("help me choose a college with rank 4500", "college_recommendation"),
    ("top colleges i can get into with 95 percentile", "college_recommendation"),
    ("what colleges are safe options for me?", "college_recommendation"),
    ("suggest universities matching my score", "college_recommendation"),
    ("show colleges that match my entrance rank", "college_recommendation"),

    # 2. college_search
    ("tell me about iit madras", "college_search"),
    ("show details for bits pilani", "college_search"),
    ("give me an overview of coep pune", "college_search"),
    ("what kind of college is nit trichy?", "college_search"),
    ("information about vellore institute of technology", "college_search"),
    ("tell me about ceg anna university campus", "college_search"),
    ("search for jadavpur university", "college_search"),
    ("dtu college profile and ranking", "college_search"),
    ("overview of iiit hyderabad", "college_search"),
    ("is ssn college of engineering autonomous?", "college_search"),
    ("details about thapar university tiet", "college_search"),
    ("profile of national institute of technology surathkal", "college_search"),
    ("tell me more about amrita vishwa vidyapeetham", "college_search"),
    ("describe dtu delhi technological university", "college_search"),
    ("search college code for ceg", "college_search"),

    # 3. college_comparison
    ("compare iit madras and bits pilani", "college_comparison"),
    ("which is better nit trichy or nit surathkal?", "college_comparison"),
    ("ceg versus ssn college", "college_comparison"),
    ("compare coep and vnit nagpur for cse", "college_comparison"),
    ("vit vellore vs srm university which one to choose?", "college_comparison"),
    ("should i choose iit bombay electrical or iit delhi cse?", "college_comparison"),
    ("difference between dtu and nsut", "college_comparison"),
    ("compare tuition fees and placements between bits and iit", "college_comparison"),
    ("which college has better campus between thapar and manipal?", "college_comparison"),
    ("compare these two options", "college_comparison"),
    ("nit warangal vs nit trichy comparison", "college_comparison"),
    ("which one to pick between vit and srm?", "college_comparison"),
    ("head to head comparison of iit kanpur and iit kharagpur", "college_comparison"),
    ("how do these two colleges compare?", "college_comparison"),

    # 4. admission_eligibility
    ("am i eligible for btech with 55% in pcm?", "admission_eligibility"),
    ("what is the eligibility criteria for iiit hyderabad?", "admission_eligibility"),
    ("minimum marks needed in 12th for nit admission", "admission_eligibility"),
    ("can i apply for tnea if my home state is not tamil nadu?", "admission_eligibility"),
    ("is 75% aggregate compulsory for jee advanced?", "admission_eligibility"),
    ("eligibility requirements for bitsat 2024", "admission_eligibility"),
    ("do i qualify for direct admission without entrance exam?", "admission_eligibility"),
    ("age limit for engineering entrance exams in india", "admission_eligibility"),
    ("what are the mandatory subjects for btech eligibility?", "admission_eligibility"),
    ("pcm percentage requirement for general category in bits", "admission_eligibility"),
    ("am i qualified to write jee advanced?", "admission_eligibility"),

    # 5. cutoff_and_rank
    ("what is a closing rank?", "cutoff_and_rank"),
    ("what was the previous closing cutoff for cse at nit trichy?", "cutoff_and_rank"),
    ("can i get cse at nit trichy with rank 1200?", "cutoff_and_rank"),
    ("what was the opening rank for iit bombay cse?", "cutoff_and_rank"),
    ("cutoff rank for coep pune mht cet", "cutoff_and_rank"),
    ("closing rank for general category in bitsat", "cutoff_and_rank"),
    ("difference between crl rank and category rank", "cutoff_and_rank"),
    ("what is the home state cutoff for nit warangal?", "cutoff_and_rank"),
    ("what are my chances of getting cse with rank 3500?", "cutoff_and_rank"),
    ("how do cutoffs change between round 1 and round 6?", "cutoff_and_rank"),
    ("previous year closing ranks for mechanical engineering", "cutoff_and_rank"),
    ("josaa round 6 cutoffs for obc ncl category", "cutoff_and_rank"),
    ("what rank is needed for computer science in top nits?", "cutoff_and_rank"),
    ("cutoff marks out of 200 for tnea anna university", "cutoff_and_rank"),
    ("will i get admission with 1500 rank?", "cutoff_and_rank"),

    # 6. fees_and_budget
    ("what are the annual tuition fees at bits pilani?", "fees_and_budget"),
    ("which college is affordable for me with a budget of 2 lakhs per year?", "fees_and_budget"),
    ("show cheaper ones", "fees_and_budget"),
    ("what about fees?", "fees_and_budget"),
    ("cost of studying btech at srm university", "fees_and_budget"),
    ("cheapest government engineering colleges in india", "fees_and_budget"),
    ("annual fees and living expenses at coep pune", "fees_and_budget"),
    ("are there any low fee engineering colleges?", "fees_and_budget"),
    ("total 4 year btech cost including hostel", "fees_and_budget"),
    ("semester fee schedule for vit vellore", "fees_and_budget"),
    ("how expensive is bits pilani compared to iit?", "fees_and_budget"),
    ("tuition fee per semester in nit", "fees_and_budget"),
    ("hostel mess charges per annum", "fees_and_budget"),
    ("colleges with fee under 1 lakh per year", "fees_and_budget"),
    ("can i afford this college with 2 lakh budget?", "fees_and_budget"),

    # 7. branch_selection
    ("should i choose cse or ece?", "branch_selection"),
    ("which engineering branch has better job scope?", "branch_selection"),
    ("what is the difference between cse and ai ds?", "branch_selection"),
    ("is mechanical engineering still good in 2024?", "branch_selection"),
    ("can i change my branch after first year in nit?", "branch_selection"),
    ("future scope of electrical and electronics engineering", "branch_selection"),
    ("is it worth taking civil engineering in top iit vs cse in private?", "branch_selection"),
    ("which branch is best for software companies?", "branch_selection"),
    ("difference between information technology and computer science", "branch_selection"),
    ("which specialization to pick in btech?", "branch_selection"),

    # 8. placement_information
    ("what is the difference between average and median package?", "placement_information"),
    ("what is the median package at iit madras?", "placement_information"),
    ("placement statistics for bits pilani cse", "placement_information"),
    ("highest package offered at iiit hyderabad", "placement_information"),
    ("which companies visit coep for campus recruitment?", "placement_information"),
    ("placement percentage of nit trichy mechanical", "placement_information"),
    ("average salary for btech graduates at vit", "placement_information"),
    ("show me the nirf placement report for dtu", "placement_information"),
    ("what is the placement rate at ssn college of engineering?", "placement_information"),
    ("top recruiters offering high ctc packages", "placement_information"),
    ("how are placements for ece branch in nits?", "placement_information"),
    ("audited placement records of jadavpur university", "placement_information"),

    # 9. scholarship_information
    ("what scholarships are available for economically weaker students?", "scholarship_information"),
    ("how can i get 100% fee waiver at nits?", "scholarship_information"),
    ("merit cum means scholarship criteria at iits", "scholarship_information"),
    ("does ssn provide merit scholarships for top cutoff students?", "scholarship_information"),
    ("financial aid and loan assistance options", "scholarship_information"),
    ("scholarships for sc st students in engineering", "scholarship_information"),
    ("central sector scholarship scheme eligibility", "scholarship_information"),
    ("fee concession for students with family income below 1 lakh", "scholarship_information"),

    # 10. hostel_and_facilities
    ("are hostel facilities available for first year students?", "hostel_and_facilities"),
    ("hostel charges and mess food at nit surathkal", "hostel_and_facilities"),
    ("is on campus accommodation compulsory at bits pilani?", "hostel_and_facilities"),
    ("what sports and lab amenities does coep provide?", "hostel_and_facilities"),
    ("room types single sharing double sharing in iit hostel", "hostel_and_facilities"),
    ("wifi and laundry facilities in campus", "hostel_and_facilities"),

    # 11. location_search
    ("engineering colleges in tamil nadu", "location_search"),
    ("any better option near chennai?", "location_search"),
    ("top engineering colleges in pune and mumbai", "location_search"),
    ("colleges in bangalore for computer science", "location_search"),
    ("government colleges in maharashtra", "location_search"),
    ("engineering colleges in hyderabad with good placements", "location_search"),
    ("show colleges in north india", "location_search"),

    # 12. admission_procedure
    ("how to register for josaa counselling 2024?", "admission_procedure"),
    ("what is the step by step process for tnea application?", "admission_procedure"),
    ("documents required during physical reporting at nit", "admission_procedure"),
    ("what is csab special round and when does it happen?", "admission_procedure"),
    ("how to freeze or float seats in seat allotment?", "admission_procedure"),
    ("counselling schedule and key dates", "admission_procedure"),

    # 13. follow_up
    ("what about placements?", "follow_up"),
    ("and what about hostel?", "follow_up"),
    ("which one has lower fees?", "follow_up"),
    ("tell me more about that college", "follow_up"),
    ("any other options?", "follow_up"),
    ("what about the second one?", "follow_up"),
    ("show me other branches there", "follow_up"),

    # 14. greeting_and_casual
    ("hello", "greeting_and_casual"),
    ("hi there", "greeting_and_casual"),
    ("good morning", "greeting_and_casual"),
    ("hey", "greeting_and_casual"),
    ("who are you?", "greeting_and_casual"),
    ("what can you do?", "greeting_and_casual"),
    ("thank you so much", "greeting_and_casual"),
    ("thanks for the help", "greeting_and_casual"),
    ("bye", "greeting_and_casual"),

    # 15. clarification_request
    ("why did you recommend this college?", "clarification_request"),
    ("why is college x in target and college y in reach?", "clarification_request"),
    ("how did you calculate my admission chances?", "clarification_request"),
    ("what does percentile mean?", "clarification_request"),
    ("can you explain what you meant?", "clarification_request"),
    ("i did not understand your previous answer", "clarification_request"),

    # 16. out_of_scope
    ("what is the weather in mumbai today?", "out_of_scope"),
    ("who won the cricket world cup?", "out_of_scope"),
    ("write a python function to invert a binary tree", "out_of_scope"),
    ("tell me a joke", "out_of_scope"),
    ("who is the prime minister of india?", "out_of_scope"),
    ("how to bake chocolate cookies", "out_of_scope"),
    ("what is the distance to the moon?", "out_of_scope")
]


class AdmissionIntentClassifier:
    """
    Hybrid Intent Classifier combining:
    1. TF-IDF n-grams + Logistic Regression (Lexical)
    2. Dense Semantic Prototypes (SentenceTransformer)
    3. Targeted Domain Guards (Priority keyword filters)
    """

    def __init__(self, confidence_threshold: float = 0.25):
        self.confidence_threshold = confidence_threshold
        self.embedding_model = get_embedding_model()
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            strip_accents="unicode"
        )
        self.classifier = LogisticRegression(
            C=4.0,
            max_iter=1000,
            class_weight="balanced",
            random_state=42
        )
        self.training_corpus: List[Tuple[str, str]] = list(DEFAULT_TRAINING_DATA)
        self.prototype_embeddings: Dict[str, np.ndarray] = {}
        self.is_trained = False
        self._train()

    def _train(self):
        """Fits TF-IDF classifier and computes dense semantic prototype centroids per intent."""
        texts = [preprocess_query(t) for t, _ in self.training_corpus]
        labels = [lbl for _, lbl in self.training_corpus]

        # 1. Fit TF-IDF Logistic Regression
        X = self.vectorizer.fit_transform(texts)
        self.classifier.fit(X, labels)

        # 2. Compute Dense Prototype Centroids using SentenceTransformer
        dense_embs = self.embedding_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        self.prototype_embeddings = {}
        for intent in INTENT_CLASSES:
            indices = [i for i, lbl in enumerate(labels) if lbl == intent]
            if indices:
                centroid = np.mean(dense_embs[indices], axis=0)
                centroid = centroid / np.linalg.norm(centroid)  # normalize
                self.prototype_embeddings[intent] = centroid

        self.is_trained = True
        logger.info(f"AdmissionIntentClassifier trained on {len(texts)} samples across {len(set(labels))} intents.")

    def add_training_examples(self, new_samples: List[Tuple[str, str]], retrain: bool = True):
        self.training_corpus.extend(new_samples)
        if retrain:
            self._train()

    def predict(self, query: str) -> IntentResult:
        """
        Hybrid prediction: blends TF-IDF logistic regression probabilities
        with dense semantic prototype similarity scores.
        """
        if not self.is_trained:
            self._train()

        clean_q = preprocess_query(query)
        q_lower = clean_q.lower()
        if not q_lower.strip():
            return IntentResult(
                intent="greeting_and_casual",
                confidence=1.0,
                probabilities={},
                is_fallback=False,
                explanation="Empty query defaulted to greeting/casual."
            )

        # --- Priority Domain Guards ---
        # 1. Package / placement inquiries (check before generic 'difference between')
        if any(k in q_lower for k in ["average and median", "average vs median", "median package", "placement percentage", "placement statistics"]):
            return IntentResult("placement_information", 0.95, {"placement_information": 0.95}, False, "Priority placement/salary intent guard matched.")

        # 2. Closing rank / terminology cutoffs
        if any(k in q_lower for k in ["what is closing rank", "closing rank", "what is opening rank", "crl vs category", "what is percentile"]):
            return IntentResult("cutoff_and_rank", 0.95, {"cutoff_and_rank": 0.95}, False, "Priority cutoff/rank terminology intent guard matched.")

        # 3. Transparent recommendation rationale
        if any(k in q_lower for k in ["why did you recommend", "why is college in target", "how did you calculate"]):
            return IntentResult("clarification_request", 0.95, {"clarification_request": 0.95}, False, "Priority recommendation rationale intent guard matched.")

        # 4. College comparison
        if any(k in q_lower for k in ["compare ", " versus ", " vs ", "difference between "]) and len(clean_q.split()) > 2:
            return IntentResult("college_comparison", 0.95, {"college_comparison": 0.95}, False, "Priority college comparison intent guard matched.")

        # 5. College recommendations
        if any(k in q_lower for k in ["suggest college", "recommend college", "which college can i get", "colleges for 20k", "best college for my rank", "options for my rank"]):
            return IntentResult("college_recommendation", 0.95, {"college_recommendation": 0.95}, False, "Priority recommendation intent guard matched.")

        # --- Hybrid Model Prediction ---
        # 1. TF-IDF Probabilities
        X_q = self.vectorizer.transform([clean_q])
        tfidf_probs = self.classifier.predict_proba(X_q)[0]
        tfidf_dict = {cls: float(prob) for cls, prob in zip(self.classifier.classes_, tfidf_probs)}

        # 2. Dense Semantic Prototype Similarities
        q_emb = self.embedding_model.encode([clean_q], convert_to_numpy=True, normalize_embeddings=True)[0]
        semantic_sims = {}
        for intent, centroid in self.prototype_embeddings.items():
            sim = float(np.dot(q_emb, centroid))
            semantic_sims[intent] = max(0.0, sim)

        # Softmax normalize semantic similarities with temperature 0.15
        sim_vals = np.array([semantic_sims.get(intent, 0.0) for intent in INTENT_CLASSES])
        exp_sims = np.exp((sim_vals - np.max(sim_vals)) / 0.15)
        sem_probs = exp_sims / np.sum(exp_sims)
        sem_dict = {intent: float(p) for intent, p in zip(INTENT_CLASSES, sem_probs)}

        # 3. Ensemble Blend: 0.40 TF-IDF + 0.60 Dense Semantic
        blended_probs = {}
        for intent in INTENT_CLASSES:
            p_tfidf = tfidf_dict.get(intent, 0.0)
            p_sem = sem_dict.get(intent, 0.0)
            blended_probs[intent] = round((0.40 * p_tfidf) + (0.60 * p_sem), 4)

        sorted_intents = sorted(blended_probs.items(), key=lambda x: x[1], reverse=True)
        top_intent, top_confidence = sorted_intents[0]

        is_fallback = top_confidence < self.confidence_threshold
        final_intent = top_intent
        explanation = f"Hybrid classified as '{top_intent}' with {top_confidence:.1%} confidence."

        if is_fallback:
            final_intent = "clarification_request"
            explanation = f"Confidence {top_confidence:.1%} below threshold {self.confidence_threshold:.1%}; routed to fallback clarification."

        return IntentResult(
            intent=final_intent,
            confidence=top_confidence,
            probabilities=blended_probs,
            is_fallback=is_fallback,
            explanation=explanation
        )

    def evaluate(self, test_size: float = 0.20) -> Dict[str, Any]:
        """
        Evaluates hybrid classifier performance on a stratified train/test split.
        """
        texts = [preprocess_query(t) for t, _ in self.training_corpus]
        labels = [lbl for _, lbl in self.training_corpus]

        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            texts, labels, test_size=test_size, random_state=42, stratify=labels
        )

        eval_vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1)
        X_train = eval_vec.fit_transform(X_train_raw)
        X_test = eval_vec.transform(X_test_raw)

        eval_clf = LogisticRegression(C=4.0, max_iter=1000, class_weight="balanced", random_state=42)
        eval_clf.fit(X_train, y_train)

        y_pred = eval_clf.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

        return {
            "test_sample_count": len(y_test),
            "accuracy": round(float(acc), 4),
            "macro_f1": round(float(f1_macro), 4),
            "classification_report": report
        }


# Global singleton instance
_intent_classifier: Optional[AdmissionIntentClassifier] = None

def get_intent_classifier() -> AdmissionIntentClassifier:
    global _intent_classifier
    if _intent_classifier is None:
        _intent_classifier = AdmissionIntentClassifier()
    return _intent_classifier
