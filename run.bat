@echo off
echo Starting PyTutor AI Backend and Frontend...

start "Backend - FastAPI" cmd /k "call venv\Scripts\activate && uvicorn src.fast_api_backend:app --reload --port 8000"
start "Frontend - Vite React" cmd /k "cd frontend && npm run dev"
