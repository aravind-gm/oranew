# PRODUCTION STABILITY VERIFICATION CHECKLIST

**Date:** February 3, 2026  
**Status:** Ready for Production  
**Severity:** CRITICAL - Affects all users

---

## PRE-DEPLOYMENT CHECKS

### Code Quality
- [ ] All TypeScript errors fixed (`npm run build`)
- [ ] No console errors in Prisma schema
- [ ] Auth controller has proper error handling
- [ ] Retry logic implemented with exponential backoff
- [ ] Health check endpoint created and tested

### Database
- [ ] Prisma migration file created (`001_add_pgbouncer_support.sql`)
- [ ] `supabase_id` column exists in `users` table
- [ ] Database indexes created for performance
- [ ] Connection pool settings configured (PgBouncer)
- [ ] Migration tested locally first

### Environment Variables
- [ ] `DATABASE_URL` points to PgBouncer endpoint (Render)
- [ ] `DIRECT_URL` points to direct connection (Render)
- [ ] `JWT_SECRET` is set and same across all environments
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `NODE_ENV=production` in Render dashboard

### Configuration Files
- [ ] `backend/prisma/schema.prisma` - PgBouncer comments added
- [ ] `backend/package.json` - build script runs migrations
- [ ] `.gitignore` - doesn't exclude necessary files
- [ ] `backend/.env` - has example with all required vars

---

## DEPLOYMENT VERIFICATION (In Order)

### Step 1: Backend Deployment
- [ ] Git branch is `main`
- [ ] No uncommitted changes
- [ ] All files added to git
- [ ] Commit message is descriptive
- [ ] Push to remote succeeds

```bash
git status  # Should be clean
git log -1  # Should see your commit
```

### Step 2: Render Deployment
- [ ] Environment variables set in Render dashboard
- [ ] Build command succeeds (check Logs)
- [ ] No errors during Prisma migration
- [ ] Server starts with warmup message

**Expected in logs:**
```
[Startup] 🔥 Warming up database connection...
[Startup] ✅ Database: READY
[Startup] ✅ Server ready for requests
```

### Step 3: Health Check
- [ ] `/api/health` returns 200 with `"database": "connected"`
- [ ] Response time < 500ms
- [ ] Timestamp is current

**Test:**
```bash
curl https://your-backend.onrender.com/api/health
```

### Step 4: OTP Login Flow
- [ ] User can send OTP (Email form)
- [ ] OTP arrives in email within 30 seconds
- [ ] User can enter OTP (8-digit code)
- [ ] Backend validates OTP and returns JWT
- [ ] User is redirected to /account
- [ ] No 500 errors in browser console

**Manual test:**
1. Go to login page
2. Enter test email
3. Check email for OTP
4. Enter OTP
5. Should login successfully

### Step 5: Admin Login Flow
- [ ] Admin login form appears (Ctrl+Shift+A in dev)
- [ ] Admin credentials authenticate
- [ ] Admin is redirected to /admin
- [ ] Admin sees dashboard

**Test (Dev only):**
```bash
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password"}'
```

### Step 6: User Profile
- [ ] User can access /account page
- [ ] Profile shows correct user data
- [ ] Can update profile (name, phone)
- [ ] No 403 or 401 errors

### Step 7: Product Pages
- [ ] Product list loads
- [ ] Can filter by category
- [ ] Can add to cart
- [ ] Can wishlist products

### Step 8: Order Flow
- [ ] Can create order
- [ ] Payment gateway loads
- [ ] Order saves to database
- [ ] Can view order history

---

## ERROR HANDLING VERIFICATION

### Test 1: Database Connection Failure

**Simulate:**
```bash
# On Render web terminal or local postgres:
psql -c "SELECT version()"  # This works
psql -c "DROP DATABASE ora_db"  # Now it fails
```

