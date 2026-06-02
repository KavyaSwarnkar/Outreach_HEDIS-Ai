@echo off
echo Starting Backend (FastAPI + DuckDB) on port 8080...
start cmd /k "cd backend && .\venv\Scripts\uvicorn main:app --port 8080"

echo Starting Frontend (Next.js) on port 3005...
start cmd /k "cd frontend && npm run dev -- -p 3005"

echo Both servers are starting in new windows.
echo Frontend will be available at http://localhost:3005
echo Backend will be available at http://localhost:8080
