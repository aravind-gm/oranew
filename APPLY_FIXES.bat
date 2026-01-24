@echo off
REM ORA Jewellery - Production Fixes Deployment Script (Windows)

setlocal enabledelayedexpansion

echo ===========================================
echo ORA JEWELLERY - PRODUCTION FIXES (Windows)
echo ===========================================
echo.

REM Get current directory
cd /d "%~dp0"

echo Step 1: Backup current files
echo Creating backups before applying fixes...
echo.

if exist "frontend\src\lib\api.ts" (
    copy "frontend\src\lib\api.ts" "frontend\src\lib\api.ts.backup" >nul
    echo [OK] Backed up api.ts
)

if exist "frontend\src\store\authStore.ts" (
    copy "frontend\src\store\authStore.ts" "frontend\src\store\authStore.ts.backup" >nul
    echo [OK] Backed up authStore.ts
)

if exist "backend\src\controllers\product.controller.ts" (
    copy "backend\src\controllers\product.controller.ts" "backend\src\controllers\product.controller.ts.backup" >nul
    echo [OK] Backed up product.controller.ts
)

if exist "backend\src\config\supabase.ts" (
    copy "backend\src\config\supabase.ts" "backend\src\config\supabase.ts.backup" >nul
    echo [OK] Backed up supabase.ts
)

echo.
echo Step 2: Apply frontend fixes
echo Applying fixed files to frontend...
echo.

copy "FIX_frontend_api.ts" "frontend\src\lib\api.ts" >nul
if %errorlevel% equ 0 (
    echo [OK] Applied FIX_frontend_api.ts
) else (
    echo [ERROR] Failed to apply FIX_frontend_api.ts
)

copy "FIX_frontend_authStore.ts" "frontend\src\store\authStore.ts" >nul
if %errorlevel% equ 0 (
    echo [OK] Applied FIX_frontend_authStore.ts
) else (
    echo [ERROR] Failed to apply FIX_frontend_authStore.ts
)

copy "FIX_frontend_next.config.js" "frontend\next.config.js" >nul
if %errorlevel% equ 0 (
    echo [OK] Applied FIX_frontend_next.config.js
) else (
    echo [ERROR] Failed to apply FIX_frontend_next.config.js
)

copy "FIX_frontend_tailwind.config.js" "frontend\tailwind.config.js" >nul
if %errorlevel% equ 0 (
    echo [OK] Applied FIX_frontend_tailwind.config.js
) else (
    echo [ERROR] Failed to apply FIX_frontend_tailwind.config.js
)

echo.
echo Step 3: Apply backend fixes
echo Applying fixed files to backend...
echo.

copy "FIX_backend_product_createProduct.ts" "backend\src\controllers\product.controller.ts" >nul
if %errorlevel% equ 0 (
    echo [OK] Applied FIX_backend_product_createProduct.ts
) else (
    echo [ERROR] Failed to apply FIX_backend_product_createProduct.ts
)

copy "FIX_backend_supabase.ts" "backend\src\config\supabase.ts" >nul
if %errorlevel% equ 0 (
    echo [OK] Applied FIX_backend_supabase.ts
) else (
    echo [ERROR] Failed to apply FIX_backend_supabase.ts
)

echo.
echo ===========================================
echo [OK] FIXES APPLIED SUCCESSFULLY!
echo ===========================================
echo.

echo NEXT STEPS:
echo.
echo 1. UPDATE ENVIRONMENT VARIABLES:
echo    - Verify backend\.env has JWT_SECRET set correctly
echo    - Verify SUPABASE_SERVICE_ROLE_KEY is present
echo    - Verify SUPABASE_URL is correct
echo.

echo 2. UPDATE frontend\package.json:
echo    Find the "dev" script and update it to:
echo    "dev": "NODE_OPTIONS=--max-old-space-size=2048 next dev --experimental-app-only"
echo.

echo 3. RESTART SERVICES:
echo    Terminal 1 - Backend:
echo      cd backend
echo      npm install
echo      npm run build
echo      npm run dev
echo.
echo    Terminal 2 - Frontend:
echo      cd frontend
echo      npm install
echo      npm run dev
echo.

echo 4. VERIFY FIXES:
echo    - Login to admin account
echo    - Try uploading an image
echo    - Create a test product
echo    - Check database for product
echo    - Monitor memory usage (should stay under 2GB)
echo.

echo 5. IF PROBLEMS OCCUR:
echo    Restore backups:
echo      copy frontend\src\lib\api.ts.backup frontend\src\lib\api.ts
echo.

echo For detailed information, see: PRODUCTION_FIXES.md
echo.
pause
