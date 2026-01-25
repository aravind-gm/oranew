# PRODUCTION DEPLOYMENT - MASTER EXECUTION GUIDE
## Step-by-Step Implementation Plan for ORA Jewellery E-Commerce Platform

**Project:** ORA Jewellery Production Deployment  
**Status:** Phase 1 - READY TO START  
**Total Duration:** 2-3 days (full-time) or 1-2 weeks (part-time)  
**Date Created:** January 25, 2026  

---

## 🎯 OVERVIEW

This guide walks you through deploying a production-ready e-commerce platform using:

- **Frontend:** Next.js 16 → Vercel (CDN + edge functions)
- **Backend:** Express.js → Render.com (serverless container)
- **Database:** Supabase PostgreSQL (RLS policies for security)
- **Storage:** Supabase Storage (product images)
- **Auth:** JWT-based (7-day expiry)
- **Payments:** Razorpay (test → production)
- **Domain:** GoDaddy/Namecheap (CNAME/Nameserver configuration)

---

## 📋 PREREQUISITES

✅ Have these ready before starting:

```
GitHub Account:
- [ ] Backend repository (with backend/ folder)
- [ ] Frontend repository (with frontend/ folder)
- [ ] Repository access (push permission)

Accounts Created:
- [ ] Supabase account (free tier OK)
- [ ] Render.com account (free to start)
- [ ] Vercel account (free tier OK)
- [ ] Razorpay account (test keys available)
- [ ] Domain registrar account (GoDaddy, Namecheap, etc.)

Information Gathered:
- [ ] Supabase project ID
- [ ] Database password
- [ ] Razorpay Key ID (test)
- [ ] Razorpay Key Secret (test)
- [ ] Domain name (orashop.com)
```

---

## ⚡ QUICK TIMELINE

### Full-Time Deployment (2-3 days)

```
Day 1:
├── Morning (1 hour): Phase 1 - Supabase Setup
├── Mid-morning (1.5 hours): Phase 2 - Backend Deployment
└── Afternoon: Phase 3 - Frontend Deployment (1.5 hours)

Day 2:
├── Morning: Phase 4 - Testing & Fixes (2-3 hours)
└── Afternoon: Phase 5 - DNS & Domain Setup (1 hour)

Day 3:
├── Morning: Final verification & launch preparation
├── Go-live: Switch to production URLs
└── Post-launch: Monitor and support
```

### Part-Time Deployment (1-2 weeks)

```
Week 1:
├── Monday: Phase 1 - Supabase (1 hour)
├── Tuesday: Phase 2 - Backend (1.5 hours)
├── Wednesday: Phase 3 - Frontend (1.5 hours)
└── Thursday-Friday: Testing & fixes

Week 2:
├── Monday-Tuesday: Phase 4 - Complete testing
├── Wednesday: Phase 5 - DNS configuration
└── Thursday-Friday: Launch & monitoring
```

---

## 🚀 PHASE-BY-PHASE BREAKDOWN

### PHASE 1: SUPABASE SETUP ✅ (1 hour)
**File:** `PHASE_1_SUPABASE_CHECKLIST.md`

**Tasks:**
1. Enable RLS (Row-Level Security) on all tables
2. Create security policies (public read, admin write)
3. Set up storage bucket for product images
4. Generate JWT_SECRET
5. Gather Supabase credentials

**Output:**
- RLS policies enabled on 12 tables
- product-images storage bucket created
- JWT_SECRET generated
- Credentials saved for next phases

**Key File:** `SUPABASE_RLS_SETUP.sql` (215 lines, copy-paste ready)

---

### PHASE 2: BACKEND DEPLOYMENT ✅ (1.5-2 hours)
**File:** `PHASE_2_BACKEND_DEPLOYMENT.md`

**Tasks:**
1. Create Render.com account
2. Connect GitHub repository
3. Configure build & start commands
4. Add production environment variables
5. Deploy Express.js backend
6. Verify API endpoints responding

**Deployment Options:**
- **Recommended:** Render.com (simplest, $7-12/month)
- **Alternative:** Railway.app (easy, pay-as-you-go)
- **Advanced:** Vercel Functions (complex, free tier)

**Output:**
- Backend API live at: `https://orashop-api.onrender.com`
- All endpoints responding correctly
- Database migrations applied
- API ready to serve frontend

---

### PHASE 3: FRONTEND DEPLOYMENT ✅ (1-1.5 hours)
**File:** `PHASE_3_FRONTEND_DEPLOYMENT.md`

**Tasks:**
1. Create Vercel account
2. Import GitHub repository (frontend folder)
3. Set root directory to `./frontend`
4. Add environment variables (NEXT_PUBLIC_*)
5. Deploy Next.js application
6. Configure custom domain

**Output:**
- Frontend live at: `https://orashop.com`
- Collections page displays all active products
- Images load from Supabase Storage
- Connected to backend API

