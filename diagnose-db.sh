#!/bin/bash

# Database Connection Diagnostic Script
# Helps identify why Supabase connection is failing

echo "🔍 DATABASE CONNECTION DIAGNOSTIC"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo "TEST 1: Backend Health Check"
echo "---"
response=$(curl -s https://oranew-backend.onrender.com/health/detailed)
db_connected=$(echo "$response" | grep -o '"connected":[^,}]*' | head -1)

if echo "$db_connected" | grep -q "true"; then
  echo -e "${GREEN}✅ Database connected${NC}"
else
  echo -e "${RED}❌ Database NOT connected${NC}"
  echo "Response: $response" | head -c 200
  echo ""
fi
echo ""

# Test 2: Check DATABASE_URL
echo "TEST 2: Environment Variables"
echo "---"
if [ -f "backend/.env" ]; then
  echo "✓ backend/.env exists"
  db_url=$(grep "^DATABASE_URL=" backend/.env | cut -d'=' -f2)
  if [ -z "$db_url" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
  else
    echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
    # Hide password for security
    echo "  Host: $(echo $db_url | grep -oP 'pooler\.supabase\.com' || echo 'UNKNOWN')"
    echo "  Pooler: $(echo $db_url | grep -oP 'pgbouncer=true|pgbouncer=false')"
  fi
else
  echo -e "${RED}❌ backend/.env not found${NC}"
fi
echo ""

# Test 3: Check Render environment
echo "TEST 3: Render Deployment Status"
echo "---"
if command -v curl &> /dev/null; then
  # Try to get Render service info (requires API key in practice)
  echo "⚠️  Cannot check Render directly without API key"
  echo "   Go to: https://dashboard.render.com/"
  echo "   Service: oranew-backend"
  echo "   Check: Environment variables match backend/.env"
else
  echo "❌ curl not available"
fi
echo ""

# Test 4: Check connection pooler syntax
echo "TEST 4: DATABASE_URL Format Check"
echo "---"
if [ -f "backend/.env" ]; then
  db_url=$(grep "^DATABASE_URL=" backend/.env | cut -d'=' -f2 | tr -d '"')
  
  # Check for required parts
  if echo "$db_url" | grep -q "postgresql://"; then
    echo -e "${GREEN}✓ Correct protocol (postgresql://)${NC}"
  else
    echo -e "${RED}✗ Missing postgresql:// protocol${NC}"
  fi
  
  if echo "$db_url" | grep -q "@"; then
    echo -e "${GREEN}✓ Contains credentials (@)${NC}"
  else
    echo -e "${RED}✗ Missing credentials${NC}"
  fi
  
  if echo "$db_url" | grep -q "pooler.supabase.com"; then
    echo -e "${GREEN}✓ Using connection pooler${NC}"
  else
    echo -e "${YELLOW}⚠️  Not using connection pooler${NC}"
  fi
  
  if echo "$db_url" | grep -q "pgbouncer=true"; then
    echo -e "${GREEN}✓ PgBouncer enabled${NC}"
  else
    echo -e "${YELLOW}⚠️  PgBouncer might be disabled${NC}"
  fi
else
  echo "Cannot check: backend/.env not found"
fi
echo ""

# Test 5: DNS Resolution
echo "TEST 5: DNS Resolution"
echo "---"
if command -v nslookup &> /dev/null; then
  if nslookup aws-1-ap-south-1.pooler.supabase.com &> /dev/null; then
    echo -e "${GREEN}✓ DNS resolves: aws-1-ap-south-1.pooler.supabase.com${NC}"
  else
    echo -e "${RED}❌ DNS cannot resolve: aws-1-ap-south-1.pooler.supabase.com${NC}"
  fi
else
  echo "⚠️  nslookup not available (cannot test DNS)"
fi
echo ""

# Test 6: Port connectivity (if available)
echo "TEST 6: Port Connectivity"
echo "---"
if command -v nc &> /dev/null; then
  if timeout 3 nc -zv aws-1-ap-south-1.pooler.supabase.com 6543 2>&1 | grep -q "succeeded\|open"; then
    echo -e "${GREEN}✓ Port 6543 is reachable${NC}"
  else
    echo -e "${RED}❌ Port 6543 is NOT reachable${NC}"
    echo "   This means Supabase is unreachable from this machine"
  fi
else
  echo "⚠️  netcat (nc) not available (cannot test port)"
  echo "   Try: curl -v telnet://aws-1-ap-south-1.pooler.supabase.com:6543"
fi
echo ""

# Test 7: Supabase Project Check
echo "TEST 7: Supabase Project Verification"
echo "---"
if [ -f "backend/.env" ]; then
  project_id=$(grep "DATABASE_URL=" backend/.env | grep -oP 'postgres\.\K[a-z0-9]+(?=\.)')
  if [ -n "$project_id" ]; then
    echo "Project ID: $project_id"
    echo ""
    echo "✓ Go to: https://app.supabase.com/"
    echo "✓ Verify project is running (not paused)"
    echo "✓ Settings → Database → Connection pooler status"
    echo "✓ Settings → Security → IP Whitelist"
  fi
fi
echo ""

# Summary
echo "=================================="
echo "SUMMARY"
echo "=================================="
echo ""
echo "If database is NOT connected:"
echo ""
echo "1️⃣ Check Supabase Status:"
echo "   → https://app.supabase.com/"
echo "   → Is database 'Running' (not 'Paused')?"
echo ""
echo "2️⃣ Restart Connection Pooler:"
echo "   → Settings → Database → Connection pooler"
echo "   → Toggle OFF → Wait 10 sec → Toggle ON"
echo ""
echo "3️⃣ Check IP Whitelist:"
echo "   → Settings → Security → IP Whitelist"
echo "   → Is it enabled? If yes, add 0.0.0.0/0 for testing"
echo ""
echo "4️⃣ Redeploy Backend:"
echo "   → https://dashboard.render.com/"
echo "   → Service: oranew-backend"
echo "   → Deployments → Manual Deploy"
echo ""
echo "5️⃣ Verify Render Environment:"
echo "   → Check DATABASE_URL matches backend/.env exactly"
echo ""
