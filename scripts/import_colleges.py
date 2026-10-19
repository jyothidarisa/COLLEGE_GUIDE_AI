import os
import sys
import csv
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal, init_db
from app.models import (
    College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic, Scholarship, Source
)

DATA_DIR = BASE_DIR / "data"

def import_all_data():
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Import Colleges
        colleges_file = DATA_DIR / "colleges.csv"
        colleges_map = {}
        if colleges_file.exists():
            print("Importing colleges...")
            with open(colleges_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    code = row["code"].strip()
                    existing = db.query(College).filter(College.code == code).first()
                    if not existing:
                        col = College(
                            code=code,
                            name=row["name"].strip(),
                            college_type=row["college_type"].strip(),
                            state=row["state"].strip(),
                            city=row["city"].strip(),
                            campus_area_acres=float(row["campus_area_acres"]) if row.get("campus_area_acres") else None,
                            established_year=int(row["established_year"]) if row.get("established_year") else None,
                            nirf_rank=int(row["nirf_rank"]) if row.get("nirf_rank") else None,
                            accreditation=row.get("accreditation", "").strip() or None,
                            official_website=row["official_website"].strip(),
                            admissions_portal_url=row.get("admissions_portal_url", "").strip() or None,
                            overview=row.get("overview", "").strip() or None,
                            facilities=row.get("facilities", "").strip() or None,
                            hostel_available=row.get("hostel_available", "True").lower() == "true",
                            image_url=row.get("image_url", "").strip() or None,
                            image_source=row.get("image_source", "").strip() or None,
                            data_freshness_year=int(row.get("data_freshness_year", 2024)),
                            last_verified_at=row.get("last_verified_at", "2024-08-15"),
                            verification_status=row.get("verification_status", "Verified Official")
                        )
                        db.add(col)
                        db.flush()
                        colleges_map[code] = col.id
                    else:
                        if row.get("image_url"):
                            existing.image_url = row["image_url"].strip()
                        if row.get("image_source"):
                            existing.image_source = row["image_source"].strip()
                        colleges_map[code] = existing.id
            db.commit()
            print(f"Colleges imported/verified: {len(colleges_map)}")

        # 2. Import Courses
        courses_file = DATA_DIR / "courses.csv"
        courses_map = {}  # (college_code, course_code) -> course_id
        if courses_file.exists():
            print("Importing courses...")
            with open(courses_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_code = row["college_code"].strip()
                    crs_code = row["course_code"].strip()
                    col_id = colleges_map.get(c_code)
                    if not col_id:
                        continue
                    
                    existing_crs = db.query(Course).filter(
                        Course.college_id == col_id,
                        Course.course_code == crs_code
                    ).first()

                    if not existing_crs:
                        crs = Course(
                            college_id=col_id,
                            course_code=crs_code,
                            degree=row.get("degree", "B.Tech").strip(),
                            course_name=row["course_name"].strip(),
                            duration_years=int(row.get("duration_years", 4)),
                            total_seats=int(row["total_seats"]) if row.get("total_seats") else None,
                            eligibility_criteria=row.get("eligibility_criteria", "").strip(),
                            minimum_pcm_percentage=float(row.get("minimum_pcm_percentage", 60.0)),
                            primary_exam=row["primary_exam"].strip()
                        )
                        db.add(crs)
                        db.flush()
                        courses_map[(c_code, crs_code)] = crs.id
                    else:
                        courses_map[(c_code, crs_code)] = existing_crs.id
            db.commit()
            print(f"Courses imported/verified: {len(courses_map)}")

        # 3. Import Cutoffs
        cutoffs_file = DATA_DIR / "cutoffs.csv"
        if cutoffs_file.exists():
            print("Importing cutoffs...")
            cut_count = 0
            with open(cutoffs_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_code = row["college_code"].strip()
                    crs_code = row["course_code"].strip()
                    col_id = colleges_map.get(c_code)
                    crs_id = courses_map.get((c_code, crs_code))
                    if not col_id or not crs_id:
                        continue

                    year = int(row["admission_year"])
                    route = row["exam_route"].strip()
                    cat = row["category"].strip()
                    quota = row.get("quota", "General").strip()

                    exists = db.query(AdmissionCutoff).filter(
                        AdmissionCutoff.college_id == col_id,
                        AdmissionCutoff.course_id == crs_id,
                        AdmissionCutoff.admission_year == year,
                        AdmissionCutoff.exam_route == route,
                        AdmissionCutoff.category == cat,
                        AdmissionCutoff.quota == quota
                    ).first()

                    if not exists:
                        cut = AdmissionCutoff(
                            college_id=col_id,
                            course_id=crs_id,
                            admission_year=year,
                            exam_route=route,
                            category=cat,
                            quota=quota,
                            score_or_rank_type=row["score_or_rank_type"].strip(),
                            opening_value=float(row["opening_value"]) if row.get("opening_value") else None,
                            closing_value=float(row["closing_value"]),
                            round_number=int(row.get("round_number", 1)),
                            source_url=row["source_url"].strip(),
                            notes=row.get("notes", "").strip() or None
                        )
                        db.add(cut)
                        cut_count += 1
            db.commit()
            print(f"Cutoffs imported: {cut_count}")

        # 4. Import Fees
        fees_file = DATA_DIR / "fees.csv"
        if fees_file.exists():
            print("Importing fees...")
            fee_count = 0
            with open(fees_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_code = row["college_code"].strip()
                    col_id = colleges_map.get(c_code)
                    if not col_id:
                        continue
                    year = int(row["academic_year"])
                    exists = db.query(FeeDetail).filter(
                        FeeDetail.college_id == col_id,
                        FeeDetail.academic_year == year
                    ).first()
                    if not exists:
                        f_rec = FeeDetail(
                            college_id=col_id,
                            academic_year=year,
                            annual_tuition_fee=float(row["annual_tuition_fee"]),
                            hostel_fee_annual=float(row["hostel_fee_annual"]) if row.get("hostel_fee_annual") else None,
                            mess_fee_annual=float(row["mess_fee_annual"]) if row.get("mess_fee_annual") else None,
                            one_time_caution_deposit=float(row["one_time_caution_deposit"]) if row.get("one_time_caution_deposit") else None,
                            total_annual_estimate=float(row["total_annual_estimate"]),
                            fee_breakdown_notes=row.get("fee_breakdown_notes", "").strip() or None,
                            source_url=row["source_url"].strip(),
                            last_verified=row.get("last_verified", "2024-08-15")
                        )
                        db.add(f_rec)
                        fee_count += 1
            db.commit()
            print(f"Fee records imported: {fee_count}")

        # 5. Import Placements
        placements_file = DATA_DIR / "placements.csv"
        if placements_file.exists():
            print("Importing placements...")
            plc_count = 0
            with open(placements_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_code = row["college_code"].strip()
                    col_id = colleges_map.get(c_code)
                    if not col_id:
                        continue
                    year = int(row["reporting_year"])
                    exists = db.query(PlacementStatistic).filter(
                        PlacementStatistic.college_id == col_id,
                        PlacementStatistic.reporting_year == year
                    ).first()
                    if not exists:
                        p_rec = PlacementStatistic(
                            college_id=col_id,
                            reporting_year=year,
                            eligible_students=int(row["eligible_students"]) if row.get("eligible_students") else None,
                            placed_students=int(row["placed_students"]) if row.get("placed_students") else None,
                            placement_percentage=float(row["placement_percentage"]) if row.get("placement_percentage") else None,
                            highest_package_lpa=float(row["highest_package_lpa"]) if row.get("highest_package_lpa") else None,
                            average_package_lpa=float(row["average_package_lpa"]) if row.get("average_package_lpa") else None,
                            median_package_lpa=float(row["median_package_lpa"]) if row.get("median_package_lpa") else None,
                            top_recruiters=row.get("top_recruiters", "").strip() or None,
                            source_report_url=row["source_report_url"].strip(),
                            verification_date=row.get("verification_date", "2024-08-15")
                        )
                        db.add(p_rec)
                        plc_count += 1
            db.commit()
            print(f"Placement records imported: {plc_count}")

        # 6. Import Scholarships
        schol_file = DATA_DIR / "scholarships.csv"
        if schol_file.exists():
            print("Importing scholarships...")
            s_count = 0
            with open(schol_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_code = row["college_code"].strip()
                    col_id = colleges_map.get(c_code)
                    s_name = row["scholarship_name"].strip()
                    exists = db.query(Scholarship).filter(
                        Scholarship.scholarship_name == s_name,
                        Scholarship.college_id == col_id
                    ).first()
                    if not exists:
                        s_rec = Scholarship(
                            college_id=col_id,
                            scholarship_name=s_name,
                            eligibility_criteria=row["eligibility_criteria"].strip(),
                            award_amount_or_waiver=row["award_amount_or_waiver"].strip(),
                            category_applicable=row.get("category_applicable", "").strip() or None,
                            merit_or_need=row.get("merit_or_need", "Merit").strip(),
                            application_url=row.get("application_url", "").strip() or None,
                            source_title=row["source_title"].strip()
                        )
                        db.add(s_rec)
                        s_count += 1
            db.commit()
            print(f"Scholarships imported: {s_count}")

        # 7. Import Sources
        sources_file = DATA_DIR / "sources.csv"
        if sources_file.exists():
            print("Importing sources...")
            src_count = 0
            with open(sources_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_code = row.get("college_code", "").strip()
                    col_id = colleges_map.get(c_code)
                    s_name = row["source_name"].strip()
                    url = row["url"].strip()
                    exists = db.query(Source).filter(
                        Source.source_name == s_name,
                        Source.url == url
                    ).first()
                    if not exists:
                        src_rec = Source(
                            college_id=col_id,
                            authority_name=row["authority_name"].strip(),
                            source_name=s_name,
                            source_type=row["source_type"].strip(),
                            url=url,
                            academic_year=int(row["academic_year"]),
                            last_verified_date=row["last_verified_date"].strip(),
                            notes=row.get("notes", "").strip() or None
                        )
                        db.add(src_rec)
                        src_count += 1
            db.commit()
            print(f"Sources imported: {src_count}")

        print("Data import successfully completed!")
    finally:
        db.close()

if __name__ == "__main__":
    import_all_data()
