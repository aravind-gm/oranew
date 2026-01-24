#!/bin/bash
# ORA Jewellery - Production Fixes Deployment Script

echo "==========================================="
echo "ORA JEWELLERY - PRODUCTION FIXES"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    IS_WINDOWS=true
    COPY_CMD="copy"
    KILL_CMD="taskkill /F /PID"
else
    IS_WINDOWS=false
    COPY_CMD="cp"
    KILL_CMD="kill -9"
fi

echo -e "${YELLOW}Step 1: Backup current files${NC}"
echo "Creating backups before applying fixes..."
cd "$(dirname "$0")"

# Backup frontend files
if [ -f "frontend/src/lib/api.ts" ]; then
    if [ "$IS_WINDOWS" = true ]; then
        copy "frontend\src\lib\api.ts" "frontend\src\lib\api.ts.backup"
    else
        cp frontend/src/lib/api.ts frontend/src/lib/api.ts.backup
    fi
    echo "✅ Backed up api.ts"
fi

if [ -f "frontend/src/store/authStore.ts" ]; then
    if [ "$IS_WINDOWS" = true ]; then
        copy "frontend\src\store\authStore.ts" "frontend\src\store\authStore.ts.backup"
    else
        cp frontend/src/store/authStore.ts frontend/src/store/authStore.ts.backup
    fi
    echo "✅ Backed up authStore.ts"
fi

# Backup backend files
if [ -f "backend/src/controllers/product.controller.ts" ]; then
    if [ "$IS_WINDOWS" = true ]; then
        copy "backend\src\controllers\product.controller.ts" "backend\src\controllers\product.controller.ts.backup"
    else
        cp backend/src/controllers/product.controller.ts backend/src/controllers/product.controller.ts.backup
    fi
    echo "✅ Backed up product.controller.ts"
fi

if [ -f "backend/src/config/supabase.ts" ]; then
    if [ "$IS_WINDOWS" = true ]; then
        copy "backend\src\config\supabase.ts" "backend\src\config\supabase.ts.backup"
    else
        cp backend/src/config/supabase.ts backend/src/config/supabase.ts.backup
    fi
    echo "✅ Backed up supabase.ts"
fi

echo ""
echo -e "${YELLOW}Step 2: Apply frontend fixes${NC}"
echo "Applying fixed files to frontend..."

if [ "$IS_WINDOWS" = true ]; then
    copy "FIX_frontend_api.ts" "frontend\src\lib\api.ts"
    copy "FIX_frontend_authStore.ts" "frontend\src\store\authStore.ts"
    copy "FIX_frontend_next.config.js" "frontend\next.config.js"
    copy "FIX_frontend_tailwind.config.js" "frontend\tailwind.config.js"
else
    cp FIX_frontend_api.ts frontend/src/lib/api.ts
    cp FIX_frontend_authStore.ts frontend/src/store/authStore.ts
    cp FIX_frontend_next.config.js frontend/next.config.js
    cp FIX_frontend_tailwind.config.js frontend/tailwind.config.js
fi

echo "✅ Frontend fixes applied"

echo ""
echo -e "${YELLOW}Step 3: Apply backend fixes${NC}"
echo "Applying fixed files to backend..."

if [ "$IS_WINDOWS" = true ]; then
    copy "FIX_backend_product_createProduct.ts" "backend\src\controllers\product.controller.ts"
    copy "FIX_backend_supabase.ts" "backend\src\config\supabase.ts"
else
    cp FIX_backend_product_createProduct.ts backend/src/controllers/product.controller.ts
    cp FIX_backend_supabase.ts backend/src/config/supabase.ts
fi

echo "✅ Backend fixes applied"

echo ""
echo -e "${YELLOW}Step 4: Update package.json for memory management${NC}"
echo "Updating frontend package.json with memory limits..."

# Update package.json with memory limits (requires jq or manual editing on Windows)
if [ "$IS_WINDOWS" = false ] && command -v jq &> /dev/null; then
    jq '.scripts.dev = "NODE_OPTIONS=\"--max-old-space-size=2048\" next dev --experimental-app-only"' frontend/package.json > frontend/package.json.tmp
    mv frontend/package.json.tmp frontend/package.json
    echo "✅ Updated frontend package.json with memory limit"
else
    echo -e "${YELLOW}⚠️  Manual step required:${NC}"
    echo "Edit frontend/package.json and update the dev script to:"
    echo '  "dev": "NODE_OPTIONS="--max-old-space-size=2048" next dev --experimental-app-only"'
fi

echo ""
echo -e "${GREEN}==========================================="
echo "✅ FIXES APPLIED SUCCESSFULLY!"
echo "==========================================${NC}"
echo ""

echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1️⃣  UPDATE ENVIRONMENT VARIABLES:"
echo "   • Verify backend/.env has JWT_SECRET set correctly"
echo "   • Verify SUPABASE_SERVICE_ROLE_KEY is present"
echo "   • Verify SUPABASE_URL is correct"
echo ""

echo "2️⃣  RESTART SERVICES:"
echo "   Terminal 1 - Backend:"
echo "     cd backend"
echo "     npm install  # Install any new dependencies"
echo "     npm run build"
echo "     npm run dev"
echo ""
echo "   Terminal 2 - Frontend:"
echo "     cd frontend"
echo "     npm install  # Install any new dependencies"
echo "     npm run dev"
echo ""

echo "3️⃣  VERIFY FIXES:"
echo "   ✓ Login to admin account"
echo "   ✓ Try uploading an image"
echo "   ✓ Create a test product"
echo "   ✓ Check database for product"
echo "   ✓ Monitor memory usage (should stay under 2GB)"
echo ""

echo "4️⃣  RUN TESTS:"
echo "   See PRODUCTION_FIXES.md for full verification checklist"
echo ""

echo "5️⃣  IF PROBLEMS OCCUR:"
echo "   Restore backups:"
if [ "$IS_WINDOWS" = true ]; then
    echo "   copy frontend\src\lib\api.ts.backup frontend\src\lib\api.ts"
else
    echo "   cp frontend/src/lib/api.ts.backup frontend/src/lib/api.ts"
fi
echo ""
echo "   Check logs for:"
echo "   • [Auth Middleware] messages in backend"
echo "   • [Axios] messages in browser console"
echo "   • [AuthStore] messages in browser console"
echo ""

echo -e "${GREEN}For detailed information, see: PRODUCTION_FIXES.md${NC}"
