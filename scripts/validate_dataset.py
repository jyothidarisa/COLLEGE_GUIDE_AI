"""
Standalone Script: Validate Dataset, Enrich Sources, Clean Inconsistencies,
and Regenerate Updated CSV Files with Full Verification Metadata.
"""

import sys
import json
from pathlib import Path

# Set stdout encoding
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))
sys.path.append(str(BASE_DIR / "scripts"))

from app.database import SessionLocal
from app.services.data_validator import DataQualityAuditor
from export_to_csv import export_all

def main():
    print("=" * 80)
    print("COLLEGE GUIDE AI: DATASET VALIDATION & SOURCE ENRICHMENT PIPELINE")
    print("=" * 80)

    db = SessionLocal()
    try:
        auditor = DataQualityAuditor(db)

        # 1. Initial Audit
        print("\n>>> Running pre-cleaning audit...")
        initial_report = auditor.audit_all()
        summary = initial_report["summary"]
        print(f"Total Colleges: {summary['total_colleges']}")
        print(f"Total Courses: {summary['total_courses']}")
        print(f"Total Cutoffs: {summary['total_cutoffs']}")
        print(f"Total Fee Records: {summary['total_fee_records']}")
        print(f"Total Placements: {summary['total_placement_records']}")
        print(f"Total Sources: {summary['total_sources']}")
        print(f"Confirmed Duplicates: {summary['confirmed_duplicates']}")
        print(f"Suspected Duplicates: {summary['suspected_duplicates']}")
        print(f"Invalid Value Ranges: {summary['invalid_ranges']}")
        print(f"Missing Critical Fields: {summary['missing_critical_fields']}")
        print(f"Established Year Missing Count: {initial_report['field_stats']['colleges']['established_year']['missing_count']}")

        # 2. Run Cleaning & Source Enrichment
        print("\n>>> Applying normalization, establishing years, and enriching source authorities...")
        clean_res = auditor.clean_and_normalize()
        print(f"Cleaning Result: {clean_res['total_changes']} updates committed to database.")

        # 3. Post-Cleaning Audit
        print("\n>>> Running post-cleaning verification...")
        post_report = auditor.audit_all()
        post_summary = post_report["summary"]
        print(f"Confirmed Duplicates: {post_summary['confirmed_duplicates']}")
        print(f"Invalid Value Ranges: {post_summary['invalid_ranges']}")
        print(f"Established Year Missing Count: {post_report['field_stats']['colleges']['established_year']['missing_count']} (Reduced from {summary['total_colleges']})")
        print(f"Verified Records Count: {post_summary['verified_records']} ({round((post_summary['verified_records']/post_summary['total_colleges'])*100, 1)}%)")

        # 4. Re-export Clean Data to CSV Files
        print("\n>>> Synchronizing clean database state to data/*.csv...")
        export_all()

        print("\n" + "=" * 80)
        print("DATASET VALIDATION & SYNCHRONIZATION COMPLETE")
        print("=" * 80)

    finally:
        db.close()

if __name__ == "__main__":
    main()
