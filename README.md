# College Guide AI — LLM-Powered College Recommendation System with RAG

**College Guide AI** is a full-stack, AI-powered web application that helps students find suitable engineering colleges based on academic qualifications, entrance exam score or rank (TNEA, JEE Main, JEE Advanced), preferred course, annual budget, hostel requirements, and placement preferences.

The platform integrates:
1. **Deterministic Recommendation Engine**: Evaluates mandatory Class 12 PCM eligibility, applies hard budget and hostel constraints, estimates historical admission suitability (Ambitious, Better-Matched, Alternative), and computes explainable multi-criteria scores.
2. **Retrieval-Augmented Generation (RAG)**: Extracts text from official PDF brochures using PyPDF, indexes 384-dimensional embeddings into FAISS, and performs hybrid retrieval (SQL exact numbers + semantic chunks) with clickable citations.
3. **Configurable LLM Service**: Supports Google Gemini, OpenAI, Groq, Ollama (local inference), and an honest offline evidence-grounded fallback engine when credentials are unconfigured.
4. **Normalized Relational Database**: MySQL 8.0 schema (with SQLite fallback) tracking colleges, courses, cutoffs, fee structures, placement audits, scholarships, and verified sources.
5. **Modern React Frontend**: Built with Vite, Tailwind CSS, React Router, Axios, and Recharts.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0 |
| **Database** | MySQL 8.0 (Primary) / SQLite (Development Fallback) |
| **RAG & Vector Search** | SentenceTransformers (`all-MiniLM-L6-v2`), FAISS (`faiss-cpu`), PyPDF |
| **LLM Providers** | Google Gemini API, OpenAI API, Groq, Ollama, Grounded Evidence Fallback |

---

## Project Structure

```
college-guide-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, lifespan, /health
│   │   ├── config.py            # Settings and environment variables
│   │   ├── database.py          # SQLAlchemy engine, session, init_db
│   │   ├── models.py            # Normalized ORM database models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── colleges.py      # /api/colleges, /api/compare, /api/sources
│   │   │   ├── recommendations.py # /api/recommendations
│   │   │   ├── chat.py          # /api/chat (RAG conversational engine)
│   │   │   └── admin.py         # /api/admin/ingest, /api/admin/reindex
│   │   └── services/
│   │       ├── college_service.py # College listing, detail, comparison logic
│   │       ├── recommendation.py  # Hard constraints & suitability scoring
│   │       ├── ingestion.py       # PDF parsing, chunking & FAISS index builder
│   │       ├── retriever.py       # Hybrid SQL + Vector retriever
│   │       ├── rag.py             # RAG orchestrator
│   │       └── llm_service.py     # Multi-provider LLM & offline fallback
│   ├── database/
│   │   └── schema.sql           # MySQL 8.0 production DDL schema
│   ├── tests/
│   │   ├── test_validation.py   # Student profile & exam validation tests
│   │   ├── test_recommendation.py # Hard constraints & suitability tier tests
│   │   ├── test_rag.py          # SQL fee/cutoff retrieval & citation tests
│   │   └── test_api.py          # FastAPI endpoint integration tests
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Footer
│   │   ├── context/             # AppContext (Profile, Comparison tray)
│   │   ├── pages/               # LandingPage, ProfilePage, RecommendationsPage,
│   │   │                        # CollegeDetailPage, ComparePage, ChatbotPage, SourcesPage
│   │   ├── services/            # Axios API client
│   │   ├── App.jsx              # React Router routes
│   │   └── main.jsx             # React entrypoint
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── data/
│   ├── colleges.csv             # Verified colleges master data
│   ├── courses.csv              # Approved engineering programs
│   ├── cutoffs.csv              # 2024 & 2023 closing cutoff marks/ranks
│   ├── fees.csv                 # Audited tuition and hostel expenses
│   ├── placements.csv           # Audited CTC packages and recruiters
│   ├── scholarships.csv         # Verified waivers and criteria
│   ├── sources.csv              # Regulatory authorities and URLs
│   ├── documents/               # Official brochures and guidelines (.pdf & .txt)
│   └── README.md
├── scripts/
│   ├── generate_documents.py    # Generates official admissions guides
│   ├── import_colleges.py       # Populates database from CSV datasets
│   ├── ingest_documents.py      # Parses PDFs, chunks, and builds FAISS index
│   └── rebuild_index.py         # Re-indexes chunks directly into FAISS
├── docs/
│   ├── architecture.md          # Architecture & Mermaid system diagrams
│   ├── database_schema.md       # Entity-Relationship diagram and table specs
│   └── rag_pipeline.md          # Hybrid retrieval & RAG evaluation docs
├── README.md
└── .gitignore
```

---

## Step-by-Step Setup & Installation

