#!/bin/bash

# Supabase Auth Implementation Verification Script
# Run this to verify all changes were applied correctly

echo "🔍 Verifying Supabase Auth Implementation..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Frontend Supabase client
echo "1️⃣  Checking Supabase client..."
if [ -f "frontend/src/lib/supabase.ts" ]; then
    echo -e "${GREEN}✅ frontend/src/lib/supabase.ts exists${NC}"
else
    echo -e "${RED}❌ frontend/src/lib/supabase.ts MISSING${NC}"
    ((ERRORS++))
fi

# Check 2: Auth callback page
echo "2️⃣  Checking OAuth callback page..."
if [ -f "frontend/src/app/auth/callback/page.tsx" ]; then
    echo -e "${GREEN}✅ frontend/src/app/auth/callback/page.tsx exists${NC}"
else
    echo -e "${RED}❌ frontend/src/app/auth/callback/page.tsx MISSING${NC}"
    ((ERRORS++))
fi

# Check 3: No mock JWT in backend
echo "3️⃣  Checking for mock JWT bypass removal..."
if grep -q "mock-jwt-token-otp-login" "backend/src/middleware/auth.ts"; then
    echo -e "${RED}❌ Mock JWT token still in auth.ts${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Mock JWT token removed${NC}"
fi

# Check 4: Supabase Auth middleware
echo "4️⃣  Checking Supabase auth middleware..."
if [ -f "backend/src/middleware/supabaseAuth.ts" ]; then
    echo -e "${GREEN}✅ backend/src/middleware/supabaseAuth.ts exists${NC}"
else
    echo -e "${RED}❌ backend/src/middleware/supabaseAuth.ts MISSING${NC}"
    ((ERRORS++))
fi

# Check 5: No password hash in schema
echo "5️⃣  Checking Prisma schema..."
if grep -q "passwordHash" "backend/prisma/schema.prisma"; then
    echo -e "${RED}❌ passwordHash still in schema${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ passwordHash removed from schema${NC}"
fi

# Check 6: No PasswordReset model
echo "6️⃣  Checking for PasswordReset model removal..."
if grep -q "model PasswordReset" "backend/prisma/schema.prisma"; then
    echo -e "${RED}❌ PasswordReset model still in schema${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ PasswordReset model removed${NC}"
fi

# Check 7: Auth controller updated
echo "7️⃣  Checking auth controller..."
if grep -q "Password-based login is deprecated" "backend/src/controllers/auth.controller.ts"; then
    echo -e "${GREEN}✅ Auth controller updated (deprecated endpoints)${NC}"
else
    echo -e "${RED}❌ Auth controller not fully updated${NC}"
    ((ERRORS++))
fi

# Check 8: No hardcoded OTP
echo "8️⃣  Checking for hardcoded OTP removal..."
if grep -q "123456" "frontend/src/app/auth/login/page.tsx"; then
    echo -e "${RED}❌ Hardcoded OTP '123456' still in login page${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Hardcoded OTP removed${NC}"
fi

# Check 9: Real Supabase calls
echo "9️⃣  Checking for real Supabase API calls..."
if grep -q "supabase.auth.signInWithOtp" "frontend/src/app/auth/login/page.tsx"; then
    echo -e "${GREEN}✅ Real Supabase OTP calls found${NC}"
else
    echo -e "${RED}❌ Real Supabase OTP calls not found${NC}"
    ((ERRORS++))
fi

# Check 10: Google OAuth
echo "🔟 Checking for Google OAuth..."
if grep -q "signInWithOAuth" "frontend/src/app/auth/login/page.tsx"; then
    echo -e "${GREEN}✅ Google OAuth implementation found${NC}"
else
    echo -e "${RED}❌ Google OAuth not found${NC}"
    ((ERRORS++))
fi

echo ""
echo "════════════════════════════════════════"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Set environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)"
    echo "  2. Configure Supabase dashboard (Email, Phone, Google providers)"
    echo "  3. Run: npx prisma migrate deploy"
    echo "  4. Deploy to production"
else
    echo -e "${RED}❌ $ERRORS issues found!${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
fi

echo "════════════════════════════════════════"
