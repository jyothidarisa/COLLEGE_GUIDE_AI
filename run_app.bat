@echo off
echo ===================================================
echo Starting College Guide AI (Backend + Frontend)
echo ===================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "College Guide AI - Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo Starting Vite React Frontend on http://localhost:5173 ...
start "College Guide AI - Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 2 /nobreak > nul

echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo Application is running! Keep the terminal windows open.
pause
