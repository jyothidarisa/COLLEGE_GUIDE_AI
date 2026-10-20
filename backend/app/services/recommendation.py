import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models import College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic, Source
from app.schemas import (
    StudentProfile, CollegeRecommendationItem, RecommendationResponse, SourceCitation
)

logger = logging.getLogger(__name__)

# Default scoring weights (sum to 1.0)
DEFAULT_WEIGHTS = {
    "suitability": 0.35,
    "affordability": 0.20,
    "placement": 0.25,
    "location": 0.10,
    "accreditation": 0.10
}

def validate_student_profile(profile: StudentProfile) -> Tuple[bool, Optional[str]]:
    """
    Validates profile fields according to the chosen entrance exam route.
    """
    exam = profile.entrance_exam.upper()
    valid_exams = [
        "TNEA", "JEE_MAIN", "JEE_ADVANCED", "BITSAT", "VITEEE",
        "MHT_CET", "WBJEE", "AP_EAPCET", "TS_EAMCET", "SRMJEEE", "COMEDK"
    ]
    if exam not in valid_exams:
        return False, f"Unsupported entrance exam '{profile.entrance_exam}'. Supported exams: {', '.join(valid_exams)}."
    
    # TNEA uses normalized cutoff out of 200 (usually 40.0 - 200.0)
    if exam == "TNEA":
        if profile.rank_or_score < 40 or profile.rank_or_score > 200:
            return False, "For TNEA, cutoff score must be between 40.0 and 200.0."
            
    # BITSAT score is out of 390
    if exam == "BITSAT":
        if profile.rank_or_score < 40 or profile.rank_or_score > 390:
            return False, "For BITSAT, score must be between 40 and 390."

    # MHT-CET score is either percentile (0-100) or state rank (>= 1)
    if exam == "MHT_CET":
        if profile.rank_or_score < 0:
            return False, "For MHT-CET, percentile or rank must be non-negative."

    # Rank-based exams use positive integer ranks >= 1
    if exam in ["JEE_MAIN", "JEE_ADVANCED", "VITEEE", "WBJEE", "AP_EAPCET", "TS_EAMCET", "SRMJEEE", "COMEDK"]:
        if profile.rank_or_score < 1:
            return False, f"For {exam}, rank must be a positive integer >= 1."
            
    if profile.pcm_percentage is not None and (profile.pcm_percentage < 0 or profile.pcm_percentage > 100):
        return False, "Class 12 PCM percentage must be between 0 and 100."
        
    return True, None