**Expected:**
- [ ] GET /api/health returns 503 (not 200)
- [ ] Backend logs show "Database not reachable"
- [ ] Frontend sees error and retries
- [ ] After DB comes back online, login works again

### Test 2: Validation Error (400)

**Cause:** Send OTP login without supabaseId

```bash
curl -X POST http://localhost:5000/api/auth/otp-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "fullName": "Test"}'
  # Note: Missing supabaseId
```

**Expected:**
- [ ] Response: 400 with error message
- [ ] Response includes: `"retryable": false`
- [ ] Frontend should NOT retry
- [ ] No infinite retry loop

### Test 3: Server Error (5xx)

**Cause:** Database query fails (e.g., schema mismatch)

**Expected:**
- [ ] Response: 503 with error message
- [ ] Response includes: `"retryable": true`
- [ ] Frontend retries with exponential backoff
- [ ] After fix, login works again

### Test 4: Network Timeout

**Cause:** Slow network or slow server

**Expected:**
- [ ] First request: Timeout (retried by frontend)
- [ ] Second request: Success
- [ ] User experiences brief delay but no error

---

## PERFORMANCE VERIFICATION

### Response Times
- [ ] `/api/health` - < 500ms
- [ ] `/api/auth/otp-login` - < 2 seconds
- [ ] `/api/auth/admin-login` - < 2 seconds
- [ ] `/api/products` - < 3 seconds
- [ ] `/api/users/profile` - < 1 second

**Test with curl:**
```bash
time curl https://your-backend.onrender.com/api/health
```

### Database Queries
- [ ] User lookup by email - uses index
- [ ] User lookup by supabaseId - uses unique index
- [ ] Product queries - pagination works
- [ ] No N+1 queries (Prisma logging shows smart queries)

### Connection Pool
- [ ] No "too many connections" errors
- [ ] No connection timeouts
- [ ] Pool recovers after cold start
- [ ] Multiple requests don't exhaust pool

**Check in Render logs:**
```
[DB] ✅ Connection pool healthy (active: 1, idle: 2)
```

---

## SECURITY VERIFICATION

