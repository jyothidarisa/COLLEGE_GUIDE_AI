"""
Stage 3: Entity Recognition and Information Extraction
======================================================
Extracts structured admission entities from preprocessed user messages:
- Entrance Examination (JEE Main, Advanced, TNEA, BITSAT, etc.)
- Examination Rank vs. Cutoff Score / Percentile
- Academic Qualifications (Class 12 PCM %, Class 10 %)
- Preferred Engineering Branch (CSE, ECE, MECH, etc.)
- College Names and Codes (mapped to verified database records)
- Preferred Location (Cities, States)
- Budget and Fee Thresholds
- Institution Preference (IIT, NIT, IIIT, Govt, Private)
- Reservation Category & Quota
"""

import re
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, field
from app.nlp.preprocessor import clean_text

@dataclass
class ExtractedEntities:
    entrance_exam: Optional[str] = None
    rank: Optional[float] = None
    score_or_percentile: Optional[float] = None
    score_type: Optional[str] = None  # "rank", "percentile", "mark_out_of_200"
    pcm_percentage: Optional[float] = None
    class12_percentage: Optional[float] = None
    class10_percentage: Optional[float] = None
    preferred_branch: Optional[str] = None
    branch_name_full: Optional[str] = None
    colleges_mentioned: List[Dict[str, str]] = field(default_factory=list)
    state: Optional[str] = None
    city: Optional[str] = None
    max_tuition_budget: Optional[float] = None
    max_total_budget: Optional[float] = None
    hostel_required: Optional[bool] = None
    preferred_college_type: Optional[str] = None
    category: Optional[str] = None
    quota: Optional[str] = None
    admission_year: Optional[int] = None
    is_valid: bool = True
    validation_warnings: List[str] = field(default_factory=list)

# Comprehensive college dictionary mapped to canonical codes
COLLEGE_ALIAS_REGISTRY: Dict[str, Dict[str, Any]] = {
    "IITM": {"name": "Indian Institute of Technology Madras", "aliases": ["iit madras", "iitm", "iit chennai", "iit-m"]},
    "IITD": {"name": "Indian Institute of Technology Delhi", "aliases": ["iit delhi", "iitd", "iit-d"]},
    "IITB": {"name": "Indian Institute of Technology Bombay", "aliases": ["iit bombay", "iitb", "iit powai", "iit mumbai"]},
    "IITK": {"name": "Indian Institute of Technology Kanpur", "aliases": ["iit kanpur", "iitk"]},
    "IITKGP": {"name": "Indian Institute of Technology Kharagpur", "aliases": ["iit kharagpur", "iitkgp", "kharagpur"]},
    "IITR": {"name": "Indian Institute of Technology Roorkee", "aliases": ["iit roorkee", "iitr"]},
    "IITH": {"name": "Indian Institute of Technology Hyderabad", "aliases": ["iit hyderabad", "iith"]},
    "IITG": {"name": "Indian Institute of Technology Guwahati", "aliases": ["iit guwahati", "iitg"]},
    "NITT": {"name": "National Institute of Technology Tiruchirappalli", "aliases": ["nit trichy", "nitt", "nit tiruchirappalli", "trichy"]},
    "BITS-P": {"name": "Birla Institute of Technology & Science -Pilani", "aliases": ["bits pilani", "bits", "pilani", "bits-p"]},
    "NITK": {"name": "National Institute of Technology Karnataka, Surathkal", "aliases": ["nit surathkal", "nitk", "surathkal", "nit karnataka"]},
    "COEP": {"name": "COEP Technological University", "aliases": ["coep", "college of engineering pune", "coep pune"]},
    "CEG-0001": {"name": "College of Engineering Guindy, Anna University", "aliases": ["ceg", "anna university", "guindy", "ceg chennai"]},
    "SSN-1315": {"name": "SSN College of Engineering", "aliases": ["ssn", "ssn college", "ssn chennai"]},
    "JU-KOL": {"name": "Jadavpur University", "aliases": ["jadavpur", "jadavpur university"]},
    "DTU": {"name": "Delhi Technological University", "aliases": ["dtu", "delhi college of engineering", "dce"]},
    "IIITH": {"name": "International Institute of Information Technology Hyderabad", "aliases": ["iiit hyderabad", "iiith", "iiit-h"]},
    "NITW": {"name": "National Institute of Technology Warangal", "aliases": ["nit warangal", "nitw", "warangal"]},
    "NITC": {"name": "National Institute of Technology Calicut", "aliases": ["nit calicut", "nitc", "calicut"]},
    "VNIT-NGP": {"name": "Visvesvaraya National Institute of Technology, Nagpur", "aliases": ["vnit nagpur", "vnit", "nit nagpur"]},
    "VIT-001": {"name": "Vellore Institute of Technology", "aliases": ["vit vellore", "vit", "vellore institute"]},
    "SRMIST": {"name": "SRM Institute of Science and Technology", "aliases": ["srm", "srmist", "srm university"]},
    "TIET": {"name": "Thapar Institute of Engineering and Technology", "aliases": ["thapar", "tiet", "thapar university"]},
    "AMU": {"name": "Aligarh Muslim University", "aliases": ["amu", "aligarh muslim university"]},
    "SOA-BBSR": {"name": "Siksha 'O' Anusandhan", "aliases": ["soa", "soa university", "siksha o anusandhan"]},
    "AMRITA-CBE": {"name": "Amrita Vishwa Vidyapeetham", "aliases": ["amrita", "amrita coimbatore"]},
    "JMI-DEL": {"name": "Jamia Millia Islamia", "aliases": ["jamia millia", "jmi"]},
    "SKCET": {"name": "Sri Krishna College of Engineering and Technology", "aliases": ["skcet", "sri krishna college"]},
    "AUCE-VIZAG": {"name": "Andhra University College of Engineering", "aliases": ["andhra university", "auce"]},
    "CHITKARA": {"name": "Chitkara University", "aliases": ["chitkara", "chitkara university"]}
}