def evaluate_admission_suitability(
    exam_route: str,
    user_score_or_rank: float,
    cutoff_records: List[AdmissionCutoff]
) -> Tuple[str, str, Optional[Dict[str, Any]], float]:
    """
    Determines admission suitability: 'Target', 'Reach', 'Safer', or 'Insufficient data'.
    Returns (suitability_category, reason, latest_cutoff_dict, suitability_score_0_to_100).
    """
    if not cutoff_records:
        return (
            "Insufficient data",
            "Insufficient historical cutoff records to estimate admission suitability reliably.",
            None,
            40.0
        )
    
    # Sort cutoff records by admission_year descending
    sorted_cutoffs = sorted(cutoff_records, key=lambda c: c.admission_year, reverse=True)
    latest = sorted_cutoffs[0]
    cutoff_val = latest.closing_value
    
    cutoff_dict = {
        "year": latest.admission_year,
        "round": latest.round_number,
        "category": latest.category,
        "quota": latest.quota,
        "closing_value": cutoff_val,
        "type": latest.score_or_rank_type,
        "source_url": latest.source_url
    }
    
    exam = exam_route.upper()
    
    if exam in ["TNEA", "BITSAT"] or (exam == "MHT_CET" and user_score_or_rank <= 100.0):
        # Higher score/percentile is better in TNEA (out of 200), BITSAT (out of 390), and MHT-CET (percentile)
        diff = user_score_or_rank - cutoff_val
        alt_threshold = 8.0 if exam == "BITSAT" else 1.5
        bm_min = -12.0 if exam == "BITSAT" else -0.5
        bm_max = 8.0 if exam == "BITSAT" else 1.5
        amb_min = -25.0 if exam == "BITSAT" else -2.5

        if diff >= alt_threshold:
            return (
                "Safer",
                f"Your score ({user_score_or_rank:.2f}) is solidly above the {latest.admission_year} closing cutoff ({cutoff_val:.2f}) by {diff:.2f} marks, making this a comfortable option based on historical trends.",
                cutoff_dict,
                95.0
            )
        elif bm_min <= diff < bm_max:
            return (
                "Target",
                f"Your score ({user_score_or_rank:.2f}) closely aligns with the {latest.admission_year} closing cutoff ({cutoff_val:.2f}) with a difference of {diff:+.2f} marks.",
                cutoff_dict,
                82.0
            )
        elif amb_min <= diff < bm_min:
            return (
                "Reach",
                f"Your score ({user_score_or_rank:.2f}) is slightly below the {latest.admission_year} closing cutoff ({cutoff_val:.2f}) by {abs(diff):.2f} marks. Highly competitive but possible across rounds.",
                cutoff_dict,
                60.0
            )
        else:
            return (
                "Reach",
                f"Your score ({user_score_or_rank:.2f}) is noticeably below the {latest.admission_year} closing cutoff ({cutoff_val:.2f}). Considered an ambitious reach based on past trends.",
                cutoff_dict,
                30.0
            )
    else:
        # In JEE/VITEEE rank systems, lower rank number is better
        ratio = user_score_or_rank / max(cutoff_val, 1.0)
        if ratio <= 0.80:
            return (
                "Safer",
                f"Your rank ({int(user_score_or_rank)}) is comfortably ahead of the {latest.admission_year} closing rank ({int(cutoff_val)}), providing a strong historical admission probability.",
                cutoff_dict,
                95.0
            )
        elif 0.80 < ratio <= 1.15:
            return (
                "Target",
                f"Your rank ({int(user_score_or_rank)}) closely aligns with the {latest.admission_year} closing rank ({int(cutoff_val)}).",
                cutoff_dict,
                82.0
            )
        elif 1.15 < ratio <= 1.45:
            return (
                "Reach",
                f"Your rank ({int(user_score_or_rank)}) is moderately higher than the {latest.admission_year} closing rank ({int(cutoff_val)}). Competitive across spot/special rounds.",
                cutoff_dict,
                55.0
            )
        else:
            return (
                "Reach",
                f"Your rank ({int(user_score_or_rank)}) is significantly higher than the {latest.admission_year} closing rank ({int(cutoff_val)}).",
                cutoff_dict,
                25.0
            )


