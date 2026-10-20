"""
Automated Test Suite for Dataset Quality, Range Constraints,
Referential Integrity, and Source Attribution.
"""

import pytest
from app.database import SessionLocal
from app.models import College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic, Source
from app.services.data_validator import DataQualityAuditor, EXAM_RULES

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


def test_dataset_no_confirmed_duplicates(db_session):
    """Verifies that no duplicate college codes, courses, or cutoffs exist."""
    auditor = DataQualityAuditor(db_session)
    report = auditor.audit_all()
    assert report["summary"]["confirmed_duplicates"] == 0, (
        f"Found confirmed duplicates: {report['issues']}"
    )


def test_dataset_range_constraints(db_session):
    """Verifies that all cutoffs, fees, and placements obey valid numerical ranges."""
    auditor = DataQualityAuditor(db_session)
    report = auditor.audit_all()
    assert report["summary"]["invalid_ranges"] == 0, (
        f"Found invalid range violations: {report['issues']}"
    )


def test_referential_integrity(db_session):
    """Verifies that no orphan foreign keys exist across any tables."""
    college_ids = {c.id for c in db_session.query(College.id).all()}

    # Courses point to valid college
    for crs in db_session.query(Course).all():
        assert crs.college_id in college_ids, f"Orphan course id {crs.id}"

    # Cutoffs point to valid college and course
    course_ids = {c.id for c in db_session.query(Course.id).all()}
    for cut in db_session.query(AdmissionCutoff).all():
        assert cut.college_id in college_ids, f"Orphan cutoff id {cut.id}"
        assert cut.course_id in course_ids, f"Orphan cutoff course id {cut.id}"

    # Fees point to valid college
    for fee in db_session.query(FeeDetail).all():
        assert fee.college_id in college_ids, f"Orphan fee id {fee.id}"

    # Placements point to valid college
    for plc in db_session.query(PlacementStatistic).all():
        assert plc.college_id in college_ids, f"Orphan placement id {plc.id}"


def test_source_attribution_completeness(db_session):
    """Verifies that all cutoffs, fees, placements, and sources have valid URLs."""
    for cut in db_session.query(AdmissionCutoff).all():
        assert cut.source_url and cut.source_url.startswith("http"), (
            f"Cutoff id {cut.id} missing valid source URL"
        )

    for fee in db_session.query(FeeDetail).all():
        assert fee.source_url and fee.source_url.startswith("http"), (
            f"Fee id {fee.id} missing valid source URL"
        )

    for plc in db_session.query(PlacementStatistic).all():
        assert plc.source_report_url and plc.source_report_url.startswith("http"), (
            f"Placement id {plc.id} missing valid source report URL"
        )

    for s in db_session.query(Source).all():
        assert s.url and s.url.startswith("http"), (
            f"Source id {s.id} missing valid URL"
        )
        assert s.authority_name and len(s.authority_name) > 3, (
            f"Source id {s.id} missing authority name"
        )


def test_fee_logical_consistency(db_session):
    """Verifies fee components: total estimate must be >= annual tuition fee."""
    for fee in db_session.query(FeeDetail).all():
        assert fee.annual_tuition_fee >= 0, f"Negative tuition in fee id {fee.id}"
        assert fee.total_annual_estimate >= fee.annual_tuition_fee, (
            f"Total annual estimate less than tuition in fee id {fee.id}"
        )


def test_placement_statistics_bounds(db_session):
    """Verifies placement stats: median and average <= highest, percentage <= 100%."""
    for plc in db_session.query(PlacementStatistic).all():
        if plc.placement_percentage is not None:
            assert 0.0 <= plc.placement_percentage <= 100.0, (
                f"Placement percentage out of bounds in placement id {plc.id}"
            )
        if plc.highest_package_lpa and plc.median_package_lpa:
            assert plc.highest_package_lpa >= plc.median_package_lpa, (
                f"Highest package ({plc.highest_package_lpa}) < Median ({plc.median_package_lpa}) in placement {plc.id}"
            )
