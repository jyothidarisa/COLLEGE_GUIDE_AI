import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, engine
from app.routers import colleges, recommendations, chat, admin, models_performance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("college_guide_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    logger.info("Initializing database schema...")
    try:
        init_db()
        logger.info(f"Database initialized successfully ({engine.url.drivername}).")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

    # Startup log: Active LLM provider and model (without printing the key)
    provider = (settings.LLM_PROVIDER or "fallback").lower()
    has_key = bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip())
    model = settings.LLM_MODEL_NAME or "default"
    logger.info(f"LLM Configuration: active_provider='{provider}', active_model='{model}', key_configured={has_key}")

    yield
    # Shutdown
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack AI-powered college recommendation system with RAG, verified admissions data, and LLM guidance.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Endpoint
@app.get("/health", tags=["Health"])
def health_check():
    db_status = "connected"
    try:
        with engine.connect() as conn:
            pass
    except Exception as e:
        db_status = f"error: {e}"

    faiss_index_exists = os.path.exists(os.path.join(settings.FAISS_INDEX_DIR, "vector_index.faiss"))

    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "status": db_status,
            "engine": engine.url.drivername
        },
        "rag": {
            "faiss_index_ready": faiss_index_exists,
            "embedding_model": settings.EMBEDDING_MODEL_NAME
        },
        "llm": {
            "provider": settings.LLM_PROVIDER,
            "model": settings.LLM_MODEL_NAME,
            "configured": bool(settings.LLM_API_KEY) or settings.LLM_PROVIDER in ["ollama", "fallback"]
        }
    }

# Include API Routers
app.include_router(colleges.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(models_performance.router, prefix="/api")

# Serve built frontend and PWA static assets if frontend/dist exists (Full-stack container / Cloud Run mode)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException

candidate_dists = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
    os.path.abspath("/app/frontend/dist")
]

frontend_dist = next((p for p in candidate_dists if os.path.exists(p)), None)

if frontend_dist:
    logger.info(f"Frontend production distribution found at: {frontend_dist}")
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Explicit routes for root PWA assets
    pwa_files = [
        "manifest.webmanifest", "sw.js", "icon.svg", "logo.svg",
        "icon-192.png", "icon-512.png", "apple-touch-icon.png"
    ]
    for pwa_filename in pwa_files:
        pwa_path = os.path.join(frontend_dist, pwa_filename)
        if os.path.exists(pwa_path):
            def make_pwa_handler(target_file=pwa_path):
                async def pwa_handler():
                    return FileResponse(target_file)
                return pwa_handler
            app.add_api_route(f"/{pwa_filename}", make_pwa_handler(), methods=["GET"], include_in_schema=False)

    # SPA catch-all route for React Router navigation
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path in ["health", "docs", "openapi.json"]:
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Index file not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
