# CRITICAL: Render Environment Variable Update

## Issue
Backend deployed on Render is experiencing **connection pool exhaustion**:
- Error: "Timed out fetching a new connection from the connection pool"
- Current setting: `connection_limit=1` (too restrictive)
- Impact: All API requests failing after a few concurrent calls

## Root Cause
Supabase pgBouncer connection string has `connection_limit=1`, which is too low for production traffic. With even 2-3 concurrent requests, Prisma exhausts the connection pool.

## Solution
Update the DATABASE_URL environment variable in Render dashboard:

### Steps:
1. Go to https://dashboard.render.com
2. Navigate to **oranew** web service
3. Click **Environment** tab
4. Find `DATABASE_URL` variable
5. Update value from:
   ```
   postgresql://postgres.hgejomvgldqnqzkgffoi:9EtOmJae6YyUxXx2@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
   
   To:
   ```
   postgresql://postgres.hgejomvgldqnqzkgffoi:9EtOmJae6YyUxXx2@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20
   ```

6. Click **Save Changes**
7. Render will automatically redeploy

### Changes Made:
- `connection_limit=1` → `connection_limit=10` (allows 10 concurrent Prisma connections)
- Added `pool_timeout=20` (wait 20 seconds before timeout instead of default 10)

### Why This Works:
- **pgBouncer** sits between Prisma and PostgreSQL
- pgBouncer handles the real connection pooling to Supabase
- Prisma just needs enough connections to handle concurrent requests
- 10 connections is safe for Render free tier + Supabase pooler
- 20s timeout prevents premature failures during cold starts

## Expected Outcome
After redeployment:
✅ Multiple concurrent API requests handled successfully
✅ No more "Timed out fetching a new connection" errors
✅ Product listing loads without failures
✅ Checkout flow completes without 401 errors (after user re-logs in)

## Verification
Test with:
```bash
# Should return product list without timeout
curl https://oranew.onrender.com/api/products

# Check health endpoint
curl https://oranew.onrender.com/api/health
```

## Additional Context

### Token Expired Error (Separate Issue)
The logs also show:
```
[Auth Middleware] ⏰ TOKEN EXPIRED { endpoint: 'POST /checkout', expiredAt: 2026-02-13T04:44:07.000Z }
```

**This is expected behavior:**
- User's JWT token expired 2 days ago (Feb 13)
- JWTs have 7-day expiry configured
- User needs to log out and log back in to get fresh token
- Not a bug - working as designed

### Files Modified in This Session
1. **backend/.env.production** - Updated connection_limit from 1→10, added pool_timeout
2. **backend/src/config/database.ts** - Added graceful shutdown handlers (SIGINT/SIGTERM)

### Related Documentation
- Supabase pgBouncer: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- Prisma with pgBouncer: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer
- Render Environment Variables: https://render.com/docs/environment-variables

---

**Time to Fix:** ~2 minutes (just update 1 env var in Render dashboard)
**Priority:** P0 - CRITICAL (blocks all production traffic)
**Next Steps:** Update DATABASE_URL in Render → auto-redeploy → verify API works
