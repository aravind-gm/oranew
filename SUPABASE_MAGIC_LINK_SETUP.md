# 🔐 SUPABASE MAGIC LINK EMAIL AUTH - SETUP GUIDE

**Status:** ✅ **Code Updated - Now Configure Supabase**  
**Last Updated:** February 2, 2026  
**Authentication Method:** Magic Link (Email Only)

---

## 📋 WHAT CHANGED

### Frontend Implementation
✅ **Login Page (`/auth/login`)** - Updated to Magic Link
- Removed: 6-digit OTP input  
- Added: Magic Link sending UI  
- UI now shows: "We'll send you a secure login link to your email"
- After sending: Shows "Check your email" confirmation screen with resend button

✅ **Callback Page (`/auth/callback`)** - Optimized for Magic Links
- Simplified: Only calls `getSession()` (Supabase handles magic link URL parsing)
- Removed: Manual code exchange (no longer needed for magic links)
- Added: Better error messaging for expired/invalid links

### How It Works Now
1. User enters email → "Send Login Link" button appears
2. User clicks → Email sent with magic link
3. Success screen shows: "Check your email for the login link"
4. User clicks link in email → Redirects to `/auth/callback`
5. Callback page authenticates → User logged in → Redirects to `/account`

---

## 🔧 REQUIRED SUPABASE CONFIGURATION

### STEP 1: Verify Email Provider is Configured

**In Supabase Dashboard:**

```
Authentication → Providers → Email
```

**Check these settings:**

| Setting | Value | Status |
|---------|-------|--------|
| **Provider Enabled** | ✅ Toggle ON | Must be ON |
| **Confirm email** | OFF | Don't require confirmation |
| **Double confirm email changes** | OFF | Optional |

---

### STEP 2: Configure URL Settings (CRITICAL!)

**In Supabase Dashboard:**

```
Authentication → URL Configuration
```

**Update these fields:**

#### Site URL
```
http://localhost:3000
```
(For local development. Change to `https://orashop.in` for production)

#### Redirect URLs
Add both URLs:
```
http://localhost:3000/auth/callback
https://orashop.in/auth/callback
```

**Important:**
- These must EXACTLY match the URLs where users will be after clicking the email link
- One line per URL
- Include the `/auth/callback` path

---

### STEP 3: Configure Email Templates

**In Supabase Dashboard:**

```
Authentication → Email Templates → Confirm Email
```

**Make sure the magic link template contains:**

```
{{ .ConfirmationURL }}
```

This is the actual clickable magic link that will be sent to users.

**Optional:** Customize the email template to match ORA branding:

Subject:
```
Your ORA Jewellery Secure Login Link
```

Template:
```
Hi there!

We received a request to log in to your ORA Jewellery account.

Click the link below to complete your login:
{{ .ConfirmationURL }}

This link will expire in 24 hours.

If you didn't request this, you can safely ignore this email.

Best regards,
ORA Jewellery Team
```

---

### STEP 4: Verify Environment Variables

**File:** `frontend/.env.local`

```env
# Required for authentication
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (your anon key)

# Optional for diagnostics
NEXT_PUBLIC_DEBUG_AUTH=false
```

**To get these values:**

1. Go to Supabase Dashboard → Settings → API
2. Copy "Project URL" → Use as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Verify URL format:**
- ✅ Correct: `https://abcdefghij.supabase.co`
- ❌ Wrong: `https://abcdefghij.supabase.co/` (trailing slash)
- ❌ Wrong: `http://` (must be `https://`)

---

### STEP 5: Restart Development Server

After making ANY changes to `.env.local`:

```bash
cd frontend

# Stop the dev server (Ctrl+C)

# Clear cache
rm -rf .next

# Restart
npm run dev
```

**Why restart?** Environment variables are loaded once at startup. Changes won't apply without restarting.

---

## 🧪 TEST THE MAGIC LINK FLOW

### Local Testing

1. **Start the app:**
   ```bash
   cd frontend
   npm run dev
   # Open http://localhost:3000/auth/login
   ```

2. **Send a magic link:**
   - Enter a test email (any email address)
   - Click "Send Login Link"
   - Should show: "Check your email" screen

3. **Check email:**
   - Go to Supabase Dashboard → Authentication → Users
   - Look for your test email in the users list
   - Click on it to see the sent emails

4. **Get the link:**
   - In Supabase Dashboard → Authentication → Email Log
   - Find your email send
   - Copy the confirmation link (or click to simulate)

5. **Click the link:**
   - Paste link in browser or click in email client
   - Should redirect to `/auth/callback`
   - Should load your `/account` page with user logged in

---

## 🔍 TROUBLESHOOTING

### Issue: "Email not received"

**Cause:** Supabase email provider not configured  
**Fix:**
1. Check: Authentication → Providers → Email is toggled ON
2. Check email templates are saved
3. Try a different email address
4. Check spam/promotions folder

---

### Issue: "Invalid redirect URL" or "Cannot redirect to localhost:3000/auth/callback"

**Cause:** URL not added to Supabase redirect list  
**Fix:**
1. Go to: Authentication → URL Configuration
2. Add exact URL: `http://localhost:3000/auth/callback`
3. Save changes
4. Restart dev server

---

### Issue: "Link expired" when clicking email link

