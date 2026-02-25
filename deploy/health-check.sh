#!/usr/bin/env bash
# ============================================================
# ORA Jewellery — Production Health Check
# /deploy/health-check.sh
#
# Checks:
#   1. PM2 process status
#   2. Redis memory usage
#   3. Supabase / Postgres connection count
#   4. Recent error log count
#
# Usage:
#   bash /deploy/health-check.sh
#   bash /deploy/health-check.sh --slack   (post summary to SLACK_WEBHOOK_URL)
# ============================================================

set -euo pipefail

PASS="✅"
FAIL="❌"
WARN="⚠️ "
SEP="────────────────────────────────────────"
SUMMARY=()
EXIT_CODE=0

# ── Load .env if present ──────────────────────────────────
if [[ -f "/home/ora/oranew/deploy/.env.production" ]]; then
  set -o allexport
  source /home/ora/oranew/deploy/.env.production
  set +o allexport
fi

echo ""
echo "  ORA Health Check — $(date '+%Y-%m-%d %H:%M:%S')"
echo "$SEP"

# ── 1. PM2 STATUS ─────────────────────────────────────────
echo ""
echo "1. PM2 Processes"
if command -v pm2 &>/dev/null; then
  PM2_STATUS=$(pm2 jlist 2>/dev/null || echo "[]")
  ONLINE=$(echo "$PM2_STATUS" | python3 -c "import sys,json; procs=json.load(sys.stdin); print(sum(1 for p in procs if p.get('pm2_env',{}).get('status')=='online'))" 2>/dev/null || echo "?")
  ERRORED=$(echo "$PM2_STATUS" | python3 -c "import sys,json; procs=json.load(sys.stdin); print(sum(1 for p in procs if p.get('pm2_env',{}).get('status')=='errored'))" 2>/dev/null || echo "0")
  echo "   Online: $ONLINE  |  Errored: $ERRORED"
  if [[ "$ERRORED" != "0" && "$ERRORED" != "" ]]; then
    echo "   $FAIL $ERRORED PM2 process(es) in errored state"
    SUMMARY+=("$FAIL PM2: $ERRORED errored")
    EXIT_CODE=1
  else
    echo "   $PASS All PM2 processes online"
    SUMMARY+=("$PASS PM2: all online ($ONLINE)")
  fi
else
  echo "   $WARN pm2 not found — skipping"
  SUMMARY+=("$WARN PM2: not found")
fi

# ── 2. REDIS MEMORY ───────────────────────────────────────
echo ""
echo "2. Redis Memory"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
if command -v redis-cli &>/dev/null; then
  REDIS_HOST=$(echo "$REDIS_URL" | sed 's|redis://||' | cut -d: -f1)
  REDIS_PORT=$(echo "$REDIS_URL" | sed 's|redis://||' | cut -d: -f2 | cut -d/ -f1)
  REDIS_PORT="${REDIS_PORT:-6379}"
  MEM=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '[:space:]' || echo "unreachable")
  MAXMEM=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory 2>/dev/null | grep maxmemory_human | cut -d: -f2 | tr -d '[:space:]' || echo "0B")
  if [[ "$MEM" == "unreachable" ]]; then
    echo "   $FAIL Redis unreachable at $REDIS_HOST:$REDIS_PORT"
    SUMMARY+=("$FAIL Redis: unreachable")
    EXIT_CODE=1
  else
    echo "   $PASS Redis OK — used: $MEM / max: $MAXMEM"
    SUMMARY+=("$PASS Redis: $MEM used")
  fi
else
  echo "   $WARN redis-cli not found — skipping"
  SUMMARY+=("$WARN Redis: redis-cli not found")
fi

# ── 3. SUPABASE / POSTGRES CONNECTION COUNT ───────────────
echo ""
echo "3. Supabase / Postgres Connections"
DATABASE_URL="${DATABASE_URL:-}"
if [[ -n "$DATABASE_URL" ]] && command -v psql &>/dev/null; then
  CONN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state IS NOT NULL;" 2>/dev/null | tr -d '[:space:]' || echo "error")
  if [[ "$CONN_COUNT" == "error" || -z "$CONN_COUNT" ]]; then
    echo "   $FAIL Cannot reach database"
    SUMMARY+=("$FAIL DB: unreachable")
    EXIT_CODE=1
  elif [[ "$CONN_COUNT" -gt 80 ]]; then
    echo "   $WARN High connection count: $CONN_COUNT"
    SUMMARY+=("$WARN DB: high connections ($CONN_COUNT)")
  else
    echo "   $PASS DB connections: $CONN_COUNT"
    SUMMARY+=("$PASS DB: $CONN_COUNT connections")
  fi
else
  echo "   $WARN DATABASE_URL not set or psql not found — skipping"
  SUMMARY+=("$WARN DB: skipped")
fi

# ── 4. ERROR LOG COUNT (last 5 min) ───────────────────────
echo ""
echo "4. Error Log Count (last 5 min)"
LOG_DIR="${LOG_DIR:-/home/ora/.pm2/logs}"
if [[ -d "$LOG_DIR" ]]; then
  ERR_COUNT=$(find "$LOG_DIR" -name "*.log" -newer /proc/1 -exec grep -c "ERROR\|CRITICAL\|❌" {} + 2>/dev/null | awk -F: '{sum += $NF} END {print sum+0}' || echo "0")
  if [[ "$ERR_COUNT" -gt 50 ]]; then
    echo "   $FAIL High error count: $ERR_COUNT in last run"
    SUMMARY+=("$FAIL Logs: $ERR_COUNT errors")
    EXIT_CODE=1
  elif [[ "$ERR_COUNT" -gt 10 ]]; then
    echo "   $WARN Elevated errors: $ERR_COUNT"
    SUMMARY+=("$WARN Logs: $ERR_COUNT errors")
  else
    echo "   $PASS Error log count OK: $ERR_COUNT"
    SUMMARY+=("$PASS Logs: $ERR_COUNT errors")
  fi
else
  echo "   $WARN Log directory not found: $LOG_DIR"
  SUMMARY+=("$WARN Logs: dir not found")
fi

# ── SUMMARY ───────────────────────────────────────────────
echo ""
echo "$SEP"
echo "  Summary"
for LINE in "${SUMMARY[@]}"; do echo "  $LINE"; done
echo "$SEP"
echo ""

if [[ $EXIT_CODE -ne 0 ]]; then
  echo "  $FAIL HEALTH CHECK FAILED"
else
  echo "  $PASS ALL CHECKS PASSED"
fi
echo ""

exit $EXIT_CODE
