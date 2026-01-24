@echo off
REM Docker Status Checker
REM Run this to check the status of your Docker deployment

echo ==========================================
echo   ORA E-COMMERCE - Docker Status
echo ==========================================
echo.

echo [1] Container Status
echo ==========================================
docker compose ps
echo.

echo [2] Recent Logs (Last 20 lines)
echo ==========================================
docker compose logs --tail=20
echo.

echo [3] Health Check
echo ==========================================
echo Checking backend health...
curl -s http://localhost:5000/health 2>nul
if errorlevel 1 (
    echo Backend not responding yet
) else (
    echo.
)
echo.

echo Checking frontend...
curl -s -o nul -w "Frontend Status: %%{http_code}\n" http://localhost:3000 2>nul
if errorlevel 1 (
    echo Frontend not responding yet
)
echo.

echo [4] Quick Commands
echo ==========================================
echo View live logs:        docker compose logs -f
echo Restart backend:       docker compose restart backend
echo Stop all:              docker compose stop
echo Remove all:            docker compose down
echo Init database:         docker exec ora-backend npx prisma migrate deploy
echo.

pause