**Cause:** Magic link expired (default 24 hours) or already used  
**Fix:**
1. Send a new link (magic links are single-use)
2. User should click within 24 hours
3. To extend expiry: Settings → Auth → JWT Expiry (advanced)

---

### Issue: Page shows "Logging you in..." then redirects to /auth/login with error

**Cause:** Session not being established from magic link  
**Fix:**
1. Check browser console for errors (F12 → Console tab)
2. Verify NEXT_PUBLIC_SUPABASE_URL is correct (no trailing slash!)
3. Check that /auth/callback is in Supabase URL Configuration
4. Try clearing browser cache and cookies

---

### Issue: "Network error. Please check your connection"

**Cause:** Cannot reach Supabase API  
**Fix:**
1. Verify internet connection
2. Check if Supabase status is up: https://status.supabase.com/
3. Verify NEXT_PUBLIC_SUPABASE_URL is reachable (not localhost!)
4. Check firewall/VPN isn't blocking Supabase

---

## 📊 MAGIC LINK FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│ User visits /auth/login                                 │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Enters email and clicks "Send Login Link"               │
└──────────────────────┬──────────────────────────────────┘
                       ↓
         ┌─────────────────────────────┐
         │ signInWithOtp({              │
         │   email,                    │
         │   emailRedirectTo:           │
         │   /auth/callback             │
         │ })                           │
         └──────────┬────────────────────┘
                    ↓
    ┌───────────────────────────────────┐
    │ Email sent with magic link        │
    │ (with emailRedirectTo=/auth/...)  │
    └──────────────────┬────────────────┘
                       ↓
    ┌───────────────────────────────────┐
    │ User clicks link in email         │
    │ Browser navigates to callback URL │
    └──────────────────┬────────────────┘
                       ↓
    ┌───────────────────────────────────┐
    │ /auth/callback page loads         │
    │ Calls getSession()                │
    │ Supabase auto-verifies URL params │
    │ Session established! ✅           │
    └──────────────────┬────────────────┘
                       ↓
    ┌───────────────────────────────────┐
    │ Auth store updated with:          │
    │ - access_token                    │
    │ - user.email                      │
    │ - user.id                         │
    └──────────────────┬────────────────┘
                       ↓
    ┌───────────────────────────────────┐
    │ Redirect to /account              │
    │ User sees their profile! ✅       │
    └───────────────────────────────────┘
```

---

## ✅ PRE-LAUNCH CHECKLIST

Before going to production, verify:

- [ ] Email provider enabled in Supabase
- [ ] Site URL set to production domain
- [ ] Redirect URL added: `https://orashop.in/auth/callback`
- [ ] Custom email template configured (optional but recommended)
- [ ] NEXT_PUBLIC_SUPABASE_URL has no trailing slash
- [ ] Tested magic link flow end-to-end
- [ ] Verified email arrives within 1-2 minutes
- [ ] Link works and logs user in successfully
- [ ] User redirects to /account correctly
- [ ] No console errors in browser DevTools
- [ ] Admin login still works (separate from magic link)

---

## 📞 MAGIC LINK BEST PRACTICES

✅ **DO:**
- Test with real emails before launch
- Verify spam folder if email not received
- Keep magic links short (Supabase handles this)
- Show user-friendly "Check your email" message
- Provide "resend" option if link expires

❌ **DON'T:**
- Try to manually open Supabase URLs
- Use `http://` for production (must be `https://`)
- Add trailing slashes to URLs
- Share magic links (single-use only anyway)
- Store/save magic links (they expire)

---

## 🚀 PRODUCTION DEPLOYMENT

When deploying to production:

### 1. Update Environment Variables (Render/Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Update Supabase URL Configuration
```
Site URL: https://orashop.in
Redirect URLs: https://orashop.in/auth/callback
```

### 3. Test Staging
```
1. Deploy to staging environment
2. Test magic link flow on staging domain
3. Verify emails arrive
4. Verify redirect works
5. Then deploy to production
```

### 4. Monitor Production
```
- Check email delivery rates
- Monitor authentication errors in Supabase dashboard
- Watch for any failed login attempts
- Keep auth logs for 30+ days
```

---

## 📚 REFERENCE LINKS

**Supabase Documentation:**
- [Magic Links (Passwordless Login)](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Email Configuration](https://supabase.com/docs/guides/auth/auth-email)
- [URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls)

**ORA Implementation:**
- Frontend: `/frontend/src/app/auth/login/page.tsx`
- Callback: `/frontend/src/app/auth/callback/page.tsx`
- Supabase Client: `/frontend/src/lib/supabase.ts`
- Auth Store: `/frontend/src/store/authStore.ts`

---

## 🎯 NEXT STEPS

1. ✅ Complete Supabase configuration (this guide)
2. ⏭️ Create profile completion page (new users collecting phone/address)
3. ⏭️ Test end-to-end authentication flow
4. ⏭️ Deploy to production with magic links working
5. ⏭️ Monitor email delivery and auth success rates

---

**Configuration Status:** 🟡 **PENDING SETUP** (Code ready, waiting for Supabase configuration)

**Last Checked:** 2026-02-02 06:37:11 UTC

---

For questions or issues, refer to the troubleshooting section above or check Supabase documentation links.
