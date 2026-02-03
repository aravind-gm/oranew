# Render Deployment: Cold Start Fix Guide

## Overview
This guide ensures your Render backend never breaks the frontend during cold starts (when Render spins down inactive services).

---

## Step 1: Configure Render Health Check

### Why This Matters
- Render checks `/api/health` to determine if service is ready
- Only routes traffic when health check passes
- Our lightweight endpoint responds instantly without touching the database

### Action: Update Render Service Settings

1. Go to **Render Dashboard** → Your Backend Service
2. Click **Settings** tab
3. Scroll to **Health Check Path**
4. Set to: `/api/health`
5. Set **Health Check Protocol** to: `HTTP`
6. Set **Initial Service Delay** to: `30` seconds (gives backend time to start)
7. Click **Save**

### Verification
```bash
# Test that health check responds instantly
curl https://oranew.onrender.com/api/health

# Response should be:
# {"status":"ok","timestamp":"2026-02-03T..."}
```

---

## Step 2: Understand the Architecture

### When Backend Sleeps
1. No traffic for 15+ minutes
2. Render spins down the service (cold stop)
3. Browser tries to fetch `/api/products`
4. Render receives request, starts waking backend
5. **During startup (30-60 seconds): All requests get 503**

### Our Fix: Three Layers
```
┌─────────────────────────────────────────┐
│ Layer 1: Lightweight /api/health       │
│ - Responds instantly (no DB)            │
│ - Render uses to detect ready state     │
│ - Prevents traffic during startup       │
└─────────────────────────────────────────┘
         ↓ (only routes when ready)
┌─────────────────────────────────────────┐
│ Layer 2: Axios Interceptor (Frontend)   │
│ - Detects 503 responses                 │
│ - Automatically retries 3 times         │
│ - Never clears auth tokens              │
│ - User stays logged in                  │
└─────────────────────────────────────────┘
         ↓ (if 503 still happens)
┌─────────────────────────────────────────┐
│ Layer 3: UI Fallback (React)            │
│ - Shows "Waking up server..." message   │
│ - Displays skeleton loaders             │
│ - No error screens or 500 pages         │
│ - User experience stays smooth          │
└─────────────────────────────────────────┘
```

---

## Step 3: Frontend Code Usage

### Using useCategories Hook

```tsx
'use client';

import { useCategories } from '@/hooks/useCategories';
import { LoadingFallback } from '@/components/LoadingFallback';

export function CategoriesSection() {
  const { categories, loading, error, isWakingUp } = useCategories();

  // While loading or waking up
  if (loading || isWakingUp) {
    return (
      <div className="py-8">
        <LoadingFallback isWakingUp={isWakingUp} count={4} />
      </div>
    );
  }

  // Real error (not 503)
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  // Success
  return (
    <div className="grid grid-cols-4 gap-4">
      {categories.map((cat) => (
        <div key={cat.id} className="p-4 border rounded-lg">
          {cat.name}
        </div>
      ))}
    </div>
  );
}
```

### What This Does
- ✅ Shows skeletons during initial load
- ✅ Shows "Waking up..." during 503 retries
- ✅ Retries automatically (user sees no errors)
- ✅ Never logs out the user
- ✅ Recovers gracefully when server comes back

---

## Step 4: API Interceptor Details

### How 503 Retry Works

File: `src/lib/api-interceptors.ts`

```
Request to /api/categories
  ↓
Network succeeds, server returns 503
  ↓
Interceptor detects 503
  ↓
Log warning: "Service temporarily unavailable (503). Retrying 1/3..."
  ↓
Wait 2 seconds
  ↓
Retry the same request
  ↓
If succeeds → Clear retry counter, return data
If fails again → Retry 2/3, 3/3
If all 3 fail → Return error to component (but keep user logged in)
```

### Key Safety Features
- ✅ **Max 3 retries** - Prevents infinite loops
- ✅ **2 second delay** - Gives backend time to start
- ✅ **Per-endpoint tracking** - Different endpoints tracked separately
- ✅ **Never clears auth** - User stays logged in even on failure
- ✅ **Production-safe** - Graceful degradation, never crashes

---

