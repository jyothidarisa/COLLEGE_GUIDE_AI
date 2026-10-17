import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

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
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "fallback")  # gemini, openai, groq, ollama, fallback
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-1.5-flash")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Security
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "admin-secret-key-change-in-production")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
