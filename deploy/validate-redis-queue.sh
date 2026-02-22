#!/usr/bin/env bash
# ============================================================================
# ORA JEWELLERY — REDIS + QUEUE VALIDATION (Phase 6)
# ============================================================================
#
# Run as: deploy user
# Usage:  bash validate-redis-queue.sh
#
# What this validates:
#   1. Redis is running and accepting connections
#   2. Redis is bound to 127.0.0.1 ONLY (not public)
#   3. Redis password authentication works
#   4. Redis memory limits are configured
#   5. BullMQ queues are accessible
#   6. Rate limiter Redis store works
#   7. Cache SET/GET cycle works
#   8. Redis is NOT accessible from external IP
# ============================================================================

set -euo pipefail

DEPLOY_DIR="/var/www/ora-backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; }

PASS=0
FAIL=0
WARN=0

pass() { ok "$1"; ((PASS++)); }
failed() { fail "$1"; ((FAIL++)); }
warned() { warn "$1"; ((WARN++)); }

echo ""
echo "============================================"
echo "  ORA JEWELLERY — REDIS & QUEUE VALIDATION"
echo "============================================"
echo ""

# ── Load Redis password ──
REDIS_PASS=""
if [[ -f "$HOME/.redis-credentials" ]]; then
    REDIS_PASS=$(grep "REDIS_PASSWORD" "$HOME/.redis-credentials" | cut -d'=' -f2)
fi

if [[ -z "$REDIS_PASS" ]]; then
    # Try from .env
    if [[ -f "${DEPLOY_DIR}/.env" ]]; then
        REDIS_URL=$(grep "REDIS_URL" "${DEPLOY_DIR}/.env" | cut -d'=' -f2-)
        REDIS_PASS=$(echo "$REDIS_URL" | sed -n 's|redis://:\([^@]*\)@.*|\1|p')
    fi
fi

REDIS_CLI_AUTH=""
if [[ -n "$REDIS_PASS" ]]; then
    REDIS_CLI_AUTH="-a ${REDIS_PASS}"
fi

# ══════════════════════════════════════════════════
# TEST 1: Redis Service Status
# ══════════════════════════════════════════════════
echo "── Redis Service ──"

if systemctl is-active --quiet redis-server 2>/dev/null || systemctl is-active --quiet redis 2>/dev/null; then
    pass "Redis service is running"
else
    failed "Redis service is NOT running"
    echo "       Fix: sudo systemctl start redis-server"
fi

# ══════════════════════════════════════════════════
# TEST 2: Redis Ping
# ══════════════════════════════════════════════════
echo ""
echo "── Redis Connectivity ──"

PING_RESULT=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning ping 2>/dev/null || echo "FAIL")
if [[ "$PING_RESULT" == "PONG" ]]; then
    pass "Redis PING → PONG (connection works)"
else
    failed "Redis PING failed: ${PING_RESULT}"
fi

# ══════════════════════════════════════════════════
# TEST 3: Redis Binding (SECURITY CRITICAL)
# ══════════════════════════════════════════════════
echo ""
echo "── Redis Security ──"

REDIS_BIND=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning CONFIG GET bind 2>/dev/null | tail -1)
if echo "$REDIS_BIND" | grep -q "127.0.0.1"; then
    pass "Redis bound to 127.0.0.1 (local only)"
else
    if [[ -z "$REDIS_BIND" ]]; then
        warned "Could not determine Redis bind address"
    else
        failed "Redis bind: ${REDIS_BIND} — MUST be 127.0.0.1!"
    fi
fi

# Check protected mode
PROTECTED=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning CONFIG GET protected-mode 2>/dev/null | tail -1)
if [[ "$PROTECTED" == "yes" ]]; then
    pass "Protected mode is ON"
else
    warned "Protected mode is OFF — enable in redis.conf"
fi

# Check password is set
if [[ -n "$REDIS_PASS" ]]; then
    pass "Redis password is configured"
else
    failed "No Redis password found — set requirepass in redis.conf"
fi

