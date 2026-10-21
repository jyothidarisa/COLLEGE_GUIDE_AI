"""
Stage 4 & Stage 5: Conversational Memory and Query Rewriting
============================================================
Maintains multi-turn conversational state, tracks confirmed vs. assumed
student constraints, resolves coreferences and pronouns, and rewrites
informal follow-up questions into self-contained search queries.
Includes explicit user correction overrides.
"""

import re
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from app.nlp.entity_extractor import ExtractedEntities, extract_entities
from app.nlp.preprocessor import clean_text

@dataclass
class ConversationTurn:
    turn_index: int
    raw_query: str
    preprocessed_query: str
    rewritten_query: str
    intent: str
    entities: ExtractedEntities
    assistant_reply: str = ""
    timestamp: float = field(default_factory=time.time)

@dataclass
class SessionContext:
    session_id: str
    confirmed_exam: Optional[str] = None
    confirmed_rank: Optional[float] = None
    confirmed_branch: Optional[str] = None
    confirmed_budget: Optional[float] = None
    confirmed_city: Optional[str] = None
    confirmed_state: Optional[str] = None
    confirmed_category: Optional[str] = None
    confirmed_quota: Optional[str] = None
    confirmed_college_type: Optional[str] = None
    hostel_required: Optional[bool] = None
    pcm_percentage: Optional[float] = None

    # Track discussed colleges in chronological order
    discussed_colleges: List[Dict[str, str]] = field(default_factory=list)
    last_comparison_pair: Optional[Tuple[Dict[str, str], Dict[str, str]]] = None

    # Current task state: "recommendation", "comparison", "inquiry", "general"
    current_task: str = "general"

    # Track assumptions made by the assistant
    assumed_entities: Dict[str, str] = field(default_factory=dict)

    # History turns
    turns: List[ConversationTurn] = field(default_factory=list)
    last_active: float = field(default_factory=time.time)