EXAM_PATTERNS: Dict[str, str] = {
    r"\bjee\s*(?:main|mains)\b": "JEE_MAIN",
    r"\bjee\s*(?:advanced|adv)\b": "JEE_ADVANCED",
    r"\btnea\b": "TNEA",
    r"\bbitsat\b": "BITSAT",
    r"\bmht[ -]?cet\b": "MHT_CET",
    r"\bviteee\b": "VITEEE",
    r"\bmet\b": "MET",
    r"\bsrmjeee\b": "SRMJEEE",
    r"\bcomedk\b": "COMEDK",
    r"\bkcet\b": "KCET",
    r"\bwbjee\b": "WBJEE"
}

BRANCH_PATTERNS: Dict[str, Tuple[str, str]] = {
    r"\b(?:computer\s*science|cse|cs)\b": ("CSE", "Computer Science and Engineering"),
    r"\b(?:electronics\s*(?:and|&)?\s*communication|ece)\b": ("ECE", "Electronics and Communication Engineering"),
    r"\b(?:mechanical|mech)\b": ("MECH", "Mechanical Engineering"),
    r"\b(?:civil)\b": ("CIVIL", "Civil Engineering"),
    r"\b(?:electrical\s*(?:and|&)?\s*electronics|eee)\b": ("EEE", "Electrical and Electronics Engineering"),
    r"\b(?:information\s*technology|it)\b": ("IT", "Information Technology"),
    r"\b(?:artificial\s*intelligence|ai\s*ds|ai\s*and\s*ds|ai/ds|data\s*science)\b": ("AI_DS", "Artificial Intelligence and Data Science"),
    r"\b(?:chemical)\b": ("CHEMICAL", "Chemical Engineering"),
    r"\b(?:aerospace)\b": ("AEROSPACE", "Aerospace Engineering"),
}

LOCATION_CITIES = [
    "chennai", "pune", "bangalore", "bengaluru", "hyderabad", "mumbai",
    "delhi", "coimbatore", "trichy", "tiruchirappalli", "vellore", "kolkata",
    "pilani", "surathkal", "warangal", "calicut", "nagpur", "patna",
    "bhubaneswar", "chandigarh", "jaipur", "dehradun", "roorkee", "varanasi"
]

