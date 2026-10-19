import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "rag" in data
    assert "llm" in data

def test_list_colleges_endpoint():
    res = client.get("/api/colleges")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["count"] > 0
    assert len(data["colleges"]) > 0

def test_college_detail_endpoint():
    # First get college list
    list_res = client.get("/api/colleges")
    first_col = list_res.json()["colleges"][0]
    col_id = first_col["id"]

    res = client.get(f"/api/colleges/{col_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == col_id
    assert "courses" in data
    assert "cutoffs" in data
    assert "fees" in data
    assert "placements" in data

def test_college_not_found():
    res = client.get("/api/colleges/999999")
    assert res.status_code == 404

def test_recommendations_endpoint():
    payload = {
        "preferred_course": "CSE",
        "entrance_exam": "TNEA",
        "rank_or_score": 198.5,
        "pcm_percentage": 95.0,
        "category": "OC"
    }
    res = client.post("/api/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["total_found"] > 0
    assert "best_match" in data
    assert data["best_match"] is not None
    assert "reach" in data
    assert "target" in data
    assert "safer" in data
    assert "intelligent_alternatives" in data
    assert "better_matched" in data

def test_compare_colleges_endpoint():
    list_res = client.get("/api/colleges")
    colleges = list_res.json()["colleges"]
    c1 = colleges[0]["id"]
    c2 = colleges[1]["id"]

    res = client.post("/api/compare", json={"college_ids": [c1, c2]})
    assert res.status_code == 200
    data = res.json()
    assert len(data["colleges"]) == 2
    assert "comparison_matrix" in data
    assert "metric_charts" in data

def test_chat_endpoint():
    payload = {
        "message": "What is the tuition fee for IIT Madras and CEG?"
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 20
    assert "citations" in data
    assert "evidence_used" in data

def test_scholarships_and_sources_endpoints():
    s_res = client.get("/api/scholarships")
    assert s_res.status_code == 200
    assert s_res.json()["count"] > 0

    src_res = client.get("/api/sources")
    assert src_res.status_code == 200
    assert len(src_res.json()) > 0
