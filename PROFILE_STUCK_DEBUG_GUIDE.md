# 🔍 Profile Completion - Debugging Guide

## Quick Diagnosis Flow

### Question 1: Does the form show after magic link click?
- **YES** → Go to Question 2
- **NO** → You're still on callback page, check backend logs

### Question 2: Can you fill in name and phone?
- **YES** → Go to Question 3
- **NO** → Form is disabled, check auth state

### Question 3: Does clicking "Continue" show loading spinner?
- **YES** → Go to Question 4
- **NO** → Button not working, check browser console

### Question 4: Does it eventually redirect to /account?
- **YES** → ✅ SUCCESS! Issue is fixed
- **NO** → Go to Question 5

### Question 5: How long does it stay stuck?
- **Still loading after 5 seconds** → Backend might be down
- **Shows error message** → See "Common Errors" section
- **Page loads but not /account** → Redirect failed, see console logs

---

## Browser Console Debugging

### How to Open Console
1. Press `F12` or `Ctrl+Shift+I` (Windows)
2. Click "Console" tab
3. Look for messages starting with `[Profile]`

### Console Messages Explained

**Good Signs** ✅
```
[Profile] 🔍 Checking profile: {...}
[Profile] 📝 User needs to complete profile
[Profile] 📝 Updating profile for: test@example.com
[Profile] 📝 Data: { fullName: "John Doe", phone: "9876543210" }
[Profile] 📝 Supabase update response: { data: {...}, error: null }
[Profile] ✅ Supabase profile updated
[Profile] ✅ Auth store updated
[Profile] ✅ Profile updated successfully, redirecting to account
[Profile] 🔄 Redirecting to /account
```

**Red Flags** ❌
```
[Profile] ❌ No user or token, redirecting to login
[Profile] ❌ Supabase update error: {...}
[Profile] Error fetching session: {...}
```

---

## Common Issues & Solutions

### Issue 1: "Still Showing Loading Spinner After 10 Seconds"

**Cause**: Supabase update is taking too long or failing silently

**Solution**:
1. Open browser console (F12)
2. Look for `[Profile]` messages
3. If you don't see "Supabase update response" message:
   - Check Supabase credentials in `.env.local`
   - Check backend is running: `curl http://localhost:3001/health`
   - Restart dev server

**Quick Fix**:
```bash
# Restart frontend dev server
cd /frontend && npm run dev
```

---

### Issue 2: "Error: Full name is required"

**Cause**: Name field is empty or only whitespace

**Solution**:
1. Make sure you entered a name (not just spaces)
2. Name must be at least 2 characters
3. Try again with valid name like "John Doe"

---

### Issue 3: "Error: Please enter a valid 10-digit phone number"

**Cause**: Phone number is not exactly 10 digits

**Solution**:
```
❌ Valid formats:
  - "123 456 7890" → Only accepts digits
  - "123-456-7890" → Strips dashes automatically
  - "+91 9876543210" → Won't work (has +91)

✅ Valid formats:
  - "9876543210" → Direct 10 digits
  - After entering, field shows only digits
```

**Example**:
- Enter: `9876543210`
- Display: `9876543210` ✅
- Show: "✅ Valid" message

---

### Issue 4: "Network Error" or "Failed to save profile"

**Cause**: Backend API call failed

**Solution**:
1. Check backend is running:
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"connected"}`

2. If backend not running:
   ```bash
   cd /backend && npm run dev
   ```

3. Check Supabase connection:
   - Go to https://app.supabase.com
   - Check project status (should be green)

4. Restart everything:
   ```bash
   # Terminal 1
   cd /backend && npm run dev
   
   # Terminal 2
   cd /frontend && npm run dev
   ```

---

### Issue 5: "Redirects to login instead of profile form"

**Cause**: User or token not set in auth store

**Symptoms**:
- Page shows loading spinner
- Then redirects to login
- Console shows: `[Profile] ❌ No user or token, redirecting to login`

**Solution**:
1. Check you actually received the session from magic link
2. Try the magic link process again:
   - Go to `/auth/login`
   - Send magic link
   - Click link in email (check spam folder!)
   - Should show profile page now

3. If still redirects to login:
   - Clear browser cache: `Ctrl+Shift+Delete`
   - Try in incognito mode: `Ctrl+Shift+N`
   - Or clear cookies and try again

---

### Issue 6: "Page shows 'Redirecting...' but nothing happens"

**Cause**: `/account` page might have issues

**Solution**:
1. Try accessing directly: `http://localhost:3000/account`
2. If it shows error, check account page logs
3. Skip profile for now:
   - Click "I'll complete this later"
   - You'll go to account page
   - Can update profile later

---

### Issue 7: "Same Data Submitted Twice (Duplicates)"

**Cause**: Form might have been submitted twice

