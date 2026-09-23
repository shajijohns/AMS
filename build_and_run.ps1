param (
    [switch]$BuildOnly
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      Association Management System Build & Run Script      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Build Backend
Write-Host "`n[1/4] Building .NET Backend..." -ForegroundColor Yellow
Push-Location src\Backend
dotnet build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}
Pop-Location

# 2. Build Frontend (Install & Build)
Write-Host "`n[2/4] Installing Frontend Dependencies and Building..." -ForegroundColor Yellow
Push-Location src\Frontend
npm install --legacy-peer-deps
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}
Pop-Location

if ($BuildOnly) {
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    exit 0
}

# 3. Run Services
Write-Host "`n[3/4] Starting Backend API in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src\Backend\Ams.Api; dotnet run"

Write-Host "`n[4/4] Starting Frontend Dev Server in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src\Frontend; npm run dev"

Write-Host "`nBoth services are launching! You can close the new windows to stop them." -ForegroundColor Cyan
