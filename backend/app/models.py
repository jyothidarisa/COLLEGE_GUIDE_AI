from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    college_type = Column(String(100), nullable=False)  # Central Govt, State Govt, Govt Aided, Private Autonomous, Deemed
    state = Column(String(100), index=True, nullable=False)
    city = Column(String(100), index=True, nullable=False)
    campus_area_acres = Column(Float, nullable=True)
    established_year = Column(Integer, nullable=True)
    nirf_rank = Column(Integer, nullable=True)
    accreditation = Column(String(100), nullable=True)  # e.g. NAAC A++, NBA
    official_website = Column(String(255), nullable=False)
    admissions_portal_url = Column(String(255), nullable=True)
    overview = Column(Text, nullable=True)
    facilities = Column(Text, nullable=True)  # Comma-separated or JSON
    hostel_available = Column(Boolean, default=True)
    data_freshness_year = Column(Integer, default=2024)
    last_verified_at = Column(String(50), nullable=True)
    verification_status = Column(String(50), default="Verified Official")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    courses = relationship("Course", back_populates="college", cascade="all, delete-orphan")
    cutoffs = relationship("AdmissionCutoff", back_populates="college", cascade="all, delete-orphan")
    fees = relationship("FeeDetail", back_populates="college", cascade="all, delete-orphan")
    placements = relationship("PlacementStatistic", back_populates="college", cascade="all, delete-orphan")
    scholarships = relationship("Scholarship", back_populates="college", cascade="all, delete-orphan")
    documents = relationship("CollegeDocument", back_populates="college", cascade="all, delete-orphan")
    sources = relationship("Source", back_populates="college", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    course_code = Column(String(50), nullable=False)  # CSE, ECE, MECH, IT, etc.
    degree = Column(String(50), default="B.Tech")  # B.Tech, B.E.
    course_name = Column(String(255), nullable=False)
    duration_years = Column(Integer, default=4)
    total_seats = Column(Integer, nullable=True)
    eligibility_criteria = Column(Text, nullable=True)
    minimum_pcm_percentage = Column(Float, default=60.0)
    primary_exam = Column(String(50), nullable=False)  # TNEA, JEE_MAIN, JEE_ADVANCED, etc.

    college = relationship("College", back_populates="courses")
    cutoffs = relationship("AdmissionCutoff", back_populates="course", cascade="all, delete-orphan")


class AdmissionCutoff(Base):
    __tablename__ = "admission_cutoffs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    admission_year = Column(Integer, nullable=False, index=True)
    exam_route = Column(String(50), nullable=False, index=True)  # TNEA, JEE_MAIN, JEE_ADVANCED
    category = Column(String(50), nullable=False, index=True)  # OC, BC, MBC, SC, ST, GEN, OBC-NCL, EWS
    quota = Column(String(50), default="General", index=True)  # General, Home State, Other State, All India
    score_or_rank_type = Column(String(100), nullable=False)  # Cutoff Mark (out of 200), Closing Rank, Percentile
    opening_value = Column(Float, nullable=True)
    closing_value = Column(Float, nullable=False)  # Mandatory cutoff score/rank
    round_number = Column(Integer, default=1)
    source_url = Column(String(500), nullable=False)
    notes = Column(String(255), nullable=True)

    college = relationship("College", back_populates="cutoffs")
    course = relationship("Course", back_populates="cutoffs")

    __table_args__ = (
        Index("idx_cutoff_lookup", "college_id", "course_id", "admission_year", "exam_route", "category"),
    )


class FeeDetail(Base):
    __tablename__ = "fee_details"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    academic_year = Column(Integer, nullable=False)
    annual_tuition_fee = Column(Float, nullable=False)
    hostel_fee_annual = Column(Float, nullable=True)
    mess_fee_annual = Column(Float, nullable=True)
    one_time_caution_deposit = Column(Float, nullable=True)
    total_annual_estimate = Column(Float, nullable=False)
    fee_breakdown_notes = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=False)
    last_verified = Column(String(50), nullable=True)

    college = relationship("College", back_populates="fees")


class PlacementStatistic(Base):
    __tablename__ = "placement_statistics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    reporting_year = Column(Integer, nullable=False)
    eligible_students = Column(Integer, nullable=True)
    placed_students = Column(Integer, nullable=True)
    placement_percentage = Column(Float, nullable=True)
    highest_package_lpa = Column(Float, nullable=True)
    average_package_lpa = Column(Float, nullable=True)
    median_package_lpa = Column(Float, nullable=True)
    top_recruiters = Column(Text, nullable=True)
    source_report_url = Column(String(500), nullable=False)
    verification_date = Column(String(50), nullable=True)

    college = relationship("College", back_populates="placements")


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=True, index=True)
    scholarship_name = Column(String(255), nullable=False)
    eligibility_criteria = Column(Text, nullable=False)
    award_amount_or_waiver = Column(String(255), nullable=False)
    category_applicable = Column(String(100), nullable=True)
    merit_or_need = Column(String(50), default="Merit")  # Merit, Need-Based, Category-Based
    application_url = Column(String(500), nullable=True)
    source_title = Column(String(255), nullable=False)

    college = relationship("College", back_populates="scholarships")


class CollegeDocument(Base):
    __tablename__ = "college_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    doc_type = Column(String(100), nullable=False)  # Brochure, Cutoff_Table, Fee_Structure, Placement_Report, Admission_Guidelines
    academic_year = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    source_url = Column(String(500), nullable=False)
    publication_date = Column(String(50), nullable=True)
    last_verified = Column(String(50), nullable=True)
    sha256_hash = Column(String(64), nullable=True)
    total_chunks = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    college = relationship("College", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("college_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True, index=True)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    section_heading = Column(String(255), nullable=True)
    vector_id = Column(Integer, nullable=True, index=True)
    metadata_json = Column(Text, nullable=True)

    document = relationship("CollegeDocument", back_populates="chunks")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True, index=True)
    authority_name = Column(String(255), nullable=False)  # e.g. TNEA Directorate, JoSAA, NIRF MHRD
    source_name = Column(String(255), nullable=False)
    source_type = Column(String(100), nullable=False)  # Official Portal, Counselling Authority, NIRF, NAAC
    url = Column(String(500), nullable=False)
    academic_year = Column(Integer, nullable=False)
    last_verified_date = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)

    college = relationship("College", back_populates="sources")
