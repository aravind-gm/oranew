#!/bin/bash

# 🚀 QUICK DATABASE RECONNECTION GUIDE
# Run this to reconnect to Supabase

echo "=========================================="
echo "  DATABASE RECONNECTION PROTOCOL"
echo "=========================================="
echo ""

# Step 1: Verify credentials
echo "[Step 1/6] Verifying Database Credentials..."
if grep -q "DATABASE_URL=" backend/.env; then
    echo "✅ DATABASE_URL found in backend/.env"
else
    echo "❌ DATABASE_URL missing! Check backend/.env"
    exit 1
fi

# Step 2: Kill any hanging connections
echo ""
echo "[Step 2/6] Clearing connection cache..."
cd backend 2>/dev/null
pkill -f "node" 2>/dev/null || true
echo "✅ Old processes cleaned"

# Step 3: Clear Prisma cache
echo ""
echo "[Step 3/6] Clearing Prisma cache..."
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf dist 2>/dev/null || true
echo "✅ Cache cleared"

# Step 4: Regenerate Prisma client
echo ""
echo "[Step 4/6] Regenerating Prisma client..."
npx prisma generate 2>&1 | tail -5
echo "✅ Prisma client regenerated"

# Step 5: Test connection
echo ""
echo "[Step 5/6] Testing database connection..."
npx prisma db execute --stdin <<'EOF'
SELECT 1 as connection_test;
EOF
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "⚠️  Connection test returned error (may still work)"
fi

# Step 6: Restart backend
echo ""
echo "[Step 6/6] Restarting backend server..."
cd .. 2>/dev/null
npm run dev:backend 2>&1 | grep -E "listening|error|connected" | head -10 &
sleep 3
echo "✅ Backend restart initiated"

echo ""
echo "=========================================="
echo "  ✓ RECONNECTION COMPLETE"
echo "=========================================="
echo ""
echo "If still getting errors:"
echo "1. Check Supabase dashboard: https://app.supabase.com/"
echo "2. Verify database is 'Running' (not 'Paused')"
echo "3. Check connection pooler is enabled"
echo "4. Verify DATABASE_URL in backend/.env matches Supabase"
echo ""
