# Start Backend
Write-Host "Starting Backend (.NET API)..." -ForegroundColor Cyan
Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory ".\src\Backend\Ams.Api" -NoNewWindow

# Wait a few seconds for the backend to initialize before starting the frontend
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend (React/Vite)..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\src\Frontend" -NoNewWindow

Write-Host "Both applications are starting up! Keep this window open." -ForegroundColor Yellow
