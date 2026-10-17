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
    valid_exams = ["TNEA", "JEE_MAIN", "JEE_ADVANCED", "VITEEE"]
    if exam not in valid_exams:
        return False, f"Unsupported entrance exam '{profile.entrance_exam}'. Supported exams: {', '.join(valid_exams)}."
    
    # TNEA uses normalized cutoff out of 200 (usually 77.5 - 200.0)
    if exam == "TNEA":
        if profile.rank_or_score < 40 or profile.rank_or_score > 200:
            return False, "For TNEA, cutoff score must be between 40.0 and 200.0."
            
    # JEE Main and Advanced use All India Ranks (ranks are positive integers)
    if exam in ["JEE_MAIN", "JEE_ADVANCED", "VITEEE"]:
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
    Determines admission suitability: 'Ambitious', 'Better-matched', 'Alternative', or 'Insufficient data'.
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
    
    if exam == "TNEA":
        # Higher score is better in TNEA (out of 200)
        diff = user_score_or_rank - cutoff_val
        if diff >= 1.5:
            return (
                "Alternative",
                f"Your cutoff mark ({user_score_or_rank:.2f}) is solidly above the {latest.admission_year} closing cutoff ({cutoff_val:.2f}) by {diff:.2f} marks, making this a comfortable option based on historical trends.",
                cutoff_dict,
                95.0
            )
        elif -0.5 <= diff < 1.5:
            return (
                "Better-matched",
                f"Your cutoff mark ({user_score_or_rank:.2f}) closely aligns with the {latest.admission_year} closing cutoff ({cutoff_val:.2f}) with a difference of {diff:+.2f} marks.",
                cutoff_dict,
                80.0
            )
        elif -2.5 <= diff < -0.5:
            return (
                "Ambitious",
                f"Your cutoff mark ({user_score_or_rank:.2f}) is slightly below the {latest.admission_year} closing cutoff ({cutoff_val:.2f}) by {abs(diff):.2f} marks. Highly competitive but possible across rounds.",
                cutoff_dict,
                60.0
            )
        else:
            return (
                "Ambitious",
                f"Your cutoff mark ({user_score_or_rank:.2f}) is noticeably below the {latest.admission_year} closing cutoff ({cutoff_val:.2f}). Considered a high reach based on past trends.",
                cutoff_dict,
                30.0
            )
    else:
        # In JEE/Rank systems, lower rank number is better
        ratio = user_score_or_rank / max(cutoff_val, 1.0)
        if ratio <= 0.80:
            return (
                "Alternative",
                f"Your rank ({int(user_score_or_rank)}) is comfortably ahead of the {latest.admission_year} closing rank ({int(cutoff_val)}), providing a strong historical admission probability.",
                cutoff_dict,
                95.0
            )
        elif 0.80 < ratio <= 1.15:
            return (
                "Better-matched",
                f"Your rank ({int(user_score_or_rank)}) closely aligns with the {latest.admission_year} closing rank ({int(cutoff_val)}).",
                cutoff_dict,
                82.0
            )
        elif 1.15 < ratio <= 1.45:
            return (
                "Ambitious",
                f"Your rank ({int(user_score_or_rank)}) is moderately higher than the {latest.admission_year} closing rank ({int(cutoff_val)}). Competitive across spot/special rounds.",
                cutoff_dict,
                55.0
            )
        else:
            return (
                "Ambitious",
                f"Your rank ({int(user_score_or_rank)}) is significantly higher than the {latest.admission_year} closing rank ({int(cutoff_val)}).",
                cutoff_dict,
                25.0
            )


def recommend_colleges(db: Session, profile: StudentProfile) -> RecommendationResponse:
    """
    Main recommendation engine applying multi-step validation, hard filtering,
    suitability classification, and multi-criteria normalized ranking.
    """
    # Step 1: Validate profile
    is_valid, err_msg = validate_student_profile(profile)
    if not is_valid:
        return RecommendationResponse(
            success=False,
            total_found=0,
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

    # Collect recommendations
    ambitious_list: List[CollegeRecommendationItem] = []
    better_matched_list: List[CollegeRecommendationItem] = []
    alternative_list: List[CollegeRecommendationItem] = []
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
        # Query fee details
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
                # Exceeds tuition budget constraint
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
            # Fallback to Open / General category if specific category data is absent
            cat_cutoffs = cutoffs_query.filter(AdmissionCutoff.category.in_(["OC", "GEN", "General"])).all()
            if cat_cutoffs and profile.category.upper() not in ["OC", "GEN"]:
                missing_info.append(f"Category '{profile.category}' cutoff not verified separately; evaluated using General/OC cutoff.")

        # If quota is given (e.g. Home State vs Other State)
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

        # --- Step 4: Multi-Criteria Normalized Scoring ---
        # 1. Suitability Score (0-100) -> suitability_score
        
        # 2. Affordability Score (0-100)
        if annual_tuition is not None:
            # Lower fees get higher score; scale: 30k -> 100, 300k -> 40
            affordability_score = max(20.0, min(100.0, 100.0 - (annual_tuition / 4000.0)))
            if annual_tuition < 100000:
                pros.append(f"Affordable tuition fee of ₹{annual_tuition:,.0f}/year.")
            else:
                cons.append(f"Higher annual tuition fee of ₹{annual_tuition:,.0f}/year.")
        else:
            affordability_score = 50.0  # Neutral when missing

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
            matched_course=course.course_code,
            course_name=course.course_name,
            annual_tuition_fee=annual_tuition,
            hostel_fee_annual=hostel_fee,
            total_annual_cost=total_cost,
            fee_verified=(annual_tuition is not None),
            admission_suitability=suitability,
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
            pros=pros,
            cons=cons,
            missing_information=missing_info,
            sources=source_citations,
            data_freshness_year=college.data_freshness_year,
            verification_status=college.verification_status
        )

        # Group by suitability
        if suitability == "Ambitious":
            ambitious_list.append(item)
        elif suitability == "Better-matched":
            better_matched_list.append(item)
        elif suitability == "Alternative":
            alternative_list.append(item)
        else:
            insufficient_data_list.append(item)

    # Sort each list by match score descending
    ambitious_list.sort(key=lambda x: x.match_score, reverse=True)
    better_matched_list.sort(key=lambda x: x.match_score, reverse=True)
    alternative_list.sort(key=lambda x: x.match_score, reverse=True)
    insufficient_data_list.sort(key=lambda x: x.match_score, reverse=True)

    total_found = len(ambitious_list) + len(better_matched_list) + len(alternative_list) + len(insufficient_data_list)

    relaxations = []
    if total_found == 0:
        relaxations.append("Consider relaxing your tuition or total budget cap.")
        relaxations.append("Consider widening your preferred city or location preference.")
        relaxations.append("Note: Mandatory Class 12 PCM eligibility criteria cannot be relaxed.")

    return RecommendationResponse(
        success=True,
        total_found=total_found,
        ambitious=ambitious_list,
        better_matched=better_matched_list,
        alternative=alternative_list,
        insufficient_data=insufficient_data_list,
        relaxations_suggested=relaxations if total_found == 0 else None,
        message=f"Found {total_found} verified college options matching your criteria."
    )
