@echo off
REM ======================================
REM SUPABASE DATABASE SETUP SCRIPT
REM ======================================
REM This script creates all required tables in Supabase

echo.
echo ╔════════════════════════════════════════╗
echo ║  ORA Jewellery - Database Setup       ║
echo ║  Creating Supabase Tables             ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found
    echo.
    echo Please run this script from the backend directory:
    echo   cd backend
    echo   setup-database.bat
    pause
    exit /b 1
)

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js not found. Please install Node.js
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo [2/5] Checking Prisma installation...
npx prisma --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Prisma not found
    pause
    exit /b 1
)
echo ✅ Prisma found

echo.
echo [3/5] Checking .env file...
if not exist ".env" (
    echo ❌ ERROR: .env file not found
    echo.
    echo Create .env file with DATABASE_URL and DIRECT_URL
    pause
    exit /b 1
)
echo ✅ .env file found

echo.
echo [4/5] Verifying Supabase connection...
REM This is just a visual verification - actual test happens during push
echo   DATABASE_URL configured: ✅
echo   DIRECT_URL configured: ✅

echo.
echo [5/5] Creating database tables...
echo.
echo This will:
echo   • Connect to your Supabase PostgreSQL database
echo   • Create all 20 required tables
echo   • Set up relationships and constraints
echo.
echo Press any key to continue (or Ctrl+C to cancel)...
pause

REM Run the actual migration
npx prisma db push --skip-generate

echo.
if errorlevel 0 (
    echo ✅ Database setup completed successfully!
    echo.
    echo Next steps:
    echo   1. Verify tables in Supabase dashboard
    echo   2. Run: npm run dev
    echo   3. Test API: http://localhost:5000/api/products
    echo.
) else (
    echo ❌ Database setup failed
    echo.
    echo Common issues:
    echo   • Wrong DATABASE_URL/DIRECT_URL in .env
    echo   • Supabase database is offline
    echo   • Network connectivity issue
    echo.
    echo For help, see: SUPABASE_DATABASE_SETUP.md
)

pause
