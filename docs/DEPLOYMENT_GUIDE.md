# CollegeGuide AI — Production Deployment & PWA Installation Guide

This guide provides end-to-end instructions for deploying **CollegeGuide AI** (FastAPI backend + Vite React PWA frontend) to production cloud platforms (Render + Vercel) and installing the web app as a Progressive Web App (PWA) on Android and desktop devices.

---

## 1. Architecture & Deployment Options

```mermaid
flowchart LR
    A["Android / Mobile Browser<br>(PWA Standalone App)"] -->|HTTPS Requests| B["Vercel / Render Static Site<br>(React Vite Frontend)"]
    C["Desktop Browser<br>(Chrome / Edge PWA)"] -->|HTTPS Requests| B
    B -->|REST API with CORS| D["Render Web Service<br>(FastAPI Python 3.11)"]
    D -->|SQLAlchemy| E[("Database<br>SQLite / MySQL / Postgres")]
    D -->|OpenAI-Compatible REST| F["OpenRouter API<br>(Llama 3.3 / DeepSeek / Claude)"]
```

### Recommended Hosting Stack
- **Backend:** [Render](https://render.com) (Python Web Service) or [Railway](https://railway.app).
- **Frontend:** [Vercel](https://vercel.com) (Recommended for React SPAs with global CDN) or [Render Static Site](https://render.com).
- **Database:** Bundled SQLite (zero extra cost) OR cloud MySQL / PostgreSQL (Supabase, Neon, PlanetScale, Aiven).

---

## 2. Option A: Deploying Backend on Render

Render automatically detects the repository and can deploy using the included `render.yaml` or via the Render dashboard.

### Step 1: Push Code to GitHub
Ensure all your latest changes are pushed to your GitHub repository:
```bash
git push origin main
```

### Step 2: Create a Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`COLLEGE_GUIDE_AI`).
4. Configure the service settings:
   - **Name:** `collegeguide-backend`
   - **Region:** Choose closest to your users (e.g., *Oregon* or *Frankfurt* or *Singapore*)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`

### Step 3: Configure Environment Variables in Render
In the **Environment** tab, add the following variables:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |
| `DATABASE_URL` | `sqlite:///./college_guide.db` | Local SQLite or your cloud database connection string |
| `LLM_PROVIDER` | `openrouter` | Cloud LLM integration provider |
| `OPENROUTER_API_KEY` | `sk-or-v1-your-key-here` | Your OpenRouter secret key |
| `OPENROUTER_MODEL` | `deepseek/deepseek-chat` | Chosen OpenRouter model |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter endpoint |
| `ADMIN_API_KEY` | *(A strong random string)* | Protects admin ingestion routes |
| `CORS_ORIGINS` | `*` *(or your Vercel URL)* | Allowed frontend origins |

### Step 4: Health Check Configuration
- In Render **Advanced Settings**, set **Health Check Path** to: `/health`
- Render will ping `/health` before routing traffic to ensure zero downtime.

---

## 3. Option B: Deploying Frontend on Vercel

Vercel provides instant SSL, worldwide edge CDN, and native SPA routing using `frontend/vercel.json`.

### Step 1: Connect Repository to Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`COLLEGE_GUIDE_AI`).
4. Set the **Root Directory** to `frontend`.
5. Framework preset will automatically be recognized as **Vite**.

### Step 2: Configure Build Settings & Environment Variables
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: Set this to your deployed Render backend URL (e.g., `https://collegeguide-backend.onrender.com` without trailing slash).

### Step 3: Deploy
1. Click **Deploy**.
2. Once the build finishes (approx. 30 seconds), Vercel will give you a public URL (e.g., `https://collegeguide-ai.vercel.app`).
3. Update the backend's `CORS_ORIGINS` in Render with this URL if you prefer strict CORS!

---

## 4. Alternative: 1-Click Blueprint on Render (`render.yaml`)

We have included a complete `render.yaml` blueprint at the root of the repository.

1. Go to **Render Dashboard** > **Blueprints** > **New Blueprint Instance**.
2. Select your repository.
3. Render reads `render.yaml` and provisions:
   - Backend Web Service (`collegeguide-backend`)
   - Frontend Static Site (`collegeguide-frontend`)
   - Automatically links `VITE_API_URL` to the backend host!
4. Enter your `OPENROUTER_API_KEY` when prompted and click **Apply**.

---

## 5. Database Setup & Data Migration

### Zero-Configuration (Default SQLite)
The application includes a pre-seeded SQLite database with 13 top engineering institutions, cutoffs, placements, scholarships, and fee structures. It starts working immediately with zero database setup.

### Hosted MySQL / PostgreSQL Setup
If you want to use a cloud database (Supabase, Neon, PlanetScale, AWS RDS, Aiven):
1. Create a MySQL or PostgreSQL database on your cloud provider.
2. Set `DATABASE_URL` in your backend environment variables:
   - **PostgreSQL:** `postgresql://username:password@host:port/dbname`
   - **MySQL:** `mysql+pymysql://username:password@host:port/dbname`
3. Run the automated seed script to populate all tables and data:
   ```bash
   python scripts/import_colleges.py
   ```
4. Rebuild vector search embeddings (optional if running RAG):
   ```bash
   python scripts/rebuild_rag_index.py
   ```

---

## 6. Progressive Web App (PWA) & Android Installation

CollegeGuide AI is configured as a fully installable PWA with an app manifest, service worker caching, and high-resolution icons.

### Installing on Android (Google Chrome & Edge)
1. Open the deployed website URL (e.g. `https://collegeguide-ai.vercel.app`) in **Google Chrome** on your Android phone.
2. Chrome will automatically detect the PWA manifest and show an **"Install CollegeGuide AI"** banner or badge at the bottom of the screen.
3. If the banner does not appear automatically:
   - Tap the **three vertical dots (⋮)** in the top right corner of Chrome.
   - Tap **"Install app"** (or **"Add to Home screen"**).
   - Tap **Install** in the confirmation dialog.
4. The CollegeGuide AI icon will appear on your phone's home screen and app drawer.
5. Tap the icon to launch the app in **standalone mode** (full-screen, no URL address bar, native app feel).

### Installing on Desktop (Windows / macOS / ChromeOS)
1. Open the deployed website in **Google Chrome** or **Microsoft Edge**.
2. In the right side of the address bar, look for the **Install** icon (a computer monitor with an arrow or a `+` symbol).
3. Click **Install**. The app will open in its own dedicated, native desktop window.

---

## 7. AI Verification & Testing

### Test Backend Health
```bash
curl -X GET "https://your-backend.onrender.com/health"
```
*Expected response:*
```json
{
  "status": "healthy",
  "database": "connected",
  "llm_provider": "openrouter",
  "llm_model": "deepseek/deepseek-chat"
}
```

### Test Interactive Documentation
Visit `https://your-backend.onrender.com/docs` to test all college search, recommendation, and chat endpoints directly in Swagger UI.