### 1. Prerequisites
- **Python**: Version 3.10+ (Tested on Python 3.13)
- **Node.js**: Version 18+ (Tested on Node v22.14.0, npm 11.2.0)
- **MySQL Server** (Optional for production; SQLite works out-of-the-box for local development)

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd college-guide-ai/backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your settings:
   ```ini
   # For MySQL (Production):
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/college_guide_ai

   # Or for SQLite (Local zero-configuration development):
   DATABASE_URL=sqlite:///./college_guide.db

   # LLM Provider: gemini, openai, groq, ollama, or fallback
   LLM_PROVIDER=fallback
   LLM_API_KEY=
   LLM_MODEL_NAME=gemini-1.5-flash
   OLLAMA_BASE_URL=http://localhost:11434

   # Admin Key for protected ingestion endpoints
   ADMIN_API_KEY=admin-secret-key-change-in-production
   ```

---

### 3. Database Setup & Data Ingestion

#### If Using MySQL:
1. Log into your MySQL console and execute `schema.sql`:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
2. Set your `DATABASE_URL` in `.env`.

#### Populate Database and Build Vector Index:
Run the initialization scripts from the project root:
```bash
# 1. Generate verified admissions text & PDF documents
python scripts/generate_documents.py

# 2. Import verified colleges, cutoffs, fees, placements, and scholarships
python scripts/import_colleges.py

# 3. Parse PDFs, create chunks, and build the FAISS vector index
python scripts/ingest_documents.py
```

---

### 4. Running the Backend Server

Start the FastAPI backend with Uvicorn:
```bash
# From college-guide-ai/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

---

### 5. Frontend Setup & Execution

1. **Navigate to the frontend directory**:
   ```bash
   cd college-guide-ai/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
- Frontend Application URL: `http://localhost:5173`

---

## Running the Automated Test Suite

College Guide AI includes comprehensive tests covering profile validation, budget filtering, historical cutoff matching, hybrid SQL/vector retrieval, citation extraction, and API endpoints.

Execute tests using pytest:
```bash
cd college-guide-ai/backend
python -m pytest tests -v
```

All 20 test cases will execute and verify the system:
- `test_health_check_endpoint`: Verifies DB, FAISS, and LLM health checks.
- `test_list_colleges_endpoint` & `test_college_detail_endpoint`: Verifies college retrieval.
- `test_recommendations_endpoint`: Verifies suitability tiering.
- `test_compare_colleges_endpoint`: Verifies multi-college matrix generation.
- `test_chat_endpoint`: Verifies RAG conversational generation.
- `test_sql_fee_evidence_retrieval` & `test_sql_cutoff_evidence_retrieval`: Verifies numerical SQL lookup.
- `test_fallback_answering_no_hallucinations`: Verifies that citations strictly use real URLs.
- `test_tnea_cse_top_score_recommendation`: Verifies TNEA cutoff evaluation.
- `test_hard_tuition_budget_constraint`: Verifies strict budget adherence.
- `test_jee_main_nitt_recommendation`: Verifies JEE All India Rank matching.
- `test_unsupported_exam_no_fabricated_colleges`: Verifies no fictitious data is invented.
- `test_valid_tnea_profile` & boundary validation tests.

---

## Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Application status, database connection, FAISS index readiness |
| `GET` | `/api/colleges` | List colleges with query, city, state, and type filters |
| `GET` | `/api/colleges/{id}` | Detailed college profile (courses, cutoffs, fees, placements, sources) |
| `POST` | `/api/recommendations` | Submit qualifications to receive Ambitious, Better-Matched, and Alternative options |
| `POST` | `/api/compare` | Compare 2 to 4 colleges with matrix table and Recharts visual metrics |
| `POST` | `/api/chat` | Conversational RAG assistant grounded in verified documents |
| `GET` | `/api/scholarships` | Directory of verified scholarships and tuition fee waivers |
| `GET` | `/api/sources` | Complete audit trail of primary authorities and verification dates |
| `POST` | `/api/admin/ingest` | Protected endpoint (`X-Admin-Key`) for uploading official brochures |
| `POST` | `/api/admin/reindex` | Protected endpoint (`X-Admin-Key`) for rebuilding the FAISS vector index |

---

## Security & Transparency Principles

1. **No Fabricated Information**: Missing fees or cutoff ranks are explicitly labeled as unknown rather than invented.
2. **Deterministic Eligibility**: Mandatory Class 12 PCM eligibility thresholds are strictly verified before ranking scores are evaluated.
3. **No False Guarantees**: Cutoff evaluations are clearly described as historical estimates, not admission guarantees.
4. **Credential Isolation**: All LLM API keys and database credentials remain on the server and are never exposed to the frontend.