class ConversationStateManager:
    """
    Manages in-memory session contexts with automatic timeout eviction
    and coreference query rewriting.
    """

    def __init__(self, session_ttl_seconds: int = 3600):
        self.sessions: Dict[str, SessionContext] = {}
        self.session_ttl = session_ttl_seconds

    def get_or_create_session(self, session_id: str) -> SessionContext:
        """Retrieves active session or creates a new one, evicting stale sessions."""
        now = time.time()
        # Clean expired sessions
        expired = [sid for sid, s in self.sessions.items() if now - s.last_active > self.session_ttl]
        for sid in expired:
            del self.sessions[sid]

        if session_id not in self.sessions:
            self.sessions[session_id] = SessionContext(session_id=session_id)
        else:
            self.sessions[session_id].last_active = now

        return self.sessions[session_id]

    def build_context_from_history(self, history: List[Any], session_id: str = "stateless") -> SessionContext:
        """
        Constructs a SessionContext from the incoming request's conversation_history list.
        Enables stateless API clients to retain full multi-turn context.
        """
        ctx = SessionContext(session_id=session_id)
        for msg in history:
            content = msg.content if hasattr(msg, "content") else msg.get("content", "")
            role = msg.role if hasattr(msg, "role") else msg.get("role", "")
            if role == "user":
                ents = extract_entities(content)
                self.update_session_with_entities(ctx, ents, content)
        return ctx

    def update_session_with_entities(self, ctx: SessionContext, entities: ExtractedEntities, query: str):
        """
        Updates session context with extracted entities, honoring explicit corrections
        (e.g., 'actually change my preference to CSE' overrides previous 'ECE').
        """
        q_lower = query.lower()
        is_correction = any(k in q_lower for k in [
            "actually", "change my", "correction", "not ", "instead of", "switch to", "prefer "
        ])

        # 1. Entrance Exam
        if entities.entrance_exam:
            ctx.confirmed_exam = entities.entrance_exam
            if "exam" in ctx.assumed_entities:
                del ctx.assumed_entities["exam"]

        # 2. Rank / Score
        if entities.rank:
            ctx.confirmed_rank = entities.rank
        elif entities.score_or_percentile and not ctx.confirmed_rank:
            ctx.confirmed_rank = entities.score_or_percentile

        # 3. Branch Preference (with correction override)
        if entities.preferred_branch:
            ctx.confirmed_branch = entities.preferred_branch

        # 4. Budget
        if entities.max_tuition_budget:
            ctx.confirmed_budget = entities.max_tuition_budget

        # 5. Location
        if entities.city:
            ctx.confirmed_city = entities.city
        if entities.state:
            ctx.confirmed_state = entities.state

        # 6. Category & Quota
        if entities.category:
            ctx.confirmed_category = entities.category
        if entities.quota:
            ctx.confirmed_quota = entities.quota

        # 7. PCM Percentage
        if entities.pcm_percentage:
            ctx.pcm_percentage = entities.pcm_percentage

        # 8. College Type
        if entities.preferred_college_type:
            ctx.confirmed_college_type = entities.preferred_college_type

        # 9. Hostel
        if entities.hostel_required is not None:
            ctx.hostel_required = entities.hostel_required

        # 10. Track colleges discussed
        if entities.colleges_mentioned:
            for col in entities.colleges_mentioned:
                # Add to front or keep unique
                if col not in ctx.discussed_colleges:
                    ctx.discussed_colleges.append(col)
            if len(entities.colleges_mentioned) >= 2:
                ctx.last_comparison_pair = (entities.colleges_mentioned[0], entities.colleges_mentioned[1])
                ctx.current_task = "comparison"
            elif len(entities.colleges_mentioned) == 1:
                ctx.current_task = "inquiry"

    def rewrite_query(self, query: str, ctx: SessionContext, intent: str, entities: ExtractedEntities) -> Tuple[str, List[str]]:
        """
        Stage 4: Query Understanding and Rewriting.
        Resolves coreferences (pronouns, ellipses, follow-ups) using conversational state.
        Returns (rewritten_self_contained_query, list_of_applied_modifications).
        """
        q_clean = clean_text(query)
        q_lower = q_clean.lower()
        applied_mods = []
        rewritten = q_clean

        # Pattern 1: Follow-up fee inquiry ("what about fees?", "fees?", "how much does it cost?")
        is_fee_followup = any(re.search(p, q_lower) for p in [
            r"\bwhat about (?:the )?fees?\b",
            r"\bhow much (?:does it cost|are the fees)\b",
            r"\bwhat are the fees\b",
            r"\bfee structure\?\b",
            r"\bwhat about tuition\b"
        ])
        if is_fee_followup and not entities.colleges_mentioned:
            if ctx.discussed_colleges:
                target_col = ctx.discussed_colleges[-1]["name"]
                rewritten = f"What are the annual tuition fees and living expenses at {target_col}?"
                applied_mods.append(f"Resolved follow-up fee question for previously discussed college: {target_col}")
            elif ctx.last_comparison_pair:
                c1, c2 = ctx.last_comparison_pair
                rewritten = f"Compare the annual tuition fees between {c1['name']} and {c2['name']}."
                applied_mods.append(f"Resolved fee comparison for {c1['name']} and {c2['name']}")

        # Pattern 2: Follow-up placement inquiry ("what about placements?", "placement stats?", "average package?")
        is_placement_followup = any(re.search(p, q_lower) for p in [
            r"\bwhat about (?:the )?placements?\b",
            r"\bplacement (?:statistics|stats|report)\b",
            r"\bwhat is the package\b",
            r"\bmedian package\?\b"
        ])
        if is_placement_followup and not entities.colleges_mentioned:
            if ctx.discussed_colleges:
                target_col = ctx.discussed_colleges[-1]["name"]
                rewritten = f"What are the placement statistics at {target_col}?"
                applied_mods.append(f"Resolved follow-up placement question for: {target_col}")

        # Pattern 3: Comparative follow-up ("which one has lower fees?", "which one is better?", "which has better placement?")
        is_comparison_followup = any(re.search(p, q_lower) for p in [
            r"\bwhich (?:one|college) has lower fees\b",
            r"\bwhich is cheaper\b",
            r"\bwhich one is better\b",
            r"\bwhich one has higher placement\b"
        ])
        if is_comparison_followup and ctx.last_comparison_pair:
            c1, c2 = ctx.last_comparison_pair
            if "fee" in q_lower or "cheaper" in q_lower:
                rewritten = f"Compare fees between {c1['name']} and {c2['name']}: which one has lower annual fees?"
                applied_mods.append(f"Resolved comparison coreference between {c1['name']} and {c2['name']} on fees")
            else:
                rewritten = f"Compare {c1['name']} and {c2['name']} on academics, placements, and fees."
                applied_mods.append(f"Resolved comparison between {c1['name']} and {c2['name']}")

        # Pattern 4: Location refinement ("any better option near Chennai?", "show options in Pune")
        is_loc_refinement = any(k in q_lower for k in ["near ", "in ", "options in ", "better option near"])
        if is_loc_refinement and entities.city:
            retained_parts = []
            if ctx.confirmed_exam:
                retained_parts.append(f"for {ctx.confirmed_exam}")
            if ctx.confirmed_rank:
                retained_parts.append(f"with rank {int(ctx.confirmed_rank)}")
            if ctx.confirmed_branch:
                retained_parts.append(f"in {ctx.confirmed_branch}")
            if ctx.confirmed_budget:
                retained_parts.append(f"within budget ₹{int(ctx.confirmed_budget):,}")

            retained_str = " ".join(retained_parts)
            rewritten = f"Suggest engineering colleges near {entities.city} {retained_str}."
            applied_mods.append(f"Injected retained constraints ({retained_str}) into new location: {entities.city}")

        # Pattern 5: Budget refinement ("show cheaper ones", "any lower budget options?")
        is_cheaper_refinement = any(k in q_lower for k in ["show cheaper", "cheaper ones", "lower budget options", "less expensive"])
        if is_cheaper_refinement:
            retained_parts = []
            if ctx.confirmed_exam:
                retained_parts.append(f"for {ctx.confirmed_exam}")
            if ctx.confirmed_rank:
                retained_parts.append(f"with rank {int(ctx.confirmed_rank)}")
            if ctx.confirmed_branch:
                retained_parts.append(f"in {ctx.confirmed_branch}")

            retained_str = " ".join(retained_parts)
            rewritten = f"Suggest more affordable engineering colleges with lower fees {retained_str}."
            applied_mods.append(f"Retained student academic criteria ({retained_str}) with lower fee sorting")

        # Pattern 6: User correction ("Actually, change my preference to CSE", "I prefer ECE instead")
        is_correction = any(k in q_lower for k in ["actually", "change my", "correction", "prefer "])
        if is_correction and entities.preferred_branch:
            rewritten = f"Update my preferred branch to {entities.branch_name_full or entities.preferred_branch} and suggest matching colleges."
            applied_mods.append(f"User correction applied: branch changed to {entities.preferred_branch}")

        # Pattern 7: Bare rank query ("colleges for 20k rank")
        if re.search(r'^\s*colleges for \d+\s*(?:k|rank)?\s*$', q_lower) and not entities.entrance_exam and not ctx.confirmed_exam:
            applied_mods.append("Noted unspecified entrance exam; assuming JEE Main CRL rank while preparing clarification prompt.")

        return rewritten, applied_mods


# Global singleton instance
_state_manager: Optional[ConversationStateManager] = None

def get_state_manager() -> ConversationStateManager:
    global _state_manager
    if _state_manager is None:
        _state_manager = ConversationStateManager()
    return _state_manager
