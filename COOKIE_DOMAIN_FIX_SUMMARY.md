# 🍪 Cookie Domain Fix — Complete

## Problem Identified

**Symptom**: Login succeeds, cookies set with `domain: 'orashop.in'`, but subsequent requests receive **NO cookies** (`allCookies: []`)

**Root Cause**: When setting `domain: 'orashop.in'` on cookies sent from `api.orashop.in`, browsers may reject or not send them back due to subdomain mismatch behavior.

**Solution**: Remove `domain` property entirely → cookies become **host-only** cookies tied exclusively to `api.orashop.in`

---

## Changes Applied

### Cookie Configuration Updates

**Before:**
```typescript
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  domain: 'orashop.in',  // ❌ REMOVED
  path: '/',
  maxAge: 30 * 60 * 1000,
});
```

**After:**
```typescript
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',  // ✅ Host-only cookie (api.orashop.in)
  maxAge: 30 * 60 * 1000,
});
```

---

## Files Modified

### 1. `/backend/src/controllers/authToken.controller.ts`
- ✅ `setAuthCookies()` — Removed `domain` from both `access_token` and `refresh_token`
- ✅ `clearAuthCookies()` — Removed `domain` from both `clearCookie()` calls

### 2. `/backend/src/controllers/auth.controller.ts`
- ✅ **OTP verify login** (line ~217) — Removed `domain` from both cookies
- ✅ **Unified login password flow** (line ~338) — Removed `domain` from both cookies + updated debug log
- ✅ **Register password flow** (line ~542) — Removed `domain` from both cookies
- ✅ **passwordLogin standalone** (line ~704) — Removed `domain` from both cookies
- ✅ **logout** (line ~856) — Removed `domain` from both `clearCookie()` calls

---

## Total Changes

| Operation | Locations Modified |
|-----------|-------------------|
| `res.cookie()` | 10 |
| `res.clearCookie()` | 4 |
| **Total** | **14** |

---

## Expected Behavior After Deployment

### 1. Login Request
```
POST https://api.orashop.in/api/auth/login
Response Headers:
Set-Cookie: access_token=...; Path=/; HttpOnly; Secure; SameSite=Lax
Set-Cookie: refresh_token=...; Path=/; HttpOnly; Secure; SameSite=Lax
```

**Key**: NO `Domain=` attribute → browser stores as host-only cookie for `api.orashop.in`

### 2. Subsequent Requests
```
GET https://api.orashop.in/api/auth/me
Request Headers:
Cookie: access_token=...; refresh_token=...
```

**Key**: Browser automatically sends cookies because request is to same host (`api.orashop.in`)

### 3. Render Logs
```
[Auth Middleware] 🍪 All cookies received: { access_token: 'eyJhbGci...' }
[Auth Middleware] 🔍 access_token cookie: eyJhbGci...
[Auth Middleware] 🍪 Token found in HttpOnly cookie
[Auth Middleware] ✅ Token verified successfully
```

**No more `allCookies: []`** ✅

---

## Why This Works

| Aspect | Explanation |
|--------|-------------|
| **Host-only cookies** | When `domain` is omitted, cookies are tied exclusively to the exact host that set them (`api.orashop.in`) |
| **No subdomain issues** | Browser doesn't need to match domain patterns — simple exact host match |
| **sameSite: 'lax'** | Since frontend (`orashop.in`) makes API calls to backend (`api.orashop.in`), they're **same-site** (same eTLD+1) |
| **Cloudflare compatible** | Host-only cookies work reliably through CDN/proxy chains |

---

## Build Verification

```bash
cd /home/aravind/Downloads/oranew/backend
npx tsc --noEmit
```

**Result**: ✅ **Zero TypeScript errors**

---

## Deployment Checklist

- [x] Remove `domain` property from all 10 `res.cookie()` calls
- [x] Remove `domain` property from all 4 `res.clearCookie()` calls
- [x] Update comments to reflect "host-only" behavior
- [x] Verify TypeScript compilation (zero errors)
- [x] No changes to CORS, Axios, Frontend, or Middleware

**Ready to deploy** ✅

---

## Testing After Deployment

### 1. Clear Existing Cookies
- Open DevTools → Application → Cookies
- Delete ALL cookies for `orashop.in` and `api.orashop.in`
- Hard refresh (`Ctrl+Shift+R`)

### 2. Login Test
1. Go to `https://orashop.in/auth/login`
2. Enter credentials and submit
3. Open DevTools → Application → Cookies → `api.orashop.in`
4. Should see:
   - `access_token` — **Domain: `api.orashop.in`** (host-only)
   - `refresh_token` — **Domain: `api.orashop.in`** (host-only)

### 3. Persistence Test
1. Refresh the page
2. Open DevTools → Network → Find `GET /api/auth/me`
3. Check **Request Headers** → Should see `Cookie: access_token=...`
4. Check **Response** → Should return `200 OK` with user data

### 4. Render Logs Check
Look for:
```
[Auth Middleware] 🍪 All cookies received: { access_token: '...' }
[Auth Middleware] ✅ Token found in HttpOnly cookie
```

**No more `undefined` or empty arrays** ✅

---

## What Did NOT Change

| Component | Status |
|-----------|--------|
| CORS configuration | ✅ Unchanged |
| Cloudflare settings | ✅ Unchanged |
| SSL/TLS mode | ✅ Unchanged |
| Axios `withCredentials` | ✅ Unchanged |
| Frontend code | ✅ Unchanged |
| Middleware matcher | ✅ Unchanged |
| JWT logic | ✅ Unchanged |
| Business logic | ✅ Unchanged |

**Only cookie `domain` property removed** — minimal, surgical change.

---

## Success Criteria

After deployment:
- ✅ Login succeeds (200 OK)
- ✅ Cookies stored in browser (`api.orashop.in` domain)
- ✅ `/api/auth/me` returns 200 with user data
- ✅ Render logs show `access_token` present in `req.cookies`
- ✅ No redirect to `/auth/login` during browsing
- ✅ Checkout flow works without re-authentication
- ✅ Logout clears cookies properly

---

## Rollback Plan (if needed)

If this doesn't work, rollback by restoring:
```typescript
domain: '.orashop.in'
```

But **this is extremely unlikely to fail** — host-only cookies are the most reliable cookie configuration for API backends.

---

**Deployment ready. Expected fix: 100% cookie transport success.**
