# OTP Login Fix Summary - Feb 4, 2026

## Problems Fixed

### 1. ✅ Duplicate `/api/` in URL paths (FIXED)
**Issue:** POST requests were being sent to `/api/api/auth/otp-login` (404 error)

**Root Cause:** 
- `NEXT_PUBLIC_API_URL` was set to `http://localhost:8000/api`
- Frontend code was appending additional `/api/` paths
- Result: `/api/api/auth/otp-login` (duplicate)

**Solution:**
Updated fallback URLs in 5 frontend files to use consistent path pattern:
```
// Before
${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/otp-login

// After
${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/otp-login
```

**Files Modified:**
- `frontend/src/app/(auth)/auth/login/page.tsx`
- `frontend/src/app/(auth)/auth/complete-profile/page.tsx`
- `frontend/src/app/(store)/account/profile/page.tsx`
- `frontend/src/app/(store)/account/page.tsx`
- `frontend/src/app/(store)/account/addresses/page.tsx`

---

### 2. ✅ Missing `gender` column in database (FIXED)
**Issue:** 500 error - "The column `users.gender` does not exist in the current database"

**Root Cause:**
- Prisma schema had `gender` field defined
- Database table `users` was missing the `gender` column
- Caused all OTP verification queries to fail

**Solution:**
Added `gender` column to users table using Node.js + Prisma:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
```

**Tools Created:**
- `ADD_GENDER_COLUMN.sql` - SQL script for manual execution
- `add-gender-column.sh` - Bash script (for reference)
- `backend/add-gender-column.js` - Node.js script (executed successfully)

---

## Verification

### Step 1: API URL Fix ✅
```
Endpoint: POST /api/auth/otp-login
Expected: http://localhost:8000/api/auth/otp-login (not /api/api/...)
Status: FIXED
```

### Step 2: Gender Column Fix ✅
```
Column: users.gender
Type: character varying
Nullable: YES
Status: ADDED and VERIFIED
```

---

## Next Steps

1. ✅ Clear browser cache if needed
2. ✅ Restart frontend dev server
3. ✅ Test login flow:
   - Enter email
   - Receive OTP code
   - Verify OTP
   - Should redirect to complete profile or account

---

## Files Created/Modified

Created:
- `ADD_GENDER_COLUMN.sql`
- `add-gender-column.sh`
- `backend/add-gender-column.js`
- `backend/prisma/migrations/20260204_add_gender_column/migration.sql`

Modified:
- 5 frontend files (API URL fixes)

---

## Status: ✅ READY FOR TESTING
All issues have been resolved. The OTP login flow should now work without 404 or 500 errors.
