# ORA E-COMMERCE — VISUAL ROADMAP

## Current State vs. Target

```
CURRENT (Jan 9, 2026)                TARGET (Week 10)
═════════════════════════════════════════════════════════════

Backend: ████████░░ 90%         →     Backend: ██████████ 100%
- Auth ✅                            - Auth ✅
- Products ✅                        - Products ✅
- Orders ✅                          - Orders ✅
- Cart/Wishlist ✅                   - Cart/Wishlist ✅
- PAYMENT ❌ (CRITICAL)             - PAYMENT ✅ (COMPLETE)
- Admin ◐ (partial)                 - Admin ✅ (COMPLETE)
- Returns ◐ (schema only)           - Returns ✅ (COMPLETE)

Frontend: ████░░░░░░ 40%        →     Frontend: ██████████ 100%
- Layout ✅                         - Layout ✅
- Navigation ✅                     - Navigation ✅
- Stores ✅                         - Stores ✅
- Auth Pages ❌                     - Auth Pages ✅
- Checkout ❌                       - Checkout ✅
- Account Pages ❌                  - Account Pages ✅
- Product Pages ◐ (placeholder)     - Product Pages ✅ (real)
- Admin UI ❌                       - Admin UI ✅

Infrastructure: ███████░░░ 70%  →    Infrastructure: ██████████ 100%
- Docker ✅                        - Docker ✅ (optimized)
- docker-compose ✅               - docker-compose ✅
- PostgreSQL ✅                    - PostgreSQL ✅
- CI/CD ◐ (basic)                 - CI/CD ✅ (enhanced)
- Monitoring ❌                    - Monitoring ✅
- Deployment ❌                    - Deployment ✅
```

---

## The 8-Phase Journey

```
┌──────────────────────────────────────────────────────────────┐
│  WEEK 1-2: PAYMENT INFRASTRUCTURE                            │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ ⚡ CRITICAL: Can't build without this               │    │
│  │ • Razorpay integration (create orders)              │    │
│  │ • Webhook handling (signature verify)               │    │
│  │ • Inventory locking (prevent overselling)           │    │
│  │ • Frontend payment page                             │    │
│  │ Deliverable: First real payment accepted ✅         │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WEEK 2-3: CHECKOUT FLOW                                     │
│  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🛒 Enable customer purchases                        │    │
│  │ • Address selection UI                              │    │
│  │ • Order summary page                                │    │
│  │ • Payment initiation                                │    │
│  │ • Success page                                      │    │
│  │ Deliverable: Customers can buy 🎉                  │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WEEK 3-4: CUSTOMER ACCOUNTS                                 │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 👤 Customer self-serve features                     │    │
│  │ • Auth pages (login, register, forgot password)     │    │
│  │ • Profile & address management                      │    │
│  │ • Order history & detail view                       │    │
│  │ • Return requests UI                                │    │
│  │ Deliverable: Full customer control 👍              │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WEEK 4-5: PRODUCT CATALOG                                   │
│  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🛍️ Real product browsing                            │    │
│  │ • Product listing (PLP) with filters                │    │
│  │ • Product detail page (PDP)                         │    │
│  │ • Search & filtering                                │    │
│  │ • Cart & wishlist pages                             │    │
│  │ Deliverable: Complete catalog 📦                   │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WEEK 5-7: ADMIN PANEL                                       │
│  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 👨‍💼 Admin operational UI                             │    │
│  │ • Dashboard with sales metrics                       │    │
│  │ • Product CRUD with image upload                     │    │
│  │ • Order management (list, detail, status update)     │    │
│  │ • Return approval workflow                           │    │
│  │ Deliverable: Can run the business 📊               │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WEEK 7-8: RETURNS & REFUNDS                                 │
│  ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🔄 Complete return lifecycle                        │    │
│  │ • Customer return requests                           │    │
│  │ • Admin approval workflow                            │    │
│  │ • Razorpay refund API integration                    │    │
│  │ • Inventory restock on return                        │    │
│  │ Deliverable: Automated refunds 💰                  │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WEEK 8-9: SECURITY & HARDENING                              │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🔒 Production-ready security                        │    │
│  │ • Security audit & fixes                             │    │
│  │ • Docker optimization                                │    │
│  │ • Environment validation                             │    │
│  │ • Monitoring & logging setup                         │    │
│  │ Deliverable: Security checklist passed ✅           │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WEEK 9-10: LAUNCH                                           │
│  ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🚀 Go live!                                         │    │
│  │ • Deploy to production VPS                           │    │
│  │ • Test payment flow end-to-end                       │    │
│  │ • Monitor for errors                                 │    │
│  │ • Gather user feedback                               │    │
│  │ Deliverable: Live platform 🎉                       │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Dependency Chain

```
        ┌─────────────────────────────┐
        │ PHASE 1: PAYMENTS (CRITICAL) │
        │ Razorpay + Inventory Locking │
        └──────────────┬──────────────┘
                       │ MUST COMPLETE FIRST
                       ↓
        ┌──────────────────────────────────┐
        │ PHASE 2: CHECKOUT                │
        │ Build on top of Phase 1          │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴────────────────┐
        ↓                              ↓
    ┌────────────┐          ┌─────────────────┐
    │PHASE 3:    │          │PHASE 4:         │
    │ACCOUNTS    │          │PRODUCT CATALOG  │
    │(parallel)  │          │(parallel)       │
    └────────────┘          └─────────────────┘
        │                              │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────────┐
        │ PHASE 5: ADMIN PANEL             │
        │ Can start after Phase 1          │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴────────────────┐
        │ PHASE 6: RETURNS & REFUNDS    │
        │ Depends on Phase 5            │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴────────────────┐
        │ PHASE 7: SECURITY & HARDENING │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴────────────────┐
        │     PHASE 8: LAUNCH 🚀       │
        └───────────────────────────────┘