def get_intelligent_alternatives(
    db: Session,
    profile: StudentProfile,
    recommended_college_ids: set
) -> List[CollegeRecommendationItem]:
    """
    Suggests high-value private and autonomous alternatives (e.g. BITS Pilani, VIT Vellore, IIIT Hyderabad)
    for high-performing candidates exploring premier institutes (JEE Advanced, JEE Main, or high TNEA).
    Explains distinct advantages and explicitly alerts on specific entrance pathways (BITSAT, VITEEE).
    """
    alternatives: List[CollegeRecommendationItem] = []
    exam = profile.entrance_exam.upper()
    course_code = profile.preferred_course.upper()

    # Trigger condition: Strong academic credentials
    # 1. JEE Advanced candidate (eligible for IIT competition)
    # 2. JEE Main rank <= 40,000
    # 3. TNEA cutoff >= 194.0
    is_strong_student = (
        (exam == "JEE_ADVANCED") or
        (exam == "JEE_MAIN" and profile.rank_or_score <= 40000) or
        (exam == "TNEA" and profile.rank_or_score >= 194.0)
    )

    if not is_strong_student:
        return []

    # Target private / deemed institutions with distinct advantages
    candidate_codes = ["BITS-P", "VIT-001", "IIITH"]

    for code in candidate_codes:
        col = db.query(College).filter(College.code == code).first()
        if not col or col.id in recommended_college_ids:
            continue

        # Check course match
        course = db.query(Course).filter(
            Course.college_id == col.id,
            Course.course_code == course_code
        ).first()

        # If exact branch not matched, fallback to flagship branch (e.g. CSE or ECE)
        if not course:
            course = db.query(Course).filter(
                Course.college_id == col.id,
                Course.course_code.in_(["CSE", "ECE", "IT"])
            ).first()

        if not course:
            continue

        # Check hard PCM eligibility if given
        if profile.pcm_percentage is not None and course.minimum_pcm_percentage is not None:
            if profile.pcm_percentage < course.minimum_pcm_percentage:
                continue

        fee_rec = db.query(FeeDetail).filter(FeeDetail.college_id == col.id).order_by(FeeDetail.academic_year.desc()).first()
        placement_rec = db.query(PlacementStatistic).filter(PlacementStatistic.college_id == col.id).order_by(PlacementStatistic.reporting_year.desc()).first()

        pros: List[str] = []
        cons: List[str] = []
        alt_reason = ""
        admission_warning = ""

        if code == "BITS-P":
            alt_reason = (
                "Academic Parity with Premier IITs: BITS Pilani offers comparable academic prestige, world-class faculty, "
                "and an impressive ₹18.0 LPA median placement CTC. Institutional hallmarks include a strict zero-mandatory-attendance policy, "
                "a 7-month Practice School (PS-II) corporate internship program generating extensive pre-placement offers (PPOs), "
                "and high-value Merit-cum-Need scholarships (covering up to 100% tuition for family incomes under ₹12 LPA)."
            )
            admission_warning = (
                "⚠️ Mandatory Admission Pathway: BITS Pilani does NOT accept JEE Advanced or JEE Main ranks. "
                "Admission is conducted solely via the BITSAT examination (out of 390 marks). Academic competitiveness indicates strong potential, "
                "but you must apply and qualify through BITSAT separately."
            )
            pros.append("Placement outcomes matching top-5 IITs (₹18.0 LPA median CTC).")
            pros.append("Complete academic flexibility with zero mandatory attendance.")
            pros.append("7-month paid industrial internship (Practice School II).")
            cons.append("Requires taking a separate entrance exam (BITSAT).")
            if fee_rec and fee_rec.annual_tuition_fee > 300000:
                cons.append(f"Higher annual tuition fee of ₹{fee_rec.annual_tuition_fee:,.0f} (MCN scholarships available).")

        elif code == "VIT-001":
            alt_reason = (
                "Massive Industry Network & Flexible Curriculum: VIT Vellore provides a Fully Flexible Credit System (FFCS), "
                "world-class research facilities, and a recruitment drive with 900+ national and global firms (median CTC ₹9.0 LPA, "
                "highest package ₹1.02 Cr). Merit scholarships (GVSDP) offer up to 100% fee waivers for top board/exam rankers."
            )
            admission_warning = (
                "⚠️ Admission Pathway: VIT admits strictly through the VITEEE entrance examination. "
                "Direct admission via JoSAA or state counselling is not offered."
            )
            pros.append("Over 900 recruiters with 87%+ placement track record.")
            pros.append("Fully Flexible Credit System (FFCS) allowing custom course pacing.")
            pros.append("State-of-the-art residential and research amenities.")
            cons.append("Requires registering and appearing for VITEEE.")

        elif code == "IIITH":
            alt_reason = (
                "India's Premier CS & AI Research Institution: Renowned for having the highest computer science placement packages "
                "in the country (median CTC ₹30.0 LPA) and world-renowned research centers in NLP, Computer Vision, and Robotics."
            )
            admission_warning = (
                "⚠️ Separate Portal Application: While IIIT Hyderabad uses JEE Main All India CRL, admissions are NOT through JoSAA. "
                "You must register separately on the IIIT-H undergraduate admissions portal."
            )
            pros.append("Stellar ₹30.0 LPA median package (highest among Indian engineering colleges).")
            pros.append("Unrivaled research culture in Computer Science and Artificial Intelligence.")
            cons.append("Requires separate direct portal application outside JoSAA.")

        # Match score for alternative
        match_score = 88.0
        if placement_rec and placement_rec.median_package_lpa:
            match_score = min(96.0, round(70.0 + (placement_rec.median_package_lpa * 0.8), 1))

        sources = db.query(Source).filter(Source.college_id == col.id).all()
        source_cits = [
            SourceCitation(
                authority=s.authority_name,
                source_name=s.source_name,
                url=s.url,
                year=s.academic_year,
                verified_date=s.last_verified_date
            )
            for s in sources
        ]

        item = CollegeRecommendationItem(
            college_id=col.id,
            code=col.code,
            name=col.name,
            college_type=col.college_type,
            state=col.state,
            city=col.city,
            nirf_rank=col.nirf_rank,
            accreditation=col.accreditation,
            hostel_available=col.hostel_available,
            image_url=col.image_url,
            image_source=col.image_source,
            matched_course=course.course_code,
            course_name=course.course_name,
            annual_tuition_fee=fee_rec.annual_tuition_fee if fee_rec else None,
            hostel_fee_annual=fee_rec.hostel_fee_annual if fee_rec else None,
            total_annual_cost=fee_rec.total_annual_estimate if fee_rec else None,
            fee_verified=fee_rec is not None,
            admission_suitability="Intelligent Alternative",
            suitability_explanation=f"{alt_reason}\n\n{admission_warning}",
            historical_cutoff=None,
            placement_statistics={
                "reporting_year": placement_rec.reporting_year,
                "placement_percentage": placement_rec.placement_percentage,
                "median_package_lpa": placement_rec.median_package_lpa,
                "highest_package_lpa": placement_rec.highest_package_lpa,
                "top_recruiters": placement_rec.top_recruiters,
                "source_report_url": placement_rec.source_report_url
            } if placement_rec else None,
            match_score=match_score,
            score_breakdown={
                "suitability": 85.0,
                "affordability": 60.0,
                "placement": 95.0,
                "location": 80.0,
                "nirf": 85.0
            },
            is_intelligent_alternative=True,
            alternative_reason=alt_reason,
            admission_route_warning=admission_warning,
            pros=pros,
            cons=cons,
            missing_information=[],
            sources=source_cits,
            data_freshness_year=col.data_freshness_year,
            verification_status=col.verification_status
        )
        alternatives.append(item)

    alternatives.sort(key=lambda x: x.match_score, reverse=True)
    return alternatives


