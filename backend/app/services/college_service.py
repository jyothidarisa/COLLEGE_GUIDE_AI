import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic, Scholarship, Source
from app.schemas import (
    CollegeDetailResponse, CourseDetail, CutoffRecord, FeeRecord, PlacementRecord,
    ScholarshipRecord, SourceCitation, CompareResponse, SourceItemResponse
)

logger = logging.getLogger(__name__)

def get_colleges_list(
    db: Session,
    query: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    college_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Fetches list of colleges with optional filters and summary metrics."""
    q = db.query(College)
    if query:
        search_pattern = f"%{query}%"
        q = q.filter((College.name.ilike(search_pattern)) | (College.code.ilike(search_pattern)) | (College.city.ilike(search_pattern)))
    if state and state != "All":
        q = q.filter(College.state.ilike(f"%{state}%"))
    if city and city != "All":
        q = q.filter(College.city.ilike(f"%{city}%"))
    if college_type and college_type != "All":
        q = q.filter(College.college_type.ilike(f"%{college_type}%"))
    
    colleges = q.order_by(College.nirf_rank.asc().nullslast(), College.name.asc()).all()
    results = []
    for c in colleges:
        # Get fee summary
        latest_fee = db.query(FeeDetail).filter(FeeDetail.college_id == c.id).order_by(FeeDetail.academic_year.desc()).first()
        latest_placement = db.query(PlacementStatistic).filter(PlacementStatistic.college_id == c.id).order_by(PlacementStatistic.reporting_year.desc()).first()
        course_count = db.query(Course).filter(Course.college_id == c.id).count()

        results.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "college_type": c.college_type,
            "state": c.state,
            "city": c.city,
            "nirf_rank": c.nirf_rank,
            "accreditation": c.accreditation,
            "official_website": c.official_website,
            "hostel_available": c.hostel_available,
            "data_freshness_year": c.data_freshness_year,
            "verification_status": c.verification_status,
            "annual_tuition_fee": latest_fee.annual_tuition_fee if latest_fee else None,
            "median_package_lpa": latest_placement.median_package_lpa if latest_placement else None,
            "course_count": course_count
        })
    return results


def get_college_detail(db: Session, college_id: int) -> Optional[CollegeDetailResponse]:
    """Retrieves full college profile with all verified relations."""
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        return None

    courses = [
        CourseDetail(
            id=c.id,
            course_code=c.course_code,
            degree=c.degree,
            course_name=c.course_name,
            duration_years=c.duration_years,
            total_seats=c.total_seats,
            eligibility_criteria=c.eligibility_criteria,
            minimum_pcm_percentage=c.minimum_pcm_percentage,
            primary_exam=c.primary_exam
        )
        for c in college.courses
    ]

    cutoffs = [
        CutoffRecord(
            admission_year=cut.admission_year,
            exam_route=cut.exam_route,
            category=cut.category,
            quota=cut.quota,
            score_or_rank_type=cut.score_or_rank_type,
            opening_value=cut.opening_value,
            closing_value=cut.closing_value,
            round_number=cut.round_number,
            source_url=cut.source_url
        )
        for cut in sorted(college.cutoffs, key=lambda x: (x.admission_year, x.round_number), reverse=True)
    ]

    fees = [
        FeeRecord(
            academic_year=f.academic_year,
            annual_tuition_fee=f.annual_tuition_fee,
            hostel_fee_annual=f.hostel_fee_annual,
            mess_fee_annual=f.mess_fee_annual,
            total_annual_estimate=f.total_annual_estimate,
            fee_breakdown_notes=f.fee_breakdown_notes,
            source_url=f.source_url,
            last_verified=f.last_verified
        )
        for f in sorted(college.fees, key=lambda x: x.academic_year, reverse=True)
    ]

    placements = [
        PlacementRecord(
            reporting_year=p.reporting_year,
            placement_percentage=p.placement_percentage,
            highest_package_lpa=p.highest_package_lpa,
            average_package_lpa=p.average_package_lpa,
            median_package_lpa=p.median_package_lpa,
            top_recruiters=p.top_recruiters,
            source_report_url=p.source_report_url,
            verification_date=p.verification_date
        )
        for p in sorted(college.placements, key=lambda x: x.reporting_year, reverse=True)
    ]

    scholarships = [
        ScholarshipRecord(
            scholarship_name=s.scholarship_name,
            eligibility_criteria=s.eligibility_criteria,
            award_amount_or_waiver=s.award_amount_or_waiver,
            category_applicable=s.category_applicable,
            merit_or_need=s.merit_or_need,
            application_url=s.application_url,
            source_title=s.source_title
        )
        for s in college.scholarships
    ]

    sources = [
        SourceCitation(
            authority=src.authority_name,
            source_name=src.source_name,
            url=src.url,
            year=src.academic_year,
            verified_date=src.last_verified_date
        )
        for src in college.sources
    ]

    return CollegeDetailResponse(
        id=college.id,
        code=college.code,
        name=college.name,
        college_type=college.college_type,
        state=college.state,
        city=college.city,
        campus_area_acres=college.campus_area_acres,
        established_year=college.established_year,
        nirf_rank=college.nirf_rank,
        accreditation=college.accreditation,
        official_website=college.official_website,
        admissions_portal_url=college.admissions_portal_url,
        overview=college.overview,
        facilities=college.facilities,
        hostel_available=college.hostel_available,
        data_freshness_year=college.data_freshness_year,
        last_verified_at=college.last_verified_at,
        verification_status=college.verification_status,
        courses=courses,
        cutoffs=cutoffs,
        fees=fees,
        placements=placements,
        scholarships=scholarships,
        sources=sources
    )


def compare_colleges_data(
    db: Session,
    college_ids: List[int],
    course_code: Optional[str] = None
) -> CompareResponse:
    """Builds side-by-side comparison matrix and chart series for 2 to 4 colleges."""
    colleges_detail = []
    for cid in college_ids[:4]:
        d = get_college_detail(db, cid)
        if d:
            colleges_detail.append(d)

    # Comparison metrics table
    matrix: Dict[str, Any] = {
        "attributes": [
            "College Code", "College Type", "Location", "NIRF Rank (2024)",
            "Accreditation", "Campus Area (Acres)", "Annual Tuition Fee",
            "Hostel Annual Fee", "Median Placement CTC", "Highest Package",
            "Hostel Available", "Primary Exam Routes", "Data Freshness"
        ],
        "college_columns": []
    }

    tuition_chart = []
    placement_chart = []

    for c in colleges_detail:
        latest_fee = c.fees[0] if c.fees else None
        latest_placement = c.placements[0] if c.placements else None
        exams = list(set([course.primary_exam for course in c.courses]))

        col_data = {
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "values": {
                "College Code": c.code,
                "College Type": c.college_type,
                "Location": f"{c.city}, {c.state}",
                "NIRF Rank (2024)": f"#{c.nirf_rank}" if c.nirf_rank else "Unranked / Not in Top 100",
                "Accreditation": c.accreditation or "Not specified",
                "Campus Area (Acres)": f"{c.campus_area_acres} Acres" if c.campus_area_acres else "Not documented",
                "Annual Tuition Fee": f"₹{latest_fee.annual_tuition_fee:,.0f}" if latest_fee else "Pending verification",
                "Hostel Annual Fee": f"₹{latest_fee.hostel_fee_annual:,.0f}" if (latest_fee and latest_fee.hostel_fee_annual) else "Not available / N/A",
                "Median Placement CTC": f"₹{latest_placement.median_package_lpa} LPA" if (latest_placement and latest_placement.median_package_lpa) else "Not reported",
                "Highest Package": f"₹{latest_placement.highest_package_lpa} LPA" if (latest_placement and latest_placement.highest_package_lpa) else "Not reported",
                "Hostel Available": "Yes" if c.hostel_available else "No",
                "Primary Exam Routes": ", ".join(exams) if exams else "None listed",
                "Data Freshness": f"{c.data_freshness_year} ({c.verification_status})"
            }
        }
        matrix["college_columns"].append(col_data)

        # Bar chart series
        if latest_fee and latest_fee.annual_tuition_fee:
            tuition_chart.append({
                "college": c.code,
                "tuition_fee": latest_fee.annual_tuition_fee,
                "hostel_fee": latest_fee.hostel_fee_annual or 0
            })

        if latest_placement and latest_placement.median_package_lpa:
            placement_chart.append({
                "college": c.code,
                "median_ctc": latest_placement.median_package_lpa,
                "highest_ctc": latest_placement.highest_package_lpa or 0
            })

    return CompareResponse(
        colleges=colleges_detail,
        comparison_matrix=matrix,
        metric_charts={
            "fees": tuition_chart,
            "placements": placement_chart
        }
    )


def get_all_scholarships(db: Session, college_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Retrieves verified scholarships, optionally filtered by college."""
    q = db.query(Scholarship)
    if college_id:
        q = q.filter(Scholarship.college_id == college_id)
    items = q.all()
    results = []
    for s in items:
        college = db.query(College).filter(College.id == s.college_id).first() if s.college_id else None
        results.append({
            "id": s.id,
            "college_name": college.name if college else "All / State Welfare Scheme",
            "college_code": college.code if college else None,
            "scholarship_name": s.scholarship_name,
            "eligibility_criteria": s.eligibility_criteria,
            "award_amount_or_waiver": s.award_amount_or_waiver,
            "category_applicable": s.category_applicable,
            "merit_or_need": s.merit_or_need,
            "application_url": s.application_url,
            "source_title": s.source_title
        })
    return results


def get_all_sources(db: Session) -> List[SourceItemResponse]:
    """Retrieves all tracked sources with academic year and verification status."""
    sources = db.query(Source).all()
    results = []
    for s in sources:
        college = db.query(College).filter(College.id == s.college_id).first() if s.college_id else None
        results.append(SourceItemResponse(
            id=s.id,
            college_id=s.college_id,
            college_name=college.name if college else "Central Regulatory / Board Authority",
            authority_name=s.authority_name,
            source_name=s.source_name,
            source_type=s.source_type,
            url=s.url,
            academic_year=s.academic_year,
            last_verified_date=s.last_verified_date,
            notes=s.notes
        ))
    return results