LOCATION_STATES = [
    "tamil nadu", "maharashtra", "karnataka", "telangana", "andhra pradesh",
    "west bengal", "delhi", "uttar pradesh", "punjab", "odisha", "gujarat",
    "kerala", "rajasthan", "uttarakhand", "madhya pradesh"
]

CATEGORY_PATTERNS = {
    r"\b(?:obc|obc-ncl|ncl)\b": "OBC-NCL",
    r"\b(?:sc|scheduled\s*caste)\b": "SC",
    r"\b(?:st|scheduled\s*tribe)\b": "ST",
    r"\b(?:ews|economically\s*weaker)\b": "EWS",
    r"\b(?:general|open|gen|oc)\b": "General",
}

QUOTA_PATTERNS = {
    r"\b(?:home\s*state|hs)\b": "Home State",
    r"\b(?:other\s*state|os)\b": "Other State",
    r"\b(?:all\s*india|ai)\b": "All India",
}


def extract_entities(query: str) -> ExtractedEntities:
    """
    Extracts structured entities from student query using high-precision
    regexes, gazetteers, and numeric normalization rules.
    """
    q_clean = clean_text(query).lower()
    q_clean = q_clean.replace("₹", "rs. ").replace("inr", "rs. ")
    # Normalize comma-separated numbers e.g. "20,000" -> "20000"
    q_clean = re.sub(r'(\d+),(\d+)', r'\1\2', q_clean)
    entities = ExtractedEntities()

    # 1. Entrance Examination Extraction
    for pattern, exam_name in EXAM_PATTERNS.items():
        if re.search(pattern, q_clean):
            entities.entrance_exam = exam_name
            break

    # 2. Rank vs. Score / Percentile Extraction
    # Check for percentile first: e.g. "98.5 percentile" or "98.5%ile"
    perc_match = re.search(r'\b(\d{1,2}(?:\.\d{1,4})?)\s*(?:percentile|%ile)\b', q_clean)
    if perc_match:
        val = float(perc_match.group(1))
        if 0.0 <= val <= 100.0:
            entities.score_or_percentile = val
            entities.score_type = "percentile"

    # Check for TNEA marks out of 200: e.g. "195.5 cutoff", "tnea mark 185", "190/200"
    tnea_match = re.search(r'\b(?:tnea\s*(?:cutoff|mark|score)?|cutoff\s*mark)\s*[:=]?\s*(\d{2,3}(?:\.\d{1,2})?)\b', q_clean)
    if not tnea_match:
        tnea_match = re.search(r'\b(\d{2,3}(?:\.\d{1,2})?)\s*(?:/200|out of 200)\b', q_clean)
    if tnea_match:
        val = float(tnea_match.group(1))
        if 0.0 <= val <= 200.0:
            entities.score_or_percentile = val
            entities.score_type = "mark_out_of_200"
            if not entities.entrance_exam:
                entities.entrance_exam = "TNEA"

    # Check for rank: e.g. "rank 20000", "air 1200", "rank is 15000", "crl 18000", "rank: 4500"
    rank_match = re.search(r'\b(?:rank|air|crl|merit)\s*(?:is|of|[:=])?\s*(\d{2,6})\b', q_clean)
    if not rank_match:
        # Check for isolated number following or preceding 'rank' e.g. "20000 rank"
        rank_match = re.search(r'\b(\d{2,6})\s*rank\b', q_clean)
    if rank_match:
        val = float(rank_match.group(1))
        if val > 0:
            entities.rank = val
            entities.score_type = "rank"
            # Default to JEE Main if exam not specified and rank is typical of JEE
            if not entities.entrance_exam and val > 200:
                entities.entrance_exam = "JEE_MAIN"
        else:
            entities.is_valid = False
            entities.validation_warnings.append("Rank must be a positive number greater than 0.")

    # 3. Academic Percentage Extraction (PCM %, Class 12, Class 10)
    pcm_match = re.search(r'\b(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:in\s*)?pcm\b', q_clean)
    if not pcm_match:
        pcm_match = re.search(r'\bpcm\s*(?:percentage|marks|score|%|is)?\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)\b', q_clean)
    if pcm_match:
        val = float(pcm_match.group(1))
        if 0.0 <= val <= 100.0:
            entities.pcm_percentage = val
        else:
            entities.validation_warnings.append(f"PCM percentage {val} out of 0-100 bounds.")

    c12_match = re.search(r'\b(?:12th|class\s*12)\s*(?:percentage|marks|score|%|is)?\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)\b', q_clean)
    if c12_match:
        val = float(c12_match.group(1))
        if 0.0 <= val <= 100.0:
            entities.class12_percentage = val

    # 4. Preferred Branch Extraction
    for pattern, (code, full_name) in BRANCH_PATTERNS.items():
        if re.search(pattern, q_clean):
            entities.preferred_branch = code
            entities.branch_name_full = full_name
            break

    # 5. College Name Extraction
    for code, info in COLLEGE_ALIAS_REGISTRY.items():
        for alias in info["aliases"]:
            # Exact word boundary match
            pattern = r'(?<!\w)' + re.escape(alias) + r'(?!\w)'
            if re.search(pattern, q_clean):
                entities.colleges_mentioned.append({
                    "code": code,
                    "name": info["name"],
                    "matched_alias": alias
                })
                break

    # 6. Location Extraction (City and State)
    for city in LOCATION_CITIES:
        pattern = r'(?<!\w)' + re.escape(city) + r'(?!\w)'
        if re.search(pattern, q_clean):
            entities.city = city.title()
            break

    for state in LOCATION_STATES:
        pattern = r'(?<!\w)' + re.escape(state) + r'(?!\w)'
        if re.search(pattern, q_clean):
            entities.state = state.title()
            break

    # 7. Budget Extraction
    # Matches "budget of 2 lakhs", "under 1.5 lakh", "fees less than 200000", "budget 100000"
    budget_match = re.search(r'\b(?:budget|tuition|fees?|cost|expenditure)\s*(?:of|is|to|as|under|less than|around|up to|below|max|cap of)?\s*[:=]?\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lpa|k)?\b', q_clean)
    if budget_match:
        raw_val = float(budget_match.group(1))
        matched_str = budget_match.group(0)
        multiplier = 1.0
        if any(w in matched_str for w in ["lakh", "lac", "lpa"]):
            multiplier = 100000.0
        elif "k" in matched_str:
            multiplier = 1000.0
        elif raw_val < 50:  # Likely specified in lakhs e.g. "budget 2"
            multiplier = 100000.0

        calculated_budget = raw_val * multiplier
        if calculated_budget > 0:
            entities.max_tuition_budget = calculated_budget
            entities.max_total_budget = calculated_budget * 1.35  # Approx total including hostel
        else:
            entities.validation_warnings.append("Budget must be a positive value.")

    # 8. Institution Type Extraction
    if re.search(r'\b(?:iit|iits)\b', q_clean):
        entities.preferred_college_type = "IIT"
    elif re.search(r'\b(?:nit|nits)\b', q_clean):
        entities.preferred_college_type = "NIT"
    elif re.search(r'\b(?:iiit|iiits)\b', q_clean):
        entities.preferred_college_type = "IIIT"
    elif re.search(r'\b(?:government|govt|state\s*govt)\b', q_clean):
        entities.preferred_college_type = "Government"
    elif re.search(r'\b(?:private|deemed)\b', q_clean):
        entities.preferred_college_type = "Private"

    # 9. Category Extraction
    for pattern, cat in CATEGORY_PATTERNS.items():
        if re.search(pattern, q_clean):
            entities.category = cat
            break

    # 10. Quota Extraction
    for pattern, quota_name in QUOTA_PATTERNS.items():
        if re.search(pattern, q_clean):
            entities.quota = quota_name
            break

    # 11. Hostel Requirement
    if re.search(r'\b(?:hostel|accommodation|stay|mess)\b', q_clean):
        if not re.search(r'\b(?:no\s*hostel|without\s*hostel|day\s*scholar)\b', q_clean):
            entities.hostel_required = True
        else:
            entities.hostel_required = False

    return entities