---

### PHASE 4: TESTING & VERIFICATION ✅ (2-3 hours)
**File:** `PHASE_4_TESTING_VERIFICATION.md`

**Tests to Execute:**
1. API health check ✅
2. Products endpoint ✅
3. Categories endpoint ✅
4. Collections page load ✅
5. Category filtering ✅
6. Image loading from Supabase ✅
7. Search functionality ✅
8. Admin authentication ✅
9. Product CRUD operations ✅
10. Payment flow (test mode) ✅
11. JWT token validation ✅
12. CORS configuration ✅
13. HTTPS/SSL security ✅
14. Performance (Lighthouse) ✅
15. Mobile responsiveness ✅

**Success Criteria:**
- 14+ of 15 tests passing
- No critical errors
- Lighthouse score > 75
- Mobile responsive
- Payment flow working

---

### PHASE 5: DNS & DOMAIN SETUP ✅ (1-2 hours)
**Tasks:**
1. Configure domain DNS records
2. Set up www subdomain (optional)
3. Wait for DNS propagation (5-30 minutes)
4. Verify domain resolves correctly

**Domain Configuration:**

```
Primary Domain: orashop.com
├── CNAME → cname.vercel-dns.com (frontend on Vercel)
└── Subdomain: api.orashop.com
    └── CNAME → [render-cname] (backend on Render)

Alternative (Nameserver):
├── Update nameservers to Vercel's nameservers
└── Vercel auto-handles all DNS
```

---

## 📊 EXECUTION DASHBOARD

Track your progress here:

### Phase 1: Supabase Setup
```
Status: ⏳ NOT STARTED / 🔄 IN PROGRESS / ✅ COMPLETE

Tasks:
☐ RLS policies SQL executed
☐ All tables show rowsecurity=true
☐ Storage bucket created and public
☐ JWT_SECRET generated
☐ Credentials copied to safe location

Completion: __% (0/5)
```

### Phase 2: Backend Deployment
```
Status: ⏳ NOT STARTED / 🔄 IN PROGRESS / ✅ COMPLETE

Tasks:
☐ Render account created
☐ GitHub repo connected
☐ Build commands configured
☐ Environment variables added
☐ Backend deployed
☐ API endpoints verified

Completion: __% (0/6)
```

### Phase 3: Frontend Deployment
```
Status: ⏳ NOT STARTED / 🔄 IN PROGRESS / ✅ COMPLETE

Tasks:
☐ Vercel account created
☐ GitHub repo imported
☐ Root directory set to ./frontend
☐ Environment variables added
☐ Frontend deployed
☐ Collections page verified

Completion: __% (0/6)
```

### Phase 4: Testing
```
Status: ⏳ NOT STARTED / 🔄 IN PROGRESS / ✅ COMPLETE

Tests Completed: __/20
Tests Passed: __/20
Success Rate: __%

Completion: __% (0/20)
```

### Phase 5: DNS & Launch
```
Status: ⏳ NOT STARTED / 🔄 IN PROGRESS / ✅ COMPLETE

Tasks:
☐ DNS records configured
☐ Domain resolves correctly
☐ SSL/HTTPS working
☐ Final verification complete

Completion: __% (0/4)
```

---

## 🔑 CRITICAL VARIABLES TO SAVE

Create a file `CREDENTIALS_SAFE.txt` and save these (KEEP SECURE):

```
=== SUPABASE ===
Project ID: hgejomvgldqnqzkgffoi
Database URL (Pooled): postgresql://...@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
Direct URL (Migrations): postgresql://...@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
SUPABASE_URL: https://hgejomvgldqnqzkgffoi.supabase.co
ANON_KEY: eyJhbGc...
SERVICE_ROLE_KEY: eyJhbGc...

=== JWT ===
JWT_SECRET: [generate new secure secret]
Format: openssl rand -base64 32

=== RAZORPAY ===
Test Keys:
  KEY_ID: rzp_test_S3RpfRx3I2B7GC
  KEY_SECRET: 2x7zVlpYrT6RA2xGQhhK27oe
  WEBHOOK_SECRET: test_webhook_secret_local_testing

Production Keys (get from dashboard):
  KEY_ID: rzp_live_[your_key]
  KEY_SECRET: [your_secret]
  WEBHOOK_SECRET: [your_webhook_secret]

=== DEPLOYMENT URLS ===
Backend API: https://orashop-api.onrender.com
Frontend: https://orashop-vercel-[random].vercel.app (before custom domain)
Final Frontend: https://orashop.com (after custom domain)

=== DOMAIN ===
Domain Registrar: [GoDaddy/Namecheap/etc.]
Domain: orashop.com
Nameservers: [list if using nameserver method]
CNAME Records: [list if using CNAME method]
```

---

