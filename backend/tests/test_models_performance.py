from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_models_performance():
    response = client.get("/api/models/performance")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["system_overview"]["models_in_execution_count"] == 3
    assert len(data["deep_learning_models"]) >= 3
    assert "xai_framework" in data
    assert data["xai_framework"]["mathematical_foundation"]["weights"]["suitability"] == 0.35

def test_xai_explain_endpoint():
    payload = {
        "college_id": 1,
        "rank_or_score": 10000.0,
        "entrance_exam": "JEE_MAIN",
        "category": "General",
        "max_annual_tuition": 250000.0,
        "preferred_course": "CSE"
    }
    response = client.post("/api/models/xai-explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "final_composite_score" in data
    assert "baseline_expectation_s0" in data
    assert len(data["shapley_feature_attributions"]) == 5
    assert "counterfactual_explanation" in data
