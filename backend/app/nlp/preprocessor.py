"""
Stage 1 & Stage 10: Text Preprocessing and Linguistic Analysis
==============================================================
Provides robust normalization, abbreviation expansion, typo correction,
and educational linguistic analysis (tokenization, sentence segmentation,
POS tagging, lemmatization) tailored for Indian engineering admissions.
"""

import re
import unicodedata
from typing import Dict, List, Tuple, Any, Optional
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.tag import pos_tag
from nltk.stem import WordNetLemmatizer

# Ensure required NLTK resources are available
for resource in ['punkt', 'punkt_tab', 'averaged_perceptron_tagger', 'averaged_perceptron_tagger_eng', 'wordnet']:
    try:
        nltk.download(resource, quiet=True)
    except Exception:
        pass

lemmatizer = WordNetLemmatizer()

# Standard contractions
CONTRACTIONS: Dict[str, str] = {
    r"\bcan't\b": "cannot",
    r"\bwon't\b": "will not",
    r"\bn't\b": " not",
    r"\bi'm\b": "i am",
    r"\bi've\b": "i have",
    r"\bi'll\b": "i will",
    r"\bi'd\b": "i would",
    r"\bit's\b": "it is",
    r"\bwhat's\b": "what is",
    r"\bwhere's\b": "where is",
    r"\bhow's\b": "how is",
    r"\bthat's\b": "that is",
    r"\bthere's\b": "there is",
    r"\bthey're\b": "they are",
    r"\bwe're\b": "we are",
    r"\byou're\b": "you are",
    r"\blet's\b": "let us",
}

# Domain-specific spelling mistakes
DOMAIN_SPELL_CORRECTIONS: Dict[str, str] = {
    r"\brecomnd\b": "recommend",
    r"\brecomended\b": "recommended",
    r"\brecomend\b": "recommend",
    r"\brecomends\b": "recommends",
    r"\brecomendation\b": "recommendation",
    r"\brecomendations\b": "recommendations",
    r"\bcutof\b": "cutoff",
    r"\bcuttoff\b": "cutoff",
    r"\bcutt-off\b": "cutoff",
    r"\bcutt off\b": "cutoff",
    r"\badmision\b": "admission",
    r"\baddmission\b": "admission",
    r"\badmisson\b": "admission",
    r"\bengeneering\b": "engineering",
    r"\bengg\b": "engineering",
    r"\bcolg\b": "college",
    r"\bcolgs\b": "colleges",
    r"\bclg\b": "college",
    r"\bclgs\b": "colleges",
    r"\bplcmnt\b": "placement",
    r"\bplcmnts\b": "placements",
    r"\beligblty\b": "eligibility",
    r"\beligibile\b": "eligible",
    r"\bhosetl\b": "hostel",
    r"\bhostal\b": "hostel",
    r"\bscollarship\b": "scholarship",
    r"\bscholorship\b": "scholarship",
    r"\bpackge\b": "package",
    r"\bpkg\b": "package",
    r"\bperc\b": "percentile",
    r"\bfeez\b": "fees",
    r"\bafordable\b": "affordable",
}

# Common engineering admission abbreviations (expanded only when unambiguous)
ADMISSION_ABBREVIATIONS: Dict[str, str] = {
    r"\bjee-m\b": "jee main",
    r"\bjee-adv\b": "jee advanced",
    r"\bjeem\b": "jee main",
    r"\bjeea\b": "jee advanced",
    r"\bcse\b": "computer science and engineering",
    r"\bece\b": "electronics and communication engineering",
    r"\bmech\b": "mechanical engineering",
    r"\bcivil\b": "civil engineering",
    r"\beee\b": "electrical and electronics engineering",
    r"\bai[/-]?ds\b": "artificial intelligence and data science",
    r"\baids\b": "artificial intelligence and data science",
    r"\bhostel fac\.?\b": "hostel facilities",
    r"\bcsab\b": "central seat allocation board",
    r"\bjosaa\b": "joint seat allocation authority",
    r"\btnea\b": "tamil nadu engineering admissions",
}


