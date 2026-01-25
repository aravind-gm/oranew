# 🔗 CORS Fix & Frontend-Backend Connection Guide

**Date:** January 25, 2026  
**Status:** ✅ CORS configuration fixed

---

## 🎯 The Problem You Encountered

```
❌ Access to XMLHttpRequest at 'https://oranew-backend.onrender.com/api/auth/login' 
   has been blocked by CORS policy
```

**What this means:**
- Your frontend (Vercel) is trying to call the backend (Render)
- The backend said "I don't recognize your origin, access denied"
- This prevents any API calls from working

---

## ✅ What I Fixed

Updated the backend CORS configuration to explicitly allow:
- ✅ `https://oranew.vercel.app`
- ✅ `https://orashop.vercel.app`
- ✅ `http://localhost:3000` (for local development)
- ✅ `http://127.0.0.1:3000` (for local development)

---

## 🔄 What Happens Now

1. **Code was pushed to GitHub** ✅
2. **Render automatically redeploys** (in progress...)
3. **CORS errors will go away** once deployment completes

**Check Render status:**
1. Go to https://dashboard.render.com
2. Click **Backend Service** (`oranew-backend`)
3. Scroll down to **Deployments**
4. Wait for status to show **"Live"** (green) instead of "Deploying"

**This usually takes 1-3 minutes.**

---

## ✅ Verify the Fix Works

Once Render finishes deploying:

### **Test 1: Check CORS Logs**
1. Go to Render Dashboard → Backend Service → **Logs**
2. Look for this message:
   ```
   [CORS] 🔐 Allowed Origins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://oranew.vercel.app', ...]
   ```
3. ✅ If you see this = CORS is configured

### **Test 2: Try Admin Login Again**
1. Go to **https://oranew.vercel.app/admin/login**
2. Enter credentials:
   - Email: `admin@orashop.in`
   - Password: `admin123`
3. Click **Login**
4. ✅ If login works = CORS is fixed!

### **Test 3: Check Browser Console**
1. Press `F12` (Developer Tools)
2. Click **Console** tab
3. Look for the error message from before
4. ✅ If error is GONE = CORS is fixed

---

## 📊 How CORS Works

**Simple explanation:**

When your browser loads `https://oranew.vercel.app`, the JavaScript tries to fetch data from `https://oranew-backend.onrender.com`.

The browser asks: "Can I access this different domain?"

**Without CORS:** Backend says "No, I don't know you"  
**With CORS:** Backend says "Yes, you're allowed"

---

## 🔧 Backend CORS Configuration

**What was changed in `backend/src/server.ts`:**

```typescript
// ✅ NEW: Explicit list of allowed frontend URLs
const allowedOrigins = [
  'http://localhost:3000',           // Local development
  'http://127.0.0.1:3000',           // Local development
  'https://oranew.vercel.app',       // Vercel deployment
  'https://orashop.vercel.app',      // Vercel deployment
  'https://oranew-staging.vercel.app', // Staging deployment
];

// ✅ NEW: Add env variable if set
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// ✅ NEW: Log allowed origins for debugging
console.log('[CORS] 🔐 Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,              // Use our list
    credentials: true,                   // Allow cookies/auth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

---

## 🐛 If CORS Still Doesn't Work

### **Check 1: Wait for Render Redeploy**
- Give it 5 minutes maximum
- Check Render logs to confirm deployment succeeded

### **Check 2: Hard Refresh Frontend**
```
Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```
This clears the browser cache.

### **Check 3: Verify Backend is Running**
```bash
curl https://oranew-backend.onrender.com/api/health
```
Should return:
```json
{"status":"ok"}
```

### **Check 4: Check CORS Headers**
1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Try login again
4. Look for **OPTIONS** request to backend
5. Check **Response Headers** section
6. Should see:
   ```
   access-control-allow-origin: https://oranew.vercel.app
   access-control-allow-credentials: true
   ```

---

## 🌍 Add More Domains (If Needed)

If you deploy to a new Vercel URL or domain, you need to add it to CORS.

**Option A: Update code and redeploy**
```typescript
// In backend/src/server.ts, add to allowedOrigins array:
'https://your-new-domain.com',
'https://another-domain.vercel.app',
```

**Option B: Use environment variable** (recommended)
```env
# In Render backend settings, add:
FRONTEND_URL=https://your-new-domain.com
```

The code automatically adds `FRONTEND_URL` to allowed origins if set.

---

## 🔐 Security Notes

**Current CORS Setup:**
- ✅ Only specific Vercel domains allowed
- ✅ Localhost allowed for development
- ✅ Credentials allowed (for JWT tokens)
- ✅ Required headers allowed (Authorization)

**What's NOT allowed:**
- ❌ Requests from unknown domains
- ❌ Requests without required headers
- ❌ Requests using disallowed HTTP methods

---

## 📝 API Call Examples

**Now that CORS is fixed, these work:**

```typescript
// Frontend code can now call backend
const response = await fetch('https://oranew-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies
  body: JSON.stringify({
    email: 'admin@orashop.in',
    password: 'admin123',
  }),
});

const data = await response.json();
console.log(data); // Should have token and user
```

---

## 🎯 Next Steps

1. ⏳ **Wait for Render to finish deploying** (1-3 minutes)
2. ✅ **Try admin login again**
3. ✅ **Check browser console - no more CORS errors**
4. ✅ **Verify admin panel loads**
5. 🚀 **Deploy webhook service**

---

## 📊 Deployment Status

| Service | Status | URL |
|---------|--------|-----|
| Backend | 🔄 Deploying (CORS fix) | https://oranew-backend.onrender.com |
| Frontend | ✅ Deployed | https://oranew.vercel.app |
| Admin Panel | 🔄 Waiting for backend | https://oranew.vercel.app/admin |
| Webhook | ⏳ To Deploy | https://ora-webhook.onrender.com |

---

## 🆘 Emergency: Manual CORS Fix

If you need to immediately allow a new domain without redeploying:

You can't - CORS is checked at the backend server level before requests are processed. You MUST redeploy after changing CORS config.

---

**Key Takeaway:**  
The CORS fix has been committed and pushed to GitHub. Render will automatically redeploy in the next 1-3 minutes. Once deployed, try your admin login again - it should work!

**Last Updated:** January 25, 2026