def recommend_colleges(db: Session, profile: StudentProfile) -> RecommendationResponse:
    """
    Main recommendation engine applying multi-step validation, hard filtering,
    suitability classification, and multi-criteria normalized ranking.
    Selects one highlighted Best-Match College and organizes secondary colleges into
    Reach, Target, and Safer Options. Proactively generates Intelligent Alternatives.
    """
    # Step 1: Validate profile
    is_valid, err_msg = validate_student_profile(profile)
    if not is_valid:
        return RecommendationResponse(
            success=False,
            total_found=0,
            best_match=None,
            intelligent_alternatives=[],
            reach=[],
            target=[],
            safer=[],
            ambitious=[],
            better_matched=[],
            alternative=[],
            insufficient_data=[],
            message=err_msg or "Invalid profile inputs."
        )

    # Step 2: Query candidate colleges offering the preferred course for the exam route
    target_exam = profile.entrance_exam.upper()
    target_course_code = profile.preferred_course.upper()

    # Query matching courses
    courses_query = db.query(Course).filter(
        Course.course_code == target_course_code,
        Course.primary_exam == target_exam
    )
    matching_courses = courses_query.all()

    if not matching_courses:
        # Check if the exam is accepted by ANY college for another course or vice versa
        return RecommendationResponse(
            success=True,
            total_found=0,
            best_match=None,
            intelligent_alternatives=[],
            reach=[],
            target=[],
            safer=[],
            ambitious=[],
            better_matched=[],
            alternative=[],
            insufficient_data=[],
            relaxations_suggested=[
                f"No verified colleges found accepting {target_exam} specifically for course '{target_course_code}'.",
                "Try checking related specializations (e.g. IT, ECE, AI_DS) or verify the examination route."
            ],
            message="No matching colleges found for the chosen course and entrance examination."
        )

    matched_college_ids = {c.college_id: c for c in matching_courses}
    colleges = db.query(College).filter(College.id.in_(list(matched_college_ids.keys()))).all()

    reach_list: List[CollegeRecommendationItem] = []
    target_list: List[CollegeRecommendationItem] = []
    safer_list: List[CollegeRecommendationItem] = []
    insufficient_data_list: List[CollegeRecommendationItem] = []

    weights = profile.weights or DEFAULT_WEIGHTS

    for college in colleges:
        course = matched_college_ids[college.id]
        pros: List[str] = []
        cons: List[str] = []
        missing_info: List[str] = []

        # --- Hard Constraint Checks ---
        # 1. Eligibility Check (PCM % in Class 12)
        if profile.pcm_percentage is not None and course.minimum_pcm_percentage is not None:
            if profile.pcm_percentage < course.minimum_pcm_percentage:
                # Disqualified by hard eligibility
                continue

        # 2. Hostel Requirement
        if profile.hostel_required and not college.hostel_available:
            continue

        # 3. College Type filter
        if profile.preferred_college_type and profile.preferred_college_type != "All":
            if profile.preferred_college_type.lower() not in college.college_type.lower():
                continue

        # 4. Budget Constraint Check
        fee_record = db.query(FeeDetail).filter(
            FeeDetail.college_id == college.id
        ).order_by(FeeDetail.academic_year.desc()).first()

        annual_tuition = fee_record.annual_tuition_fee if fee_record else None
        hostel_fee = fee_record.hostel_fee_annual if fee_record else None
        total_cost = fee_record.total_annual_estimate if fee_record else None

        if annual_tuition is None:
            missing_info.append("Official tuition fee schedule is pending verification.")
        else:
            if profile.max_tuition_budget is not None and annual_tuition > profile.max_tuition_budget:
                continue

        if profile.max_total_budget is not None and total_cost is not None:
            if total_cost > profile.max_total_budget:
                continue

        # 5. Fetch Cutoff Records for relevant route & category
        cutoffs_query = db.query(AdmissionCutoff).filter(
            AdmissionCutoff.college_id == college.id,
            AdmissionCutoff.course_id == course.id,
            AdmissionCutoff.exam_route == target_exam
        )
        
        # Filter by category if matched, otherwise fallback to general
        cat_cutoffs = cutoffs_query.filter(AdmissionCutoff.category == profile.category.upper()).all()
        if not cat_cutoffs:
            cat_cutoffs = cutoffs_query.filter(AdmissionCutoff.category.in_(["OC", "GEN", "General"])).all()
            if cat_cutoffs and profile.category.upper() not in ["OC", "GEN"]:
                missing_info.append(f"Category '{profile.category}' cutoff not verified separately; evaluated using General/OC cutoff.")

        if profile.quota and profile.quota != "General":
            quota_specific = [c for c in cat_cutoffs if c.quota.lower() == profile.quota.lower()]
            if quota_specific:
                cat_cutoffs = quota_specific

        # --- Step 3: Evaluate Suitability ---
        suitability, suitability_reason, cutoff_dict, suitability_score = evaluate_admission_suitability(
            target_exam,
            profile.rank_or_score,
            cat_cutoffs
        )

        # Normalize suitability label
        normalized_suitability = "Target"
        if suitability in ["Target", "Better-matched"]:
            normalized_suitability = "Target"
        elif suitability in ["Reach", "Ambitious"]:
            normalized_suitability = "Reach"
        elif suitability in ["Safer", "Alternative"]:
            normalized_suitability = "Safer"
        else:
            normalized_suitability = "Insufficient data"

        # --- Step 4: Multi-Criteria Normalized Scoring ---
        # 1. Suitability Score (0-100) -> suitability_score
        
        # 2. Affordability Score (0-100)
        if annual_tuition is not None:
            affordability_score = max(20.0, min(100.0, 100.0 - (annual_tuition / 4000.0)))
            if annual_tuition < 100000:
                pros.append(f"Affordable tuition fee of ₹{annual_tuition:,.0f}/year.")
            else:
                cons.append(f"Higher annual tuition fee of ₹{annual_tuition:,.0f}/year.")
        else:
            affordability_score = 50.0

        # 3. Placement & NIRF Score (0-100)
        placement_record = db.query(PlacementStatistic).filter(
            PlacementStatistic.college_id == college.id
        ).order_by(PlacementStatistic.reporting_year.desc()).first()

        placement_dict = None
        if placement_record:
            placement_dict = {
                "reporting_year": placement_record.reporting_year,
                "placement_percentage": placement_record.placement_percentage,
                "median_package_lpa": placement_record.median_package_lpa,
                "highest_package_lpa": placement_record.highest_package_lpa,
                "top_recruiters": placement_record.top_recruiters,
                "source_report_url": placement_record.source_report_url
            }
            median_ctc = placement_record.median_package_lpa or 6.0
            placement_score = min(100.0, (median_ctc / 20.0) * 100.0)
            if median_ctc >= 10.0:
                pros.append(f"Strong placement record with ₹{median_ctc:.1f} LPA median package.")
        else:
            placement_score = 50.0
            missing_info.append("Audited placement report for current year is pending verification.")

        # 4. Location Match Score (0-100)
        location_score = 70.0
        if profile.preferred_city:
            if profile.preferred_city.lower() in college.city.lower():
                location_score = 100.0
                pros.append(f"Located in your preferred city ({college.city}).")
            else:
                location_score = 40.0
                cons.append(f"Located in {college.city}, outside preferred city ({profile.preferred_city}).")

        # 5. Accreditation & NIRF Score (0-100)
        nirf = college.nirf_rank or 150
        nirf_score = max(30.0, 100.0 - (nirf * 0.45))
        if college.nirf_rank and college.nirf_rank <= 50:
            pros.append(f"Top-tier NIRF Engineering Rank #{college.nirf_rank}.")

        # Calculate final weighted match score
        final_match_score = (
            (suitability_score * weights.get("suitability", 0.35)) +
            (affordability_score * weights.get("affordability", 0.20)) +
            (placement_score * weights.get("placement", 0.25)) +
            (location_score * weights.get("location", 0.10)) +
            (nirf_score * weights.get("accreditation", 0.10))
        )
        final_match_score = round(final_match_score, 1)

        # Sources query
        college_sources = db.query(Source).filter(Source.college_id == college.id).all()
        source_citations = [
            SourceCitation(
                authority=s.authority_name,
                source_name=s.source_name,
                url=s.url,
                year=s.academic_year,
                verified_date=s.last_verified_date
            )
            for s in college_sources
        ]

        item = CollegeRecommendationItem(
            college_id=college.id,
            code=college.code,
            name=college.name,
            college_type=college.college_type,
            state=college.state,
            city=college.city,
            nirf_rank=college.nirf_rank,
            accreditation=college.accreditation,
            hostel_available=college.hostel_available,
            image_url=college.image_url,
            image_source=college.image_source,
            matched_course=course.course_code,
            course_name=course.course_name,
            annual_tuition_fee=annual_tuition,
            hostel_fee_annual=hostel_fee,
            total_annual_cost=total_cost,
            fee_verified=(annual_tuition is not None),
            admission_suitability=normalized_suitability,
            suitability_explanation=suitability_reason,
            historical_cutoff=cutoff_dict,
            placement_statistics=placement_dict,
            match_score=final_match_score,
            score_breakdown={
                "suitability": round(suitability_score, 1),
                "affordability": round(affordability_score, 1),
                "placement": round(placement_score, 1),
                "location": round(location_score, 1),
                "nirf": round(nirf_score, 1)
            },
            is_intelligent_alternative=False,
            alternative_reason=None,
            admission_route_warning=None,
            pros=pros,
            cons=cons,
            missing_information=missing_info,
            sources=source_citations,
            data_freshness_year=college.data_freshness_year,
            verification_status=college.verification_status
        )

        # Group by suitability category
        if normalized_suitability == "Reach":
            reach_list.append(item)
        elif normalized_suitability == "Target":
            target_list.append(item)
        elif normalized_suitability == "Safer":
            safer_list.append(item)
        else:
            insufficient_data_list.append(item)

    # Sort each list by match score descending
    reach_list.sort(key=lambda x: x.match_score, reverse=True)
    target_list.sort(key=lambda x: x.match_score, reverse=True)
    safer_list.sort(key=lambda x: x.match_score, reverse=True)
    insufficient_data_list.sort(key=lambda x: x.match_score, reverse=True)

    total_found = len(reach_list) + len(target_list) + len(safer_list) + len(insufficient_data_list)

    # Step 5: Select Single Best-Match Recommendation
    # Prioritizes balanced probability and high outcomes:
    # 1. Highest match score from Target (sweet spot of realistic qualification & fit)
    # 2. Or highest from Safer
    # 3. Or highest from Reach / Insufficient data
    best_match: Optional[CollegeRecommendationItem] = None
    if target_list:
        best_match = target_list[0]
    elif safer_list:
        best_match = safer_list[0]
    elif reach_list:
        best_match = reach_list[0]
    elif insufficient_data_list:
        best_match = insufficient_data_list[0]

    # Enhance Best Match explanation with deep personalized rationale
    if best_match:
        tuition_str = f"₹{best_match.annual_tuition_fee:,.0f}/year" if best_match.annual_tuition_fee else "Subsidized"
        median_str = f"₹{best_match.placement_statistics['median_package_lpa']} LPA" if (best_match.placement_statistics and best_match.placement_statistics.get('median_package_lpa')) else "High"
        best_match.suitability_explanation = (
            f"🏆 Primary Recommendation: {best_match.name} ({best_match.matched_course}) emerges as your #1 Best-Match College. "
            f"Rather than merely recommending the highest-ranked institution, our multi-criteria engine identifies this college "
            f"as the optimal balance of your {profile.entrance_exam} credentials ({profile.rank_or_score}), "
            f"realistic admission probability ({best_match.admission_suitability}), "
            f"financial suitability ({tuition_str} tuition), and verified career outcomes ({median_str} median CTC)."
        )

    # Step 6: Generate Intelligent Alternative Recommendations
    all_matched_col_ids = {c.college_id for c in (reach_list + target_list + safer_list + insufficient_data_list)}
    intelligent_alts = get_intelligent_alternatives(db, profile, all_matched_col_ids)

    relaxations = []
    if total_found == 0:
        # 1. Check if budget was the bottleneck
        if profile.max_tuition_budget is not None:
            col_ids = list(matched_college_ids.keys())
            lowest_fee_rec = db.query(FeeDetail, College).join(
                College, FeeDetail.college_id == College.id
            ).filter(FeeDetail.college_id.in_(col_ids)).order_by(FeeDetail.annual_tuition_fee.asc()).first()
            if lowest_fee_rec and lowest_fee_rec[0].annual_tuition_fee > profile.max_tuition_budget:
                relaxations.append(
                    f"Your annual tuition budget cap (₹{profile.max_tuition_budget:,.0f}) is below the minimum verified tuition "
                    f"for {target_course_code} (₹{lowest_fee_rec[0].annual_tuition_fee:,.0f}/yr at {lowest_fee_rec[1].name}). "
                    f"Consider raising your budget to ₹{lowest_fee_rec[0].annual_tuition_fee:,.0f} or above."
                )

        # 2. Check if PCM eligibility was the bottleneck
        if profile.pcm_percentage is not None:
            pcm_reqs = [c.minimum_pcm_percentage for c in matching_courses if c.minimum_pcm_percentage is not None]
            if pcm_reqs and all(profile.pcm_percentage < p for p in pcm_reqs):
                min_pcm = min(pcm_reqs)
                relaxations.append(
                    f"Your Class 12 PCM percentage ({profile.pcm_percentage}%) is below the minimum required eligibility "
                    f"threshold (minimum {min_pcm}% PCM required) for verified {target_course_code} programs."
                )

        # 3. Check if college type filter was the bottleneck
        if profile.preferred_college_type and profile.preferred_college_type != "All":
            relaxations.append(
                f"No institutions matching college type '{profile.preferred_college_type}' offer {target_course_code} under {target_exam}. "
                "Consider setting College Type to 'All' to review public and autonomous options."
            )

        if not relaxations:
            relaxations.append("Consider relaxing your tuition or total budget cap.")
            relaxations.append("Consider widening your preferred city or location preference.")
            relaxations.append("Note: Mandatory Class 12 PCM eligibility criteria cannot be relaxed.")

    return RecommendationResponse(
        success=True,
        total_found=total_found,
        best_match=best_match,
        intelligent_alternatives=intelligent_alts,
        reach=reach_list,
        target=target_list,
        safer=safer_list,
        ambitious=reach_list,
        better_matched=target_list,
        alternative=safer_list,
        insufficient_data=insufficient_data_list,
        relaxations_suggested=relaxations if total_found == 0 else None,
        message=f"Found {total_found} verified college options matching your criteria."
    )