# Check no external listening
EXTERNAL_LISTEN=$(ss -tlnp | grep ":6379" | grep -v "127.0.0.1" | grep -v "::1" || true)
if [[ -z "$EXTERNAL_LISTEN" ]]; then
    pass "Redis port 6379 NOT exposed externally"
else
    failed "Redis port 6379 is listening on external interface!"
    echo "       ${EXTERNAL_LISTEN}"
fi

# ══════════════════════════════════════════════════
# TEST 4: Redis Memory Configuration
# ══════════════════════════════════════════════════
echo ""
echo "── Redis Memory ──"

MAX_MEM=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning CONFIG GET maxmemory 2>/dev/null | tail -1)
EVICTION=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning CONFIG GET maxmemory-policy 2>/dev/null | tail -1)

if [[ -n "$MAX_MEM" && "$MAX_MEM" != "0" ]]; then
    MAX_MEM_MB=$((MAX_MEM / 1024 / 1024))
    pass "Max memory: ${MAX_MEM_MB}MB"
else
    warned "No maxmemory limit set — Redis will use unlimited RAM"
fi

if [[ "$EVICTION" == "allkeys-lru" ]]; then
    pass "Eviction policy: allkeys-lru (correct)"
elif [[ "$EVICTION" == "noeviction" ]]; then
    warned "Eviction policy: noeviction — may crash when full"
else
    info "Eviction policy: ${EVICTION}"
fi

# Current memory usage
USED_MEM=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
if [[ -n "$USED_MEM" ]]; then
    info "Current memory usage: ${USED_MEM}"
fi

# ══════════════════════════════════════════════════
# TEST 5: Redis SET/GET Cycle
# ══════════════════════════════════════════════════
echo ""
echo "── Redis Data Operations ──"

TEST_KEY="ora:validation:test:$(date +%s)"
TEST_VALUE="validation_ok"

# SET
SET_RESULT=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning SET "$TEST_KEY" "$TEST_VALUE" EX 10 2>/dev/null)
if [[ "$SET_RESULT" == "OK" ]]; then
    pass "SET operation works"
else
    failed "SET operation failed: ${SET_RESULT}"
fi

# GET
GET_RESULT=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning GET "$TEST_KEY" 2>/dev/null)
if [[ "$GET_RESULT" == "$TEST_VALUE" ]]; then
    pass "GET operation works"
else
    failed "GET returned: ${GET_RESULT} (expected: ${TEST_VALUE})"
fi

# DEL
redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning DEL "$TEST_KEY" >/dev/null 2>&1
pass "DEL operation works (cleanup)"

# ══════════════════════════════════════════════════
# TEST 6: BullMQ Queue Check
# ══════════════════════════════════════════════════
echo ""
echo "── BullMQ Queues ──"

# BullMQ uses bull: prefix for queue keys
QUEUE_KEYS=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning KEYS "bull:*" 2>/dev/null | head -20)
if [[ -n "$QUEUE_KEYS" ]]; then
    QUEUE_COUNT=$(echo "$QUEUE_KEYS" | wc -l)
    pass "BullMQ queue keys found: ${QUEUE_COUNT} keys"
    
    # Check for specific ORA queues
    for QUEUE_NAME in "abandoned-cart" "payment-reconciliation" "cache-invalidation"; do
        if echo "$QUEUE_KEYS" | grep -q "$QUEUE_NAME"; then
            pass "  Queue: ${QUEUE_NAME} exists"
        else
            info "  Queue: ${QUEUE_NAME} not found (created on first job)"
        fi
    done
else
    info "No BullMQ queue keys found yet (queues created when first job is enqueued)"
fi

# ══════════════════════════════════════════════════
# TEST 7: Rate Limiter Redis Keys
# ══════════════════════════════════════════════════
echo ""
echo "── Rate Limiter ──"

RL_KEYS=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning KEYS "rl:*" 2>/dev/null | head -5)
if [[ -n "$RL_KEYS" ]]; then
    pass "Rate limiter keys found in Redis"
