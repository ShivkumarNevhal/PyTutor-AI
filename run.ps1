Write-Host "Starting PyTutor AI Backend and Frontend..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\venv\Scripts\activate'; uvicorn src.fast_api_backend:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