```

---

## What Gets Built Each Week

```
WEEK 1
┌──────────────────────────────────────┐
│ BACKEND ONLY                         │
│ • Payment controller                 │
│ • Webhook with signature verify      │
│ • Inventory locking system           │
│ • Update order controller            │
│ Estimated: 30-40 hours              │
└──────────────────────────────────────┘

WEEK 2
┌──────────────────────────────────────┐
│ BACKEND (continued) + FRONTEND       │
│ Backend:                             │
│ • Complete payment integration       │
│ • Razorpay webhook testing           │
│ Frontend:                            │
│ • Payment page                       │
│ • Success page                       │
│ Estimated: 40-50 hours              │
└──────────────────────────────────────┘

WEEK 3
┌──────────────────────────────────────┐
│ PARALLEL: BACKEND + FRONTEND         │
│ Backend (Auth):                      │
│ • Forgot password endpoint           │
│ • Reset password endpoint            │
│ Frontend (Auth):                     │
│ • Login page                         │
│ • Register page                      │
│ • Forgot password page               │
│ • Reset password page                │
│ Estimated: 40-45 hours              │
└──────────────────────────────────────┘

WEEK 4
┌──────────────────────────────────────┐
│ PARALLEL: BACKEND + FRONTEND         │
│ Backend (Accounts):                  │
│ • Order management endpoints         │
│ • Return request endpoint            │
│ Frontend (Account):                  │
│ • Profile page                       │
│ • Address management                 │
│ • Order history & detail             │
│ Estimated: 35-40 hours              │
└──────────────────────────────────────┘

WEEK 5
┌──────────────────────────────────────┐
│ PARALLEL: BACKEND + FRONTEND         │
│ Backend: (Product APIs complete)    │
│ Frontend (Catalog):                  │
│ • Product listing (PLP)              │
│ • Product detail (PDP)               │
│ • Cart page                          │
│ • Wishlist page                      │
│ Estimated: 40-50 hours              │
└──────────────────────────────────────┘

WEEK 6
┌──────────────────────────────────────┐
│ PARALLEL: BACKEND + FRONTEND         │
│ Backend (Admin):                     │
│ • Dashboard metrics endpoint         │
│ • Product CRUD endpoints             │
│ • Order management endpoints         │
│ Frontend (Admin):                    │
│ • Dashboard                          │
│ • Product list & forms               │
│ • Order list & detail                │
│ Estimated: 50-60 hours              │
└──────────────────────────────────────┘

