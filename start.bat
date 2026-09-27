@echo off
echo Starting Backend (.NET API)...
start cmd /k "cd src\Backend\Ams.Api && dotnet run"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend (React/Vite)...
start cmd /k "cd src\Frontend && npm run dev"

echo Both applications have been launched in separate windows!
exit
