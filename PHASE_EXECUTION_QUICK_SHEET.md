# PRODUCTION DEPLOYMENT - QUICK REFERENCE CHEAT SHEET
## One-Page Summary for Quick Look-Up

---

## 🚀 FIVE PHASES AT A GLANCE

| Phase | Task | Time | Key Steps | Status |
|-------|------|------|-----------|--------|
| 1 | **Supabase Setup** | 1 hr | Run SQL, create bucket, generate JWT | ⏳ Ready |
| 2 | **Backend Deploy** | 1.5 hrs | Render: Connect repo → Deploy | ⏳ Ready |
| 3 | **Frontend Deploy** | 1.5 hrs | Vercel: Import repo → Deploy | ⏳ Ready |
| 4 | **Testing** | 2-3 hrs | Run 20 smoke tests | ⏳ Ready |
| 5 | **DNS & Launch** | 1 hr | Configure domain, go live | ⏳ Ready |

**Total Duration:** 7-9 hours over 2-3 days (first-timer)

---

## 📋 PHASE 1: SUPABASE - 14 STEPS

```
1. Go to Supabase SQL Editor
2. Copy SUPABASE_RLS_SETUP.sql
3. Paste and RUN
4. Verify: SELECT * FROM pg_tables WHERE rowsecurity = true
5. Create storage bucket: product-images (public)
6. Test upload/download image
7. Go to Settings > API
8. Copy: SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY
9. Generate JWT: openssl rand -base64 32
10. Create backend/.env.production
11. Create frontend/.env.production
12. Run: npx prisma generate
13. Run: npx prisma migrate deploy
14. ✅ DONE
```

---

## 📋 PHASE 2: BACKEND - RENDER (5 STEPS)

```
1. Go to render.com → Create Web Service
2. Connect GitHub repo
3. Configure:
   - Build: npm install && npx prisma generate && npx prisma migrate deploy
   - Start: npm start
   - Region: Singapore
4. Add ALL environment variables from ENV_VARIABLES_TEMPLATE.md
5. Deploy
   → Wait 5-10 minutes
   → Copy API URL: https://orashop-api.onrender.com
```

---

## 📋 PHASE 3: FRONTEND - VERCEL (5 STEPS)

```
1. Go to vercel.com → Import Project
2. Select GitHub repo
3. Configure:
   - Root Directory: ./frontend
   - Framework: Next.js (auto-detected)
   - Build: npm run build
   - Start: npm start
4. Add environment variables:
   - NEXT_PUBLIC_API_URL = [backend-api-url-from-phase-2]
   - NEXT_PUBLIC_RAZORPAY_KEY = [production-key]
   - NEXT_PUBLIC_SITE_URL = https://orashop.com
5. Deploy
   → Wait 3-5 minutes
   → Test: https://[vercel-domain]/collections
```

---

## 📋 PHASE 4: TESTING - 20 SMOKE TESTS

**Critical Tests (MUST PASS):**
```
✅ API health check: curl https://orashop-api.onrender.com/api/health
✅ Collections page loads: https://orashop-[vercel].vercel.app/collections
✅ Products display with images
✅ Category filter works
✅ Admin login works
✅ No console errors (F12)
✅ No CORS errors
✅ HTTPS enabled (green lock)
```

**If FAIL:** Check troubleshooting in PHASE_4_TESTING_VERIFICATION.md

---

## 📋 PHASE 5: DNS - CUSTOM DOMAIN (2 STEPS)

```
Option A - Nameserver (Recommended):
1. In Vercel dashboard > Domains > Add Domain > orashop.com
2. Select "Use Nameservers"
3. Update nameservers in domain registrar
4. Wait 5-30 minutes

Option B - CNAME:
1. Add CNAME: orashop.com → cname.vercel-dns.com
2. Add subdomain: api.orashop.com → [render-cname]
3. Wait 5-30 minutes
4. Verify: nslookup orashop.com
```

---

## 🔐 CRITICAL ENVIRONMENT VARIABLES

### Backend (Production)
```
DATABASE_URL=postgresql://...@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[paste-from-supabase]
SUPABASE_SERVICE_ROLE_KEY=[paste-from-supabase]
JWT_SECRET=[STRONG-SECRET-NEW]
RAZORPAY_KEY_ID=rzp_live_[production-key]
RAZORPAY_KEY_SECRET=[production-secret]
NODE_ENV=production
FRONTEND_URL=https://orashop.com
```

### Frontend (Production)
```
NEXT_PUBLIC_API_URL=https://orashop-api.onrender.com
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[production-key]
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste-from-supabase]
```

---

