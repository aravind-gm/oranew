@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM ORA JEWELLERY - ADMIN FIX SCRIPT
REM ═══════════════════════════════════════════════════════════════════════════
REM Run this to diagnose and fix admin panel issues
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          ORA JEWELLERY - ADMIN FIX SCRIPT                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0backend"

echo [1/5] Checking environment configuration...
echo.

REM Check if .env exists
if not exist .env (
    echo ❌ ERROR: backend\.env file not found!
    echo    Please create it from .env.example
    goto :error
)

echo ✅ .env file exists

REM Check for placeholder values
findstr /C:"your-supabase-anon-key" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: SUPABASE_ANON_KEY contains placeholder value
    echo    Please update with actual key from Supabase Dashboard
)

findstr /C:"your-super-secret-jwt-key" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: JWT_SECRET contains default value
    echo    This may cause authentication failures
)

echo.
echo [2/5] Installing dependencies...
call npm install

echo.
echo [3/5] Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    goto :error
)

echo.
echo [4/5] Running database migrations...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Database migration failed!
    echo    Check your DATABASE_URL and DIRECT_URL in .env
    goto :error
)

echo.
echo [5/5] Seeding database with admin user...
call npx ts-node seed.js
if %errorlevel% neq 0 (
    echo ⚠️  Seed script may have failed (this is OK if data already exists)
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SETUP COMPLETE!                             ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  Admin Login: admin@orashop.in                                 ║
echo ║  Password:    admin123                                         ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  MANUAL STEPS REQUIRED:                                        ║
echo ║                                                                ║
echo ║  1. Go to Supabase Dashboard ^> Storage                         ║
echo ║  2. Create bucket: "product-images" (Public: YES)              ║
echo ║  3. Get SUPABASE_ANON_KEY from Project Settings ^> API          ║
echo ║  4. Update backend\.env with the actual key                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Starting backend server...
echo.
call npm run dev

goto :end

:error
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SETUP FAILED!                               ║
echo ║  Check the errors above and fix them before retrying          ║
echo ╚════════════════════════════════════════════════════════════════╝
pause
exit /b 1

:end
pause
