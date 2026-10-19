import csv
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal
from app.models import (
    College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic, Scholarship, Source
)

DATA_DIR = BASE_DIR / "data"

def export_all():
    db = SessionLocal()
    try:
        # 1. Colleges
        colleges = db.query(College).order_by(College.nirf_rank).all()
        with open(DATA_DIR / "colleges.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "code", "name", "college_type", "state", "city",
                "campus_area_acres", "established_year", "nirf_rank", "accreditation",
                "official_website", "admissions_portal_url", "overview", "facilities",
                "hostel_available", "image_url", "image_source", "data_freshness_year",
                "last_verified_at", "verification_status"
            ])
            for c in colleges:
                writer.writerow([
                    c.code, c.name, c.college_type, c.state, c.city,
                    c.campus_area_acres, c.established_year, c.nirf_rank, c.accreditation,
                    c.official_website, c.admissions_portal_url, c.overview, c.facilities,
                    c.hostel_available, c.image_url, c.image_source, c.data_freshness_year,
                    c.last_verified_at, c.verification_status
                ])
        print(f"Exported {len(colleges)} colleges to data/colleges.csv")

        # 2. Courses
        courses = db.query(Course, College).join(College, Course.college_id == College.id).all()
        with open(DATA_DIR / "courses.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "college_code", "course_code", "degree", "course_name",
                "duration_years", "total_seats", "eligibility_criteria",
                "minimum_pcm_percentage", "primary_exam"
            ])
            for crs, col in courses:
                writer.writerow([
                    col.code, crs.course_code, crs.degree, crs.course_name,
                    crs.duration_years, crs.total_seats, crs.eligibility_criteria,
                    crs.minimum_pcm_percentage, crs.primary_exam
                ])
        print(f"Exported {len(courses)} courses to data/courses.csv")

        # 3. Cutoffs
        cutoffs = db.query(AdmissionCutoff, College, Course).join(
            College, AdmissionCutoff.college_id == College.id
        ).join(
            Course, AdmissionCutoff.course_id == Course.id
        ).all()
        with open(DATA_DIR / "cutoffs.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "college_code", "course_code", "admission_year", "exam_route",
                "category", "quota", "score_or_rank_type", "opening_value",
                "closing_value", "round_number", "source_url", "notes"
            ])
            for cut, col, crs in cutoffs:
                writer.writerow([
                    col.code, crs.course_code, cut.admission_year, cut.exam_route,
                    cut.category, cut.quota, cut.score_or_rank_type, cut.opening_value,
                    cut.closing_value, cut.round_number, cut.source_url, cut.notes
                ])
        print(f"Exported {len(cutoffs)} cutoffs to data/cutoffs.csv")

        # 4. Fees
        fees = db.query(FeeDetail, College).join(College, FeeDetail.college_id == College.id).all()
        with open(DATA_DIR / "fees.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "college_code", "academic_year", "annual_tuition_fee", "hostel_fee_annual",
                "mess_fee_annual", "one_time_caution_deposit", "total_annual_estimate",
                "fee_breakdown_notes", "source_url", "last_verified"
            ])
            for fee, col in fees:
                writer.writerow([
                    col.code, fee.academic_year, fee.annual_tuition_fee, fee.hostel_fee_annual,
                    fee.mess_fee_annual, fee.one_time_caution_deposit, fee.total_annual_estimate,
                    fee.fee_breakdown_notes, fee.source_url, fee.last_verified
                ])
        print(f"Exported {len(fees)} fee records to data/fees.csv")

        # 5. Placements
        placements = db.query(PlacementStatistic, College).join(College, PlacementStatistic.college_id == College.id).all()
        with open(DATA_DIR / "placements.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "college_code", "reporting_year", "eligible_students", "placed_students",
                "placement_percentage", "highest_package_lpa", "average_package_lpa",
                "median_package_lpa", "top_recruiters", "source_report_url", "verification_date"
            ])
            for p, col in placements:
                writer.writerow([
                    col.code, p.reporting_year, p.eligible_students, p.placed_students,
                    p.placement_percentage, p.highest_package_lpa, p.average_package_lpa,
                    p.median_package_lpa, p.top_recruiters, p.source_report_url, p.verification_date
                ])
        print(f"Exported {len(placements)} placement records to data/placements.csv")

        # 6. Scholarships
        scholarships = db.query(Scholarship, College).join(College, Scholarship.college_id == College.id).all()
        with open(DATA_DIR / "scholarships.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "college_code", "scholarship_name", "eligibility_criteria", "award_amount_or_waiver",
                "category_applicable", "merit_or_need", "application_url", "source_title"
            ])
            for s, col in scholarships:
                writer.writerow([
                    col.code, s.scholarship_name, s.eligibility_criteria, s.award_amount_or_waiver,
                    s.category_applicable, s.merit_or_need, s.application_url, s.source_title
                ])
        print(f"Exported {len(scholarships)} scholarships to data/scholarships.csv")

        # 7. Sources
        sources = db.query(Source, College).join(College, Source.college_id == College.id).all()
        with open(DATA_DIR / "sources.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "college_code", "authority_name", "source_name", "source_type",
                "url", "academic_year", "last_verified_date", "notes"
            ])
            for s, col in sources:
                writer.writerow([
                    col.code, s.authority_name, s.source_name, s.source_type,
                    s.url, s.academic_year, s.last_verified_date, s.notes
                ])
        print(f"Exported {len(sources)} sources to data/sources.csv")

    finally:
        db.close()

if __name__ == "__main__":
    export_all()
