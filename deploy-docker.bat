@echo off
REM ORA E-Commerce Docker Deployment Script
REM Run this script to deploy the application with Docker

echo ==========================================
echo   ORA E-COMMERCE - Docker Deployment
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [✓] Docker is running
echo.

REM Check if .env exists
if not exist .env (
    echo [!] .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo [!] IMPORTANT: Please edit .env file with your configuration
    echo Press any key to open .env in notepad...
    pause
    notepad .env
    echo.
)

echo [✓] Environment file ready
echo.

REM Prompt for action
echo What would you like to do?
echo.
echo 1. Fresh Start (Clean build + start)
echo 2. Start (Use existing images)
echo 3. Stop all services
echo 4. View logs
echo 5. Initialize database
echo 6. Full cleanup (removes all data!)
echo 0. Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto fresh_start
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto init_db
if "%choice%"=="6" goto cleanup
if "%choice%"=="0" goto end

echo Invalid choice
goto end

:fresh_start
echo.
echo ==========================================
echo   Fresh Start - Building containers...
echo ==========================================
echo.
docker-compose down
docker-compose up -d --build
echo.
echo [✓] Containers built and started!
echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul
echo.
goto show_status

:start
echo.
echo ==========================================
echo   Starting containers...
echo ==========================================
echo.
docker-compose up -d
echo.
echo [✓] Containers started!
echo.
timeout /t 5 /nobreak >nul
goto show_status

:stop
echo.
echo ==========================================
echo   Stopping all services...
echo ==========================================
echo.
docker-compose stop
echo.
echo [✓] All services stopped!
goto end

:logs
echo.
echo ==========================================
echo   Viewing logs (Ctrl+C to exit)...
echo ==========================================
echo.
docker-compose logs -f
goto end

:init_db
echo.
echo ==========================================
echo   Initializing Database...
echo ==========================================
echo.
echo Running Prisma migrations...
docker exec ora-backend npx prisma migrate deploy
echo.
set /p seed="Do you want to seed database with sample data? (y/n): "
if /i "%seed%"=="y" (
    echo Seeding database...
    docker exec ora-backend npm run prisma:seed
    echo [✓] Database seeded!
) else (
    echo Skipping seed...
)
echo.
echo [✓] Database initialized!
goto end

:cleanup
echo.
echo ==========================================
echo   WARNING: Full Cleanup
echo ==========================================
echo.
echo This will:
echo - Stop all containers
echo - Remove all containers
echo - Remove all volumes (DATABASE WILL BE DELETED!)
echo - Remove all images
echo.
set /p confirm="Are you ABSOLUTELY sure? Type 'yes' to confirm: "
if /i not "%confirm%"=="yes" (
    echo Cleanup cancelled.
    goto end
)
echo.
echo Performing full cleanup...
docker-compose down -v
docker system prune -a -f
echo.
echo [✓] Full cleanup completed!
goto end

:show_status
echo ==========================================
echo   Container Status
echo ==========================================
echo.
docker-compose ps
echo.
echo ==========================================
echo   Access Information
echo ==========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000
echo Database:  localhost:5432
echo.
echo ==========================================
echo   Quick Commands
echo ==========================================
echo.
echo View logs:         docker-compose logs -f
echo Check status:      docker-compose ps
echo Stop services:     docker-compose stop
echo Restart service:   docker-compose restart [service]
echo.
set /p open_browser="Open frontend in browser? (y/n): "
if /i "%open_browser%"=="y" (
    start http://localhost:3000
)
echo.

:end
echo.
echo Press any key to exit...
pause >nul
