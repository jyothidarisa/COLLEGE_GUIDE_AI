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

import difflib

def normalize_college_text(text: str) -> str:
    """Normalizes query text and college aliases with identical rules."""
    t = text.lower().strip()
    t = re.sub(r'[^\w\s]', ' ', t)
    subs = {
        r'\buniv\b': 'university',
        r'\binst\b': 'institute',
        r'\bclg\b': 'college',
        r'\bcoll\b': 'college',
        r'\bengg\b': 'engineering',
        r'\btech\b': 'technology'
    }
    for pat, rep in subs.items():
        t = re.sub(pat, rep, t)
    return re.sub(r'\s+', ' ', t).strip()

FUZZY_NAME_GUARD = {
    'amit', 'aman', 'anand', 'sumit', 'mohit', 'rohit', 'rahul', 'vijay',
    'activity', 'admission', 'admissions', 'campus', 'college', 'colleges',
    'institute', 'university', 'technology', 'engineering', 'branch', 'course'
}

# Complete 75-college canonical registry merged from database and retriever
COLLEGE_ALIAS_REGISTRY: Dict[str, Dict[str, Any]] = {
    "PSG": {
        "name": "PSG College of Technology",
        "college_type": "State Aided Autonomous",
        "aliases": [
            "psg tech",
            "psg",
            "psg college of technology",
            "psg coimbatore",
            "psg college"
        ]
    },
    "IITM": {
        "name": "Indian Institute of Technology Madras",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit chennai",
            "iit madras",
            "iit-m",
            "iitm",
            "indian institute of technology madras"
        ]
    },
    "IITD": {
        "name": "Indian Institute of Technology Delhi",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit delhi",
            "iit-d",
            "iitd",
            "indian institute of technology delhi"
        ]
    },
    "IITB": {
        "name": "Indian Institute of Technology Bombay",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit bombay",
            "iit mumbai",
            "iit powai",
            "iit-b",
            "iitb",
            "indian institute of technology bombay"
        ]
    },
    "IITK": {
        "name": "Indian Institute of Technology Kanpur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit kanpur",
            "iit-k",
            "iitk",
            "indian institute of technology kanpur"
        ]
    },
    "IITKGP": {
        "name": "Indian Institute of Technology Kharagpur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit kharagpur",
            "iit-kgp",
            "iitkgp",
            "indian institute of technology kharagpur",
            "kharagpur"
        ]
    },
    "IITR": {
        "name": "Indian Institute of Technology Roorkee",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit roorkee",
            "iitr",
            "indian institute of technology roorkee",
            "roorkee"
        ]
    },
    "IITH": {
        "name": "Indian Institute of Technology Hyderabad",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit hyderabad",
            "iit-h",
            "iith",
            "indian institute of technology hyderabad"
        ]
    },
    "IITG": {
        "name": "Indian Institute of Technology Guwahati",
        "college_type": "Institute of National Importance",
        "aliases": [
            "guwahati",
            "iit guwahati",
            "iitg",
            "indian institute of technology guwahati"
        ]
    },
    "NITT": {
        "name": "National Institute of Technology Tiruchirappalli",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology tiruchirappalli",
            "nit tiruchirappalli",
            "nit trichi",
            "nit trichy",
            "nitt",
            "trichy"
        ]
    },
    "IIT-BHU": {
        "name": "Indian Institute of Technology (Banaras Hindu University) Varanasi",
        "college_type": "Institute of National Importance",
        "aliases": [
            "bhu varanasi",
            "iit bhu",
            "iit varanasi",
            "iit-bhu",
            "indian institute of technology (banaras hindu university) varanasi"
        ]
    },
    "BITS-P": {
        "name": "Birla Institute of Technology & Science -Pilani",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "birla institute of technology & science -pilani",
            "bits",
            "bits pilani",
            "bits-p",
            "pilani"
        ]
    },
    "IITI": {
        "name": "Indian Institute of Technology Indore",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit indore",
            "iiti",
            "indian institute of technology indore"
        ]
    },
    "NITR": {
        "name": "National Institute of Technology Rourkela",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology rourkela",
            "nit rourkela",
            "nitr",
            "rourkela"
        ]
    },
    "SRMIST": {
        "name": "S.R.M. Institute of Science and Technology",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "s.r.m. institute of science and technology",
            "srm",
            "srm university",
            "srmist"
        ]
    },
    "IIT-ISM": {
        "name": "Indian Institute of Technology (Indian School of Mines)",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit dhanbad",
            "iit ism",
            "iit-ism",
            "indian institute of technology (indian school of mines)",
            "ism dhanbad"
        ]
    },
    "VIT-001": {
        "name": "Vellore Institute of Technology",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "vellore institute",
            "vellore institute of technology",
            "vit",
            "vit vellore",
            "vit-001"
        ]
    },
    "NITK": {
        "name": "National Institute of Technology Karnataka, Surathkal",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology karnataka, surathkal",
            "nit karnataka",
            "nit surathkal",
            "nitk",
            "surathkal"
        ]
    },
    "JU-KOL": {
        "name": "Jadavpur University",
        "college_type": "State University (Public)",
        "aliases": [
            "jadavpur",
            "jadavpur university",
            "ju-kol"
        ]
    },
    "IITP": {
        "name": "Indian Institute of Technology Patna",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit patna",
            "iitp",
            "indian institute of technology patna"
        ]
    },
    "CEG-0001": {
        "name": "Anna University",
        "college_type": "State University (Public)",
        "aliases": [
            "anna univ",
            "anna university",
            "anna university chennai",
            "ceg",
            "ceg chennai",
            "ceg-0001",
            "college of engineering guindy",
            "guindy"
        ]
    },
    "NITC": {
        "name": "National Institute of Technology Calicut",
        "college_type": "Institute of National Importance",
        "aliases": [
            "calicut",
            "national institute of technology calicut",
            "nit calicut",
            "nit kozhikode",
            "nitc"
        ]
    },
    "SOA-BBSR": {
        "name": "Siksha `O` Anusandhan",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "siksha 'o' anusandhan",
            "siksha `o` anusandhan",
            "siksha o anusandhan",
            "soa",
            "soa university",
            "soa-bbsr"
        ]
    },
    "AMRITA-CBE": {
        "name": "Amrita Vishwa Vidyapeetham",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "amrita",
            "amrita coimbatore",
            "amrita university",
            "amrita vishwa vidyapeetham",
            "amrita-cbe",
            "amritha"
        ]
    },
    "JMI-DEL": {
        "name": "Jamia Millia Islamia",
        "college_type": "Central University (Public)",
        "aliases": [
            "jamia",
            "jamia millia",
            "jamia millia islamia",
            "jmi",
            "jmi-del"
        ]
    },
    "IITGN": {
        "name": "Indian Institute of Technology Gandhinagar",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit gandhinagar",
            "iitgn",
            "indian institute of technology gandhinagar"
        ]
    },
    "IIT-MANDI": {
        "name": "Indian Institute of Technology Mandi",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit mandi",
            "iit-mandi",
            "indian institute of technology mandi"
        ]
    },
    "IITJ": {
        "name": "Indian Institute of Technology Jodhpur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit jodhpur",
            "iitj",
            "indian institute of technology jodhpur"
        ]
    },
    "NITW": {
        "name": "National Institute of Technology Warangal",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology warangal",
            "nit warangal",
            "nitw",
            "warangal"
        ]
    },
    "TIET": {
        "name": "Thapar Institute of Engineering and Technology",
        "college_type": "Private Deemed University",
        "aliases": [
            "thapar",
            "thapar institute",
            "thapar institute of engineering and technology",
            "thapar university",
            "tiet"
        ]
    },
    "DTU": {
        "name": "Delhi Technological University",
        "college_type": "State University (Public)",
        "aliases": [
            "dce",
            "delhi college of engineering",
            "delhi technological university",
            "dtu"
        ]
    },
    "CU-PUNJAB": {
        "name": "Chandigarh University",
        "college_type": "Private University",
        "aliases": [
            "chandigarh university",
            "cu punjab",
            "cu-punjab"
        ]
    },
    "IITRPR": {
        "name": "Indian Institute of Technology Ropar",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit ropar",
            "iitrpr",
            "indian institute of technology ropar"
        ]
    },
    "KARE": {
        "name": "Kalasalingam Academy of Research and Education",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "kalasalingam",
            "kalasalingam academy of research and education",
            "kare"
        ]
    },
    "AMU": {
        "name": "Aligarh Muslim University",
        "college_type": "Central University (Public)",
        "aliases": [
            "aligarh muslim university",
            "amu"
        ]
    },
    "KLEF": {
        "name": "Koneru Lakshmaiah Education Foundation",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "kl university",
            "klef",
            "koneru lakshmaiah",
            "koneru lakshmaiah education foundation"
        ]
    },
    "KIIT": {
        "name": "Kalinga Institute of Industrial Technology",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "kalinga institute",
            "kalinga institute of industrial technology",
            "kiit"
        ]
    },
    "AMITY": {
        "name": "Amity University Noida",
        "college_type": "Private University",
        "aliases": [
            "amity",
            "amity noida",
            "amity university noida"
        ]
    },
    "IIITH": {
        "name": "International Institute of Information Technology Hyderabad",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "iiit hyderabad",
            "iiit-h",
            "iiith",
            "international institute of information technology hyderabad"
        ]
    },
    "IIT-BBS": {
        "name": "Indian Institute of Technology Bhubaneswar",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit bhubaneswar",
            "iit-bbs",
            "indian institute of technology bhubaneswar"
        ]
    },
    "SASTRA": {
        "name": "SASTRA Deemed University",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "sastra",
            "sastra deemed university",
            "sastra university"
        ]
    },
    "ICT-MUM": {
        "name": "Institute of Chemical Technology",
        "college_type": "State University (Public)",
        "aliases": [
            "ict",
            "ict mumbai",
            "ict-mum",
            "institute of chemical technology"
        ]
    },
    "MNIT-JPR": {
        "name": "Malaviya National Institute of Technology Jaipur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "malaviya national institute of technology jaipur",
            "mnit",
            "mnit jaipur",
            "mnit-jpr",
            "nit jaipur"
        ]
    },
    "UPES": {
        "name": "UPES",
        "college_type": "Private University",
        "aliases": [
            "upes",
            "upes dehradun"
        ]
    },
    "VNIT-NGP": {
        "name": "Visvesvaraya National Institute of Technology Nagpur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "nit nagpur",
            "visvesvaraya national institute of technology nagpur",
            "vnit",
            "vnit nagpur",
            "vnit-ngp"
        ]
    },
    "SIMATS": {
        "name": "Saveetha Institute of Medical and Technical Sciences",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "saveetha",
            "saveetha institute of medical and technical sciences",
            "simats"
        ]
    },
    "SIU-PUNE": {
        "name": "Symbiosis International",
        "college_type": "Deemed University (Private)",
        "aliases": [
            "siu pune",
            "siu-pune",
            "symbiosis",
            "symbiosis international"
        ]
    },
    "SSN-1315": {
        "name": "Sri Sivasubramaniya Nadar College of Engineering",
        "college_type": "Private Autonomous",
        "aliases": [
            "sri sivasubramaniya nadar college of engineering",
            "ssn",
            "ssn chennai",
            "ssn college",
            "ssn college of engineering",
            "ssn-1315"
        ]
    },
    "LPU": {
        "name": "Lovely Professional University",
        "college_type": "Private University",
        "aliases": [
            "lovely professional university",
            "lpu"
        ]
    },
    "NIT-DGP": {
        "name": "National Institute of Technology Durgapur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "durgapur",
            "national institute of technology durgapur",
            "nit durgapur",
            "nit-dgp"
        ]
    },
    "NIT-SIL": {
        "name": "National Institute of Technology Silchar",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology silchar",
            "nit silchar",
            "nit-sil",
            "silchar"
        ]
    },
    "CHRIST-BLR": {
        "name": "Christ University (Kengeri Campus, School of Engineering & Technology)",
        "college_type": "Private Deemed University",
        "aliases": [
            "christ",
            "christ university",
            "christ university (kengeri campus, school of engineering & technology)",
            "christ-blr"
        ]
    },
    "IIT-DH": {
        "name": "Indian Institute of Technology Dharwad",
        "college_type": "Institute of National Importance",
        "aliases": [
            "iit dharwad",
            "iit-dh",
            "indian institute of technology dharwad"
        ]
    },
    "RGIPT": {
        "name": "Rajiv Gandhi Institute of Petroleum Technology",
        "college_type": "Institute of National Importance",
        "aliases": [
            "rajiv gandhi institute of petroleum",
            "rajiv gandhi institute of petroleum technology",
            "rgipt"
        ]
    },
    "SLIET": {
        "name": "Sant Longowal Institute of Engineering and Technology",
        "college_type": "Deemed University (Institute of National Importance)",
        "aliases": [
            "sant longowal",
            "sant longowal institute of engineering and technology",
            "sliet"
        ]
    },
    "VIGNAN": {
        "name": "Vignan's Foundation for Science, Technology and Research (VFSTR)",
        "college_type": "Private Deemed University",
        "aliases": [
            "vignan",
            "vignan university",
            "vignan's foundation for science, technology and research (vfstr)"
        ]
    },
    "MANIT-BPL": {
        "name": "Maulana Azad National Institute of Technology (MANIT) Bhopal",
        "college_type": "Institute of National Importance",
        "aliases": [
            "manit",
            "manit bhopal",
            "manit-bpl",
            "maulana azad national institute of technology (manit) bhopal",
            "nit bhopal"
        ]
    },
    "NIT-JSR": {
        "name": "National Institute of Technology Jamshedpur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology jamshedpur",
            "nit jamshedpur",
            "nit-jsr"
        ]
    },
    "NIT-MEGH": {
        "name": "National Institute of Technology Meghalaya",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology meghalaya",
            "nit meghalaya",
            "nit-megh"
        ]
    },
    "JAIN-BLR": {
        "name": "Jain University (Faculty of Engineering & Technology, Jain Global Campus)",
        "college_type": "Private Deemed University",
        "aliases": [
            "jain university",
            "jain university (faculty of engineering & technology, jain global campus)",
            "jain-blr"
        ]
    },
    "NIT-KKR": {
        "name": "National Institute of Technology Kurukshetra",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology kurukshetra",
            "nit kurukshetra",
            "nit-kkr"
        ]
    },
    "NIT-RPR": {
        "name": "National Institute of Technology Raipur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology raipur",
            "nit raipur",
            "nit-rpr"
        ]
    },
    "VELTECH": {
        "name": "Vel Tech Rangarajan Dr. Sagunthala R&D Institute of Science and Technology",
        "college_type": "Private Deemed University",
        "aliases": [
            "vel tech",
            "vel tech rangarajan dr. sagunthala r&d institute of science and technology",
            "veltech"
        ]
    },
    "AUCE-VIZAG": {
        "name": "Andhra University College of Engineering (A)",
        "college_type": "State Public University (Autonomous College)",
        "aliases": [
            "andhra university",
            "andhra university college of engineering",
            "andhra university college of engineering (a)",
            "auce",
            "auce-vizag"
        ]
    },
    "CHITKARA": {
        "name": "Chitkara University (Punjab Campus)",
        "college_type": "Private University",
        "aliases": [
            "chitkara",
            "chitkara university",
            "chitkara university (punjab campus)"
        ]
    },
    "COEP": {
        "name": "COEP Technological University (formerly College of Engineering Pune)",
        "college_type": "State Public University",
        "aliases": [
            "cet pune",
            "coep",
            "coep pune",
            "coep technological university",
            "coep technological university (formerly college of engineering pune)",
            "college of engineering pune"
        ]
    },
    "SRU": {
        "name": "SR University",
        "college_type": "Private University",
        "aliases": [
            "sr university",
            "sru"
        ]
    },
    "DIAT-PUNE": {
        "name": "Defence Institute of Advanced Technology (DIAT)",
        "college_type": "Deemed University (Ministry of Defence)",
        "aliases": [
            "defence institute of advanced technology (diat)",
            "diat",
            "diat pune",
            "diat-pune"
        ]
    },
    "UIET-PU": {
        "name": "University Institute of Engineering and Technology (UIET), Panjab University",
        "college_type": "State Public University",
        "aliases": [
            "panjab university",
            "uiet",
            "uiet-pu",
            "university institute of engineering and technology (uiet), panjab university"
        ]
    },
    "JNTUH": {
        "name": "JNTUH College of Engineering Hyderabad",
        "college_type": "State Public University",
        "aliases": [
            "jntu hyderabad",
            "jntuh",
            "jntuh college of engineering hyderabad"
        ]
    },
    "CGU-BBSR": {
        "name": "C.V. Raman Global University",
        "college_type": "Private University",
        "aliases": [
            "c.v. raman",
            "c.v. raman global university",
            "cgu odisha",
            "cgu-bbsr",
            "cv raman"
        ]
    },
    "IIITM-GWL": {
        "name": "Atal Bihari Vajpayee Indian Institute of Information Technology and Management (ABV-IIITM) Gwalior",
        "college_type": "Institute of National Importance",
        "aliases": [
            "abv-iiitm",
            "atal bihari vajpayee indian institute of information technology and management (abv-iiitm) gwalior",
            "iiitm gwalior",
            "iiitm-gwl"
        ]
    },
    "NIT-HMR": {
        "name": "National Institute of Technology Hamirpur",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology hamirpur",
            "nit hamirpur",
            "nit-hmr"
        ]
    },
    "PDEU": {
        "name": "Pandit Deendayal Energy University (PDEU)",
        "college_type": "Private University",
        "aliases": [
            "pandit deendayal",
            "pandit deendayal energy university (pdeu)",
            "pdeu"
        ]
    },
    "NIT-PY": {
        "name": "National Institute of Technology Puducherry",
        "college_type": "Institute of National Importance",
        "aliases": [
            "national institute of technology puducherry",
            "nit puducherry",
            "nit-py"
        ]
    },
    "SKCET": {
        "name": "Sri Krishna College of Engineering and Technology",
        "college_type": "Private Autonomous College",
        "aliases": [
            "skcet",
            "sri krishna college",
            "sri krishna college of engineering and technology"
        ]
    }
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

    # 5. Word N-Gram & Guarded Fuzzy College Name Extraction
    q_norm = normalize_college_text(query)
    words = q_norm.split()
    ngrams = []
    for n in range(1, min(10, len(words) + 1)):
        for i in range(len(words) - n + 1):
            ngrams.append(" ".join(words[i:i+n]))

    seen_codes = set()
    # Pass 1: Exact matches take highest priority
    for code, info in COLLEGE_ALIAS_REGISTRY.items():
        if code in seen_codes:
            continue
        for alias in info["aliases"]:
            norm_alias = normalize_college_text(alias)
            if norm_alias in ngrams:
                entities.colleges_mentioned.append({
                    "code": code,
                    "name": info["name"],
                    "matched_alias": alias
                })
                seen_codes.add(code)
                break

    # Pass 2: Fuzzy matching (ONLY executed if no exact match exists anywhere in query)
    if not entities.colleges_mentioned:
        for code, info in COLLEGE_ALIAS_REGISTRY.items():
            if code in seen_codes:
                continue
            for alias in info["aliases"]:
                norm_alias = normalize_college_text(alias)
                alias_len = len(norm_alias)
                if alias_len >= 6:
                    for ng in ngrams:
                        if ng in FUZZY_NAME_GUARD or len(ng) < 6:
                            continue
                        if (ng.startswith("iiit") and not norm_alias.startswith("iiit")) or (norm_alias.startswith("iiit") and not ng.startswith("iiit")):
                            continue
                        if (ng.startswith("iit ") and not norm_alias.startswith("iit ")) or (norm_alias.startswith("iit ") and not ng.startswith("iit ")):
                            continue
                        if (ng.startswith("nit") and not norm_alias.startswith("nit")) or (norm_alias.startswith("nit") and not ng.startswith("nit")):
                            continue
                        if abs(len(ng) - alias_len) <= 2:
                            sim = difflib.SequenceMatcher(None, ng, norm_alias).ratio()
                            if sim >= 0.88:
                                entities.colleges_mentioned.append({
                                    "code": code,
                                    "name": info["name"],
                                    "matched_alias": alias
                                })
                                seen_codes.add(code)
                                break
                if code in seen_codes:
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