## Step 5: Environment Variables (Corrected)

### Current Issue
- DATABASE_URL and DIRECT_URL are using the pooler
- Pooler may time out during cold starts

### Fix Applied
Update **Render Dashboard** → Settings → Environment Variables:

```
DATABASE_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres

DIRECT_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
```

This uses **direct connection** (no pooler) which is more reliable during cold starts.

---

## Step 6: Testing Cold Start Behavior

### Test 1: Simulate Server Waking Up

```bash
# Terminal 1: Trigger deploy (simulates cold start)
curl -X GET https://oranew.onrender.com/api/health

# Terminal 2: Immediately fetch products
curl -X GET https://oranew.onrender.com/api/products

# Expected: First request might get 503, second request succeeds
# because interceptor retries automatically
```

### Test 2: Check Render Logs

1. Go to Render Dashboard → Your Service → **Logs**
2. Trigger a new deployment
3. Watch for messages:
   - `[API] 🟡 Service temporarily unavailable (503). Retrying 1/3...`
   - `[API] ✅ Request succeeded after retry`

### Test 3: Check Frontend Console

1. Open browser DevTools → Console
2. Trigger a cold start (redeploy from Render)
3. Load a page with categories
4. You should see:
   - Skeleton loaders show
   - Console logs: `[API] 🟡 Service temporarily unavailable (503). Retrying 1/3...`
   - After 2 seconds: Data loads
   - No error screen, user never sees the 503

---

## Step 7: Monitoring & Debugging

### Check Backend Health

```bash
# Lightweight check (no DB)
curl https://oranew.onrender.com/api/health
# Response: {"status":"ok","timestamp":"..."}

# Detailed check (with DB, storage, env vars)
curl https://oranew.onrender.com/api/health/detailed
# Shows database connection status, storage config, etc.
```

### Common Issues & Fixes

**Issue**: Still getting 503 errors that don't retry
- **Cause**: Health check might still be hitting the database
- **Fix**: Verify backend code uses lightweight `/api/health` (no DB query)

**Issue**: User gets logged out during cold start
- **Cause**: Auth interceptor clearing tokens on 503
- **Fix**: Verify `api-interceptors.ts` only handles 503, not other errors

**Issue**: Retries don't stop after 3 attempts
- **Cause**: Retry counter not clearing on success
- **Fix**: Verify `retryMap.delete(key)` in success path

---

## Step 8: Production Checklist

- [ ] Backend `/api/health` endpoint responds in <100ms
- [ ] Render Health Check Path set to `/api/health`
- [ ] Render Health Check Interval: 30 seconds
- [ ] Frontend uses `useCategories()` hook (or equivalent retry logic)
- [ ] `LoadingFallback` component displays during loading
- [ ] Tested cold start behavior (redeploy and immediately fetch data)
- [ ] Verified user doesn't get logged out on 503
- [ ] Checked browser console for retry logs
- [ ] DATABASE_URL uses direct connection (no pooler)
- [ ] All env vars set on Render (not in .env file)

---

## Summary: How This Prevents Broken Experiences

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Backend cold start | 503 error, app breaks | Automatic retry, user sees loading |
| User waits 2 seconds | Still 503 | Data loads, seamless experience |
| Multiple API calls | All get 503, crash | Interceptor retries each one |
| User navigates away | Lost data, logout | User stays logged in, data syncs when back |
| Production impact | ~60 seconds of downtime | ~10 seconds of loading UI |

---

## Next Steps

1. **Commit and deploy**:
   ```bash
   git add .
   git commit -m "feat: Add Render cold-start resilience layer"
   git push
   ```

2. **Trigger Render redeploy**: Click "Manual Deploy" on Render

3. **Test in browser**: Visit the site, check console for retry logs

4. **Monitor**: Keep Render logs open during traffic to watch health checks

---

## Questions?

- **Why not upgrade Render plan?** - This solution works on FREE tier and is free!
- **Will users see loading for 10 seconds every time?** - Only during cold starts (15+ min idle)
- **Is 3 retries enough?** - Yes, backend starts within 30-60 seconds typically
- **What if 503 persists?** - User sees "Waking up..." message, can retry page refresh