WEEK 7
┌──────────────────────────────────────┐
│ ADMIN PANEL (continued)              │
│ Backend:                             │
│ • Category endpoints                 │
│ • Return endpoints                   │
│ Frontend:                            │
│ • Category management                │
│ • Return approval UI                 │
│ • Refund integration                 │
│ Estimated: 40-50 hours              │
└──────────────────────────────────────┘

WEEK 8
┌──────────────────────────────────────┐
│ RETURNS & SECURITY                   │
│ Backend:                             │
│ • Refund API calls (Razorpay)       │
│ • Inventory restock logic            │
│ • Security audit & fixes             │
│ Frontend:                            │
│ • Return request UI                  │
│ • Refund status display              │
│ Estimated: 35-45 hours              │
└──────────────────────────────────────┘

WEEK 9
┌──────────────────────────────────────┐
│ HARDENING & DEPLOYMENT               │
│ • Docker optimization                │
│ • Environment configuration          │
│ • Monitoring setup                   │
│ • Database backup automation         │
│ • Performance optimization           │
│ Estimated: 25-35 hours              │
└──────────────────────────────────────┘

WEEK 10
┌──────────────────────────────────────┐
│ LAUNCH 🚀                            │
│ • Deploy to VPS                      │
│ • Test all critical flows            │
│ • Monitor error logs                 │
│ • Go live!                           │
│ • Post-launch support                │
│ Estimated: 20-30 hours              │
└──────────────────────────────────────┘
```

---

## Team Composition

For 10-week timeline, ideal setup:

```
Option 1: Single Engineer (10 weeks)
┌─────────────┐
│ 1 Backend   │ → Full-stack engineer (most efficient)
│ 1 Frontend  │   Works both sides, 50/50 time split
│ 1 DevOps    │   Parallel infrastructure work
└─────────────┘
Total: 3 people, 10 weeks

Option 2: Two Engineers (7 weeks)
┌─────────────┐
│ 1 Backend   │ → Dedicated backend engineer (weeks 1-7)
│ 1 Frontend  │ → Dedicated frontend engineer (weeks 2-7)
└─────────────┘
Total: 2 people, + PM/QA, 7-8 weeks

Option 3: Three Engineers (5-6 weeks) — RECOMMENDED
┌─────────────┐
│ 1 Backend   │ → Node.js / Express / Payments
│ 1 Frontend  │ → Next.js / React / Components
│ 1 DevOps    │ → Docker / VPS / Monitoring
└─────────────┘
Total: 3 people, + PM/QA, 5-6 weeks
```

---

## Critical Path (Do These First!)

```
DAY 1: Setup
  □ Read EXECUTIVE_SUMMARY.md
  □ Create Razorpay account (free)
  □ Get API keys
  □ Set up .env file

DAY 2-3: Payment Implementation
  □ Copy payment controller from IMPLEMENTATION_SNIPPETS.md
  □ Add webhook endpoint
  □ Test locally with Razorpay test card

DAY 4-5: Frontend Payment
  □ Build payment page component
  □ Integrate Razorpay SDK
  □ Test complete flow

DAY 6: Inventory System
  □ Add InventoryLock model to Prisma
  □ Implement inventory functions
  □ Update order controller

DAY 7: Testing & Validation
  □ Full payment flow test
  □ Inventory accuracy check
  □ Webhook signature verification
  □ Email delivery check
```

---

## Success Milestones

```
Week 2: ✅ First payment processed
        ✅ Inventory locking working
        ✅ Order created with PENDING status
        ✅ Webhook signature verified

Week 3: ✅ Checkout flow complete
        ✅ Customers can buy from UI
        ✅ Success page shows order
        ✅ Email confirmations sent

Week 4: ✅ Login/register working
        ✅ Forgot password flow working
        ✅ Customers can view orders
        ✅ Address management working

Week 5: ✅ Products load with real data
        ✅ Filtering & search working
        ✅ Cart & wishlist pages functional
        ✅ PDP shows all details

Week 7: ✅ Admin dashboard live
        ✅ Product CRUD working
        ✅ Order management working
        ✅ Return approval workflow

Week 8: ✅ Refunds processed automatically
        ✅ Inventory restocked on return
        ✅ Return process automated
        ✅ Security audit passed

