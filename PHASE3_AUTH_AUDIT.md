# PHASE 3: AUTH FLOW AUDIT — END-TO-END ANALYSIS

## 🔍 AUDIT SUMMARY

Complete authentication flow analysis for admin panel. **No fixes yet - investigation only.**

---

## Q1: WHERE DOES THE TOKEN ORIGINATE?

### Token Creation (Backend)
**File**: [backend/src/controllers/auth.controller.ts](backend/src/controllers/auth.controller.ts)
**Function**: `login()` (lines 85-137)

```typescript
// Step 1: User provides email + password
const { email, password } = req.body;

// Step 2: Verify credentials
const user = await prisma.user.findUnique({ where: { email } });
const isPasswordValid = await comparePassword(password, user.passwordHash);

// Step 3: Generate JWT token
const token = generateToken({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Step 4: Return token to frontend
res.json({
  success: true,
  data: {
    user: { id, email, fullName, phone, role },
    token
  }
});
```

**Token Generation**: [backend/src/utils/jwt.ts](backend/src/utils/jwt.ts)
```typescript
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });
};
```

**Summary**:
- ✅ Token created in auth login endpoint
- ✅ Contains: id, email, role
- ✅ Expires in: 24 hours
- ✅ Secret: `process.env.JWT_SECRET`

---

## Q2: WHERE IS IT STORED?

### Frontend Storage (Browser)
**File**: [frontend/src/store/authStore.ts](frontend/src/store/authStore.ts) (Zustand store)
**Storage Layer**: Both localStorage and Zustand

```typescript
// Method 1: Direct localStorage (fallback)
localStorage.setItem('ora_token', token);

// Method 2: Zustand state (primary)
set({ token, user, isAuthenticated: true });

// Storage persistence: localStorage (via persist middleware)
// Configuration:
{
  name: 'ora-auth',  // localStorage key: 'ora-auth'
  partialize: (state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
  })
}
```

**Storage Locations**:
1. **Zustand Store** (in-memory state)
   - Used for immediate access
   - Lives during page session
   
2. **localStorage** (browser storage)
   - Key: `ora-auth` (Zustand persistence)
   - Key: `ora_token` (manual backup)
   - Survives page reloads

**Hydration Flow**:
```
Page Load
  ↓
Zustand hydration middleware triggers
  ↓
Reads localStorage('ora-auth')
  ↓
Restores { user, token, isAuthenticated } to state
  ↓
Sets isHydrated = true
  ↓
Components can use token
```

**Summary**:
- ✅ Primary: Zustand state + localStorage persistence
- ✅ Fallback: Direct localStorage read
- ✅ Hydration: Automatic on page load via persist middleware
- ✅ Lifetime: Until logout or 24h expiry

---

## Q3: WHEN IS IT ATTACHED TO REQUESTS?

### Request Interceptor (Axios)
**File**: [frontend/src/lib/api.ts](frontend/src/lib/api.ts) (lines 12-50)

```typescript
api.interceptors.request.use((config) => {
  // Access token from store (if hydrated) OR localStorage (fallback)
  const authStore = useAuthStore.getState();
  const storeToken = authStore.token;
  const localToken = localStorage.getItem('ora_token');
  const token = storeToken || localToken;
  
  if (token) {
    // ✅ Attach to Authorization header
    config.headers.Authorization = `Bearer ${token}`;
    
    // Log for debugging (admin/upload/order endpoints)
    if (config.url?.includes('admin')) {
      console.log('[Axios] 🔐 Token attached:', {
        endpoint: config.url,
        hasToken: !!token,
        fromStore: !!storeToken,
        fromLocalStorage: !storeToken && !!localToken,
      });
    }
  }
  
  return config;
});
```

**When Token is Attached**:
- ✅ Every request (request.use interceptor)
- ✅ If token exists in store OR localStorage
- ✅ As: `Authorization: Bearer <token>`

**Special Handling**:
- FormData requests: Content-Type header removed for proper multipart handling
- Admin endpoints: Extra logging for debugging

**Summary**:
- ✅ Every API call includes token
- ✅ Dual source: Store first, fallback to localStorage
- ✅ Header format: `Authorization: Bearer ${token}`
- ✅ Works for all endpoints (admin, orders, products, etc.)

---

## Q4: WHY DOES THE BACKEND REJECT VALID TOKENS?

### Backend Auth Verification
**File**: [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)

#### Step 1: Extract Token
```typescript
if (req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')) {
  token = req.headers.authorization.split(' ')[1];
}
```
**Requirement**: `Authorization: Bearer <token>` format

