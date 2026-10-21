"""
Rule-Based Small-Talk Handler
=============================
Executes before intent classification and retrieval to handle conversational
chitchat, greetings, compliments, complaints, and polite acknowledgements
without invoking the language model or FAISS vector search.
"""

import re
import random
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field

@dataclass
class SmallTalkResult:
    is_smalltalk: bool
    category: Optional[str] = None
    reply: Optional[str] = None
    suggestions: List[str] = field(default_factory=list)
    cleaned_query: Optional[str] = None

# Normalized full-message match sets
GREETING_PATTERNS = {
    "hi", "hii", "hiii", "hello", "helo", "hellow", "hey", "heyy", "heyya",
    "hey there", "heyy there", "hola", "gm", "gn", "good morning", "good afternoon",
    "good evening", "namaste", "vanakkam", "greetings", "yo", "sup"
}

HOW_ARE_YOU_PATTERNS = {
    "how are you", "how r u", "how are you doing", "how are you doing today", "how do you do",
    "hows it going", "how is it going", "how are things", "how are u",
    "hope you are doing well", "how have you been"
}

IDENTITY_HELP_PATTERNS = {
    "who are you", "who r u", "what are you", "what is your name", "whats your name",
    "who made you", "who created you", "what can you do", "what do you do", "what can u do",
    "help", "help me", "can you help me", "how can you help", "what is this bot",
    "tell me about yourself", "about you", "guide me"
}

THANKS_PATTERNS = {
    "thanks", "thank you", "thank you so much", "thanks a lot", "thx", "tq", "ty",
    "thank u", "many thanks", "appreciated", "much appreciated"
}

GOODBYE_PATTERNS = {
    "bye", "goodbye", "good bye", "cya", "see you", "see ya", "bye bye", "byebye",
    "tata", "talk to you later", "see you later", "farewell", "have a good day", "have a nice day"
}

ACKNOWLEDGEMENT_PATTERNS = {
    "ok", "okay", "k", "kk", "got it", "understood", "alright", "all right",
    "noted", "i see", "fine", "sure", "cool", "sounds good"
}

COMPLIMENT_PATTERNS = {
    "you are great", "you are awesome", "you are amazing", "good bot", "great bot",
    "awesome", "nice", "super", "superb", "excellent", "well done", "good job",
    "great job", "you are very helpful", "you are helpful", "you are so smart", "smart bot"
}

COMPLAINT_PATTERNS = {
    "this is bad", "this is useless", "useless", "bad bot", "not helpful",
    "you are not helpful", "wrong answer", "incorrect", "you are useless",
    "terrible", "this sucks", "horrible", "waste of time", "not good"
}

RUDE_PATTERNS = {
    "shut up", "shut the fuck up", "stfu", "stupid", "idiot", "dumb", "fool",
    "get lost", "fuck you", "fck you", "asshole", "nonsense", "bullshit", "go to hell",
    "loser", "you know nothing"
}

GREETING_PREFIX_RE = re.compile(
    r'^(?:hi+|hello+|helo+|hellow+|hey+|heyy+|heyya|greetings|namaste|vanakkam|good\s*(?:morning|afternoon|evening)|gm)\b[\s,\.\-!:]*',
    re.IGNORECASE
)

DEFAULT_SUGGESTIONS = [
    "Find colleges for my rank",
    "Compare two colleges",
    "Check fees and placements"
]

WARM_REPLIES = {
    "greeting": [
        "Hello! I am College Guide AI, your engineering admissions counsellor. How can I assist with your college search today?",
        "Hi there! I'm here to help you navigate college cutoffs, admissions, and campus placements. What would you like to explore?",
        "Namaste! Welcome to College Guide AI. Feel free to ask about college fees, cutoff ranks, or personalized recommendations."
    ],
    "how_are_you": [
        "I'm doing well, thank you for asking! I'm ready to help you explore the best college options for your career.",
        "I'm doing great and excited to help you find your ideal engineering college! How can I assist you today?"
    ],
    "identity": [
        "I am College Guide AI, an admissions assistant designed to help Indian engineering aspirants explore verified cutoffs, fee structures, and placement records.",
        "I'm your college admissions guide! I can analyze your entrance exam ranks, suggest Safe/Target/Reach colleges, and compare institutions using official data."
    ],
    "thanks": [
        "You're very welcome! I'm always here to help you make informed college decisions.",
        "Glad I could help! Feel free to reach out anytime you have more questions about colleges and admissions."
    ],
    "goodbye": [
        "Goodbye and best of luck with your admissions journey! Feel free to return anytime you need more guidance.",
        "Take care and all the best for your counselling rounds! I'll be right here whenever you need assistance."
    ],
    "acknowledgement": [
        "Glad that's clear! Let me know if you would like to explore specific colleges, fees, or cutoff trends.",
        "Understood! Feel free to ask about any college, branch, or counselling procedure whenever you're ready."
    ],
    "compliment": [
        "Thank you so much for the kind words! I'm glad I could provide helpful and transparent guidance.",
        "Thank you! I strive to make college admissions simple, objective, and accessible for everyone."
    ],
    "complaint": [
        "I apologize if my response wasn't helpful. Please tell me which specific college, cutoff, or fee detail you need, and I will find the official data.",
        "I'm sorry for any inconvenience. You can ask directly for specific facts, like 'IIT Madras fee' or 'NIT Trichy CSE cutoff', for precise answers."
    ],
    "rude": [
        "I am here to offer constructive and respectful college admissions guidance. Please let me know which college information you'd like to check.",
        "Let's keep things respectful and productive. Whenever you're ready, I can help you with cutoffs, fees, and college recommendations."
    ]
}

