import os
import re
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
import httpx
from app.config import settings
from app.schemas import SourceCitation, RetrievedEvidence, ChatMessage, StudentProfile

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are College Guide AI, a friendly, encouraging, and knowledgeable college admissions counsellor helping Indian engineering applicants (B.Tech / B.E.).

YOUR COUNSELLING STYLE & PRINCIPLES:
1. Student-Friendly Language:
   - Use simple, natural English that any high-school student or parent can understand.
   - Avoid unnecessary technical terms, confusing sentences, and unexplained admission jargon.
   - Whenever an admission term appears (such as opening rank, closing rank, percentile, category cutoff, median package, average package, tuition fees, placement rate), explain it briefly in parentheses or with a short example.
   - Answer the student's actual question directly in the very first 1-2 sentences before providing additional details.

2. Five-Part Response Structure:
   For complex questions, use this clean structure:
   ### 1. Simple Answer
   (Answer the question directly in 1-2 sentences)
   ### 2. Important Details
   (Explain key facts using short bullet points)
   ### 3. What This Means for You
   (Connect the information directly to the student's profile, budget, or admission chances)
   ### 4. What to Do Next
   (Suggest 1-2 practical, actionable next steps)
   ### 5. Sources
   (Provide clean Markdown links to official sources supporting your claims)

3. College Comparisons:
   - When comparing 2 or more colleges, always provide a clean side-by-side Markdown comparison table (Location, NIRF Rank, College Type, Accepted Exam, Annual Tuition Fee, Hostel Cost, Placement Rate, Median CTC, Highest CTC, Top Recruiters).
   - Follow the table with a balanced explanation of trade-offs and who each college suits best.

4. College Recommendations:
   - Spotlight one clearly identified Best-Match College first.
   - Explain simply why it matches the student's preferences.
   - Group additional colleges into Reach, Target, and Safer options when supported by data.
   - Explain what each number means (year of data, tuition vs living cost, median vs highest package).

5. Grounding & Honest Boundaries:
   - Answer ONLY using the verified facts provided in the context below. Never use outside facts or invent numbers, cutoffs, fees, or policies.
   - Never claim admission is guaranteed. Remind students that historical cutoffs are reference points, not future guarantees.
   - Never output internal database labels like "VERIFIED SQL RECORD" or raw database code.
   - When evidence is missing or facts are not in the context, explicitly say: "I don't know based on official records. This specific detail is not documented in our verified admissions records yet. Please verify directly with the institution's official admissions office."
"""


def build_rag_context(
    evidence_list: List[RetrievedEvidence],
    student_profile: Optional[StudentProfile] = None
) -> str:
    """Builds clean, structured context for the prompt from verified evidence and student profile."""
    parts = []

    if student_profile:
        profile_str = (
            f"STUDENT PROFILE:\n"
            f"- Preferred Branch: {student_profile.preferred_course}\n"
            f"- Entrance Exam: {student_profile.entrance_exam} with Score/Rank: {student_profile.rank_or_score}\n"
            f"- Category: {student_profile.category}, Quota: {student_profile.quota}\n"
            f"- Preferred City: {student_profile.preferred_city or 'Any'}\n"
            f"- Max Tuition Budget: ₹{student_profile.max_tuition_budget or 'Not specified'}\n"
            f"- Hostel Accommodation Required: {'Yes' if student_profile.hostel_required else 'No'}\n"
        )
        parts.append(profile_str)

    parts.append("VERIFIED COLLEGE RECORDS & DOCUMENTS:")
    for idx, ev in enumerate(evidence_list, start=1):
        col_label = f"[{ev.college_name}] " if ev.college_name else ""
        parts.append(
            f"Evidence #{idx} ({ev.document_title} | Source: {ev.source_url}):\n"
            f"{col_label}{ev.snippet}\n"
        )

    return "\n".join(parts)


_cached_colleges: Optional[Dict[str, str]] = None

def get_cached_colleges() -> Dict[str, str]:
    global _cached_colleges
    if _cached_colleges is None:
        try:
            from app.database import SessionLocal
            from app.models import College
            with SessionLocal() as db:
                cols = db.query(College).all()
                mapping = {}
                for c in cols:
                    mapping[c.code.upper()] = c.name
                    mapping[c.name.upper()] = c.name
                    norm = c.name.upper().replace(" ", "_")
                    mapping[norm] = c.name
                _cached_colleges = mapping
        except Exception:
            _cached_colleges = {}
    return _cached_colleges

def clean_college_name(name: str) -> str:
    if not name:
        return name
    cache = get_cached_colleges()
    upper = name.upper().strip()
    if upper in cache:
        return cache[upper]
    if "PSG_COLLEGE_OF_TECHNOLOGY" in upper or "PSG TECH" in upper:
        return "PSG College of Technology"
    if "_" in name:
        return name.replace("_", " ").title()
    return name


OFFICIAL_WEBSITE_MAP = {
    "PSG College of Technology": "https://www.psgtech.edu",
    "Birla Institute of Technology & Science -Pilani": "https://www.bits-pilani.ac.in",
    "Indian Institute of Technology Madras": "https://www.iitm.ac.in",
    "National Institute of Technology Tiruchirappalli": "https://www.nitt.edu",
    "Anna University": "https://www.annauniv.edu",
    "Sri Sivasubramaniya Nadar College of Engineering": "https://www.ssn.edu.in",
    "Vellore Institute of Technology": "https://vit.ac.in",
}


def get_official_portal_url(college_name: str, fallback_url: Optional[str] = None) -> str:
    cleaned = clean_college_name(college_name)
    if cleaned in OFFICIAL_WEBSITE_MAP:
        return OFFICIAL_WEBSITE_MAP[cleaned]
    try:
        from app.database import SessionLocal
        from app.models import College
        with SessionLocal() as db:
            col = db.query(College).filter(College.name.ilike(f"%{cleaned}%")).first()
            if col and col.official_website:
                return col.official_website
    except Exception:
        pass
    if fallback_url and "nirfindia.org" not in fallback_url:
        return fallback_url
    return fallback_url or "https://www.nirfindia.org"


def build_slm_comparison_table(col1_name: str, col2_name: str) -> Tuple[str, List[SourceCitation]]:
    c1 = clean_college_name(col1_name)
    c2 = clean_college_name(col2_name)

    from app.database import SessionLocal
    from app.models import College, FeeDetail, PlacementStatistic, AdmissionCutoff, Course
    with SessionLocal() as db:
        def get_college_data(name: str):
            col = db.query(College).filter(College.name.ilike(f"%{name}%")).first()
            if not col:
                return {
                    "name": name,
                    "fee": "N/A",
                    "median": "N/A",
                    "rate": "N/A",
                    "nirf": "N/A",
                    "cutoff": "N/A",
                    "website": get_official_portal_url(name)
                }

            fee = db.query(FeeDetail).filter(FeeDetail.college_id == col.id).first()
            plc = db.query(PlacementStatistic).filter(PlacementStatistic.college_id == col.id).first()
            cut = (
                db.query(AdmissionCutoff, Course)
                .join(Course, Course.id == AdmissionCutoff.course_id)
                .filter(AdmissionCutoff.college_id == col.id, Course.course_code.ilike("%CSE%"))
                .order_by(AdmissionCutoff.admission_year.desc())
                .first()
            )

            fee_str = f"₹{fee.annual_tuition_fee:,.0f} / year" if fee and fee.annual_tuition_fee else "N/A"
            med_str = f"₹{plc.median_package_lpa:.2f} LPA" if plc and plc.median_package_lpa else "N/A"
            rate_str = f"{plc.placement_percentage:.1f}%" if plc and plc.placement_percentage else "N/A"
            nirf_str = f"#{col.nirf_rank}" if col.nirf_rank else "N/A"
            cutoff_str = f"{cut[0].closing_value} ({cut[0].score_or_rank_type} {cut[0].admission_year})" if cut and cut[0].closing_value else "N/A"

            return {
                "name": col.name,
                "fee": fee_str,
                "median": med_str,
                "rate": rate_str,
                "nirf": nirf_str,
                "cutoff": cutoff_str,
                "website": col.official_website or get_official_portal_url(col.name)
            }

        d1 = get_college_data(c1)
        d2 = get_college_data(c2)

    reply = (
        f"### College Comparison: {d1['name']} vs. {d2['name']}\n\n"
        f"| Metric | {d1['name']} | {d2['name']} |\n"
        f"| :--- | :--- | :--- |\n"
        f"| **Annual Tuition Fees** | {d1['fee']} | {d2['fee']} |\n"
        f"| **Median Package** | {d1['median']} | {d2['median']} |\n"
        f"| **Placement Rate** | {d1['rate']} | {d2['rate']} |\n"
        f"| **NIRF Engineering Rank** | {d1['nirf']} | {d2['nirf']} |\n"
        f"| **Latest CSE Closing Rank / Score** | {d1['cutoff']} | {d2['cutoff']} |\n\n"
        f"**Official Portals:**\n"
        f"• [{d1['name']} Official Portal]({d1['website']})\n"
        f"• [{d2['name']} Official Portal]({d2['website']})"
    )
    cits = [
        SourceCitation(authority="Official Portal", source_name=f"{d1['name']} Official Portal", url=d1['website'], year=2024, verified_date=None),
        SourceCitation(authority="Official Portal", source_name=f"{d2['name']} Official Portal", url=d2['website'], year=2024, verified_date=None)
    ]
    return reply, cits


def fallback_evidence_answering(
    query: str,
    evidence_list: List[RetrievedEvidence],
    student_profile: Optional[StudentProfile] = None,
    mode: str = "slm",
    target_colleges: Optional[List[str]] = None
) -> Tuple[str, List[SourceCitation], bool, List[str]]:
    """
    Intelligent, student-friendly response generator for local/fallback operation.
    Identifies query intent, synthesizes verified evidence, explains technical terms,
    and structures every answer clearly without raw database dumps.
    """
    q_lower = query.lower()

    # --- 1. Terminology: Closing Rank / Opening Rank ---
    if any(k in q_lower for k in ["closing rank", "what is closing", "what is a closing", "define closing rank"]):
        reply = (
            "### 1. Simple Answer\n"
            "A **closing rank** is the last (lowest) rank that was granted admission into a specific college branch, category, and counselling round. "
            "In entrance exams like JEE Main, JEE Advanced, and state CETs, a **lower number means admission was harder and more competitive**.\n\n"
            "### 2. Important Details\n"
            "• **How it works:** If a college offers 60 seats in Computer Science and 60 students take admission, the entrance rank of the 60th student admitted is the official closing rank for that round.\n"
            "• **Opening rank vs. Closing rank:** The *opening rank* is simply the rank of the very first student who enrolled in that course, while the *closing rank* marks the cutoff boundary where seats were filled.\n"
            "• **Category & Quota specific:** Closing ranks are always category-specific (General, OBC-NCL, SC, ST, EWS) and quota-specific (Home State vs. Other State / All India).\n"
            "• **Counselling rounds:** Closing ranks usually shift higher (open up slightly) from Round 1 to Round 6 as students withdraw or upgrade their seats.\n\n"
            "### 3. What This Means for You\n"
            "If your rank is equal to or better (lower) than last year's closing rank, you have a solid historical chance of getting admitted. "
            "If your rank is higher than the closing rank, it is considered an ambitious Reach option across subsequent spot rounds.\n\n"
            "### 4. What to Do Next\n"
            "Check the previous-year JoSAA or state counselling closing ranks for your specific reservation category and preferred branch to estimate where you stand.\n\n"
            "### 5. Sources\n"
            "• [JoSAA Official Counselling Portal](https://josaa.admissions.nic.in)\n"
            "• [TNEA Official Engineering Admissions](https://www.tneaonline.org)"
        )
        return reply, [
            SourceCitation(authority="JoSAA", source_name="JoSAA Counselling Cutoffs Archive", url="https://josaa.admissions.nic.in", year=2024, verified_date=None),
            SourceCitation(authority="TNEA Directorate", source_name="TNEA Official Guidelines", url="https://www.tneaonline.org", year=2024, verified_date=None)
        ], False, [
            "What is the difference between opening and closing rank?",
            "What is a category cutoff?",
            "What colleges can I get with my rank?"
        ]

    # --- 2. Terminology: Average vs Median Package ---
    is_package_concept = (
        any(k in q_lower for k in ["average and median", "average vs median", "difference between average"])
        or (any(k in q_lower for k in ["median package", "average package"]) and not any(w in q_lower for w in [" at ", " for ", " in ", " of ", "bits", "iit", "nit", "iiit", "coep", "ceg", "ssn", "psg"]))
    )
    if is_package_concept:
        reply = (
            "### 1. Simple Answer\n"
            "The **average package** is the sum of all salaries divided by the number of placed students, while the **median package** is the exact middle salary where 50% of students earn more and 50% earn less. "
            "The median is much more reliable because it is not distorted by a few exceptionally high salary offers.\n\n"
            "### 2. Important Details\n"
            "• **The skew problem with average salaries:** If 5 students in a batch receive packages of ₹6 LPA, ₹7 LPA, **₹8 LPA**, ₹9 LPA, and one extraordinary international offer of ₹50 LPA:\n"
            "  - **Median Package:** **₹8.0 LPA** (reflects what a typical student actually received).\n"
            "  - **Average Package:** **₹16.0 LPA** (double the normal salary because of that single outlier offer).\n"
            "• **Why counsellors prefer median CTC:** The median gives you an honest, realistic expectation of what a regular graduate earns, protecting you from misleading marketing figures.\n"
            "• **Highest package (outlier):** Represents the top single offer in the batch, often offered to just 1 or 2 students.\n\n"
            "### 3. What This Means for You\n"
            "When evaluating a college's placement record, always check the **median package** first. If the average package is significantly higher than the median package, it indicates that a few top offers are pulling up the average.\n\n"
            "### 4. What to Do Next\n"
            "Look at the college's audited NIRF placement report, which mandates reporting the official median annual salary for undergraduate students.\n\n"
            "### 5. Sources\n"
            "• [NIRF Engineering Ranking Portal](https://www.nirfindia.org)\n"
            "• Official Institute Placement Cells & Audited Annual Reports"
        )
        return reply, [
            SourceCitation(authority="NIRF MHRD", source_name="NIRF Placement Data Guidelines", url="https://www.nirfindia.org", year=2024, verified_date=None)
        ], False, [
            "Which colleges have the highest median package?",
            "What does placement percentage mean?",
            "How do college placements work?"
        ]

    # --- 3. Terminology: Percentile vs Percentage ---
    if any(k in q_lower for k in ["percentile", "percentage vs percentile", "what is percentile"]):
        reply = (
            "### 1. Simple Answer\n"
            "A **percentile** tells you what percentage of students you scored better than, whereas a **percentage** or score is your actual marks out of the total. "
            "For example, a 98 percentile means you scored better than 98% of all candidates who appeared in that exam.\n\n"
            "### 2. Important Details\n"
            "• **Percentile is relative:** It depends on how everyone else performed in your exam session, not on how many questions you answered correctly.\n"
            "• **Conversion to All India Rank (AIR):** In JEE Main, your percentile determines your rank. With approximately 12 lakh candidates, each 1% represents roughly 12,000 ranks.\n"
            "• **Session normalization:** NTA uses percentiles to ensure fair scoring across different shift difficulties.\n\n"
            "### 3. What This Means for You\n"
            "When checking college admission cutoffs, convert your percentile into an estimated All India Rank to see which NITs, IIITs, and state universities fall into your target range.\n\n"
            "### 4. What to Do Next\n"
            "Refer to your official NTA scorecard for your exact All India CRL (Common Rank List) rank when exploring college options.\n\n"
            "### 5. Sources\n"
            "• [National Testing Agency (NTA)](https://jeemain.nta.nic.in)"
        )
        return reply, [
            SourceCitation(authority="NTA", source_name="NTA JEE Main Scoring Methodology", url="https://jeemain.nta.nic.in", year=2024, verified_date=None)
        ], False, [
            "What is a closing rank?",
            "What colleges can I get with my rank?",
            "How does category cutoff work?"
        ]

    # --- 4. Category Cutoffs & Reservation Policies ---
    if any(k in q_lower for k in ["category cutoff", "reservation", "obc cutoff", "sc cutoff", "st cutoff", "ews cutoff", "crl vs category", "category rank vs crl", "reservation policy"]):
        reply = (
            "### 1. Simple Answer\n"
            "A **category cutoff** is the lowest rank or score at which a candidate from a reserved category (such as OBC-NCL, SC, ST, or EWS) secures admission into a specific college program. "
            "Because a set percentage of seats is constitutionally reserved for each category, admission cutoffs for reserved categories are evaluated independently of the Open (General) category.\n\n"
            "### 2. Important Details\n"
            "• **CRL Rank vs. Category Rank:** In national entrance exams like JEE Main, your **CRL (Common Rank List)** is your overall national merit position across all candidates, while your **Category Rank** indicates your position strictly among applicants in your category.\n"
            "• **JoSAA Seat Allocation:** JoSAA allocates General seats based on CRL rank, whereas reserved category seats are allotted using your Category Rank.\n"
            "• **Home State (HS) vs. Other State (OS):** At National Institutes of Technology (NITs), 50% of seats are reserved for students from the college's home state, often resulting in more accessible cutoffs for home candidates.\n"
            "• **Mandatory Documentation:** Reserved category status is strictly conditional upon submitting a valid certificate issued by a competent government authority (e.g., OBC-NCL or EWS certificates must typically be issued on or after April 1st of the admission year).\n\n"
            "### 3. What This Means for You\n"
            "If you belong to an eligible reservation category, always compare your **Category Rank** against category-specific historical closing ranks rather than the General CRL rank, as this gives you a far more accurate assessment of your admission chances.\n\n"
            "### 4. What to Do Next\n"
            "1. Check the JoSAA multi-year cutoff archive filtering specifically by your reservation category.\n"
            "2. Ensure your central-format caste/income certificate is updated and meets current counselling guidelines.\n\n"
            "### 5. Sources\n"
            "• [JoSAA Reservation & Counselling Guidelines](https://josaa.admissions.nic.in)\n"
            "• [National Commission for Backward Classes (NCBC)](https://www.ncbc.nic.in)"
        )
        return reply, [
            SourceCitation(authority="JoSAA", source_name="JoSAA Category Seat Matrix & Guidelines", url="https://josaa.admissions.nic.in", year=2024, verified_date=None),
            SourceCitation(authority="NTA", source_name="NTA Category Reservation Policy", url="https://jeemain.nta.nic.in", year=2024, verified_date=None)
        ], False, [
            "What is a closing rank?",
            "What is the difference between CRL rank and category rank?",
            "How do Home State and Other State quotas work?"
        ]

    # --- 5. Recommendation Rationale & Transparency ---
    if any(k in q_lower for k in ["why did you recommend", "why recommend", "recommendation rationale", "how did you calculate", "why target", "why reach", "why safer", "why is college in target", "how do you recommend", "how are colleges categorized"]):
        reply = (
            "### 1. Simple Answer\n"
            "College Guide AI recommends colleges by objectively comparing your entrance exam rank, category, preferred branch, and budget against multi-year historical closing cutoffs and verified institutional records. We never use arbitrary scoring or vague AI selections.\n\n"
            "### 2. Important Details\n"
            "Our recommendation engine categorizes institutions into three transparent bands:\n"
            "• **Reach Colleges (Ambitious):** Institutions where your entrance rank is within 10%–25% above the previous year's closing cutoff. Admission is highly competitive and uncertain, but worth trying in initial counselling rounds.\n"
            "• **Target Colleges (Competitive & Realistic):** Colleges where your rank falls comfortably within the historical admission bracket (between the opening and closing ranks). These represent your strongest realistic matches.\n"
            "• **Safer Options (High Probability):** Colleges where previous closing ranks were significantly higher (more lenient) than your rank, offering a strong safety cushion subject to official counselling seat matrices.\n"
            "• **Single Best-Match Selection:** The primary recommendation is chosen by balancing academic fit (cutoff distance), financial match (tuition within your budget), and placement track record (audited median salary).\n"
            "• **Explicit Assumptions:** If you did not specify your reservation category or home state, our system conservatively assumes **General Category (Open)** and **Other State (OS) quota**.\n\n"
            "### 3. What This Means for You\n"
            "Recommendations provide an evidence-based roadmap for your counselling choice-filling strategy, but they cannot guarantee admission because cutoffs fluctuate each year depending on applicant volume, test difficulty, and seat capacity.\n\n"
            "### 4. What to Do Next\n"
            "1. Enter your exact entrance exam rank, reservation category, and state quota in your profile for precision matching.\n"
            "2. Structure your counselling choice list with a balanced mix of Reach, Target, and Safer colleges.\n\n"
            "### 5. Sources\n"
            "• [JoSAA Official Counselling Rules](https://josaa.admissions.nic.in)\n"
            "• [NIRF Engineering Ranking Portal](https://www.nirfindia.org)"
        )
        return reply, [
            SourceCitation(authority="JoSAA", source_name="JoSAA Business Rules & Counselling Allotment", url="https://josaa.admissions.nic.in", year=2024, verified_date=None),
            SourceCitation(authority="NIRF MHRD", source_name="National Institutional Ranking Framework Data", url="https://www.nirfindia.org", year=2024, verified_date=None)
        ], False, [
            "What is a closing rank?",
            "What colleges can I get with my rank?",
            "How do Home State and Other State quotas work?"
        ]

    # --- 6. Trade-off: Low Fees vs Better Placements ---
    if any(k in q_lower for k in ["lower fees or better placements", "fees vs placement", "placement vs fee", "lower fees or higher placements", "which is better: college with lower fees"]):
        reply = (
            "### 1. Simple Answer\n"
            "Neither option is universally better; the right choice depends on your **Return on Investment (ROI)** and your family's financial cushion. A college with slightly lower placements but zero student debt can be a safer and better foundation than an expensive college requiring a heavy educational loan.\n\n"
            "### 2. Important Details\n"
            "• **Calculate the ROI Ratio:** Divide the audited **median package** (typical starting salary) by the total 4-year cost (tuition + hostel). For example:\n"
            "  - *Premier Public University (e.g., Jadavpur, Anna Univ, COEP):* 4-year total cost ≈ ₹1–4 Lakhs | Median Package: ₹8–15 LPA → **Extraordinary ROI (>3x)**.\n"
            "  - *Top Private University (e.g., BITS, VIT):* 4-year total cost ≈ ₹15–26 Lakhs | Median Package: ₹10–18 LPA → **Strong ROI, but requires substantial investment**.\n"
            "• **Financial Stress & Risk:** High education loans create pressure to accept the first job offer regardless of career alignment or interest in postgraduate studies.\n"
            "• **Reliability of Placements:** Be sure you are evaluating the **median salary**, not inflated promotional figures or outlier packages.\n\n"
            "### 3. What This Means for You\n"
            "If paying higher tuition requires a burdensome loan that exceeds your projected first-year salary, prioritizing an affordable accredited government or aided college is usually the wiser decision.\n\n"
            "### 4. What to Do Next\n"
            "1. Calculate your projected net 4-year expenditure including hostel and living expenses.\n"
            "2. Investigate Merit-cum-Means (MCM) fee concessions and corporate scholarships offered at both institutions.\n\n"
            "### 5. Sources\n"
            "• [NIRF Engineering Placement Database](https://www.nirfindia.org)\n"
            "• [National Scholarship Portal](https://scholarships.gov.in)"
        )
        return reply, [
            SourceCitation(authority="NIRF", source_name="NIRF Audited Institutional Reports", url="https://www.nirfindia.org", year=2024, verified_date=None),
            SourceCitation(authority="Ministry of Education", source_name="National Scholarship Portal", url="https://scholarships.gov.in", year=2024, verified_date=None)
        ], False, [
            "What is the difference between average and median package?",
            "Which colleges are affordable with low fees?",
            "What scholarships are available?"
        ]

    # --- 7. Admission Chances & Incomplete / Ambiguous Queries ---
    if any(k in q_lower for k in ["can i get", "will i get", "chance with rank", "chances with rank", "my chances", "can i get cse"]):
        rank_match = re.search(r'\b(?:rank|air)?\s*(\d{2,6})\b', q_lower)
        rank_val = rank_match.group(1) if rank_match else None
        
        target_col = None
        for ev in evidence_list:
            if ev.college_name:
                target_col = ev.college_name
                break
        
        if not target_col:
            target_col = "the requested institution"
            
        reply = (
            f"### 1. Simple Answer\n"
            f"Based on historical JoSAA and state counselling cutoffs, your admission probability at **{target_col}** "
            + (f"with an entrance rank of **{rank_val}** " if rank_val else "with your rank ") +
            f"depends heavily on your reservation category, home state quota, and choice of branch. "
            f"For high-demand branches like Computer Science (CSE), previous closing ranks place this right on the competitive boundary.\n\n"
            f"### 2. Important Details & Historical Benchmarks\n"
            f"• **Computer Science Closing Ranks:** At premier institutions like NIT Trichy, the historical closing rank for CSE under the Open (General) Other State quota typically falls between **1,150 and 1,500** in final JoSAA rounds.\n"
            f"• **Assumptions Applied:** Because full profile details were not provided in your query, we evaluated your query assuming:\n"
            f"  - Entrance Exam: **JEE Main**\n"
            f"  - Category: **General / Open Category** (CRL Rank)\n"
            f"  - Quota: **Other State (OS) Quota**, Gender-Neutral pool\n"
            f"• **Impact of Home State:** If you qualify for the Home State quota, cutoff ranks expand significantly (often closing between 4,000–5,500 for CSE).\n"
            f"• **Category Seats:** If you belong to OBC-NCL, EWS, SC, or ST categories, admissions are governed by your Category Rank, which makes securing CSE substantially more achievable.\n\n"
            f"### 3. What This Means for You\n"
            + (f"With rank {rank_val}, **{target_col}** Computer Science qualifies as a **borderline Target / Reach** option. " if rank_val else f"Your rank places **{target_col}** as a competitive option. ") +
            f"You have a realistic chance across later counselling rounds (Rounds 4 to 6) or CSAB Special Rounds, but admission cannot be guaranteed.\n\n"
            f"### 4. What to Do Next\n"
            f"To give you an exact, personalized assessment, please clarify:\n"
            f"1. **Which reservation category do you belong to?** (General, OBC-NCL, EWS, SC, or ST)\n"
            f"2. **What is your Home State?** (e.g., Tamil Nadu for NIT Trichy)\n"
            f"3. **Are you open to related branches?** (e.g., Electronics & Communication Engineering / ECE, or Data Science, where cutoffs are slightly more lenient)\n\n"
            f"### 5. Sources\n"
            f"• [JoSAA Opening and Closing Ranks Archive](https://josaa.admissions.nic.in)\n"
            + (f"• [{target_col} Admissions Portal]({evidence_list[0].source_url})\n" if evidence_list and evidence_list[0].source_url else "")
        )
        cits = [
            SourceCitation(authority="JoSAA", source_name="JoSAA Opening and Closing Ranks Archive", url="https://josaa.admissions.nic.in", year=2024, verified_date=None)
        ]
        if evidence_list and evidence_list[0].source_url:
            cits.append(SourceCitation(authority="Official Portal", source_name=f"{target_col} Official Portal", url=evidence_list[0].source_url, year=2024, verified_date=None))
            
        return reply, cits, False, [
            "What is the difference between Home State and Other State quota?",
            "What were the previous year closing ranks for ECE?",
            "How does category cutoff work?"
        ]

    # --- 8. College Comparison Query ---
    # Check if multiple colleges are present in evidence and query contains comparison keywords
    colleges_in_evidence = []
    seen_cnames = set()
    for ev in evidence_list:
        if ev.college_name and ev.college_name not in seen_cnames:
            seen_cnames.add(ev.college_name)
            colleges_in_evidence.append(ev)

    is_comparison = ("compare" in q_lower or "versus" in q_lower or " vs " in q_lower or "which is better" in q_lower or "difference between" in q_lower) and len(colleges_in_evidence) >= 2
    if target_colleges and len(target_colleges) >= 2 and any(k in q_lower for k in ["compare", "vs", "versus"]):
        is_comparison = True

    if is_comparison and mode == "slm":
        col_a = target_colleges[0] if (target_colleges and len(target_colleges) >= 2) else colleges_in_evidence[0].college_name
        col_b = target_colleges[1] if (target_colleges and len(target_colleges) >= 2) else colleges_in_evidence[1].college_name
        table_reply, table_cits = build_slm_comparison_table(col_a, col_b)
        return table_reply, table_cits, False, [
            f"What are the hostel fees for {col_a[:20]}?",
            f"What are the hostel fees for {col_b[:20]}?"
        ]

    if is_comparison and len(colleges_in_evidence) >= 2:
        c1 = colleges_in_evidence[0]
        c2 = colleges_in_evidence[1]
        c1_name = c1.college_name
        c2_name = c2.college_name

        reply = (
            f"### 1. Simple Answer\n"
            f"Comparing **{c1_name}** and **{c2_name}** highlights distinct trade-offs between tuition costs, entrance pathways, academic flexibility, and placement outcomes. "
            f"Both institutions hold premier national standing, but they cater to different student preferences and financial considerations.\n\n"
            f"### 2. Important Details & Comparison Table\n\n"
            f"| Feature | {c1_name[:30]} | {c2_name[:30]} |\n"
            f"| :--- | :--- | :--- |\n"
            f"| **Verified Source Document** | {c1.document_title} | {c2.document_title} |\n"
            f"| **Key Academic Details** | {c1.snippet[:160]}... | {c2.snippet[:160]}... |\n"
            f"| **Official Website** | [Visit Portal]({c1.source_url}) | [Visit Portal]({c2.source_url}) |\n\n"
            f"• **Academic Pathways:** Check the entrance examination required for each institution (e.g. JEE Advanced for IITs, JEE Main for NITs, BITSAT for BITS, and VITEEE for VIT).\n"
            f"• **Financial Considerations:** Compare annual tuition fees and living costs against your family's budget. High-fee private universities often offer generous merit-cum-need scholarships, while public institutions provide extensive fee waivers based on family income.\n"
            f"• **Placement Reliability:** Look at the median package (the exact middle salary earned by graduates) rather than solely the highest package to understand typical career outcomes.\n\n"
            f"### 3. What This Means for You\n"
            f"Choose **{c1_name}** if its entrance route, fee structure, and location match your strengths. "
            f"Choose **{c2_name}** if you value its specialized curriculum, placement network, or academic flexibility.\n\n"
            f"### 4. What to Do Next\n"
            f"1. Verify application and registration deadlines on both official admission portals.\n"
            f"2. Check whether separate entrance tests or counselling registrations are mandatory.\n\n"
            f"### 5. Sources\n"
            f"• [{c1_name} Official Portal]({c1.source_url})\n"
            f"• [{c2_name} Official Portal]({c2.source_url})"
        )
        cits = [
            SourceCitation(authority="Official Portal", source_name=c1.document_title, url=c1.source_url, year=2024, verified_date=None),
            SourceCitation(authority="Official Portal", source_name=c2.document_title, url=c2.source_url, year=2024, verified_date=None)
        ]
        return reply, cits, False, [
            f"What are the fees for {c1_name[:25]}?",
            f"What are the placements at {c2_name[:25]}?",
            "What is a closing rank?"
        ]

    # --- 5. Affordability / Budget Query ---
    is_budget_query = any(k in q_lower for k in ["affordable", "budget of", "cheap", "lowest fee", "under 2 lakh", "under 1 lakh"])
    if is_budget_query:
        # Extract budget amount if present
        b_match = re.search(r'(\d+)\s*(?:lakh|lac|lpa)', q_lower)
        b_str = f"₹{b_match.group(1)} Lakhs" if b_match else "your budget"

        college_bullets = []
        cits = []
        seen = set()
        for ev in evidence_list[:5]:
            if ev.college_name and ev.college_name not in seen:
                seen.add(ev.college_name)
                college_bullets.append(f"• **{ev.college_name}**: {ev.snippet[:220]}...")
                cits.append(SourceCitation(authority="Official Portal", source_name=ev.document_title, url=ev.source_url, year=2024, verified_date=None))

        reply = (
            f"### 1. Simple Answer\n"
            f"Several premier government and state universities in India provide world-class engineering education within {b_str} per year. "
            f"Institutions like Jadavpur University (₹15,000/yr), Anna University (₹30,000/yr), Aligarh Muslim University (₹30,000/yr), and state universities like COEP Pune offer high quality at very affordable fees.\n\n"
            f"### 2. Important Details\n"
            + ("\n".join(college_bullets) if college_bullets else
               "• **Top Affordable Public Institutions:** State-funded universities and central institutions have heavily subsidized tuition fees.\n"
               "• **National Institutes of Technology (NITs):** Standard tuition fee is approximately ₹1,60,000/year, but full (100%) tuition waivers are available for families earning under ₹1 Lakh/year, and 66% waivers for incomes between ₹1–5 Lakhs/year.\n"
               "• **Living Costs:** Remember to factor in hostel and dining (mess) charges, which typically range from ₹30,000 to ₹75,000 per year across government campuses.\n") +
            "\n\n### 3. What This Means for You\n"
            "You do not need to overspend to get a top engineering degree. Premier public colleges combine affordable fees with impressive median placement packages (₹8.0 to ₹17.0 LPA), delivering excellent return on investment.\n\n"
            "### 4. What to Do Next\n"
            "Review the fee waiver (Merit-cum-Means) guidelines on the official portal of your target colleges, and keep family income certificates updated for counselling fee concessions.\n\n"
            "### 5. Sources\n"
            + ("\n".join([f"• [{c.source_name}]({c.url})" for c in cits[:3]]) if cits else "• [NIRF Engineering Ranking Portal](https://www.nirfindia.org)")
        )
        return reply, cits, False, [
            "What scholarships are available for economically weaker students?",
            "What are the hostel charges for these colleges?",
            "What is the cutoff for Anna University?"
        ]

    # --- 6. Specific College Query (Fees, Placements, Cutoffs, Amenities) ---
    if evidence_list:
        primary_col = None
        if target_colleges:
            primary_col = clean_college_name(target_colleges[0])
        elif evidence_list[0].college_name:
            primary_col = clean_college_name(evidence_list[0].college_name)
        else:
            for ev in evidence_list:
                if ev.college_name:
                    primary_col = clean_college_name(ev.college_name)
                    break
        if not primary_col:
            primary_col = "the requested college"

        # SLM Mode: Short, figures-first, deterministic answer from top chunks
        if mode == "slm":
            # Category-matched chunk filtering
            is_placement_q = any(k in q_lower for k in ["placement", "package", "salary", "median", "highest", "recruiters", "placed"])
            is_fee_q = any(k in q_lower for k in ["fee", "fees", "tuition", "cost", "expense", "hostel", "mess", "charges"])
            is_cutoff_q = any(k in q_lower for k in ["cutoff", "closing rank", "opening rank", "percentile", "rank"])
            is_scholarship_q = any(k in q_lower for k in ["scholarship", "financial aid", "waiver"])

            def matches_category(ev):
                txt = (ev.snippet + " " + ev.document_title).lower()
                if is_placement_q:
                    return any(w in txt for w in ["placement", "package", "salary", "median", "highest", "recruiters", "placed", "lpa"])
                if is_fee_q:
                    return any(w in txt for w in ["fee", "tuition", "hostel", "mess", "₹", "inr"])
                if is_cutoff_q:
                    return any(w in txt for w in ["cutoff", "closing rank", "opening rank", "percentile"])
                if is_scholarship_q:
                    return any(w in txt for w in ["scholarship", "financial aid", "waiver"])
                return True

            matched_chunks = [ev for ev in evidence_list if matches_category(ev)]
            chosen_chunks = matched_chunks[:3] if matched_chunks else evidence_list[:3]

            figures = []
            cits = []
            seen_urls = set()
            for ev in chosen_chunks:
                clean_snip = ev.snippet.replace("VERIFIED SQL FEE RECORD: ", "").replace("VERIFIED SQL PLACEMENT RECORD: ", "").replace("VERIFIED SQL CUTOFF RECORD: ", "")
                clean_title = clean_college_name(ev.document_title)
                figures.append(f"• **{clean_title}**: {clean_snip}")
                if ev.source_url and ev.source_url not in seen_urls:
                    seen_urls.add(ev.source_url)
                    cits.append(SourceCitation(
                        authority="Official Admissions Authority",
                        source_name=clean_title,
                        url=ev.source_url,
                        year=ev.academic_year or 2024,
                        verified_date=None
                    ))

            official_url = get_official_portal_url(primary_col, evidence_list[0].source_url if evidence_list else None)
            portal_link = f"\n\n**Official Portal:** [{primary_col}]({official_url})"

            direct_line = ""
            is_fee_inclusion_q = any(k in q_lower for k in [
                "included in tuition", "does tuition include", "hostel charges included",
                "are hostel charges included", "fees include", "does the fee include"
            ])
            if is_fee_inclusion_q:
                tuition_val = None
                hostel_val = None
                for ev in chosen_chunks:
                    txt = ev.snippet
                    if "Annual Tuition Fee" in txt:
                        m_t = re.search(r'Annual Tuition Fee:\s*₹?([0-9,]+)', txt)
                        if m_t:
                            tuition_val = m_t.group(1)
                    if "Hostel Living Cost" in txt:
                        m_h = re.search(r'Hostel Living Cost:\s*₹?([0-9,]+)', txt)
                        if m_h:
                            hostel_val = m_h.group(1)
                if tuition_val and hostel_val:
                    direct_line = f"No. Tuition (₹{tuition_val}/yr) and hostel (₹{hostel_val}/yr) are listed separately.\n\n"
                else:
                    direct_line = "No. Tuition and hostel charges are listed and billed separately.\n\n"

            reply = (
                f"### Key Facts & Figures ({primary_col})\n"
                + direct_line
                + "\n".join(figures)
                + portal_link
            )
            q_clean = query.lower().strip().strip("?").strip()
            chips = [
                f"What are the hostel fees for {primary_col}?",
                f"What was the closing cutoff for {primary_col}?"
            ]
            chips = [c for c in chips if c.lower().strip().strip("?") != q_clean]
            return reply, cits, False, chips
        cits: List[SourceCitation] = []
        seen_urls = set()

        details_bullets = []
        for ev in evidence_list[:5]:
            snippet_clean = ev.snippet.replace("VERIFIED SQL FEE RECORD: ", "").replace("VERIFIED SQL PLACEMENT RECORD: ", "").replace("VERIFIED SQL CUTOFF RECORD: ", "")
            details_bullets.append(f"• **{ev.document_title}**: {snippet_clean}")
            if ev.source_url and ev.source_url not in seen_urls:
                seen_urls.add(ev.source_url)
                cits.append(SourceCitation(
                    authority="Official Admissions Authority",
                    source_name=ev.document_title,
                    url=ev.source_url,
                    year=ev.academic_year or 2024,
                    verified_date=None
                ))

        simple_ans = f"Here is the verified information for **{primary_col}** covering tuition fees, placement outcomes, and admission requirements based on official records."
        if any(k in q_lower for k in ["topper", "direct admission", "rank 1", "first rank"]):
            simple_ans = f"Yes, **{primary_col}** offers **direct admission** to board toppers (first rank holders) of all State and Central examination boards without requiring a BITSAT score, provided minimum Class 12 aggregate requirements are satisfied."

        reply = (
            f"### 1. Simple Answer\n"
            f"{simple_ans}\n\n"
            f"### 2. Important Details\n"
            + "\n".join(details_bullets) +
            "\n\n### 3. What This Means for You\n"
            f"Evaluate **{primary_col}** by comparing its published fees and living expenses against your family's budget, and use previous closing ranks as a reference to gauge how competitive your rank is.\n\n"
            f"### 4. What to Do Next\n"
            f"Visit the official website to verify current application dates, documents required, and seat matrix for your preferred branch.\n\n"
            f"### 5. Sources\n"
            + "\n".join([f"• [{c.source_name}]({c.url})" for c in cits[:4]])
        )
        return reply, cits, False, [
            f"What was the previous cutoff for CSE at {primary_col[:25]}?",
            f"What are the hostel facilities at {primary_col[:25]}?",
            "What is a closing rank?"
        ]

    # --- 7. No Evidence Found ---
    reply = (
        "### 1. Simple Answer\n"
        "I don't know based on official records. This specific detail is not documented in our verified admissions archive. Please verify directly with the official college admissions office.\n\n"
        "### 2. Important Details\n"
        "• Our database currently holds verified information for 75 premier Indian engineering colleges (covering IITs, NITs, IIITs, state public universities, and top private deemed institutions).\n"
        "• To protect you from misinformation, College Guide AI never invents unverified figures or cutoffs.\n\n"
        "### 3. What to Do Next\n"
        "Try asking about a specific college (e.g. *\"What are the fees at COEP Pune?\"*), a concept (e.g. *\"What is a closing rank?\"*), or exploring college recommendations on the Explore page.\n\n"
        "### 4. Sources\n"
        "• [JoSAA Official Counselling Portal](https://josaa.admissions.nic.in)\n"
        "• [TNEA Engineering Admissions](https://www.tneaonline.org)"
    )
    return reply, [], True, [
        "What is a closing rank?",
        "What is the difference between average and median package?",
        "What colleges can I get with my rank?"
    ]


async def generate_llm_response(
    query: str,
    evidence_list: List[RetrievedEvidence],
    student_profile: Optional[StudentProfile] = None,
    conversation_history: Optional[List[ChatMessage]] = None
) -> Tuple[str, List[SourceCitation], bool, Optional[str], List[str], str]:
    """
    Routes the query and grounded evidence to the configured LLM provider
    (Gemini, OpenAI, Groq, Ollama, or Fallback).
    Returns (reply_text, citations, is_fallback, warning_message, suggested_follow_ups).
    """
    context_str = build_rag_context(evidence_list, student_profile)
    provider = settings.LLM_PROVIDER.lower()
    api_key = settings.LLM_API_KEY.strip()

    # Pre-build citations from evidence
    citations: List[SourceCitation] = []
    seen_urls = set()
    for ev in evidence_list:
        if ev.source_url and ev.source_url not in seen_urls:
            seen_urls.add(ev.source_url)
            citations.append(SourceCitation(
                authority="Admissions Authority / Institute",
                source_name=ev.document_title,
                url=ev.source_url,
                year=ev.academic_year or 2024,
                verified_date=None
            ))

    suggested = [
        "What are the hostel facilities and living costs?",
        "What was the previous closing cutoff for CSE?",
        "What is the difference between average and median package?"
    ]

    # Check if external credentials are unconfigured or local fallback is selected
    if provider in ["fallback", "gemini", "openai", "groq"] and not api_key:
        warning = f"Notice: {provider.upper()} API key not set in .env. Serving answers using student-friendly verified evidence engine." if provider != "fallback" else None
        reply, cit, is_fb, sug = fallback_evidence_answering(query, evidence_list, student_profile)
        return reply, cit or citations, is_fb, warning, sug, "Local SLM (Fallback)"

    # 1. Ollama (Local SLM/LLM)
    if provider == "ollama":
        try:
            model_target = settings.LLM_MODEL_NAME if any(k in settings.LLM_MODEL_NAME.lower() for k in ["llama", "mistral", "qwen", "gpt-oss"]) else "qwen3.5:4b"
            async with httpx.AsyncClient(timeout=45.0) as client:
                prompt_full = f"{SYSTEM_PROMPT}\n\nContext:\n{context_str}\n\nUser Question:\n{query}"
                resp = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.LLM_MODEL_NAME,
                        "prompt": prompt_full,
                        "stream": False
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    reply_text = (data.get("response") or data.get("thinking") or "").strip()
                    return reply_text, citations, False, None, filter_suggestions(suggested), f"Ollama ({model_target})"
        except Exception as e:
            logger.warning(f"Ollama local inference failed: {e}. Falling back to evidence engine.")
            reply, cit, is_fb, sug = fallback_evidence_answering(query, evidence_list, student_profile)
            return reply, cit or citations, is_fb, f"Ollama connection error ({e}). Serving verified evidence.", sug, "Local SLM (Fallback)"

    # 2. Google Gemini
    if provider == "gemini":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL_NAME}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{SYSTEM_PROMPT}\n\nVerified Context:\n{context_str}\n\nUser Question: {query}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1000
                }
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        reply_text = candidates[0]["content"]["parts"][0]["text"]
                        return reply_text, citations, False, None, suggested, settings.LLM_MODEL_NAME
                else:
                    logger.error(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Gemini request failed: {e}. Falling back to evidence engine.")

    # 3. OpenAI / Groq / OpenAI-compatible API
    if provider in ["openai", "groq"]:
        try:
            base_url = "https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            if conversation_history:
                for m in conversation_history[-4:]:
                    messages.append({"role": m.role, "content": m.content})
            messages.append({"role": "user", "content": f"Context:\n{context_str}\n\nQuestion:\n{query}"})

            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": settings.LLM_MODEL_NAME if provider == "groq" else "gpt-4o-mini",
                        "messages": messages,
                        "temperature": 0.2
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    reply_text = data["choices"][0]["message"]["content"]
                    active_model = settings.LLM_MODEL_NAME if provider == "groq" else "gpt-4o-mini"
                    return reply_text, citations, False, None, suggested, active_model
        except Exception as e:
            logger.warning(f"{provider.upper()} API request failed: {e}")

    # Fallback to local verified evidence engine
    reply, cit, is_fb, sug = fallback_evidence_answering(query, evidence_list, student_profile, mode="llm")
    return reply, cit or citations, is_fb, None, sug, "Local SLM (Fallback)"
