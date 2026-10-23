import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Check candidate locations for .env: project root, backend folder, parent directory, and current working directory
for env_candidate in [BASE_DIR / ".env", BASE_DIR / "backend" / ".env", BASE_DIR.parent / ".env", Path.cwd() / ".env"]:
    if env_candidate.exists():
        load_dotenv(dotenv_path=env_candidate, override=True)

class Settings:
    PROJECT_NAME: str = "College Guide AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'college_guide.db'}")
    if raw_db_url.startswith("sqlite:///") and not os.path.isabs(raw_db_url.replace("sqlite:///", "")):
        rel = raw_db_url.replace("sqlite:///", "")
        DATABASE_URL = f"sqlite:///{BASE_DIR / rel}"
    else:
        DATABASE_URL = raw_db_url
    
    # Vector Search & RAG
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    
    raw_index_dir = os.getenv("FAISS_INDEX_DIR", "data/index")
    FAISS_INDEX_DIR: str = str((BASE_DIR / raw_index_dir).resolve()) if not os.path.isabs(raw_index_dir) else raw_index_dir
    
    raw_docs_dir = os.getenv("DOCUMENTS_DIR", "data/documents")
    DOCUMENTS_DIR: str = str((BASE_DIR / raw_docs_dir).resolve()) if not os.path.isabs(raw_docs_dir) else raw_docs_dir
    
    # LLM Provider Configuration (OpenRouter cloud LLM + Ollama local SLM)
    # Strictly require OPENROUTER_API_KEY for OpenRouter; do not implicitly fall back to placeholder keys
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "").strip()
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").strip()
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", os.getenv("LLM_MODEL_NAME", "meta-llama/llama-3.3-70b-instruct")).strip()
    
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter").strip().lower()
    LLM_API_KEY: str = OPENROUTER_API_KEY
    LLM_MODEL_NAME: str = OPENROUTER_MODEL
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip()
    
    # Security
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "admin-secret-key-change-in-production")
    
    # CORS
    raw_cors = os.getenv("CORS_ORIGINS", "").strip()
    if raw_cors:
        CORS_ORIGINS: list = [orig.strip() for orig in raw_cors.split(",") if orig.strip()]
    else:
        CORS_ORIGINS: list = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "*"
        ]

settings = Settings()