def normalize_text(text: str) -> str:
    t = text.lower().strip()
    t = re.sub(r'[^\w\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def handle_smalltalk(query: str, conversation_history: Optional[List[Any]] = None) -> SmallTalkResult:
    if not query:
        return SmallTalkResult(is_smalltalk=False, cleaned_query="")

    # 1. Check if greeting prefix + real question or secondary small-talk
    m = GREETING_PREFIX_RE.match(query.strip())
    if m:
        remaining = query.strip()[m.end():].strip()
        rem_norm = normalize_text(remaining)
        if rem_norm:
            # Check if the text after the stripped greeting is itself small talk (e.g. "hi, how are you")
            matched_after = None
            if rem_norm in HOW_ARE_YOU_PATTERNS:
                matched_after = "how_are_you"
            elif rem_norm in IDENTITY_HELP_PATTERNS:
                matched_after = "identity"
            elif rem_norm in THANKS_PATTERNS:
                matched_after = "thanks"
            elif rem_norm in GOODBYE_PATTERNS:
                matched_after = "goodbye"
            elif rem_norm in ACKNOWLEDGEMENT_PATTERNS:
                matched_after = "acknowledgement"
            elif rem_norm in COMPLIMENT_PATTERNS:
                matched_after = "compliment"
            elif rem_norm in COMPLAINT_PATTERNS:
                matched_after = "complaint"
            elif rem_norm in RUDE_PATTERNS:
                matched_after = "rude"
            elif rem_norm in GREETING_PATTERNS:
                matched_after = "greeting"

            if matched_after:
                replies = WARM_REPLIES.get(matched_after, WARM_REPLIES["greeting"])
                return SmallTalkResult(
                    is_smalltalk=True,
                    category=matched_after,
                    reply=random.choice(replies),
                    suggestions=DEFAULT_SUGGESTIONS,
                    cleaned_query=query
                )

            # Check if remaining text contains actual inquiry / question
            if (
                len(rem_norm.split()) >= 2 or
                any(k in rem_norm for k in ["cutoff", "fee", "rank", "college", "placement", "compare", "admissions", "btech", "course", "what", "which", "how", "can", "tell"])
            ):
                return SmallTalkResult(
                    is_smalltalk=False,
                    cleaned_query=remaining
                )

    norm = normalize_text(query)

    # 2. Check if previous bot message asked a question and user answered ok/yes/no
    if conversation_history and len(conversation_history) > 0:
        last_asst = next((
            msg for msg in reversed(conversation_history)
            if getattr(msg, "role", None) == "assistant" or (isinstance(msg, dict) and msg.get("role") == "assistant")
        ), None)

        if last_asst:
            last_text = getattr(last_asst, "content", "") or (last_asst.get("content", "") if isinstance(last_asst, dict) else "")
            # Check if bot asked a question or asked for input
            is_question = "?" in last_text or any(k in last_text.lower() for k in [
                "please clarify", "what is your", "which reservation", "your rank", "your budget",
                "do you require", "tell me your", "provide your"
            ])
            if is_question:
                if norm in ACKNOWLEDGEMENT_PATTERNS or norm in {"yes", "yeah", "yep", "no", "nope"}:
                    return SmallTalkResult(
                        is_smalltalk=False,
                        cleaned_query=query
                    )

    # 3. Match full normalized message against categories
    matched_cat = None
    if norm in GREETING_PATTERNS:
        matched_cat = "greeting"
    elif norm in HOW_ARE_YOU_PATTERNS:
        matched_cat = "how_are_you"
    elif norm in IDENTITY_HELP_PATTERNS:
        matched_cat = "identity"
    elif norm in THANKS_PATTERNS:
        matched_cat = "thanks"
    elif norm in GOODBYE_PATTERNS:
        matched_cat = "goodbye"
    elif norm in ACKNOWLEDGEMENT_PATTERNS:
        matched_cat = "acknowledgement"
    elif norm in COMPLIMENT_PATTERNS:
        matched_cat = "compliment"
    elif norm in COMPLAINT_PATTERNS:
        matched_cat = "complaint"
    elif norm in RUDE_PATTERNS:
        matched_cat = "rude"

    if matched_cat:
        replies = WARM_REPLIES.get(matched_cat, ["Hello! How can I help you with your college admissions search today?"])
        return SmallTalkResult(
            is_smalltalk=True,
            category=matched_cat,
            reply=random.choice(replies),
            suggestions=DEFAULT_SUGGESTIONS,
            cleaned_query=query
        )

    return SmallTalkResult(
        is_smalltalk=False,
        cleaned_query=query
    )
