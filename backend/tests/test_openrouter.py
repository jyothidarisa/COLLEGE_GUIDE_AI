import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
import httpx
from app.main import app
from app.config import settings
from app.services.llm_service import generate_llm_response, build_rag_context
from app.schemas import RetrievedEvidence, StudentProfile, ChatMessage

client = TestClient(app)


def test_openrouter_config_loading(monkeypatch):
    """1. Configuration loads successfully with defaults and env overrides."""
    assert settings.OPENROUTER_BASE_URL.startswith("http")
    assert settings.OPENROUTER_MODEL is not None
    assert len(settings.OPENROUTER_MODEL) > 0


def test_openrouter_missing_api_key_error(monkeypatch):
    """2. Missing API key produces a clear warning and truthful fallback badge."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openrouter")

    payload = {
        "message": "What is the fee for NIT Trichy?",
        "model_type": "llm",
        "session_id": str(uuid.uuid4())
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_fallback"] is True
    assert data["model_used"] == "Rule-based Evidence Fallback"
    assert "OpenRouter API key not configured" in (data["warning"] or "")


@pytest.mark.anyio
async def test_openrouter_mocked_success_passes_evidence(monkeypatch):
    """3, 6, 7, 8, 10. OpenRouter LLM receives evidence, generates grounded reply, and matches citations."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "sk-or-v1-mock-test-key-for-unit-testing-grounding")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openrouter")
    monkeypatch.setattr(settings, "OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

    mock_evidence = [
        RetrievedEvidence(
            chunk_id=1,
            college_name="National Institute of Technology Tiruchirappalli",
            document_title="NIT Trichy Fee Structure 2024",
            snippet="Annual B.Tech tuition fee at NIT Trichy is ₹1,25,000 per year.",
            relevance_score=0.92,
            source_url="https://www.nitt.edu/fees",
            academic_year=2024
        )
    ]

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "### 1. Simple Answer\nThe annual B.Tech tuition fee at NIT Trichy is ₹1,25,000 per year based on official 2024 records."
                }
            }
        ]
    }

    recorded_requests = []

    async def fake_post(self, url, *args, **kwargs):
        recorded_requests.append({"url": url, "kwargs": kwargs})
        return mock_resp

    with patch.object(httpx.AsyncClient, "post", new=fake_post):
        reply, citations, is_fallback, warning, suggestions, model_badge = await generate_llm_response(
            query="What is the fee for NIT Trichy?",
            evidence_list=mock_evidence,
            student_profile=None,
            conversation_history=None
        )

    assert is_fallback is False
    assert warning is None
    assert "NIT Trichy is ₹1,25,000" in reply
    assert "OpenRouter (meta-llama/llama-3.3-70b-instruct:free)" in model_badge
    assert len(citations) == 1
    assert citations[0].url == "https://www.nitt.edu/fees"

    # Verify evidence was actually passed to the LLM prompt
    assert len(recorded_requests) == 1
    payload = recorded_requests[0]["kwargs"]["json"]
    user_message = next(m["content"] for m in payload["messages"] if m["role"] == "user")
    assert "NIT Trichy Fee Structure 2024" in user_message
    assert "₹1,25,000" in user_message


@pytest.mark.anyio
async def test_openrouter_auth_error_handled_safely(monkeypatch):
    """4. API authentication errors (HTTP 401) are handled safely without exposing keys."""
    fake_secret = "sk-or-v1-my-secret-key-12345"
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", fake_secret)
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openrouter")

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.json.return_value = {
        "error": {
            "message": f"Invalid API key: {fake_secret}"
        }
    }

    with patch.object(httpx.AsyncClient, "post", new=AsyncMock(return_value=mock_resp)):
        reply, citations, is_fallback, warning, suggestions, model_badge = await generate_llm_response(
            query="Tell me about CEG",
            evidence_list=[],
            student_profile=None
        )

    assert is_fallback is True
    assert model_badge == "Rule-based Evidence Fallback"
    assert "OpenRouter authentication error (401)" in warning
    # Verify the secret key is NOT leaked in the warning
    assert fake_secret not in warning


