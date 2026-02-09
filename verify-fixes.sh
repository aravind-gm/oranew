#!/bin/bash
# ============================================================================
# IMAGE UPLOAD FIXES - VERIFICATION SCRIPT
# ============================================================================
# Run this to verify all fixes have been applied correctly

echo "════════════════════════════════════════════════════════════════════════"
echo "IMAGE UPLOAD FIXES - VERIFICATION"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

echo "✓ Checking static image files..."
echo "────────────────────────────────────────────────────────────────────────"

for img in necklace rings bracelet; do
  FILE="frontend/public/${img}.png"
  if [ -f "$FILE" ]; then
    SIZE=$(ls -lh "$FILE" | awk '{print $5}')
    echo -e "${GREEN}✓${NC} $FILE exists ($SIZE)"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $FILE NOT FOUND"
    ((FAILED++))
  fi
done

echo ""
echo "✓ Checking .env Supabase configuration..."
echo "────────────────────────────────────────────────────────────────────────"

if grep -q '^SUPABASE_URL=' .env; then
  URL=$(grep '^SUPABASE_URL=' .env | cut -d'=' -f2)
  echo -e "${GREEN}✓${NC} SUPABASE_URL set: $URL"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} SUPABASE_URL not set in .env"
  ((FAILED++))
fi

if grep -q '^SUPABASE_ANON_KEY=' .env; then
  echo -e "${GREEN}✓${NC} SUPABASE_ANON_KEY is configured"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} SUPABASE_ANON_KEY not set in .env"
  ((FAILED++))
fi

if grep -q '^SUPABASE_SERVICE_ROLE_KEY=' .env; then
  echo -e "${GREEN}✓${NC} SUPABASE_SERVICE_ROLE_KEY is configured"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} SUPABASE_SERVICE_ROLE_KEY not set in .env"
  ((FAILED++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "════════════════════════════════════════════════════════════════════════"
echo -e "Checks passed: ${GREEN}$PASSED${NC}"
echo -e "Checks failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Restart backend: npm run dev"
  echo "2. Test at: http://localhost:3000/admin/products/new"
  echo "3. Try uploading an image"
  exit 0
else
  echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
  echo ""
  echo "Run: bash verify-fixes.sh"
  echo "to check again after fixing issues"
  exit 1
fi
