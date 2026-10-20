"""
Stage 6 & Stage 10: Query Representation, Semantic Similarity & Linguistic Analysis
===================================================================================
Provides dual lexical (TF-IDF) and dense semantic (SentenceTransformer)
text representations, cosine similarity computation, paraphrasing tests,
and educational NLP components (tokenization, POS tagging, lemmatization, N-grams).
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.ingestion import get_embedding_model
from app.nlp.preprocessor import clean_text, analyze_linguistics, preprocess_query

class TextRepresentationService:
    """
    Manages lexical (TF-IDF) and dense semantic embeddings for retrieval,
    semantic search, and linguistic explainability.
    """

    def __init__(self):
        self.embedding_model = get_embedding_model()
        self.tfidf_vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            strip_accents="unicode"
        )
        # Seed the TF-IDF vocabulary with common domain queries
        seed_corpus = [
            "engineering colleges in india",
            "computer science and engineering cse cutoffs",
            "annual tuition fees and living hostel expenses",
            "placement percentage median salary package",
            "iit madras bits pilani nit trichy coep pune",
            "jee main closing ranks josaa counselling",
            "scholarships for economically weaker sections fee waiver",
            "am i eligible for btech with 60% pcm percentage"
        ]
        self.tfidf_vectorizer.fit([preprocess_query(s) for s in seed_corpus])

    def encode_dense(self, text_or_texts: Any) -> np.ndarray:
        """Generates 384-dimensional dense semantic embeddings using all-MiniLM-L6-v2."""
        if isinstance(text_or_texts, str):
            text_or_texts = [text_or_texts]
        embeddings = self.embedding_model.encode(text_or_texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings

    def encode_lexical(self, texts: List[str]):
        """Generates sparse TF-IDF feature matrix."""
        processed = [preprocess_query(t) for t in texts]
        return self.tfidf_vectorizer.transform(processed)

    def compute_semantic_similarity(self, text1: str, text2: str) -> float:
        """Computes dense cosine similarity between two queries using SentenceTransformer."""
        emb1 = self.encode_dense([text1])[0].reshape(1, -1)
        emb2 = self.encode_dense([text2])[0].reshape(1, -1)
        sim = float(cosine_similarity(emb1, emb2)[0][0])
        return round(sim, 4)

    def compute_lexical_similarity(self, text1: str, text2: str) -> float:
        """Computes sparse TF-IDF cosine similarity between two queries."""
        try:
            vec1 = self.encode_lexical([text1])
            vec2 = self.encode_lexical([text2])
            sim = float(cosine_similarity(vec1, vec2)[0][0])
            return round(sim, 4)
        except Exception:
            return 0.0

    def compare_representations(self, text1: str, text2: str) -> Dict[str, Any]:
        """
        Stage 6: Comparative evaluation of lexical (TF-IDF) vs dense semantic matching.
        Demonstrates why dense representations excel at capturing paraphrases without shared keywords.
        """
        dense_sim = self.compute_semantic_similarity(text1, text2)
        lexical_sim = self.compute_lexical_similarity(text1, text2)

        return {
            "query_1": text1,
            "query_2": text2,
            "dense_semantic_similarity": dense_sim,
            "lexical_tfidf_similarity": lexical_sim,
            "semantic_gain": round(dense_sim - lexical_sim, 4),
            "interpretation": (
                "High semantic similarity with low lexical overlap confirms paraphrase understanding."
                if dense_sim > 0.65 and lexical_sim < 0.35 else
                "Both lexical and semantic representations agree on query relatedness."
            )
        }

    def extract_ngrams(self, text: str, n: int = 2) -> List[str]:
        """Extracts n-grams for phrase-level linguistic inspection."""
        tokens = preprocess_query(text).split()
        if len(tokens) < n:
            return []
        return [" ".join(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]

    def get_full_nlp_analysis(self, text: str) -> Dict[str, Any]:
        """
        Stage 10: Complete educational NLP analysis bundle for user queries.
        Includes tokenization, sentence segmentation, POS tags, lemmatization,
        unigrams, bigrams, and dense embedding statistics.
        """
        ling = analyze_linguistics(text)
        bigrams = self.extract_ngrams(text, n=2)
        dense_vec = self.encode_dense(text)[0]

        return {
            "sentence_segmentation": ling["sentences"],
            "tokenization": ling["tokens"],
            "pos_tagging": ling["pos_tags"],
            "lemmatization": ling["lemmas"],
            "bigrams": bigrams,
            "noun_phrases": ling["noun_phrases"],
            "dense_embedding_dim": len(dense_vec),
            "dense_embedding_norm": float(np.linalg.norm(dense_vec)),
            "negations": ling["negations_found"],
            "numeric_tokens": ling["numeric_tokens"]
        }


# Global singleton instance
_repr_service: Optional[TextRepresentationService] = None

def get_representation_service() -> TextRepresentationService:
    global _repr_service
    if _repr_service is None:
        _repr_service = TextRepresentationService()
    return _repr_service
