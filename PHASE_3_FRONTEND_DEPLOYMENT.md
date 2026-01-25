# PHASE 3: FRONTEND DEPLOYMENT - STEP-BY-STEP GUIDE
## Deploy Next.js Frontend to Vercel

**Estimated Time:** 1-2 hours  
**Status:** Ready to Execute  
**Date:** January 25, 2026  
**Platform:** Vercel (officially recommended for Next.js)  

---

## 📋 PRE-REQUISITES

Before starting Phase 3, confirm Phase 1 & 2 are complete:

- [ ] Phase 1: Supabase RLS enabled
- [ ] Phase 2: Backend deployed and API responding
- [ ] Backend API URL available (e.g., https://orashop-api.onrender.com)
- [ ] GitHub repository with frontend code

---

## 🎯 PHASE 3 OBJECTIVES

✅ Connect frontend GitHub repo to Vercel  
✅ Configure build settings (root: ./frontend)  
✅ Add environment variables  
✅ Deploy frontend to production  
✅ Configure custom domain  
✅ Verify collections page loads  

---

## ⚙️ STEP-BY-STEP EXECUTION

### Step 1: Create Vercel Account

```
1. Go to: https://vercel.com
2. Click "Sign Up"
3. Choose "GitHub" as sign-up method
4. Authorize Vercel to access your GitHub account
```

✅ **Verification:** Vercel account created

---

### Step 2: Import GitHub Repository

```
1. In Vercel dashboard, click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Search for your GitHub repo (orashop, ora-jewellery, etc.)
4. Click "Import"
```

✅ **Verification:** Repository imported

---

### Step 3: Configure Project Settings

```
Vercel Configuration:
├── Framework: Next.js (auto-detected)
├── Root Directory: ./frontend ⚠️ IMPORTANT
├── Build Command: npm run build
├── Start Command: npm start
└── Install Command: npm install
```

**CRITICAL:** Set **Root Directory** to `./frontend`

**Steps:**
1. After import, click "Configure"
2. Look for "Root Directory" dropdown
3. Select "frontend" 
4. Click "Deploy"

✅ **Verification:** Root directory set to ./frontend

---

### Step 4: Add Environment Variables

In Vercel dashboard, go to "Settings" → "Environment Variables":

```
NEXT_PUBLIC_API_URL = https://orashop-api.onrender.com
(replace with your actual backend API URL from Phase 2)

NEXT_PUBLIC_RAZORPAY_KEY = rzp_live_[your_production_key]

NEXT_PUBLIC_SITE_URL = https://orashop.com

NEXT_PUBLIC_SUPABASE_URL = https://hgejomvgldqnqzkgffoi.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key]

NEXT_PUBLIC_IMAGE_DOMAIN = hgejomvgldqnqzkgffoi.supabase.co
```

**Important Notes:**
- NEXT_PUBLIC_* variables are visible to browser (safe to expose)
- Use production Razorpay key (not test key)
- API_URL must point to your backend from Phase 2

✅ **Verification:** All environment variables added

---

### Step 5: Deploy

```
1. After clicking "Deploy", Vercel will:
   ✓ Clone your GitHub repo
   ✓ Install dependencies (npm install)
   ✓ Build Next.js (npm run build)
   ✓ Deploy to CDN
   
2. Wait for green checkmark ✅
3. You'll see: "Your site is live at: https://orashop-[random].vercel.app"
```

**Monitor deployment:**
```
Building → Uploading → Deployed → Ready
[████████████████████] 100%
```

✅ **Verification:** Frontend deployed to Vercel

---

### Step 6: Test Collections Page

```
1. Click "Visit" on the deployment page
2. Go to: /collections
3. Verify:
   - Page loads without errors
   - Products display with images
   - Price shows correctly
   - Category filter works
   - No "Cannot find module" errors
```

**Expected output:**
```
Collections Page (No category selected)
├── Product 1: Price $XXX
├── Product 2: Price $XXX
├── Product 3: Price $XXX
└── ... (all active products shown)
```

✅ **Verification:** Collections page loads successfully

---

### Step 7: Configure Custom Domain

```
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter: orashop.com
5. Choose: "Use Nameservers" (recommended) OR "CNAME"
```

**Option A: Use Nameservers (Recommended)**
```
1. Vercel provides 4 nameservers
2. Go to your domain provider (GoDaddy, Namecheap, etc.)
3. Update nameservers to point to Vercel's
4. Wait 5-30 minutes for DNS to propagate
```

**Option B: Use CNAME**
```
1. Copy CNAME value from Vercel
2. Go to domain provider DNS settings
3. Create CNAME record:
   orashop.com → cname.vercel-dns.com
4. Wait 5-30 minutes
```

✅ **Verification:** Custom domain configured

---

### Step 8: Add www Subdomain (Optional)

```
1. In Vercel domains, click "Add Domain"
2. Enter: www.orashop.com
3. Configure same as step 7
```

✅ **Verification:** www domain configured

---

### Step 9: Enable SSL/HTTPS

```
1. In Vercel domains, select your domain
2. Check for SSL certificate status
3. Should show: "Valid SSL Certificate"
   (Vercel auto-provisions Let's Encrypt)
4. Https should be enabled by default
```

✅ **Verification:** HTTPS enabled

---

### Step 10: Test Production API Connection

Go to your deployed site and test:

```bash
# In browser console (F12 → Console tab):
fetch('https://orashop-api.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected output:**
```json
{
  "products": [...],
  "total": 50,
  "page": 1
}
```

If you get CORS error, check backend ALLOWED_ORIGINS in Phase 2.

✅ **Verification:** Frontend can reach backend API

---

### Step 11: Enable Analytics (Optional)

```
1. In Vercel project, click "Analytics"
2. Select "Web Analytics" or "Edge Functions"
3. Enable monitoring for performance tracking
```

✅ **Verification:** Analytics enabled

---

### Step 12: Configure Redirects (Optional)

Create file: `frontend/vercel.json`

```json
{
  "redirects": [
    {
      "source": "/",
      "destination": "/collections",
      "permanent": true
    },
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_SITE_URL": "@site-url"
  }
}
```

✅ **Verification:** Redirects configured

---

## ✅ PHASE 3 COMPLETION CHECKLIST

- [ ] Vercel account created
- [ ] GitHub repo imported
- [ ] Root directory set to ./frontend
- [ ] All environment variables added
- [ ] Frontend deployed successfully
- [ ] Collections page loads without errors
- [ ] Products display with images
- [ ] API connection working (no CORS errors)
- [ ] Custom domain configured
- [ ] HTTPS/SSL enabled
- [ ] No console errors in browser (F12)

**Phase 3 Status:** ✅ COMPLETE when all items are checked

---

## 🚨 TROUBLESHOOTING

### Issue: "Cannot find module" errors

**Solution:**
```
1. Check frontend/package.json exists
2. Run: npm install locally to verify
3. Vercel redeploy: Settings > Deployments > Redeploy
```

### Issue: Images not loading

**Solution:**
```
Check NEXT_PUBLIC_IMAGE_DOMAIN in env variables
Verify normalizeImageUrl() function exists in lib/api.ts
Test image URL directly in browser
```

### Issue: "CORS blocked" error

**Solution:**
```
1. Check backend ALLOWED_ORIGINS includes your domain
2. Set FRONTEND_URL in backend .env to your Vercel domain
3. Restart backend service
4. Redeploy frontend from Vercel
```

### Issue: "Cannot find Next.js" during build

**Solution:**
```
1. Verify root directory is set to ./frontend
2. Check frontend/package.json has next dependency
3. Check frontend/next.config.js exists
```

### Issue: Domain not working

**Solution:**
```
1. Verify DNS changes propagated:
   nslookup orashop.com
   
2. Wait 5-30 minutes if just added

3. In Vercel, check domain status shows "Valid"
```

---

## 📊 PERFORMANCE OPTIMIZATION

Once deployed, Vercel provides analytics at: `vercel.com/your-project/analytics`

**Recommended checks:**
- [ ] First Contentful Paint (FCP) < 2.5s
- [ ] Largest Contentful Paint (LCP) < 4s
- [ ] Cumulative Layout Shift (CLS) < 0.1

**If performance is slow:**
```
1. Enable Image Optimization in next.config.js
2. Reduce bundle size (tree-shake unused code)
3. Use Vercel Analytics to identify bottlenecks
```

---

## 📞 NEXT STEPS

Once Phase 3 is complete:

✅ **Next:** Move to [PHASE 4: Environment Configuration & Testing](./PHASE_4_TESTING.md)

---

## 📝 COMPLETION SIGN-OFF

```
Phase 3: Frontend Deployment - COMPLETE ✅

Frontend URL: https://orashop.com
Backend API: https://orashop-api.onrender.com
Deployed on: [Date]
Status: Live ✓
Performance Grade: [A/B/C]

Ready for Phase 4: Testing & Launch
```

---

**Phase 3 Status:** ✅ READY TO EXECUTE

Start now with Vercel!