#### Step 2: Verify JWT Signature
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
  id: string;
  email: string;
  role: UserRole;
};
```
**Requirements**:
- ✅ `JWT_SECRET` must match token's secret
- ✅ Token must not be expired
- ✅ Token signature must be valid

#### Step 3: Check Authorization
```typescript
export const authorize = (...roles: UserRole[]) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('Access denied. Required roles: ...');
  }
};
```
**Requirement**: User role must be in `['ADMIN', 'STAFF']`

### Potential Failure Points

| Point | Failure Reason | Status |
|-------|---|---|
| **1. No Token** | Authorization header missing or malformed | ❌ CRITICAL |
| **2. Expired Token** | JWT exp > current time | ⏰ TIME-BASED |
| **3. Invalid Signature** | JWT_SECRET mismatch | 🔑 SECRET MISMATCH |
| **4. Wrong Role** | User role not in ['ADMIN', 'STAFF'] | 👤 ROLE MISMATCH |
| **5. Malformed Header** | Not `Bearer <token>` format | 📝 FORMAT ERROR |

### Specific Rejections Logged

**Missing Token**:
```
[Auth Middleware] ❌ NO TOKEN PROVIDED
endpoint: /admin/dashboard/stats
authHeader: MISSING
response: 401 "Not authorized, no token provided"
```

**Invalid Token**:
```
[Auth Middleware] ❌ TOKEN INVALID
endpoint: /admin/orders
error: "invalid signature"
response: 401 "Invalid token signature or format"
```

**Expired Token**:
```
[Auth Middleware] ⏰ TOKEN EXPIRED
endpoint: /admin/products
expiredAt: 2026-01-25T10:30:00Z
response: 401 "Token has expired"
```

**Wrong Role**:
```
[Auth Middleware] 🚫 USER ROLE NOT AUTHORIZED
endpoint: POST /admin/products
userRole: CUSTOMER
requiredRoles: [ADMIN, STAFF]
response: 403 "Access denied. Required roles: ADMIN, STAFF"
```

---

## 📊 COMPLETE AUTH FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN LOGIN FLOW                                                │
└─────────────────────────────────────────────────────────────────┘

┌─ FRONTEND ──────────────────────────────────┐
│                                              │
│  1. User fills login form                   │
│     email + password                        │
│           │                                 │
│           ↓                                 │
│  2. POST /api/auth/login                   │
│     (no auth needed)                        │
│           │                                 │
└───────────┼──────────────────────────────────┘
            │
            │ Axios Request Interceptor
            │ (no token yet, auth not needed)
            │
┌───────────↓──────────────────────────────────┐
│ BACKEND                                       │
│                                              │
│  3. authController.login()                  │
│     ├─ Find user by email                   │
│     ├─ Verify password                      │
│     └─ generateToken()                      │
│        return { user, token }               │
│           │                                 │
└───────────┼──────────────────────────────────┘
            │
            │ Response: { user, token }
            │
┌───────────↓──────────────────────────────────┐
│ FRONTEND - AuthStore                         │
│                                              │
│  4. useAuthStore.setToken(token)           │
│     useAuthStore.setUser(user)             │
│     ├─ localStorage.setItem('ora_token')   │
│     ├─ localStorage.setItem('ora-auth')    │
│     └─ Update Zustand state                │
│           │                                 │
│  5. Router.push('/admin')                  │
│           │                                 │
└───────────┼──────────────────────────────────┘
            │
┌───────────↓──────────────────────────────────┐
│ ADMIN PAGE GUARD                             │
│                                              │
│  6. /admin/page.tsx useEffect               │
│     ├─ Wait for isHydrated = true          │
│     ├─ Check token && user.role === ADMIN  │
│     └─ If not: push to /admin/login        │
│           │                                 │
│  7. Render admin dashboard                  │
│           │                                 │
└───────────┼──────────────────────────────────┘
            │
┌───────────↓──────────────────────────────────┐
│ PROTECTED ADMIN REQUESTS                     │
│                                              │
│  8. GET /api/admin/dashboard/stats          │
│           │                                 │
│           ├─ Axios Request Interceptor     │
│           │  ├─ authStore.getState()       │
│           │  │  (get token from store)     │
│           │  └─ localStorage.getItem()     │
│           │     (fallback)                 │
│           │  ├─ Set header:                │
│           │  │  Authorization: Bearer<...>│
│           │  └─ console.log details       │
│           │                                 │
└───────────┼──────────────────────────────────┘
            │
┌───────────↓──────────────────────────────────┐
│ BACKEND AUTH MIDDLEWARE                      │
│                                              │
│  9. protect middleware                      │
│     ├─ Extract token from:                  │
│     │  Authorization: Bearer <token>        │
│     ├─ jwt.verify(token, JWT_SECRET)        │
│     │  ├─ Check signature                   │
│     │  ├─ Check expiry                      │
│     │  └─ Decode: { id, email, role }      │
│     └─ req.user = decoded               │
│           │                                 │
│  10. authorize('ADMIN', 'STAFF')           │
│      ├─ Check: req.user.role in roles     │
│      ├─ If not: 403 Forbidden              │
│      └─ If yes: next()                     │
│           │                                 │
└───────────┼──────────────────────────────────┘
            │
┌───────────↓──────────────────────────────────┐
│ ADMIN CONTROLLER                             │
│                                              │
│  11. getDashboardStats(req, res)            │
│      (req.user available & verified)        │
│      ├─ Query database                      │
│      └─ return { stats }                    │
│           │                                 │
└───────────┼──────────────────────────────────┘
            │
            └─→ Response: { stats, data }
                  ↓
            Frontend AdminStore updates
            UI renders with data
```