Week 10: ✅ LIVE ON PRODUCTION 🎉
         ✅ All critical flows tested
         ✅ Monitoring active
         ✅ Backup automated
         ✅ Revenue-generating!
```

---

## Risk Factors & Mitigation

```
RISK: Razorpay integration takes longer
IMPACT: Delays all subsequent phases
MITIGATION: Start immediately, test locally with test cards

RISK: Webhook signature verification fails
IMPACT: Orders don't confirm even if payment succeeds
MITIGATION: Use raw body parsing, verify before production

RISK: Inventory overselling due to concurrency
IMPACT: More items sold than in stock
MITIGATION: Implement inventory locking (15 min timeout)

RISK: Frontend payment status doesn't match backend
IMPACT: Customer confusion, refund requests
MITIGATION: Webhook is single source of truth (don't trust frontend)

RISK: Admin panel not ready before Phase 5
IMPACT: Can't manage orders/products
MITIGATION: Build minimum viable admin (product CRUD, order list)

RISK: Security issues found near launch
IMPACT: Delays go-live
MITIGATION: Security audit in Week 8, fix before Week 10
```

---

## File Size & Complexity

```
Backend Code to Write/Modify:
├── payment.controller.ts (new)      ~200 lines
├── inventory.ts (new)               ~150 lines
├── return.controller.ts (new)       ~100 lines
├── order.controller.ts (modify)     ~50 lines
├── auth.controller.ts (modify)      ~80 lines
└── server.ts (modify)               ~30 lines

Total Backend: ~600 lines of production code


Frontend Pages to Build:
├── auth/* (4 pages)                 ~800 lines total
├── checkout/* (3 pages)             ~600 lines total
├── account/* (5 pages)              ~1000 lines total
├── products/* (refactor)            ~400 lines total
├── admin/* (7 pages)                ~2000 lines total
└── components/* (20+ components)    ~2000 lines total

Total Frontend: ~6800 lines of production code


Database:
├── New models: 2 (InventoryLock, PasswordReset)
├── New migrations: 1
└── Schema changes: ~15 fields added


Configuration:
├── Environment variables: +12 new
├── Docker: 2 Dockerfiles to optimize
└── docker-compose: 1 file to verify
```

---

## Go-Live Checklist

```
1 Week Before Launch:
  □ All features completed
  □ Security audit passed
  □ All test scenarios passed
  □ Performance acceptable
  □ Monitoring ready

3 Days Before Launch:
  □ Production database backup tested
  □ DNS prepared
  □ SSL certificate ready
  □ VPS provisioned
  □ Docker images built & tested

1 Day Before Launch:
  □ All env vars configured
  □ Razorpay production keys in place
  □ SMTP working for emails
  □ Database migrations applied
  □ Load test (optional)

Launch Day:
  □ Deploy to production
  □ Health checks passing
  □ Payment test with real card (or test mode)
  □ Verify order created
  □ Check email received
  □ Monitor error logs (30 min)
  □ Announce to users ✅
```

---

## Post-Launch (Week 11+)

```
Daily:
  □ Check error logs
  □ Monitor payment success rate
  □ Response time checks
  □ User feedback review

Weekly:
  □ Database backup test
  □ Security updates check
  □ Performance metrics review
  □ Bug triage & fixes
  □ User feedback summary

Monthly:
  □ Feature analytics
  □ Revenue report
  □ Customer satisfaction survey
  □ Plan Phase 2 improvements
```

---

## Success = Production Platform

When complete, you'll have:

✅ **Customers can:**
- Browse products with filters/search
- Add to cart & wishlist
- Create account & login
- Complete checkout
- Pay securely with Razorpay
- View order history & details
- Request returns
- Manage profile & addresses

✅ **Admins can:**
- See dashboard with sales metrics
- Create/edit/delete products
- Manage categories
- View all orders
- Update order status
- Approve/reject returns
- Process refunds
- Monitor inventory

✅ **Business gets:**
- Real, secure payments
- Automatic inventory management
- Email notifications
- Customer database
- Sales reporting
- Return handling
- Scalable infrastructure

**All on a production-ready, secure, cloud-deployed platform.**

🎉 That's the goal. 10 weeks. Let's build it!