def normalize_numeric_shorthand(text: str) -> str:
    """
    Expands conversational numbers like '20k' -> '20000', '1.5 lakh' -> '150000',
    while keeping the semantic context intact.
    """
    # Convert 'X k' or 'Xk' -> (X * 1000) e.g. 20k -> 20000, 1.5k -> 1500
    def replace_k(match):
        val = float(match.group(1))
        return str(int(val * 1000))

    text = re.sub(r'(?i)\b(\d+(?:\.\d+)?)\s*k\b', replace_k, text)

    # Convert 'X lakh' / 'X lac' / 'Xl' -> (X * 100000)
    def replace_lakh(match):
        val = float(match.group(1))
        return f"{int(val * 100000)} rupees"

    text = re.sub(r'(?i)\b(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lpa)\b', replace_lakh, text)

    # Standardize Rupee symbols
    text = text.replace("₹", "rs. ").replace("INR", "rs. ")
    return text


def clean_text(text: str) -> str:
    """Normalizes Unicode characters, whitespace, and non-printable artifacts."""
    if not text:
        return ""
    # Normalize unicode (NFKC)
    text = unicodedata.normalize("NFKC", text)
    # Replace multiple whitespaces and tabs with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Standardize quotes and hyphens
    text = re.sub(r'["""]', '"', text)
    text = re.sub(r"[''']", "'", text)
    text = re.sub(r'[–—]', '-', text)
    return text.strip()


def preprocess_query(text: str) -> str:
    """
    Comprehensive Stage 1 text preprocessing pipeline:
    1. Unicode & whitespace normalization
    2. Contraction expansion
    3. Numeric & monetary shorthand expansion
    4. Domain-specific typo correction
    5. Admission abbreviation expansion
    6. Preservation of numbers, entity anchors, and negations
    """
    if not text:
        return ""

    processed = clean_text(text)
    lower = processed.lower()

    # 1. Expand contractions
    for pattern, repl in CONTRACTIONS.items():
        lower = re.sub(pattern, repl, lower)

    # 2. Expand numeric shorthand (20k -> 20000, 2 lakhs -> 200000)
    lower = normalize_numeric_shorthand(lower)

    # 3. Correct common typos in student queries
    for pattern, repl in DOMAIN_SPELL_CORRECTIONS.items():
        lower = re.sub(pattern, repl, lower)

    # 4. Expand domain abbreviations
    for pattern, repl in ADMISSION_ABBREVIATIONS.items():
        lower = re.sub(pattern, repl, lower)

    # Remove extra spaces around punctuation
    lower = re.sub(r'\s+([?.!,])', r'\1', lower)
    lower = re.sub(r'\s+', ' ', lower).strip()
    return lower


def analyze_linguistics(text: str) -> Dict[str, Any]:
    """
    Stage 10: Educational NLP linguistic analysis.
    Performs tokenization, sentence segmentation, POS tagging, and lemmatization.
    Returns structured linguistic metadata useful for diagnostics and explainability.
    """
    if not text:
        return {
            "sentences": [],
            "tokens": [],
            "pos_tags": [],
            "lemmas": [],
            "noun_phrases": [],
            "numeric_tokens": [],
            "negations_found": []
        }

    clean = clean_text(text)
    sentences = sent_tokenize(clean)
    tokens = word_tokenize(clean)
    tagged = pos_tag(tokens)

    lemmas = []
    for word, tag in tagged:
        w_lower = word.lower()
        if tag.startswith('V'):
            pos_code = 'v'
        elif tag.startswith('J'):
            pos_code = 'a'
        elif tag.startswith('R'):
            pos_code = 'r'
        else:
            pos_code = 'n'
        try:
            lemmas.append(lemmatizer.lemmatize(w_lower, pos=pos_code))
        except Exception:
            lemmas.append(w_lower)

    # Extract numeric tokens
    numeric_tokens = [tok for tok in tokens if re.search(r'\d', tok)]

    # Check for negation words
    negations = [w.lower() for w in tokens if w.lower() in {"not", "no", "never", "without", "neither", "nor", "none"}]

    # Simple rule-based noun phrases (Adjective* + Noun+)
    noun_phrases = []
    current_np = []
    for word, tag in tagged:
        if tag.startswith(('NN', 'JJ')):
            current_np.append(word)
        else:
            if current_np:
                noun_phrases.append(" ".join(current_np))
                current_np = []
    if current_np:
        noun_phrases.append(" ".join(current_np))

    return {
        "sentence_count": len(sentences),
        "sentences": sentences,
        "token_count": len(tokens),
        "tokens": tokens,
        "pos_tags": tagged,
        "lemmas": lemmas,
        "noun_phrases": noun_phrases[:10],
        "numeric_tokens": numeric_tokens,
        "negations_found": negations
    }