@pytest.mark.anyio
async def test_openrouter_rate_limit_and_credits_error(monkeypatch):
    """5. Rate limits (429) and insufficient credits (402) handled correctly."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-format-key-mock-429")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openrouter")

    # Test 429
    mock_429 = MagicMock()
    mock_429.status_code = 429
    mock_429.json.return_value = {"error": {"message": "Rate limit exceeded. Try again in 5s."}}

    with patch.object(httpx.AsyncClient, "post", new=AsyncMock(return_value=mock_429)):
        reply, citations, is_fallback, warning, _, _ = await generate_llm_response(
            query="Compare NIT Trichy and IIT Madras",
            evidence_list=[],
            student_profile=None
        )
    assert is_fallback is True
    assert "rate limit" in warning.lower()

    # Test 402 Insufficient Credits
    mock_402 = MagicMock()
    mock_402.status_code = 402
    mock_402.json.return_value = {"error": {"message": "Credit balance is zero."}}

    with patch.object(httpx.AsyncClient, "post", new=AsyncMock(return_value=mock_402)):
        reply, citations, is_fallback, warning, _, _ = await generate_llm_response(
            query="Compare NIT Trichy and IIT Madras",
            evidence_list=[],
            student_profile=None
        )
    assert is_fallback is True
    assert "insufficient credits" in warning.lower()


@pytest.mark.anyio
async def test_openrouter_timeout_handling(monkeypatch):
    """5b. Network timeouts handled cleanly with honest fallback."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-format-key-mock-timeout")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openrouter")

    async def raise_timeout(*args, **kwargs):
        raise httpx.TimeoutException("Connection timed out")

    with patch.object(httpx.AsyncClient, "post", new=raise_timeout):
        reply, citations, is_fallback, warning, _, model_badge = await generate_llm_response(
            query="What is the cutoff for CEG?",
            evidence_list=[],
            student_profile=None
        )
    assert is_fallback is True
    assert model_badge == "Rule-based Evidence Fallback"
    assert "timed out" in warning.lower()


@pytest.mark.anyio
async def test_openrouter_conversation_history_passed(monkeypatch):
    """9. Conversation history is passed to OpenRouter messages."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-format-key-mock-history")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openrouter")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"role": "assistant", "content": "CEG has strong placements."}}]
    }

    recorded_messages = []

    async def capture_post(self, url, *args, **kwargs):
        recorded_messages.extend(kwargs["json"]["messages"])
        return mock_resp

    history = [
        ChatMessage(role="user", content="Tell me about CEG Anna University"),
        ChatMessage(role="assistant", content="CEG is one of the oldest engineering colleges in India.")
    ]

    with patch.object(httpx.AsyncClient, "post", new=capture_post):
        await generate_llm_response(
            query="What are its placement stats?",
            evidence_list=[],
            student_profile=None,
            conversation_history=history
        )

    # Check that previous turns were included in messages
    contents = [m["content"] for m in recorded_messages]
    assert any("Tell me about CEG Anna University" in c for c in contents)
    assert any("CEG is one of the oldest" in c for c in contents)
    assert any("What are its placement stats?" in c for c in contents)


def test_slm_mode_independence_preserved(monkeypatch):
    """11. SLM mode continues using local deterministic SLM/Qwen independently."""
    # Even if OpenRouter key is set, SLM mode must NOT invoke OpenRouter
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "sk-or-v1-valid-format-key-mock")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openrouter")

    payload = {
        "message": "What are the fees for NIT Trichy?",
        "model_type": "slm",
        "session_id": str(uuid.uuid4())
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    # In SLM mode, the model used is Local SLM (Deterministic) or Rule-based Evidence Fallback, never OpenRouter
    assert "OpenRouter" not in data["model_used"]
    assert "Local SLM" in data["model_used"] or "Rule-based Evidence" in data["model_used"]
