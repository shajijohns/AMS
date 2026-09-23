<#
.SYNOPSIS
    Builds and starts the AssociationPortal application in Docker for release.

.DESCRIPTION
    This script changes into the src directory, stops any currently running containers,
    rebuilds the frontend and backend Docker images to ensure they have the latest code,
    and then starts the containers in detached mode.

.EXAMPLE
    .\dockerrelease.ps1
#>

$ErrorActionPreference = "Stop"

# Check if Docker is available and running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker daemon is not running."
        exit 1
    }
} catch {
    Write-Error "Docker is not available. Please install Docker."
    exit 1
}

# Store the current location so we can return to it later
$originalLocation = Get-Location

try {
    # Change into the src directory where the docker-compose.yml is located
    Set-Location -Path ".\src"

    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " AssociationPortal Docker Release Script  " -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "[1/4] Stopping any existing containers..." -ForegroundColor Yellow
    docker-compose down

    Write-Host "`n[2/4] Building latest Docker images..." -ForegroundColor Yellow
    # Using --no-cache can be added if you want a fully clean build every time: docker-compose build --no-cache
    docker-compose build

    Write-Host "`n[3/4] Starting containers in detached mode..." -ForegroundColor Yellow
    docker-compose up -d

    Write-Host "`n[4/4] Verifying running containers..." -ForegroundColor Yellow
    docker-compose ps

    $containerIds = docker-compose ps -q
    if (-not $containerIds) {
        Write-Error "No containers were started."
        exit 1
    }

    $allRunning = $true
    foreach ($id in $containerIds) {
        $status = docker inspect -f '{{.State.Running}}' $id
        if ($status -ne 'true') {
            $allRunning = $false
            break
        }
    }

    if (-not $allRunning) {
        Write-Error "One or more containers failed to start or are not running."
        exit 1
    }

    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host " Release deployed successfully!" -ForegroundColor Green
    Write-Host " Frontend is available at: http://localhost:5173" -ForegroundColor Green
    Write-Host " Backend API is mapped to: http://localhost:5200" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
}
finally {
    # Always return to the original location even if the script fails
    Set-Location -Path $originalLocation
}
