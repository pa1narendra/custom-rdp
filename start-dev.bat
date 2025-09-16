@echo off
echo Starting Screenshare App Development Environment...
echo.

echo Starting MongoDB and Redis...
docker-compose up -d
timeout /t 3 > nul

echo.
echo Starting Backend Server (Port 8080)...
start "Backend" cmd /c "cd packages\backend && bun run dev"
timeout /t 3 > nul

echo.
echo Starting Frontend Server (Port 3000)...
start "Frontend" cmd /c "cd packages\frontend && bun run dev"

echo.
echo Development servers starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8080
echo API Docs: http://localhost:8080/swagger
echo.
echo Press any key to exit...
pause > nul