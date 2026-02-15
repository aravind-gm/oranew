# 🔥 CRITICAL: Frontend localStorage Removal Guide
## Required BEFORE Backend Deployment

**Current Status:** ⚠️ BLOCKING ISSUE - Frontend still uses localStorage  
**Risk:** Backend HttpOnly cookies will NOT work until frontend is updated  
**Estimated Time:** 30 minutes

---

## 🎯 What Needs to Change

The frontend currently stores JWT tokens in localStorage:
```typescript
// ❌ OLD (VULNERABLE TO XSS):
localStorage.setItem('ora_token', token);
const token = localStorage.getItem('ora_token');

// ✅ NEW (SECURE):
// Tokens automatically stored in HttpOnly cookies
// No manual token management needed
```

---

## 📝 Files to Update

### 1. API Client Configuration

**File:** `frontend/src/lib/api-client.ts`

**Find:**
```typescript
const response = await fetch(url, {
  method: options.method || 'GET',
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
  body: options.body ? JSON.stringify(options.body) : undefined,
});
```

**Replace with:**
```typescript
const response = await fetch(url, {
  method: options.method || 'GET',
  credentials: 'include', // ← ADD THIS LINE
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
  body: options.body ? JSON.stringify(options.body) : undefined,
});
```

**Explanation:** `credentials: 'include'` tells the browser to automatically send HttpOnly cookies with every request.

---

### 2. Auth Store (Remove Token Storage)

**File:** `frontend/src/store/authStore.ts`

**Find and remove:**
```typescript
// ❌ REMOVE ALL THESE LINES:
localStorage.setItem('ora_token', token);
localStorage.removeItem('ora_token');
const token = localStorage.getItem('ora_token');
```

**Update login function:**
```typescript
// BEFORE:
const login = async (phone: string, otp: string) => {
  const response = await api.post('/auth/verify-otp', { phone, otp });
  const { token, user } = response.data;
  
  // ❌ REMOVE:
  localStorage.setItem('ora_token', token);
  
  setUser(user);
};

// AFTER:
const login = async (phone: string, otp: string) => {
  const response = await api.post('/auth/verify-otp', { phone, otp });
  const { user } = response.data; // ← No token in response anymore
  
  // Token automatically stored in HttpOnly cookie by backend
  setUser(user);
};
```

**Update logout function:**
```typescript
// BEFORE:
const logout = () => {
  // ❌ REMOVE:
  localStorage.removeItem('ora_token');
  
  setUser(null);
};

// AFTER:
const logout = async () => {
  // Call backend to revoke refresh token
  await api.post('/auth/logout'); // ← Backend clears cookies
  
  setUser(null);
  window.location.href = '/login';
};
```

---

### 3. Auth Context (Remove Token Checks)

**File:** `frontend/src/context/AuthContext.tsx`

**Find:**
```typescript
useEffect(() => {
  // ❌ REMOVE:
  const token = localStorage.getItem('ora_token');
  
  if (token) {
    // Verify token and fetch user...
  }
}, []);
```

**Replace with:**
```typescript
useEffect(() => {
  // Check if user is authenticated by calling backend
  const checkAuth = async () => {
    try {
      // Token is automatically sent via HttpOnly cookie
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      // Not authenticated, redirect to login
      setUser(null);
    }
  };
  
  checkAuth();
}, []);
```

---

### 4. API Interceptors (Remove Token Headers)

**File:** `frontend/src/lib/api-interceptors.ts` (if exists)

**Find:**
```typescript
// ❌ REMOVE:
const token = localStorage.getItem('ora_token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

**Replace with:**
```typescript
// Token is automatically sent via HttpOnly cookie
// No need to manually add Authorization header
config.credentials = 'include';
```

---

### 5. Protected Routes (Update Auth Check)

**File:** `frontend/src/components/ProtectedRoute.tsx`

**Find:**
```typescript
// ❌ REMOVE:
const token = localStorage.getItem('ora_token');
if (!token) {
  return <Navigate to="/login" />;
}
```

**Replace with:**
```typescript
// Check user object from auth context instead
const { user, loading } = useAuth();