**Solution**:
1. Use console to check:
   - Look for how many `[Profile] 📝 Updating profile for:` messages
   - Should only be 1
2. If multiple messages appear:
   - Check network tab (F12 → Network)
   - Look for multiple API calls
   - Might be a double-submit issue

**Workaround**:
- Don't click button multiple times
- Wait for spinner to show before next action

---

## Network Tab Debugging

### How to Check Network Requests

1. Open DevTools: `F12`
2. Click "Network" tab
3. Fill in profile form and click "Continue"
4. Look for requests in the Network tab

### What You Should See

**For Supabase Update**:
```
Request: (looks like Supabase API call)
Method: POST or PUT
Status: 200 (success) or 401 (auth failed)
Response: Should show user data updated
```

**For Backend Sync** (optional):
```
Request: /api/auth/profile
Method: PUT
Status: 200 or error
Response: Can fail - non-critical
```

### How to Read Status Codes

```
200 ✅ OK - Success
201 ✅ Created - Resource created
400 ❌ Bad Request - Invalid data
401 ❌ Unauthorized - Not authenticated
403 ❌ Forbidden - Not allowed
404 ❌ Not Found - Endpoint doesn't exist
500 ❌ Server Error - Backend crashed
```

---

## Supabase-Specific Issues

### Check Supabase Status

1. Go to: https://app.supabase.com
2. Select your project
3. Look for:
   - Project status (should be green)
   - Authentication enabled
   - User metadata visible

### Check User in Supabase

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: Authentication → Users
4. Find your test email
5. Should show:
   - `email`: test@example.com
   - `user_metadata`: { "full_name": "John Doe", "phone": "9876543210" }

### If Data Not Showing

**Cause**: Profile update didn't save to Supabase

**Check**:
1. Open browser console
2. Look for: `[Profile] 📝 Supabase update response:`
3. If error shows: That's your problem
4. Report the error message

---

## Mobile Debugging

### Test on Mobile (DevTools Responsive Mode)

1. Press: `Ctrl+Shift+M` (or `Cmd+Shift+M`)
2. Select: iPhone 12/13 or Android device
3. Test form filling:
   - Can you tap name field? ✅
   - Can you type name? ✅
   - Can you tap phone field? ✅
   - Can you type phone? ✅
   - Can you see full button? ✅
   - Can you tap button? ✅

---

## Step-by-Step Reproduction

If something goes wrong, reproduce like this:

```
1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to http://localhost:3000/auth/login
3. Open console (F12)
4. Enter email: test@yourmail.com
5. Click "Send Login Link"
6. Watch console for: [Magic Link] messages
7. Check email for link
8. Click magic link
9. Watch console for: [Profile] messages
10. Fill form with:
    - Name: "Test User"
    - Phone: "1234567890"
11. Click "Continue to ORA"
12. Watch console for redirect message
13. Check if you reach /account
```

---

## If Everything Else Fails

### Nuclear Reset
```bash
# 1. Clear all cache
rm -rf /frontend/.next
rm -rf /frontend/node_modules/.cache

# 2. Reinstall dependencies
cd /frontend && npm install

# 3. Rebuild
npm run build

# 4. Restart
npm run dev

# 5. Clear browser cache
# Ctrl+Shift+Delete

# 6. Try again
```

### Check All Services Running

```bash
# Check backend
curl http://localhost:3001/health
# Expected: {"status":"connected"}

# Check frontend
curl http://localhost:3000
# Expected: HTML response (not error)

# Check Supabase connection
# Visit: https://app.supabase.com
# Look for green project status
```

---

## Console Logs to Paste

When reporting an issue, paste these from console:

### Get All Profile Logs
```javascript
// Copy this into console and paste output
copy(
  Array.from(document.querySelectorAll('.console-message'))
    .map(el => el.textContent)
    .filter(msg => msg.includes('[Profile]'))
    .join('\n')
)
```

### Or Manually
1. Open console (F12)
2. Look for all `[Profile]` lines
3. Screenshot or copy all of them
4. Paste in your report

---

## Success Indicators ✅

You'll know it's working when you see:

```
[Profile] ✅ Auth store updated
[Profile] ✅ Profile updated successfully, redirecting to account
[Profile] 🔄 Redirecting to /account
```

And then immediately:
- Page navigates to `/account`
- You see your account dashboard
- You're logged in! 🎉

---

## Still Stuck?

1. Open browser console (F12)
2. Look for `[Profile]` messages
3. Find the last message before it gets stuck
4. That tells us where it's failing
5. Report that specific message

**Most Common**: Stuck on `[Profile] 📝 Supabase update response`
- This means Supabase is not responding
- Check project status or restart backend

**Second Most Common**: Stuck after all messages
- Profile saved but redirect not triggering
- Check if `/account` page accessible
- Or use "I'll complete this later" workaround

You got this! 🚀
