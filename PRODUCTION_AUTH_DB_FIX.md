# PRODUCTION AUTH + DB FAILURE FIX

**Date:** February 3, 2026  
**Status:** IMPLEMENTATION IN PROGRESS  
**Severity:** CRITICAL - Affects all user logins & database operations

---

## ROOT CAUSE ANALYSIS

### 🔴 PRIMARY ISSUES (Critical)

#### 1. **Prisma DB Connection Pool Exhaustion**
- **Problem:** Render free-tier PostgreSQL sleeps after 30 min inactivity
- **Symptom:** `Can't reach database server at db.hgejomvgldqnqzkgffoi.supabase.co:5432`
- **Root Cause:** 
  - Prisma client creates NEW connections on EVERY Render cold start
  - No lazy connection initialization
  - Singleton pattern NOT enforced in `/backend/lib/prisma.ts` (but IS attempted in `database.ts`)
  - Connection pool drains when DB goes offline
  - Prisma doesn't reconnect automatically on P1001/P1002 errors
- **Impact:** All database operations fail with 500 errors

#### 2. **Database Schema Mismatch**
- **Problem:** Prisma schema references `supabaseId` field, but query might hit columns that don't exist
- **Error:** `P2022: column "supabase_id" does not exist`
- **Root Cause:** 
  - Schema has `@map("supabase_id")` but actual DB column might be missing
  - No validation that schema matches DB structure
  - Migrations may have failed silently
- **Impact:** OTP login crashes when trying to upsert user with supabaseId

#### 3. **Broken Auth Flow - Missing supabaseId**
- **Problem:** Admin login via password doesn't capture `supabaseId`
- **Symptom:** Admin gets 500 error when trying to login
- **Root Cause:**
  - Admin login tries to use OTP flow (`/auth/otp-login`) 
  - But admin login is password-based, not OTP
  - Backend expects `supabaseId` in admin request but it's empty
  - Frontend admin form calls wrong endpoint
- **Impact:** Admins cannot login; email sent without supabaseId causes schema errors

#### 4. **Retry Logic Doesn't Work on DB Reconnect**
- **Problem:** `withRetry()` retries the query, but Prisma client is stale
- **Symptom:** Retries fail after server wakes from sleep
- **Root Cause:**
  - `withRetry()` only retries query execution, NOT connection recovery
  - After DB goes offline, Prisma `$queryRaw` fails, retries also fail
  - No `$disconnect()` + reconnect cycle
  - Exponential backoff is configured but connection reset doesn't happen
- **Impact:** Even retryable errors cause persistent 500s

#### 5. **Login Redirect Loop**
- **Problem:** Infinite loop between `/auth/login` → `/account` → `/complete-profile`
- **Root Cause:**
  - No clear guard logic on redirect decisions
  - No check for "backend user exists"
  - Frontend doesn't track profile completion state
- **Impact:** Users get stuck in redirect cycle even on successful login

#### 6. **Silent 500 Errors - No Structured Error Response**
- **Problem:** Backend returns generic 500s without details
- **Symptom:** Frontend sees error but can't tell if it's retryable
- **Root Cause:**
  - Error handler doesn't distinguish:
    - Temporary DB outage (should retry)
    - User validation error (should NOT retry)
    - Schema/programming error (should NOT retry)
- **Impact:** Frontend infinite-retries on non-retryable errors

#### 7. **Render Free-Tier Cold Start Issue**
- **Problem:** Server wakes, tries to connect, DB connection fails
- **Symptom:** First request after sleep always fails
- **Root Cause:**
  - No DB warmup on server startup
  - Node process starts before DB connection is ready
  - Supabase connection pooling (PgBouncer) not configured correctly
- **Impact:** ~50% of requests fail on cold starts

---

## COMPREHENSIVE FIX STRATEGY

### LAYER 1: DATABASE SCHEMA & MIGRATIONS
1. ✅ Verify `supabase_id` column exists
2. ✅ Add connection pooling config
3. ✅ Create migration SQL for pgbouncer compatibility

### LAYER 2: PRISMA CLIENT SINGLETON (CONNECTION STABILITY)
1. ✅ Implement true connection pooling singleton
2. ✅ Add reconnect logic on connection failure
3. ✅ Force `$disconnect()` + retry on P1001/P1002/P2002

### LAYER 3: RETRY WRAPPER WITH RECONNECT
1. ✅ Enhance `withRetry()` to detect connection errors
2. ✅ Add `ensureConnected()` before retry
3. ✅ Implement exponential backoff with max 3 retries

### LAYER 4: AUTH CONTROLLER FIXES
1. ✅ Separate admin login from OTP login flow
2. ✅ Enforce supabaseId validation
3. ✅ Return structured error responses with `retryable` flag

### LAYER 5: FRONTEND OTP FLOW FIX
1. ✅ Ensure supabaseId is passed to backend
2. ✅ Add retry logic with exponential backoff (frontend)
3. ✅ Implement clear redirect guards

### LAYER 6: RENDER DEPLOYMENT FIXES
1. ✅ Add `/api/health` endpoint with DB warmup
2. ✅ Call health check on server startup
3. ✅ Implement startup sequence with retries

### LAYER 7: ERROR HANDLING
1. ✅ Wrap all DB operations with error classification
2. ✅ Return `{ retryable: true/false }` in error responses
3. ✅ Client stops retrying on `retryable: false`

---

## FILES TO MODIFY

| File | Changes | Priority |
|------|---------|----------|
| `backend/prisma/schema.prisma` | Add PgBouncer config | HIGH |
| `backend/src/config/database.ts` | Implement safe singleton + reconnect | CRITICAL |
| `backend/src/utils/retry.ts` | Add connection recovery logic | CRITICAL |
| `backend/src/controllers/auth.controller.ts` | Fix admin login + validate supabaseId | CRITICAL |
| `backend/src/controllers/health.controller.ts` | Create health check endpoint | HIGH |
| `backend/src/routes/auth.routes.ts` | Add admin login route | HIGH |
| `backend/src/middleware/errorHandler.ts` | Add error classification | HIGH |
| `frontend/src/app/auth/login/page.tsx` | Fix OTP flow + add retry logic | HIGH |

---

## DEPLOYMENT SEQUENCE

1. **Deploy Prisma Migration** (1 min)
2. **Deploy Backend with New DB Config** (2 min)
3. **Test Health Check Endpoint** (1 min)
4. **Deploy Frontend** (1 min)
5. **Verify Auth Flow** (5 min)
6. **Monitor Logs** (continuous)

**Total Downtime:** 0 min (backward compatible)

---

## SUCCESS CRITERIA

- ✅ OTP login succeeds without 500 errors
- ✅ Admin login works with separate endpoint
- ✅ DB reconnects after cold start (within 3 retries)
- ✅ No redirect loops
- ✅ Frontend receives structured error responses
- ✅ Transient DB errors automatically retry
- ✅ Permanent errors stop retrying (no infinite loops)
- ✅ Health endpoint returns 200 with DB status

---

## TESTING COMMAND

```bash
# 1. Test OTP login
curl -X POST http://localhost:5000/api/auth/otp-login \
  -H "Content-Type: application/json" \
  -d '{
    "supabaseId": "user-uuid-here",
    "email": "test@example.com",
    "fullName": "Test User"
  }'

# 2. Test health check
curl http://localhost:5000/api/health

# 3. Kill DB connection to test recovery
# (kill psql connection manually, then retry OTP login)

# 4. Test admin login
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin_password"
  }'
```