## 🎯 STEP-BY-STEP START

### RIGHT NOW:

**Option A: Want to start immediately?**

1. Open terminal
2. Navigate to your project: `cd /home/aravind/Downloads/oranew`
3. Read Phase 1 checklist: `cat PHASE_1_SUPABASE_CHECKLIST.md`
4. Start with Step 1: Open Supabase dashboard
5. Execute SUPABASE_RLS_SETUP.sql in SQL Editor

**Option B: Want to read everything first?**

1. Read this document completely
2. Read each PHASE_*.md file in order
3. Then start execution
4. Follow the checklists step-by-step

**Option C: Need help?**

1. Check the troubleshooting section in each phase
2. Look for your error message
3. Follow the solution steps
4. If still stuck, run tests again

---

## 📁 DEPLOYMENT FILES REFERENCE

All guides are in this directory:

```
/home/aravind/Downloads/oranew/
├── PHASE_1_SUPABASE_CHECKLIST.md (14 steps)
├── PHASE_2_BACKEND_DEPLOYMENT.md (3 platform options)
├── PHASE_3_FRONTEND_DEPLOYMENT.md (12 steps)
├── PHASE_4_TESTING_VERIFICATION.md (20 tests)
├── SUPABASE_RLS_SETUP.sql (copy-paste ready)
├── ENV_VARIABLES_TEMPLATE.md (all variables needed)
└── PRODUCTION_DEPLOYMENT_GUIDE.md (comprehensive reference)
```

---

## ⏱️ TIME ESTIMATES

Experienced Developer:
```
Phase 1: 30-45 minutes
Phase 2: 45-60 minutes
Phase 3: 45-60 minutes
Phase 4: 90 minutes
Phase 5: 30 minutes
TOTAL: 4-5 hours
```

First-Time Deployer:
```
Phase 1: 1-1.5 hours (getting familiar with Supabase)
Phase 2: 1.5-2 hours (setting up Render)
Phase 3: 1-1.5 hours (Vercel deployment)
Phase 4: 2-3 hours (testing & troubleshooting)
Phase 5: 1 hour (DNS setup)
TOTAL: 7-9 hours (over 2-3 days)
```

---

## 🚨 CRITICAL SUCCESS FACTORS

✅ **Must Complete:**
1. RLS policies must be enabled (security)
2. JWT_SECRET must be strong (security)
3. Environment variables must match between platforms
4. API URLs must be correct (frontend ↔ backend)
5. Custom domains must be configured for production

❌ **Must NOT Do:**
1. Don't use test API keys in production
2. Don't commit .env files to GitHub
3. Don't use default/weak JWT secrets
4. Don't skip HTTPS configuration
5. Don't deploy without running smoke tests

---

## 📞 SUPPORT & RESOURCES

### Built-in Resources:
- Each phase has detailed troubleshooting section
- Smoke test guide helps verify everything works
- Environment variable template covers all platforms
- SQL script is ready to copy-paste

### External Resources:
- Vercel Documentation: https://vercel.com/docs
- Render Documentation: https://render.com/docs
- Supabase Documentation: https://supabase.com/docs
- Next.js Guide: https://nextjs.org/docs
- Express.js Guide: https://expressjs.com

### Emergency Contacts:
- Vercel Support: support@vercel.com
- Render Support: support@render.com
- Supabase Support: https://supabase.com/support

---

## ✅ FINAL CHECKLIST BEFORE LAUNCH

```
Phase 1 - Supabase:
☐ RLS enabled on all tables
☐ Storage bucket public and working
☐ JWT_SECRET generated and saved

Phase 2 - Backend:
☐ API deployed and responding
☐ Database connected successfully
☐ All environment variables set

Phase 3 - Frontend:
☐ Website deployed to Vercel
☐ Collections page loading
☐ Images displaying correctly

Phase 4 - Testing:
☐ 18+ tests passing out of 20
☐ No critical errors
☐ Lighthouse score > 75
☐ Mobile responsive

Phase 5 - Production:
☐ Custom domain configured
☐ HTTPS/SSL enabled
☐ DNS propagated and working
☐ Final smoke test passed

LAUNCH READY: ✅ YES / ❌ NO

Date Launched: _________
Signed By: _________
```

---

## 🎉 YOU'RE READY!

Everything is prepared. All you need to do is execute the phases step-by-step.

**Start with Phase 1 now:**
- Open: `PHASE_1_SUPABASE_CHECKLIST.md`
- Start with: Step 1 (Supabase SQL Editor)
- Time needed: 1 hour
- Difficulty: Easy

**Questions?** Check the troubleshooting section in each phase file.

**Ready to launch?** Follow the phases in order!

---

**Status:** 🟢 ALL SYSTEMS GO - READY FOR PRODUCTION LAUNCH

**Next Action:** Execute Phase 1 - Supabase Setup
