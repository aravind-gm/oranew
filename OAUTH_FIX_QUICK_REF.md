# ⚡ OAuth PKCE Fix — Quick Reference

## The Problem
```
❌ invalid request: both auth code and code verifier should be non-empty
```

## The Solution

### 1. Enable PKCE in Supabase Client
**File**: `src/lib/supabase.ts` (Line 23)

Add to auth config:
```typescript
flowType: 'pkce',
debug: process.env.NODE_ENV === 'development',
```

### 2. Fix Callback Handler
**File**: `src/app/auth/callback/page.tsx`

Three key changes:
- Check for auto-detected session FIRST
- Add 500ms delay for URL parsing
- Only exchange code if no session found

### 3. Key Insight
```
detectSessionInUrl: true  →  Auto-extracts session from callback URL
Don't exchange immediately  →  Let Supabase parse first
Wait 500ms  →  Ensure parsing completes
```

---

## Testing

```bash
# Build
npm run build  ✅

# Start dev server
npm run dev  ✅

# Visit OAuth callback
http://localhost:3000/auth/callback#...  ✅

# Check console
[Auth Callback] Session established for user: ...  ✅
```

---

## Before & After

```
BEFORE:
❌ Immediately attempt exchange
❌ Ignore detectSessionInUrl
❌ Missing PKCE flow type
❌ No delay for parsing

AFTER:
✅ Check session first
✅ Respect detectSessionInUrl
✅ Explicit PKCE flow type
✅ 500ms delay for safety
```

---

## Files Changed
- `src/lib/supabase.ts` — Add PKCE flow type
- `src/app/auth/callback/page.tsx` — Smart session handling

**Status**: ✅ Ready to test