---

## ✅ VERIFICATION CHECKLIST

### Frontend
- ✅ Token generated in login response
- ✅ Token stored in Zustand + localStorage
- ✅ Token attached to every request via Axios interceptor
- ✅ Token read from both store & localStorage (fallback)
- ✅ Admin pages check isHydrated before accessing store
- ✅ Admin pages guard against missing token/role

### Backend
- ✅ Token verified with JWT_SECRET
- ✅ Token checked for expiry
- ✅ User role authorized for endpoint
- ✅ Middleware logs all success/failures
- ✅ All admin routes protected (protect + authorize)

### Headers & Format
- ✅ Request: `Authorization: Bearer <token>`
- ✅ Token contains: id, email, role
- ✅ Expires in: 24 hours
- ✅ Secret: process.env.JWT_SECRET

---

## 🚨 IDENTIFIED ISSUES (No fixes yet)

### Issue #1: Hydration Race Condition ⚠️ MEDIUM
**Symptom**: Sometimes admin pages show 401 errors even with valid token
**Location**: [frontend/src/app/admin/page.tsx](frontend/src/app/admin/page.tsx) lines 25-40
**Root Cause**: 
```typescript
useEffect(() => {
  if (!isHydrated) return;  // ← Waits for hydration
  
  if (!token || user?.role !== 'ADMIN') {
    router.push('/admin/login');
  }
}, [isHydrated, token, user, router]);
```
**The Problem**: 
- Page renders BEFORE hydration is complete
- If token isn't in Zustand yet (only in localStorage), guard thinks token is null
- Router redirects to login unnecessarily
- Shows 401 errors on initial load

### Issue #2: Token Not Always Attached ⚠️ LOW
**Location**: [frontend/src/lib/api.ts](frontend/src/lib/api.ts) lines 13-20
**Root Cause**:
```typescript
const token = storeToken || localToken;
if (token) {  // ← What if both are null initially?
  config.headers.Authorization = `Bearer ${token}`;
}
```
**The Problem**:
- If Zustand not hydrated YET, storeToken = null
- If localStorage not read properly, localToken = null
- Request goes out WITHOUT token
- Backend rejects with 401

### Issue #3: JWT_SECRET Mismatch 🔴 HIGH
**Location**: Backend only
**Root Cause**:
```typescript
// backend/src/utils/jwt.ts
jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' })

// backend/src/middleware/auth.ts
jwt.verify(token, process.env.JWT_SECRET!)
```
**The Problem**:
- If JWT_SECRET environment variable is different between:
  - Token creation
  - Token verification
  - Different backend instances
- All tokens become invalid
- Admin CRUD fails completely

### Issue #4: Zustand Hydration Timing 🟡 MEDIUM
**Location**: [frontend/src/store/authStore.ts](frontend/src/store/authStore.ts) lines 95-110
**Root Cause**:
```typescript
onRehydrateStorage: () => (state) => {
  if (state) {
    state.setHydrated(true);
  }
},
```
**The Problem**:
- Hydration is asynchronous
- Components might call useAuthStore BEFORE hydration
- isHydrated flag set AFTER state restored
- Pages render with null token despite token in localStorage

---

## 📈 FLOW SUMMARY

| Stage | Component | Token Status | Status Code |
|-------|-----------|---|---|
| 1. Login | Frontend Form | ❌ No token yet | N/A |
| 2. Send Credentials | Axios | ❌ No auth needed | N/A |
| 3. Backend validates | Auth Controller | ✅ Token created | 200 |
| 4. Store locally | Zustand | ✅ Token stored | N/A |
| 5. Navigate to /admin | Router | ✅ Token present | N/A |
| 6. Page load | Admin Page | ✅ Wait for hydration | N/A |
| 7. Make request | Axios | ✅ Token attached | 200 |
| 8. Backend verify | Auth Middleware | ✅ Token valid | 200 |
| 9. Check role | Authorize | ✅ Role matches | 200 |
| 10. Execute | Admin Controller | ✅ User authenticated | 200 |

---

## NEXT: STEP 3.2

Identify the **single highest-impact auth failure** and propose minimal fix.

