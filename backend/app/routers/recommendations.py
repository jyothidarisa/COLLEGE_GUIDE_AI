from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import StudentProfile, RecommendationResponse
from app.services.recommendation import recommend_colleges

router = APIRouter(tags=["Recommendations"])

@router.post("/recommendations", response_model=RecommendationResponse, summary="Get student college recommendations")
def get_recommendations(profile: StudentProfile, db: Session = Depends(get_db)):
    """
    Validates student profile, evaluates eligibility, filters candidate colleges,
    and returns explainable recommendations grouped into Ambitious, Better-matched,
    and Alternative tiers.
    """
    response = recommend_colleges(db, profile)
    if not response.success:
        raise HTTPException(status_code=422, detail=response.message)
    return response