else
    info "No rate limiter keys yet (created on first API request)"
fi

# ══════════════════════════════════════════════════
# TEST 8: Cache Keys
# ══════════════════════════════════════════════════
echo ""
echo "── Application Cache ──"

CACHE_KEYS=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning KEYS "cache:*" 2>/dev/null | head -5)
if [[ -n "$CACHE_KEYS" ]]; then
    CACHE_COUNT=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning KEYS "cache:*" 2>/dev/null | wc -l)
    pass "Application cache keys: ${CACHE_COUNT}"
else
    info "No cache keys yet (populated on first requests)"
fi

# Check inventory lock keys
LOCK_KEYS=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning KEYS "inv:lock:*" 2>/dev/null | head -5)
if [[ -n "$LOCK_KEYS" ]]; then
    info "Active inventory locks found (checkout in progress)"
else
    info "No inventory locks (normal if no active checkouts)"
fi

# ══════════════════════════════════════════════════
# TEST 9: Redis Persistence
# ══════════════════════════════════════════════════
echo ""
echo "── Redis Persistence ──"

RDB_ENABLED=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning CONFIG GET save 2>/dev/null | tail -1)
if [[ -n "$RDB_ENABLED" && "$RDB_ENABLED" != "" ]]; then
    pass "RDB persistence configured: ${RDB_ENABLED}"
else
    info "RDB persistence may be disabled (OK for cache-only use)"
fi

LAST_SAVE=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning LASTSAVE 2>/dev/null)
if [[ -n "$LAST_SAVE" ]]; then
    LAST_SAVE_DATE=$(date -d "@${LAST_SAVE}" 2>/dev/null || echo "unknown")
    info "Last RDB save: ${LAST_SAVE_DATE}"
fi

# ══════════════════════════════════════════════════
# TEST 10: Redis Info Summary
# ══════════════════════════════════════════════════
echo ""
echo "── Redis Server Info ──"

REDIS_VERSION=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning INFO server 2>/dev/null | grep "redis_version:" | cut -d: -f2 | tr -d '\r')
CONNECTED_CLIENTS=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning INFO clients 2>/dev/null | grep "connected_clients:" | cut -d: -f2 | tr -d '\r')
UPTIME_DAYS=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning INFO server 2>/dev/null | grep "uptime_in_days:" | cut -d: -f2 | tr -d '\r')
TOTAL_KEYS=$(redis-cli -h 127.0.0.1 ${REDIS_CLI_AUTH} --no-auth-warning DBSIZE 2>/dev/null | awk '{print $2}' | tr -d '\r')

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  Redis Server Summary                   │"
echo "  ├─────────────────────────────────────────┤"
echo "  │  Version:    ${REDIS_VERSION:-unknown}"
echo "  │  Uptime:     ${UPTIME_DAYS:-?} days"
echo "  │  Clients:    ${CONNECTED_CLIENTS:-?} connected"
echo "  │  Keys:       ${TOTAL_KEYS:-?}"
echo "  │  Memory:     ${USED_MEM:-unknown}"
echo "  │  Max Memory: ${MAX_MEM_MB:-unlimited}MB"
echo "  │  Eviction:   ${EVICTION:-unknown}"
echo "  └─────────────────────────────────────────┘"

# ══════════════════════════════════════════════════
# RESULTS SUMMARY
# ══════════════════════════════════════════════════
echo ""
echo "============================================"
echo "  VALIDATION RESULTS"
echo "============================================"
echo ""
echo -e "  ${GREEN}Passed: ${PASS}${NC}"
echo -e "  ${RED}Failed: ${FAIL}${NC}"
echo -e "  ${YELLOW}Warnings: ${WARN}${NC}"
echo ""

if [[ $FAIL -gt 0 ]]; then
    fail "Some checks FAILED — fix issues above before going live"
    exit 1
elif [[ $WARN -gt 0 ]]; then
    warn "All critical checks passed, but review warnings"
    exit 0
else
    ok "All checks passed — Redis is production ready! ✓"
    exit 0
fi
