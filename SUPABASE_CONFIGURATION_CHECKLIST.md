# Supabase Configuration Checklist - Magic Link Setup ⚡

## ✅ Objective
Configure Supabase to work with the magic link authentication flow with proper redirect handling.

---

## 1️⃣ Project Setup (5 minutes)

### Step 1: Create/Open Supabase Project
- [ ] Go to: https://app.supabase.com
- [ ] Sign in with your account
- [ ] Select or create your "ORA" project
- [ ] Wait for project to initialize (shows "Your project is ready!")

### Step 2: Get Project Credentials
- [ ] In left sidebar, go to: **Settings → API**
- [ ] Copy and save:
  - **Project URL**: `https://xxxxx.supabase.co`
  - **Anon Public Key**: `eyJhbG... (long string)`
  - **Service Role Key**: `eyJhbG... (keep secret, for backend only)`

### Step 3: Update Environment Variables
File: `/frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

File: `/backend/.env.local`
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

## 2️⃣ Enable Magic Link Authentication (3 minutes)

### Step 1: Go to Authentication Settings
- [ ] In sidebar, go: **Authentication → Providers**
- [ ] Look for "Email" provider

### Step 2: Enable Email Authentication
- [ ] Click on **Email** provider
- [ ] Ensure "Enable Sign-Up" is **ON** ✅
- [ ] Ensure "Confirm email" is **OFF** (for magic links)
- [ ] Look for "Magic Link" option
  - [ ] If available: Enable it
  - [ ] If not available: Continue (magic link is default method)

### Step 3: Verify Settings
```
Email
├ ✅ Enable Sign-Up: ON
├ ✅ Confirm email: OFF (we don't need verification)
├ ✅ Secure email change: OFF (optional)
└ ✅ Email OTP: OFF (we're using magic links)
```

---

## 3️⃣ Configure Redirect URLs (🚨 CRITICAL)

### Step 1: Go to URL Configuration
- [ ] In sidebar, go: **Authentication → URL Configuration**
- [ ] You should see settings for redirect URLs

### Step 2: Set Site URL (for production redirect)

#### For Local Development:
- [ ] **Site URL**: `http://localhost:3000`
- [ ] This is where users come back after clicking magic link

#### For Production:
- [ ] **Site URL**: `https://orashop.in`
- [ ] Update this when deploying

### Step 3: Add Redirect URLs

#### For Local Development - Add Both:
```
http://localhost:3000/auth/callback
http://localhost:3000
```

#### For Production - Add Both:
```
https://orashop.in/auth/callback
https://orashop.in
```

#### Configuration Steps:
1. [ ] Click "Add URL" button
2. [ ] Paste: `http://localhost:3000/auth/callback`
3. [ ] Click "Add" button
4. [ ] Click "Add URL" again
5. [ ] Paste: `http://localhost:3000`
6. [ ] Click "Add" button

### Step 4: Save Configuration
- [ ] Click "Save" button at bottom
- [ ] Wait for green checkmark/success message
- [ ] Verify both URLs appear in the list

---

## 4️⃣ Configure Email Settings (10 minutes)

### Step 1: Email Provider Setup
- [ ] In sidebar, go: **Authentication → Email Templates**
- [ ] Look for "Magic Link" template

### Option A: Use Supabase Default Email (Simplest)
- [ ] Keep default Supabase email template
- [ ] This uses `auth.supabase.com` domain
- [ ] Email will show: "Click here to login to ORA"

### Option B: Customize Email Template (Optional)
1. [ ] Click "Magic Link" template
2. [ ] You can customize:
   - Subject line
   - Email HTML/CSS
   - Link text and color
3. [ ] Example customization:
   ```
   Subject: {{ .ConfirmationURL }}
   Template: 
   <p>Welcome to ORA!</p>
   <p><a href="{{ .ConfirmationURL }}">Login to Your Account</a></p>
   ```

### Option C: Use Custom SMTP (Advanced)
- [ ] Configure external email service (SendGrid, Mailgun, etc.)
- [ ] Go: **Settings → Email** 
- [ ] Configure SMTP credentials
- [ ] This allows custom email domain (e.g., noreply@orashop.in)

---

## 5️⃣ Configure Password Reset & Invite Links (Optional)

### Step 1: Password Reset URL (Optional for future)
- [ ] In **Authentication → URL Configuration**
- [ ] Add if planning password recovery:
  - `http://localhost:3000/auth/reset-password`
  - `https://orashop.in/auth/reset-password`

### Step 2: Invite Link URL (Optional)
- [ ] For future admin invitations:
  - `http://localhost:3000/auth/invite`
  - `https://orashop.in/auth/invite`

---

## 6️⃣ Database User Schema (Already Done)

### Step 1: Check Users Table
- [ ] In sidebar, go: **SQL Editor**
- [ ] Run query to verify auth.users table exists
  ```sql
  SELECT id, email, created_at FROM auth.users LIMIT 1;
  ```

### Step 2: Create Profiles Table (If Needed)
- [ ] Already created in previous implementation
- [ ] Stores: name, phone, avatar, etc.
- [ ] Linked to auth.users via user_id

---

## 7️⃣ Test Magic Link Configuration (15 minutes)

### Step 1: Start Dev Server
```bash
cd /frontend
npm run dev
```

### Step 2: Test Basic Flow
1. [ ] Go to: `http://localhost:3000/auth/login`
2. [ ] Enter test email: `test@example.com`
3. [ ] Click "Send Login Link"
4. [ ] Check logs in Supabase dashboard

### Step 3: Check Supabase Logs
- [ ] Go to: **Logs → Authentication logs**
- [ ] Look for successful "sign_in" entry
- [ ] Should show email address and timestamp

### Step 4: Verify Email Sent
- [ ] Check your email inbox
- [ ] Look for email from "auth@supabase" or custom domain
- [ ] Email should contain magic link
- [ ] Link format: `http://localhost:3000/auth/callback?code=...&type=email`

### Step 5: Click Magic Link
- [ ] Click link in email
- [ ] Should redirect to profile completion page
- [ ] Or account page if already completed

---

## 8️⃣ Rate Limiting Configuration (Important)

### Current Settings (Supabase Default):
- **Rate Limit**: ~5 magic links per email per 60 seconds
- **Our Implementation**: 60-second cooldown with user feedback
- **Status**: ✅ Already handled in code

### What This Means:
- User A tries to send 6 magic links in 1 minute → 6th fails
- User waits 60 seconds → Can send again
- Different emails not affected by same limit

### Testing Rate Limits:
1. [ ] Send magic link to: `ratelimit@test.com`
2. [ ] Click "Resend" immediately (3-4 times quickly)
3. [ ] Should see: "Too many login attempts. Please wait..."
4. [ ] Button should show: "Resend in 60s"
5. [ ] Wait for timer to count down to 0
6. [ ] Button should become enabled again

---

## 9️⃣ Production Deployment Checklist

### Before Going Live:
- [ ] All environment variables updated for production
- [ ] Site URL changed to: `https://orashop.in`
- [ ] Redirect URLs updated to production domain
- [ ] Email template customized (if desired)
- [ ] SMTP configured for production emails (optional)
- [ ] Rate limit handling tested and verified
- [ ] Magic link flow tested end-to-end
- [ ] Error handling verified
- [ ] Mobile experience tested

### Production Configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[production-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
```

### Update Supabase Settings:
1. [ ] **Site URL**: `https://orashop.in`
2. [ ] **Redirect URLs**:
   - `https://orashop.in/auth/callback`
   - `https://orashop.in`
3. [ ] Email provider configured
4. [ ] Custom email template applied

---

## 🔟 Troubleshooting

### Issue: "Redirect URL not configured"
**Solution**:
- [ ] Go to: **Authentication → URL Configuration**
- [ ] Add: `http://localhost:3000/auth/callback`
- [ ] Click Save
- [ ] Refresh browser and try again

### Issue: "Magic link doesn't work"
**Solution**:
- [ ] Check Site URL matches your domain
- [ ] Verify email was received
- [ ] Check Supabase logs for errors
- [ ] Ensure magic link template is enabled

### Issue: "Email not received"
**Solution**:
- [ ] Check spam/junk folder
- [ ] Wait 2-3 minutes (sometimes delayed)
- [ ] Check Supabase email logs
- [ ] Verify SMTP is configured (if using custom)

### Issue: "Rate limit triggered too early"
**Solution**:
- [ ] This is by design (security feature)
- [ ] Wait 60 seconds between attempts
- [ ] Or use different email address
- [ ] In our code: shows countdown timer

### Issue: "Callback returns to login page"
**Solution**:
- [ ] Check browser console for errors
- [ ] Check Supabase session was created
- [ ] Verify redirect URL in Supabase matches callback page
- [ ] Clear browser cache and try again

---

## ✅ Configuration Verification

### Quick Test:
```bash
# 1. Check environment variables are set
cat /frontend/.env.local | grep SUPABASE

# 2. Start frontend dev server
cd /frontend && npm run dev

# 3. Visit login page
# Open: http://localhost:3000/auth/login

# 4. Send magic link to your email
# Click "Send Login Link"

# 5. Check email for magic link
# Check inbox and spam folder

# 6. Click magic link
# Should see profile completion page or account page
```

---

## 📋 Final Checklist

### Authentication
- [ ] Email authentication enabled
- [ ] Magic link method enabled
- [ ] Sign-up allowed
- [ ] Email confirmation disabled

### URLs
- [ ] Site URL: `http://localhost:3000` (dev) or `https://orashop.in` (prod)
- [ ] Redirect URLs include `/auth/callback`
- [ ] All URLs saved successfully

### Email
- [ ] Email provider configured
- [ ] Magic link template available
- [ ] Emails being sent successfully
- [ ] Emails received in inbox

### Testing
- [ ] Send magic link works
- [ ] Email received
- [ ] Magic link clickable
- [ ] Callback page processes link
- [ ] Session created
- [ ] User routed correctly
- [ ] Rate limit handling works

### Production Ready
- [ ] All environment variables set
- [ ] Production URLs configured
- [ ] Email template customized
- [ ] Error handling verified
- [ ] Rate limiting understood
- [ ] Deployment plan ready

---

## 🎯 Next Steps

1. **Configure Supabase** (30 minutes)
   - Follow steps 1-5 above
   - Save all credentials

2. **Test Locally** (15 minutes)
   - Follow step 7 above
   - Verify magic link works

3. **Handle Rate Limiting** (5 minutes)
   - Test step 8 above
   - Verify countdown timer

4. **Deploy to Production** (20 minutes)
   - Update credentials
   - Update URLs in Supabase
   - Push code to production
   - Test in production

**Total Time: ~70 minutes to go live!**

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth/auth-magic-link
- **Magic Link Guide**: `/SUPABASE_MAGIC_LINK_SETUP.md`
- **Testing Guide**: `/MAGIC_LINK_TESTING_GUIDE.md`
- **Implementation Details**: `/SUPABASE_MAGIC_LINK_IMPLEMENTATION_COMPLETE.md`

**Status**: ✅ Configuration guide ready! Follow steps 1-5 to get started.
