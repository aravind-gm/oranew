#!/usr/bin/env bash
# ============================================================
# ORA Jewellery — Chaos Test Script
# /deploy/chaos-test.sh
#
# Simulates:
#   1. Redis restart + verify reconnect
#   2. PM2 restart + verify recovery
#   3. Health check endpoint responds
#   4. DB connection after restart
#   5. Redis reconnect (app-level)
#   6. Webhook endpoint accessible
#
# ⚠️  ONLY run on staging / maintenance window.
#     Never run against live production without downtime window.
#
# Usage:
#   bash /deploy/chaos-test.sh
# ============================================================

set -euo pipefail

PASS="✅"
FAIL="❌"
SEP="────────────────────────────────────────"
RESULTS=()
EXIT_CODE=0

API_BASE="${API_BASE:-https://api.orashop.in/api}"
HEALTH_URL="${API_BASE%/api}/api/health"
WEBHOOK_URL="${API_BASE%/api}/api/payments/webhook"

echo ""
echo "  ORA Chaos Test — $(date '+%Y-%m-%d %H:%M:%S')"
echo "  API: $API_BASE"
echo "$SEP"

# ── helper ────────────────────────────────────────────────
check() {
  local label="$1"; shift
  if "$@" &>/dev/null; then
    echo "   $PASS $label"
    RESULTS+=("$PASS $label")
  else
    echo "   $FAIL $label"
    RESULTS+=("$FAIL $label")
    EXIT_CODE=1
  fi
}

wait_for_http() {
  local url="$1"; local max="${2:-20}"; local i=0
  while ! curl -sf --max-time 5 "$url" &>/dev/null; do
    sleep 1; ((i++))
    [[ $i -ge $max ]] && return 1
  done
  return 0
}

# ── 1. RESTART REDIS ──────────────────────────────────────
echo ""
echo "1. Redis Restart"
if command -v redis-cli &>/dev/null && redis-cli ping &>/dev/null; then
  redis-cli debug sleep 0 &>/dev/null || true
  if sudo systemctl restart redis 2>/dev/null || sudo service redis restart 2>/dev/null; then
    sleep 3
    check "Redis back online after restart" redis-cli ping
  else
    echo "   ⚠️  Cannot restart Redis (no sudo or systemctl) — skipping"
    RESULTS+=("⚠️  Redis restart: skipped (no privilege)")
  fi
else
  echo "   ⚠️  Redis not local — skipping restart"
  RESULTS+=("⚠️  Redis restart: not local")
fi

# ── 2. RESTART PM2 ────────────────────────────────────────
echo ""
echo "2. PM2 Restart"
if command -v pm2 &>/dev/null; then
  pm2 restart all --update-env &>/dev/null
  sleep 5
  ERRORED=$(pm2 jlist 2>/dev/null | python3 -c "import sys,json; p=json.load(sys.stdin); print(sum(1 for x in p if x.get('pm2_env',{}).get('status')=='errored'))" 2>/dev/null || echo "0")
  if [[ "$ERRORED" == "0" ]]; then
    echo "   $PASS PM2 restarted — no errored processes"
    RESULTS+=("$PASS PM2 restart: OK")
  else
    echo "   $FAIL PM2 restart — $ERRORED errored"
    RESULTS+=("$FAIL PM2 restart: $ERRORED errored")
    EXIT_CODE=1
  fi
else
  echo "   ⚠️  pm2 not found — skipping"
  RESULTS+=("⚠️  PM2: not found")
fi

# ── 3. HEALTH CHECK ENDPOINT ──────────────────────────────
echo ""
echo "3. Health Check Endpoint"
sleep 3
if wait_for_http "$HEALTH_URL" 20; then
  HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" || echo "0")
  if [[ "$HTTP_STATUS" == "200" ]]; then
    check "Health endpoint returns 200" true
  else
    echo "   $FAIL Health endpoint returned HTTP $HTTP_STATUS"
    RESULTS+=("$FAIL Health: HTTP $HTTP_STATUS")
    EXIT_CODE=1
  fi
else
  echo "   $FAIL Health endpoint did not respond within 20s"
  RESULTS+=("$FAIL Health: timeout")
  EXIT_CODE=1
fi

# ── 4. DB CONNECTION VIA API ──────────────────────────────
echo ""
echo "4. Database Connection"
PRODUCTS_URL="${API_BASE}/products?limit=1"
DB_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$PRODUCTS_URL" || echo "0")
if [[ "$DB_STATUS" == "200" ]]; then
  check "Products API responds (DB connected)" true
else
  echo "   $FAIL Products API returned HTTP $DB_STATUS — possible DB issue"
  RESULTS+=("$FAIL DB via products API: HTTP $DB_STATUS")
  EXIT_CODE=1
fi

# ── 5. REDIS RECONNECT (app-level via cache header) ───────
echo ""
echo "5. Redis Reconnect (app-level)"
CACHE_HEADER=$(curl -sf -I --max-time 10 "$PRODUCTS_URL" 2>/dev/null | grep -i "x-cache" | head -1 || echo "")
if echo "$CACHE_HEADER" | grep -qi "hit\|miss"; then
  echo "   $PASS Cache header present: $CACHE_HEADER"
  RESULTS+=("$PASS Redis app reconnect: X-Cache header seen")
else
  echo "   ⚠️  X-Cache header not found (Redis may be disabled or warming up)"
  RESULTS+=("⚠️  Redis reconnect: X-Cache not seen")
fi

# ── 6. WEBHOOK ENDPOINT ACCESSIBLE ───────────────────────
echo ""
echo "6. Webhook Endpoint"
# Should return 400 (missing signature) — that means the route is reachable
WEBHOOK_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d '{}' || echo "0")
if [[ "$WEBHOOK_STATUS" == "400" || "$WEBHOOK_STATUS" == "200" ]]; then
  echo "   $PASS Webhook endpoint reachable (HTTP $WEBHOOK_STATUS)"
  RESULTS+=("$PASS Webhook: reachable ($WEBHOOK_STATUS)")
else
  echo "   $FAIL Webhook endpoint unreachable (HTTP $WEBHOOK_STATUS)"
  RESULTS+=("$FAIL Webhook: HTTP $WEBHOOK_STATUS")
  EXIT_CODE=1
fi

# ── SUMMARY ───────────────────────────────────────────────
echo ""
echo "$SEP"
echo "  Chaos Test Results"
for R in "${RESULTS[@]}"; do echo "  $R"; done
echo "$SEP"
echo ""
if [[ $EXIT_CODE -ne 0 ]]; then
  echo "  $FAIL CHAOS TEST FAILED"
else
  echo "  $PASS ALL CHAOS CHECKS PASSED"
fi
echo ""

exit $EXIT_CODE