if (loading) return <Spinner />;
if (!user) return <Navigate to="/login" />;
```

---

## 🔧 New Backend Endpoint Required

**File:** `backend/src/controllers/auth.controller.ts`

**Add this endpoint for frontend to check authentication:**

```typescript
/**
 * Get current user from access token cookie
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.user populated by protect middleware (reads access_token cookie)
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // Fetch full user details from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
```

**Add route:**
```typescript
// backend/src/routes/auth.routes.ts
router.get('/me', protect, getCurrentUser);
```

---

## 🧪 Testing Steps

### Test 1: Login Flow
```bash
# 1. Clear all cookies and localStorage
# 2. Login via OTP
# 3. Open DevTools → Application → Cookies
# Expected:
# - access_token (HttpOnly, Secure, SameSite=Strict)
# - refresh_token (HttpOnly, Secure, SameSite=Strict)
# - NO token in localStorage
```

### Test 2: API Calls
```bash
# 1. After login, call any protected endpoint (e.g., /api/products)
# 2. Open DevTools → Network → Headers
# Expected:
# - Cookie header contains: access_token=...
# - NO Authorization header
```

### Test 3: Page Refresh
```bash
# 1. Login and navigate to dashboard
# 2. Refresh page (F5)
# Expected:
# - User stays logged in (cookies persist)
# - /api/auth/me called automatically
# - User details loaded from backend
```

### Test 4: Logout
```bash
# 1. Click logout button
# 2. Check DevTools → Application → Cookies
# Expected:
# - Both access_token and refresh_token DELETED
# - Redirect to /login
```

### Test 5: Token Expiry
```bash
# 1. Login
# 2. Wait 30 minutes (or manually delete access_token cookie)
# 3. Try to access protected page
# Expected:
# - Frontend calls /api/auth/refresh automatically
# - New access_token issued
# - User stays logged in
```

---

## ⚠️ Common Pitfalls

### Issue 1: "Token not found" error
**Cause:** Frontend still sending Authorization header instead of cookies  
**Fix:** Remove all `Authorization: Bearer ${token}` code, add `credentials: 'include'`

### Issue 2: CORS error "Credentials not allowed"
**Cause:** Backend CORS not configured for credentials  
**Fix:** Backend already configured, ensure frontend origin matches allowed domains

### Issue 3: Cookies not being set
**Cause:** Backend response headers not including Set-Cookie  
**Fix:** Ensure backend uses `issueAuthTokens()` helper in login/register controllers

### Issue 4: User logged out on page refresh
**Cause:** Frontend not calling /api/auth/me on mount  
**Fix:** Add useEffect in AuthContext to check authentication on load

---

## 📋 Deployment Checklist

**Before deploying:**
- [ ] All localStorage.setItem/getItem('ora_token') removed
- [ ] All Authorization headers removed
- [ ] All API calls have credentials: 'include'
- [ ] AuthContext checks /api/auth/me on mount
- [ ] Logout calls /api/auth/logout endpoint
- [ ] Backend has /api/auth/me endpoint
- [ ] All 5 tests pass locally

**Deployment order:**
1. Deploy backend first (supports both old + new auth)
2. Test backend with Postman (cookie-based auth)
3. Deploy frontend (remove localStorage)
4. Test end-to-end login/logout/refresh flow
5. Monitor for 24 hours before marking complete

---

## 🔄 Backward Compatibility (Optional)

If you want to support both old and new clients during transition:

**Backend: Support both Authorization header and cookies**
```typescript
// backend/src/middleware/auth.ts
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check HttpOnly cookie first (NEW)
  if (req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // Fallback to Authorization header (OLD)
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    throw new AppError('Not authenticated', 401);
  }

  // Verify token...
};
```

This allows gradual migration - old clients using localStorage will continue working.

---

## ✅ Success Criteria

Frontend update is complete when:
- ✅ No localStorage usage anywhere in codebase
- ✅ All API calls send cookies automatically
- ✅ Login sets HttpOnly cookies (visible in DevTools)
- ✅ Logout clears HttpOnly cookies
- ✅ Page refresh preserves authentication
- ✅ Token refresh happens seamlessly after 30 minutes

**Security Upgrade:** localStorage (XSS vulnerable) → **HttpOnly cookies (XSS-proof)** 🔒

