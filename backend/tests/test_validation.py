import pytest
from app.schemas import StudentProfile
from app.services.recommendation import validate_student_profile

def test_valid_tnea_profile():
    profile = StudentProfile(
        preferred_course="CSE",
        entrance_exam="TNEA",
        rank_or_score=198.5,
        pcm_percentage=92.0,
        category="OC"
    )
    is_valid, err = validate_student_profile(profile)
    assert is_valid is True
    assert err is None

def test_invalid_tnea_score_out_of_bounds():
    # TNEA score must be <= 200
    profile = StudentProfile(
        preferred_course="CSE",
        entrance_exam="TNEA",
        rank_or_score=250.0,
        pcm_percentage=90.0
    )
    is_valid, err = validate_student_profile(profile)
    assert is_valid is False
    assert "between 40.0 and 200.0" in err

def test_invalid_jee_negative_rank():
    # JEE rank must be a positive integer
    profile = StudentProfile(
        preferred_course="CSE",
        entrance_exam="JEE_MAIN",
        rank_or_score=-50,
        pcm_percentage=85.0
    )
    is_valid, err = validate_student_profile(profile)
    assert is_valid is False
    assert "positive integer" in err

def test_invalid_exam_route():
    # Unknown entrance examination
    profile = StudentProfile(
        preferred_course="CSE",
        entrance_exam="UNKNOWN_EXAM",
        rank_or_score=100
    )
    is_valid, err = validate_student_profile(profile)
    assert is_valid is False
    assert "Unsupported entrance exam" in err

def test_invalid_pcm_percentage():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        StudentProfile(
            preferred_course="CSE",
            entrance_exam="TNEA",
            rank_or_score=195.0,
            pcm_percentage=105.0
        )
