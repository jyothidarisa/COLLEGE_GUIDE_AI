from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    CollegeDetailResponse, CompareRequest, CompareResponse, SourceItemResponse
)
from app.services.college_service import (
    get_colleges_list, get_college_detail, compare_colleges_data,
    get_all_scholarships, get_all_sources
)

router = APIRouter(tags=["Colleges"])

@router.get("/colleges", summary="List verified colleges with optional filters")
def list_colleges(
    q: Optional[str] = Query(None, description="Search keyword in name or city"),
    state: Optional[str] = Query(None, description="State filter"),
    city: Optional[str] = Query(None, description="City filter"),
    college_type: Optional[str] = Query(None, description="College type filter"),
    db: Session = Depends(get_db)
):
    colleges = get_colleges_list(db, query=q, state=state, city=city, college_type=college_type)
    return {
        "success": True,
        "count": len(colleges),
        "colleges": colleges
    }

@router.get("/colleges/{college_id}", response_model=CollegeDetailResponse, summary="Get full verified college profile")
def get_college(college_id: int, db: Session = Depends(get_db)):
    detail = get_college_detail(db, college_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"College with ID {college_id} not found.")
    return detail

@router.post("/compare", response_model=CompareResponse, summary="Compare 2 to 4 colleges side-by-side")
def compare_colleges_endpoint(req: CompareRequest, db: Session = Depends(get_db)):
    if len(req.college_ids) < 2 or len(req.college_ids) > 4:
        raise HTTPException(status_code=400, detail="Please select between 2 and 4 colleges for comparison.")
    return compare_colleges_data(db, req.college_ids, req.course_code)

@router.get("/scholarships", summary="List verified scholarships")
def list_scholarships(
    college_id: Optional[int] = Query(None, description="Filter by college ID"),
    db: Session = Depends(get_db)
):
    scholarships = get_all_scholarships(db, college_id=college_id)
    return {
        "success": True,
        "count": len(scholarships),
        "scholarships": scholarships
    }

@router.get("/sources", response_model=List[SourceItemResponse], summary="List all verified data sources and authorities")
def list_sources(db: Session = Depends(get_db)):
    return get_all_sources(db)
