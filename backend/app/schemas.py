from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Student Profile Schemas ---

class StudentProfile(BaseModel):
    student_name: Optional[str] = Field(None, description="Optional student name")
    state: Optional[str] = Field(None, description="Student's home state")
    preferred_city: Optional[str] = Field(None, description="Preferred college city")
    preferred_degree: str = Field("B.Tech", description="Target degree, e.g. B.Tech or B.E.")
    preferred_course: str = Field(..., description="Target specialization: CSE, ECE, MECH, IT, AI_DS, EEE, CIVIL")
    
    class10_percentage: Optional[float] = Field(None, ge=0, le=100)
    class12_percentage: Optional[float] = Field(None, ge=0, le=100)
    pcm_percentage: Optional[float] = Field(None, ge=0, le=100, description="Physics, Chemistry, Math %")
    
    entrance_exam: str = Field(..., description="TNEA, JEE_MAIN, or JEE_ADVANCED")
    rank_or_score: float = Field(..., description="TNEA cutoff mark (out of 200) or JEE rank")
    admission_year: int = Field(2024, description="Target admission year")
    category: str = Field("OC", description="Reservation category: OC, BC, MBC, SC, ST, GEN, OBC-NCL, EWS")
    quota: str = Field("General", description="General, Home State, Other State, All India")
    
    max_tuition_budget: Optional[float] = Field(None, description="Maximum annual tuition fee (INR)")
    max_total_budget: Optional[float] = Field(None, description="Maximum total annual budget including hostel (INR)")
    hostel_required: bool = Field(False, description="Whether on-campus hostel accommodation is required")
    
    preferred_college_type: Optional[str] = Field("All", description="All, Central Government, State Government, Government Aided, Private Autonomous")
    placement_priority: Optional[str] = Field("High", description="High, Medium, Low")
    research_priority: Optional[str] = Field("Medium", description="High, Medium, Low")

    weights: Optional[Dict[str, float]] = Field(
        None,
        description="Optional custom weights for scoring (admission, affordability, placement, location, course)"
    )


# --- Recommendation Schemas ---

class SourceCitation(BaseModel):
    authority: str
    source_name: str
    url: str
    year: int
    verified_date: Optional[str] = None


class CollegeRecommendationItem(BaseModel):
    college_id: int
    code: str
    name: str
    college_type: str
    state: str
    city: str
    nirf_rank: Optional[int] = None
    accreditation: Optional[str] = None
    hostel_available: bool
    
    matched_course: str
    course_name: str
    
    annual_tuition_fee: Optional[float] = None
    hostel_fee_annual: Optional[float] = None
    total_annual_cost: Optional[float] = None
    fee_verified: bool = False
    
    admission_suitability: str  # "Ambitious", "Better-matched", "Alternative", "Insufficient data"
    suitability_explanation: str
    historical_cutoff: Optional[Dict[str, Any]] = None
    placement_statistics: Optional[Dict[str, Any]] = None
    
    match_score: float
    score_breakdown: Dict[str, float]
    
    pros: List[str]
    cons: List[str]
    missing_information: List[str]
    sources: List[SourceCitation]
    data_freshness_year: int
    verification_status: str


class RecommendationResponse(BaseModel):
    success: bool
    total_found: int
    ambitious: List[CollegeRecommendationItem]
    better_matched: List[CollegeRecommendationItem]
    alternative: List[CollegeRecommendationItem]
    insufficient_data: List[CollegeRecommendationItem]
    relaxations_suggested: Optional[List[str]] = None
    message: str


# --- College Detail & Comparison Schemas ---

class CourseDetail(BaseModel):
    id: int
    course_code: str
    degree: str
    course_name: str
    duration_years: int
    total_seats: Optional[int] = None
    eligibility_criteria: Optional[str] = None
    minimum_pcm_percentage: float
    primary_exam: str


class CutoffRecord(BaseModel):
    admission_year: int
    exam_route: str
    category: str
    quota: str
    score_or_rank_type: str
    opening_value: Optional[float] = None
    closing_value: float
    round_number: int
    source_url: str


class FeeRecord(BaseModel):
    academic_year: int
    annual_tuition_fee: float
    hostel_fee_annual: Optional[float] = None
    mess_fee_annual: Optional[float] = None
    total_annual_estimate: float
    fee_breakdown_notes: Optional[str] = None
    source_url: str
    last_verified: Optional[str] = None


class PlacementRecord(BaseModel):
    reporting_year: int
    placement_percentage: Optional[float] = None
    highest_package_lpa: Optional[float] = None
    average_package_lpa: Optional[float] = None
    median_package_lpa: Optional[float] = None
    top_recruiters: Optional[str] = None
    source_report_url: str
    verification_date: Optional[str] = None


class ScholarshipRecord(BaseModel):
    scholarship_name: str
    eligibility_criteria: str
    award_amount_or_waiver: str
    category_applicable: Optional[str] = None
    merit_or_need: str
    application_url: Optional[str] = None
    source_title: str


class CollegeDetailResponse(BaseModel):
    id: int
    code: str
    name: str
    college_type: str
    state: str
    city: str
    campus_area_acres: Optional[float] = None
    established_year: Optional[int] = None
    nirf_rank: Optional[int] = None
    accreditation: Optional[str] = None
    official_website: str
    admissions_portal_url: Optional[str] = None
    overview: Optional[str] = None
    facilities: Optional[str] = None
    hostel_available: bool
    data_freshness_year: int
    last_verified_at: Optional[str] = None
    verification_status: str
    
    courses: List[CourseDetail]
    cutoffs: List[CutoffRecord]
    fees: List[FeeRecord]
    placements: List[PlacementRecord]
    scholarships: List[ScholarshipRecord]
    sources: List[SourceCitation]


class CompareRequest(BaseModel):
    college_ids: List[int] = Field(..., min_length=2, max_length=4)
    course_code: Optional[str] = None


class CompareResponse(BaseModel):
    colleges: List[CollegeDetailResponse]
    comparison_matrix: Dict[str, Any]
    metric_charts: Dict[str, List[Dict[str, Any]]]


# --- Chat & RAG Schemas ---

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    student_profile: Optional[StudentProfile] = None
    selected_college_ids: Optional[List[int]] = None
    conversation_history: Optional[List[ChatMessage]] = []


class RetrievedEvidence(BaseModel):
    chunk_id: int
    college_name: Optional[str] = None
    document_title: str
    source_url: str
    page_number: Optional[int] = None
    academic_year: Optional[int] = None
    snippet: str
    relevance_score: float


class ChatResponse(BaseModel):
    reply: str
    citations: List[SourceCitation]
    evidence_used: List[RetrievedEvidence]
    is_fallback: bool = False
    warning: Optional[str] = None
    suggested_follow_ups: List[str] = []


# --- Document & Sources Schemas ---

class SourceItemResponse(BaseModel):
    id: int
    college_id: Optional[int] = None
    college_name: Optional[str] = None
    authority_name: str
    source_name: str
    source_type: str
    url: str
    academic_year: int
    last_verified_date: str
    notes: Optional[str] = None


class IngestionResponse(BaseModel):
    success: bool
    document_id: int
    title: str
    chunks_created: int
    message: str
