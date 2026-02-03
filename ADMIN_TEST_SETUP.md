# Admin Test Account Setup Guide

## Quick Start

This temporary admin login flow allows testing the full ecommerce flow with one-click access.

⚠️ **IMPORTANT**: This is for local/testing only and must be removed before production.

---

## Step 1: Create Test Admin Account in Supabase

### In Supabase Console:

1. Go to **Authentication → Users**
2. Click **Create New User**
3. Fill in:
   - **Email**: `admin@ora-test.com`
   - **Password**: `AdminTest@2024` (matches hardcoded test password)
   - **Auto Confirm User**: ✅ Check this box

4. After user creation, click on the user to add metadata:
   - Click **Metadata** tab
   - Add to `user_metadata`:
     ```json
     {
       "role": "admin",
       "isAdmin": true,
       "isTestAccount": true,
       "profileComplete": true,
       "full_name": "Admin Test"
     }
     ```
   - **Save**

5. Ensure the user exists in `profiles` table:
   - Go to **SQL Editor**
   - Run this query:
     ```sql
     INSERT INTO profiles (id, email, full_name, role, profile_completed)
     SELECT id, email, full_name, 'admin', true
     FROM auth.users
     WHERE email = 'admin@ora-test.com'
     ON CONFLICT (id) DO UPDATE SET role = 'admin';
     ```

---

## Step 2: Trigger Admin Login in Frontend

### Two ways to access:

**Option A: Keyboard Shortcut (Recommended)**
- Press `Ctrl + Shift + A` on the login page
- Button appears: "Login as Admin"
- Click to log in instantly

**Option B: Manual Click**
- Scroll to bottom of login page
- Click "Admin Access"
- Same one-click login

---

## Step 3: Verify Admin is Logged In

After clicking "Login as Admin":
1. Should redirect to `/account`
2. Look for **"ADMIN"** badge next to user icon in header
3. Badge is only visible in development/testing
4. Disappears in production builds

---

## What Admin Can Do

Once logged in as test admin:
- ✅ Browse products
- ✅ Add items to cart
- ✅ Proceed to checkout
- ✅ Complete orders
- ✅ View order history in `/account/orders`
- ✅ Access admin panel in `/admin` (if admin routes exist)
- ✅ No OTP/magic link delays
- ✅ No profile completion required

---

## Safety Guards

These are built-in safeguards:

1. **Production Block**
   - Admin login only works in development/testing
   - Automatically disabled in production builds
   - Check: `if (process.env.NODE_ENV !== "production")`

2. **Keyboard Shortcut Block**
   - Ctrl+Shift+A only works in development
   - Has no effect in production

3. **Badge Block**
   - "ADMIN" badge only shows in development
   - Never visible to users in production

---

## Hardcoded Credentials

For testing convenience, credentials are hardcoded:

- **Email**: `admin@ora-test.com`
- **Password**: `AdminTest@2024`

⚠️ These are only for testing and should match what you create in Supabase.

---

## How to Remove Before Production

Search for these TODO comments in the codebase:

### 1. Login Page (`frontend/src/app/auth/login/page.tsx`)
```
// TODO: REMOVE BEFORE PRODUCTION - Admin keyboard shortcut (Ctrl+Shift+A)
// TODO: REMOVE BEFORE PRODUCTION - Admin test account login
```

**Remove these entire sections:**
- Lines ~48-59 (useEffect with keyboard shortcut)
- Lines ~201-254 (handleAdminLogin function)
- Lines ~392-438 (Admin form JSX)

Also remove state:
- `showAdminLogin`
- `adminLoading`
- `adminError`

### 2. Header Component (`frontend/src/components/Header.tsx`)
```
// TODO: REMOVE BEFORE PRODUCTION - Admin badge
```

**Remove this section:**
- Lines ~180-182 (Admin badge JSX)

### 3. Remove Supabase Test Account
- Delete `admin@ora-test.com` from Supabase Auth
- Delete corresponding profile from profiles table

---

## Files Modified

1. **frontend/src/app/auth/login/page.tsx**
   - Added Ctrl+Shift+A keyboard shortcut
   - Added one-click admin login with Supabase signInWithPassword
   - Simplified admin form (no manual email/password entry)

2. **frontend/src/components/Header.tsx**
   - Added "ADMIN" badge when admin is logged in
   - Only visible in development mode

---

## Testing Checklist

- [ ] Supabase test account created with correct metadata
- [ ] Can press Ctrl+Shift+A and see admin login button
- [ ] Can click "Login as Admin" and log in
- [ ] Redirects to `/account` after login
- [ ] "ADMIN" badge visible in header
- [ ] Can add items to cart as admin
- [ ] Can proceed through checkout
- [ ] Can place orders
- [ ] Admin badge is NOT visible in production build
- [ ] Ctrl+Shift+A has no effect in production

---

## Environment Detection

The admin features check `process.env.NODE_ENV`:

```javascript
if (process.env.NODE_ENV === 'production') {
  // Admin login is completely disabled
}
```

This is automatically set:
- **Development**: `npm run dev` → admin login works
- **Production Build**: `npm run build && npm start` → admin login disabled

---

## Notes

- Admin test account uses a fixed password (hardcoded for convenience)
- This is acceptable only for testing environments
- Never use this pattern for real admin accounts
- The test account has full access like a real admin
- No special restrictions apply to test account operations

---

## Troubleshooting

**"Login failed" error when clicking admin button**
- Verify Supabase test account exists
- Check password in frontend code matches Supabase password
- Verify user metadata has `"role": "admin"`
- Check Supabase is configured correctly

**Admin button not appearing**
- Must be in development mode (NODE_ENV !== 'production')
- Try pressing Ctrl+Shift+A instead
- Check console for keyboard shortcut logs

**Admin badge not showing**
- Clear browser cache
- Make sure you're actually logged in as admin
- Check user metadata has `"role": "admin"`
- Badge only shows if `process.env.NODE_ENV !== 'production'`

