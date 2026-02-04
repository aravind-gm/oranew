# ⚠️ Vercel Deployment Issue: Missing Environment Variables

## Problem

```
Error: Environment Variable "NEXT_PUBLIC_API_URL" references Secret "next_public_api_url", which does not exist.
```

This means Vercel is looking for environment variables that haven't been set in the Vercel project.

---

## Solution: Add Environment Variables to Vercel Dashboard

### Step 1: Go to Vercel Dashboard
```
https://vercel.com/dashboard
```

### Step 2: Select Your Frontend Project
```
Project name: Should be something like "ora-frontend" or "oranew"
Click on it
```

### Step 3: Navigate to Settings
```
Click: "Settings" tab at the top
```

### Step 4: Go to Environment Variables
```
Left sidebar: "Environment Variables"
Click on it
```

### Step 5: Add Each Variable

You need to add these 4 variables:

#### Variable 1: NEXT_PUBLIC_API_URL
```
Name:  NEXT_PUBLIC_API_URL
Value: https://your-backend.onrender.com  (your Render backend URL)
Environment: Production, Preview, Development (select all 3)
Click: "Save"
```

#### Variable 2: NEXT_PUBLIC_SUPABASE_URL
```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://hgejomvgldqnqzkgffoi.supabase.co
Environment: Production, Preview, Development (select all 3)
Click: "Save"
```

#### Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZWpvbXZnbGRxbnF6a2dmZm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQwNzcsImV4cCI6MjA4Mzk2MDA3N30.44RrVx8pIFcyG6wE_ngBNzSIdkH4Rg-_RomlVt_9XaI
Environment: Production, Preview, Development (select all 3)
Click: "Save"
```

#### Variable 4: NEXT_PUBLIC_RAZORPAY_KEY_ID
```
Name:  NEXT_PUBLIC_RAZORPAY_KEY_ID
Value: rzp_test_S3RpfRx3I2B7GC
Environment: Production, Preview, Development (select all 3)
Click: "Save"
```

---

## Where to Get These Values

### NEXT_PUBLIC_API_URL
```
Get from: Render backend URL
Example: https://orashop-backend.onrender.com
Check in: Render Dashboard → Your backend service → URL
```

### NEXT_PUBLIC_SUPABASE_URL
```
Get from: backend/.env
Line: SUPABASE_URL="..."
Value: https://hgejomvgldqnqzkgffoi.supabase.co
```

### NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Get from: backend/.env or frontend/.env.example
Line: NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### NEXT_PUBLIC_RAZORPAY_KEY_ID
```
Get from: backend/.env
Line: RAZORPAY_KEY_ID="..."
```

---

## Current Values (Copy These)

From `backend/.env`:
```
SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZWpvbXZnbGRxbnF6a2dmZm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQwNzcsImV4cCI6MjA4Mzk2MDA3N30.44RrVx8pIFcyG6wE_ngBNzSIdkH4Rg-_RomlVt_9XaI"
RAZORPAY_KEY_ID="rzp_test_S3RpfRx3I2B7GC"
```

From `frontend/.env.local` or `.env.example`:
```
NEXT_PUBLIC_API_URL="https://your-render-backend.onrender.com"
NEXT_PUBLIC_SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZWpvbXZnbGRxbnF6a2dmZm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQwNzcsImV4cCI6MjA4Mzk2MDA3N30.44RrVx8pIFcyG6wE_ngBNzSIdkH4Rg-_RomlVt_9XaI"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_S3RpfRx3I2B7GC"
```

---

## Quick Copy-Paste

### Dashboard Environment Variables Settings URL
```
https://vercel.com/your-username/your-project/settings/environment-variables
```

### Variables to Add (in order)

```
1. NEXT_PUBLIC_API_URL → https://your-render-url.onrender.com
2. NEXT_PUBLIC_SUPABASE_URL → https://hgejomvgldqnqzkgffoi.supabase.co
3. NEXT_PUBLIC_SUPABASE_ANON_KEY → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZWpvbXZnbGRxbnF6a2dmZm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQwNzcsImV4cCI6MjA4Mzk2MDA3N30.44RrVx8pIFcyG6wE_ngBNzSIdkH4Rg-_RomlVt_9XaI
4. NEXT_PUBLIC_RAZORPAY_KEY_ID → rzp_test_S3RpfRx3I2B7GC
```

---

## After Adding Variables

### Step 1: Return to Deployments
```
Click: "Deployments" tab
```

### Step 2: Redeploy
```
Find: Latest deployment
Click: Three dots menu (⋯)
Select: "Redeploy"
```

OR use CLI:

```bash
cd /home/aravind/Downloads/oranew
vercel deploy --prod --force
```

---

## Verification Checklist

After deployment:

```
[ ] All 4 environment variables added in Vercel
[ ] Deployment shows green ✅ checkmark
[ ] Frontend URL loads without errors
[ ] Check browser console (F12) - no 404 errors
[ ] Backend API calls work (check Network tab)
[ ] Webhook success page loads
[ ] Webhook failed page loads
```

---

## Troubleshooting

**Still getting environment variable errors?**
```
1. Check exact variable names (must match exactly)
2. Check values are copied correctly
3. Redeploy after adding variables
4. Wait 1-2 minutes for Vercel to update
5. Clear browser cache: Ctrl+Shift+R
```

**Blank page or 404 errors?**
```
1. Check NEXT_PUBLIC_API_URL points to working backend
2. Test backend URL in browser (should return JSON)
3. Check browser console for errors
4. Check Vercel build logs for errors
```

**API calls returning 404?**
```
1. Verify NEXT_PUBLIC_API_URL is correct
2. Test: curl https://your-backend-url/api/health
3. Should return: {"status": "ok"}
```

---

## Video Steps (Manual Version)

```
1. Open: https://vercel.com/dashboard
2. Click your project name
3. Click "Settings" tab
4. Click "Environment Variables" in sidebar
5. For each variable:
   a. Enter Name
   b. Enter Value
   c. Check: Production, Preview, Development
   d. Click "Save"
6. After all 4 added, go to "Deployments"
7. Click redeploy on latest deployment
8. Wait for green checkmark
9. Visit your frontend URL
10. Check console for errors
```

---

## Help

Need Render backend URL?
```
Go to: https://dashboard.render.com
Click your backend service
Copy the URL from the top
Example: https://orashop-backend-xxxxx.onrender.com
```

Need Supabase keys?
```
Go to: https://app.supabase.com
Select your project
Settings → API Keys
Copy: URL and Anon Key
```

Need Razorpay key?
```
File: backend/.env
Line: RAZORPAY_KEY_ID="..."
Copy the value after the equals sign
```