- [ ] JWT secret is strong (production value set)
- [ ] OTP is 6-8 digits (can't be brute-forced)
- [ ] Admin password is hashed with bcrypt
- [ ] No sensitive data in logs (no passwords, no supabaseId)
- [ ] CORS is restricted to frontend domains
- [ ] Auth middleware validates JWT on protected routes
- [ ] 401/403 errors don't leak user information

**Test:**
```bash
# Unauthorized request (no token)
curl http://localhost:5000/api/users/profile

# Expected: 401 "Not authorized, no token provided"
```

---

## MONITORING SETUP

### Render Health Check
- [ ] Go to Service Settings
- [ ] Set Health Check to `/api/health`
- [ ] Check Interval: 5 minutes
- [ ] Timeout: 30 seconds
- [ ] Unhealthy threshold: 3 failures

### Frontend Error Tracking
- [ ] Sentry/LogRocket configured (if available)
- [ ] Login errors logged with context
- [ ] Backend response errors captured
- [ ] User session tracking enabled

### Backend Logging
- [ ] Log level: `error` and `warn` in production
- [ ] Logs go to Render logs (visible in dashboard)
- [ ] No sensitive data in logs
- [ ] Query logs disabled in production

---

## COLD START RECOVERY TEST

**This is critical for Render free-tier!**

1. [ ] Go to Render Dashboard
2. [ ] Click your backend service
3. [ ] Click Settings → Scroll to "Dangerous Zone"
4. [ ] Click "Restart Web Service"
5. [ ] Watch logs:
   - [ ] Service starts
   - [ ] Sees `[Startup] 🔥 Warming up database...`
   - [ ] Sees `[Startup] ✅ Database: READY` (within 30 sec)
   - [ ] Sees `[Startup] ✅ Server ready for requests`
6. [ ] After restart completes:
   - [ ] Test `/api/health` → 200 OK
   - [ ] Test OTP login → Should work
   - [ ] Frontend doesn't show errors

---

## RENDER DEPLOYMENT CHECKLIST

- [ ] Backend environment variables set:
  - [ ] `DATABASE_URL` (PgBouncer)
  - [ ] `DIRECT_URL` (Direct connection)
  - [ ] `JWT_SECRET`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NODE_ENV=production`

- [ ] Build command: `cd backend && npm install && npm run build`
- [ ] Start command: `cd backend && npm start`
- [ ] Health check configured: `/api/health`
- [ ] Auto-deploy enabled for `main` branch
- [ ] Logs visible in Render dashboard

---

## FRONTEND DEPLOYMENT CHECKLIST

- [ ] API URL points to production backend
  - Vercel Env: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
- [ ] OTP retry logic enabled (3 retries with backoff)
- [ ] Error handling shows `retryable` flag properly
- [ ] Admin login uses `/auth/admin-login` endpoint
- [ ] Auth store persists login across page reload
- [ ] No hardcoded localhost URLs in production build

---

## MANUAL EDGE CASE TESTS

### Test: User Exists by Email Only (No supabaseId)

```bash
# Simulate user without supabaseId
psql -U postgres -d ora_db -c \
  "INSERT INTO users (id, email, full_name, role) VALUES ('old-uuid', 'existing@test.com', 'Old User', 'CUSTOMER');"

# Now login with that email via OTP
# Expected: User is updated with new supabaseId ✅
```

### Test: User Exists by supabaseId Only

```bash
# Create user with supabaseId
psql -U postgres -d ora_db -c \
  "INSERT INTO users (id, supabase_id, email, full_name, role) VALUES ('new-uuid', '12345678-1234-1234-1234-123456789012', 'new@test.com', 'New User', 'CUSTOMER');"

# Login with that supabaseId
# Expected: Email is updated, login succeeds ✅
```

### Test: Brand New User

```bash
# OTP login with never-before-seen email and supabaseId
# Expected: New user record created ✅
```

---

## REGRESSION TESTING

After deploying fixes, verify nothing broke:

- [ ] Existing users can still login
- [ ] Can still create orders
- [ ] Can still upload images
- [ ] Can still leave reviews
- [ ] Can still wishlist products
- [ ] Admin dashboard works
- [ ] Payment gateway integrates
- [ ] Webhook notifications work

---

## SUCCESS CRITERIA

✅ **All of the following must be true:**

1. OTP login succeeds within 3 seconds
2. Admin login succeeds within 3 seconds
3. No 500 errors in successful flows
4. Retryable errors (5xx) are automatically retried
5. Non-retryable errors (4xx) show user-friendly message
6. Cold start recovery takes max 30 seconds
7. `/api/health` endpoint works and is fast
8. Database connections don't exhaust
9. No infinite redirect loops
10. No console errors on login
11. Logs show clear error messages (no Silent 500s)
12. All supabaseId validations pass
13. Admin separate from OTP flow
14. PgBouncer connection pooling works
15. Exponential backoff prevents request storm

---

## SIGN OFF

**Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

**Environment:** ☐ Staging  ☐ Production

**All checks passed:** ☐ YES  ☐ NO (List failures above)

---

## ROLLBACK PROCEDURE

If critical issues found post-deployment:

```bash
# 1. Identify last known-good commit
git log --oneline

# 2. Revert to that commit
git revert <commit-hash>
git push origin main

# 3. Render will auto-deploy previous version
# 4. Monitor /api/health for 5 minutes
# 5. Test login again
```

**Expected time to rollback:** 3-5 minutes

---

## EMERGENCY CONTACT

If system is down:
1. Check `/api/health` endpoint
2. Restart Render web service if showing "disconnected"
3. Check Render logs for error messages
4. Verify database is reachable (Render > Databases)
5. Check frontend deployment (Vercel logs)

All fixes are backward compatible - no data loss on rollback!

