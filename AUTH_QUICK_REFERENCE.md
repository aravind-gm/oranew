# Quick Reference: Auth System Changes

## What Changed

| What | Before | After |
|------|--------|-------|
| **Login method** | Magic link (URL callback) | Email OTP (6-digit code) |
| **Callback page** | `/auth/callback` exists | Removed - not needed |
| **URL auth handling** | `exchangeCodeForSession` | Direct `verifyOtp()` |
| **Session source** | Supabase session in URL | Supabase session in local storage |
| **Token management** | Supabase access_token | Backend JWT token |
| **API 401 handling** | Logout and redirect | Log error, stay logged in |
| **Admin login** | Not separate | Separate password login |
| **Profile page** | Checks Supabase session | Checks AuthStore hydration |

## Key Files

```
frontend/src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          ✅ REFACTORED (OTP flow)
│   │   ├── complete-profile/page.tsx ✅ FIXED (proper auth guard)
│   │   ├── callback/                ❌ DELETE THIS (no longer needed)
│   ├── account/page.tsx             ✅ ENHANCED (error handling)
│   └── admin/login/page.tsx          ✅ FIXED (hydration guard)
├── lib/
│   ├── api.ts                       ✅ FIXED (never logout on 401)
│   └── supabase.ts                  ✅ FIXED (autoRefreshToken disabled)
├── store/
│   └── authStore.ts                 ✅ GOOD (minimal changes)
└── middleware.ts                    ✅ GOOD (no changes needed)
```

## Login Page Flow

```typescript
// Step 1: Send OTP
user enters email → supabase.auth.signInWithOtp() → email sent

// Step 2: Verify OTP
user enters 6-digit code → supabase.auth.verifyOtp() → Supabase session created

// Step 3: Backend login
api.post('/auth/login', {supabaseId, email}) → JWT returned

// Step 4: Store & Redirect
setToken(jwt) → setUser(data) → router.push('/account')
```

## Admin Login (Dev Only)

```
Press Ctrl+Shift+A → admin form shows
↓
supabase.auth.signInWithPassword({email, password})
↓
Check role === 'ADMIN'
↓
setToken(jwt) → router.push('/admin')
```

## API Interceptor

```typescript
// Request: Add JWT to all requests
GET /api/orders
→ Authorization: Bearer <jwt_token>

// Response: Handle errors gracefully
401 response → Log error → Return error to page
                          ↓
                    Page shows "unavailable"
                    User stays logged in
```

## Testing Commands

```bash
# Test normal OTP login
1. Go to /auth/login
2. Enter email
3. Check inbox for OTP code
4. Enter 6-digit code
5. Should redirect to /account

# Test admin login (dev mode only)
1. Press Ctrl+Shift+A
2. Admin form appears
3. Enter credentials
4. Should redirect to /admin

# Test session persistence
1. Login successfully
2. Refresh page (Ctrl+R)
3. Should still be logged in
4. Check localStorage for JWT
```

## Debugging

```typescript
// Check auth state
const { user, token, isHydrated } = useAuthStore();
console.log('[Debug]', {user, token, isHydrated});

// Check API token in request
// Look at Authorization header in Network tab
```

---

**For detailed guide, see:** `AUTH_REFACTOR_COMPLETE.md`
