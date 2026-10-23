# ==============================================================================
# Multi-Stage Dockerfile for Google Cloud Run (*.run.app) / Docker Deployment
# ==============================================================================

# Stage 1: Build the React Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python 3.11 Runtime
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code and data
COPY backend/ ./backend/
COPY data/ ./data/

# Copy compiled frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DATABASE_URL=sqlite:///./college_guide.db \
    LLM_PROVIDER=openrouter \
    OPENROUTER_MODEL=deepseek/deepseek-chat \
    OPENROUTER_BASE_URL=https://openrouter.ai/api/v1 \
    ADMIN_API_KEY=admin-secret-key-change-in-production \
    CORS_ORIGINS="*"

# Working directory
WORKDIR /app/backend

# Cloud Run injects $PORT (default 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start uvicorn binding to 0.0.0.0 and $PORT
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