## 🚨 COMMON ERRORS & QUICK FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot reach API" | Backend not deployed | Check Render deployment status |
| "Cannot find module" | Root directory wrong | Set to ./frontend in Vercel |
| "Images not loading" | Storage bucket private | Make product-images bucket public |
| "CORS blocked" | ALLOWED_ORIGINS missing | Add frontend URL to backend ALLOWED_ORIGINS |
| "RLS violation" | RLS policies not enabled | Run SUPABASE_RLS_SETUP.sql |
| "Password auth failed" | JWT_SECRET mismatch | Use SAME JWT_SECRET everywhere |
| "Domain not resolving" | DNS not propagated | Wait 5-30 minutes, check with nslookup |
| "Build failed" | Dependencies missing | Run npm install locally, test build |

---

## ✅ QUICK VERIFICATION CHECKLIST

Run these to verify everything:

```bash
# Phase 1 ✅
curl https://hgejomvgldqnqzkgffoi.supabase.co/rest/v1/products \
  -H "apikey: [ANON_KEY]"

# Phase 2 ✅
curl https://orashop-api.onrender.com/api/health

# Phase 3 ✅
curl https://orashop.vercel.app/collections

# Phase 4 ✅
# Open https://orashop.vercel.app/collections in browser
# F12 → Console → No red errors
# F12 → Network → All requests green

# Phase 5 ✅
nslookup orashop.com
# Should show Vercel nameservers
```

---

## 📊 TIMELINE

### Full-Time (2-3 Days)
```
Day 1 AM: Phase 1 (1 hr) + Phase 2 (1.5 hrs)
Day 1 PM: Phase 3 (1.5 hrs)
Day 2 AM: Phase 4 (2-3 hrs)
Day 2 PM: Phase 5 (1 hr)
Day 3: Final checks, go live
```

### Part-Time (1-2 Weeks)
```
Mon: Phase 1 (1 hour)
Tue: Phase 2 (1.5 hours)
Wed: Phase 3 (1.5 hours)
Thu: Phase 4 start (1 hour)
Fri: Phase 4 complete, Phase 5 start
Mon-Tue: Final testing
Wed: Go live!
```

---

## 🎯 KEY URLs TO SAVE

```
Supabase Dashboard: https://app.supabase.com/project/hgejomvgldqnqzkgffoi
Render Dashboard: https://dashboard.render.com
Vercel Dashboard: https://vercel.com/dashboard
Razorpay Dashboard: https://dashboard.razorpay.com

Your Live Sites (After Phase 5):
Frontend: https://orashop.com
Backend API: https://api.orashop.com
Admin: https://orashop.com/admin
Collections: https://orashop.com/collections
```

---

## ⚙️ IMPORTANT COMMANDS

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Test database connection
psql $DATABASE_URL

# Test API endpoint
curl https://orashop-api.onrender.com/api/products

# Check DNS propagation
nslookup orashop.com
# or
dig orashop.com

# Verify HTTPS
curl -I https://orashop.com
# Should show: "HTTP/2 200"

# View backend logs
# In Render dashboard > Logs tab

# View frontend build logs
# In Vercel dashboard > Deployments > Logs
```

---

## 🔒 SECURITY CHECKLIST

```
✅ Use PRODUCTION Razorpay keys (not test)
✅ Keep JWT_SECRET strong and secret
✅ Don't commit .env files to GitHub
✅ Use HTTPS everywhere
✅ RLS policies enabled on database
✅ CORS configured for your domain only
✅ Admin routes require authentication
✅ Service role key never exposed to frontend
✅ Database passwords in env variables only
✅ Regular backups of Supabase database
```

---

## 📞 SUPPORT FILES

- **Full Details:** MASTER_EXECUTION_GUIDE.md
- **Phase 1 Full Guide:** PHASE_1_SUPABASE_CHECKLIST.md
- **Phase 2 Full Guide:** PHASE_2_BACKEND_DEPLOYMENT.md
- **Phase 3 Full Guide:** PHASE_3_FRONTEND_DEPLOYMENT.md
- **Phase 4 Full Guide:** PHASE_4_TESTING_VERIFICATION.md
- **SQL Script:** SUPABASE_RLS_SETUP.sql (copy-paste)
- **Environment Template:** ENV_VARIABLES_TEMPLATE.md

---

## 🎉 SUCCESS CRITERIA

✅ All 5 phases complete  
✅ 18+ smoke tests passing (90%+)  
✅ Custom domain working  
✅ HTTPS enabled  
✅ API responding  
✅ Collections page displaying all products  
✅ No console errors  
✅ Lighthouse score > 75  

**READY TO LAUNCH!** 🚀

---

**Print this page or bookmark it for quick reference!**
