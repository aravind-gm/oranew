# ORA E-COMMERCE — QUICK REFERENCE

## Current State (Week 4 - Jan 12, 2026)

```
Backend: ██████████ 100% ✅
Frontend: ████████░░ 80% 🟡
Overall: █████████░ 90% ✅

WEEK 4 COMPLETE: Customer Account Features Enhanced!
- Order History with full details
- Cancel Order functionality
- Return Request functionality
- Order Store (Zustand)
```

---

## What's Complete (Weeks 1-4 ✅)

### ✅ CRITICAL (Weeks 1-3) - ALL DONE
- [x] Razorpay payment integration (create, verify, webhook)
- [x] Inventory locking system with 15-min expiration
- [x] Payment webhook with signature verification
- [x] Frontend payment page & Razorpay modal
- [x] Checkout flow (address, order summary, success page)
- [x] Forgot password & reset password flow
- [x] Product listing & filtering (PLP)
- [x] Product detail page (PDP)

### ✅ WEEK 4 - CUSTOMER ACCOUNT (ALL DONE)
- [x] Order Store (Zustand) for state management
- [x] Enhanced order history page with status badges
- [x] Order detail page with full information
- [x] Cancel order functionality with modal & reason
- [x] Return request functionality with modal & reasons
- [x] Address management (view, add, delete)
- [x] Customer profile page

### 🟠 NEXT (Week 5+)
- [ ] Admin dashboard & metrics
- [ ] Admin product/category/order management
- [ ] Admin return approval workflow
- [ ] Refund processing (post-return approval)
- [ ] Enhanced search & advanced filtering
- [ ] Production hardening & security audit

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│ CUSTOMER JOURNEY                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 1. Browse                                            │
│    → GET /api/products (with filters)                │
│    → GET /api/products/:slug                         │
│                                                      │
│ 2. Add to Cart                                       │
│    → POST /api/cart (local store)                    │
│                                                      │
│ 3. Checkout                                          │
│    → POST /api/orders (create order, lock inventory) │
│    → Returns: { orderId, totalAmount }               │
│                                                      │
│ 4. Payment                                           │
│    → POST /api/payments/create                       │
│    → Razorpay Modal                                  │
│    → POST /api/payments/verify (frontend verification)
│                                                      │
│ 5. Webhook (Razorpay → Backend)                      │
│    → POST /api/payments/webhook                      │
│    → Verify signature & update Order.status = PAID   │
│    → Deduct inventory                                │
│    → Clear cart                                      │
│    → Send confirmation email                         │
│                                                      │
│ 6. Account                                           │
│    → GET /api/orders (customer's orders)             │
│    → GET /api/orders/:id (order detail)              │
│    → POST /api/returns (request return)              │
│                                                      │
│ 7. Return (Optional)                                 │
│    → Status: REQUESTED → APPROVED → REFUNDED         │
│    → Refund via Razorpay API                         │
│    → Restock inventory                               │
│                                                      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ ADMIN JOURNEY                                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 1. Dashboard                                         │
│    → Today's sales, metrics                          │
│    → Low stock alerts                                │
│                                                      │
│ 2. Product Management                                │
│    → CRUD products with images (Cloudinary)          │
│    → Manage categories & subcategories                │
│                                                      │
│ 3. Order Management                                  │
│    → List orders (filters, search)                   │
│    → Update order status (PROCESSING → SHIPPED →…)   │
│    → Add tracking number & ship                      │
│                                                      │
│ 4. Return Management                                 │
│    → Review return requests                          │
│    → Approve (trigger Razorpay refund)               │
│    → Reject with reason                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Payment Flow (Detailed)

```
Frontend                Backend              Razorpay
   |                       |                    |
   |--- POST /checkout ----|                    |
   |     (order data)       |                    |
   |<- { orderId } ---------|                    |
   |                    [create Order]           |
   |                    [lock inventory]         |
   |                                             |
   |--- POST /payments/create --|                |
   |     (orderId, amount)       |               |
   |                         [GET Razorpay]-----|
   |                         [create order] <---|
   |<-- { razorpayOrderId }-----|                |
   |                                             |
   |          [Show Razorpay Modal]              |
   |          [Customer enters payment]          |
   |                                 [Process]  |
   |<- Payment Result from Razorpay ------------|
   |     (paymentId, signature)                  |
   |                                             |
   |--- POST /payments/verify --|                |
   |     (verify signature)      |               |
   |<- { success: true } --------|               |
   |                                             |
   | [Webhook arrives asynchronously]            |
   |                                             |
   |                        POST /webhooks
   |                        [signature verify]<-|
   |                        [update Order]      |
   |                        [deduct inventory]  |
   |                        [clear cart]        |
   |                        [send email]        |
   |                        [return 200 OK]---->|
   |                                             |
   | [Poll /orders/:id every 2 sec]             |
   |<-- { paymentStatus: "PAID" } when ready ---|
   |                                             |
   |   [Show Success Page]                       |
   |                                             |
```

---

## Database Model Changes

### New Models Needed

```prisma
model InventoryLock {
  id        String   @id @default(uuid())
  orderId   String   @map("order_id")
  productId String   @map("product_id")
  quantity  Int
  expiresAt DateTime @map("expires_at")
  
  order     Order    @relation(fields: [orderId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
  
  @@unique([orderId, productId])
  @@map("inventory_locks")
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("password_resets")
}
```

### Model Relationships to Add

```prisma
// In User model
passwordResets PasswordReset[]

// In Product model
inventoryLocks InventoryLock[]

// In Order model
inventoryLocks InventoryLock[]
```

---

## Critical Security Requirements

```
PAYMENT SECURITY:
✓ Razorpay webhook signature ALWAYS verified (raw body, not JSON)
✓ Never trust frontend for payment status (only webhook source of truth)
✓ Inventory deducted ONLY on successful webhook
✓ Idempotency: check Payment.transactionId before updating
✓ Rate limit: /api/payments/* endpoints

ADMIN SECURITY:
✓ All /api/admin/* routes require authorize('ADMIN', 'STAFF')
✓ Refund processing restricted to ADMIN only
✓ Audit trail: log all admin actions
✓ Email verification for sensitive actions (optional but recommended)

AUTH SECURITY:
✓ JWT_SECRET must be in .env (not hardcoded)
✓ Password reset token expires after 1 hour
✓ Hash all passwords with bcrypt
✓ Rate limit login/register/forgot-password endpoints
✓ Validate all input with Zod schemas

DATABASE SECURITY:
✓ Never log sensitive data (tokens, passwords, payment details)
✓ Use parameterized queries (Prisma handles this)
✓ Limit query size / pagination required
```

---

## Environment Variables Required

```bash
# Backend .env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@db:5432/oradb
JWT_SECRET=<64+ character random string>
JWT_EXPIRY=7d

RAZORPAY_KEY_ID=<from Razorpay Dashboard>
RAZORPAY_KEY_SECRET=<from Razorpay Dashboard>
WEBHOOK_SECRET=<generate secure random token>

CLOUDINARY_NAME=<account>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@orashop.in
SMTP_PASS=<app password>
SMTP_FROM=noreply@orashop.in

FRONTEND_URL=https://orashop.in

# Frontend .env.local
NEXT_PUBLIC_API_URL=https://api.orashop.in
NEXT_PUBLIC_RAZORPAY_KEY_ID=<public key only>
```

---

## API Endpoints Summary

### Auth Routes
```
POST   /api/auth/register              → Create user
POST   /api/auth/login                 → Get JWT token
GET    /api/auth/me                    → Get current user
POST   /api/auth/forgot-password       → Send reset email
POST   /api/auth/reset-password        → Reset password with token
POST   /api/auth/refresh               → Get new JWT token
```

### Product Routes
```
GET    /api/products                   → List with filters
GET    /api/products/featured          → Featured products
GET    /api/products/:slug             → Get single product
POST   /api/products                   → Create (admin)
PUT    /api/products/:id               → Update (admin)
DELETE /api/products/:id               → Delete (admin)
```

### Order Routes
```
POST   /api/orders                     → Create order (checkout)
GET    /api/orders                     → List user's orders
GET    /api/orders/:id                 → Get order detail
POST   /api/orders/:id/cancel          → Cancel order
POST   /api/orders/:id/return          → Request return
```

### Payment Routes
```
POST   /api/payments/create            → Create Razorpay order
POST   /api/payments/verify            → Verify payment (frontend)
POST   /api/payments/webhook           → Razorpay webhook (no auth)
GET    /api/payments/:orderId          → Get payment status
```

### Return Routes
```
POST   /api/returns                    → Request return
GET    /api/returns                    → List returns
GET    /api/returns/:id                → Get return detail
```

### Admin Routes
```
GET    /api/admin/dashboard/metrics    → Dashboard data
GET    /api/admin/products             → All products (admin list)
POST   /api/admin/categories           → Create category
PUT    /api/admin/categories/:id       → Update category
GET    /api/admin/orders               → All orders (admin list)
PUT    /api/admin/orders/:id/status    → Update order status
GET    /api/admin/returns              → All returns (admin list)
POST   /api/admin/returns/:id/approve  → Approve return & refund
POST   /api/admin/returns/:id/reject   → Reject return
```

---

## Frontend Pages to Build

```
CUSTOMER PAGES:
/                           Homepage (real products)
/auth/login                 Login form
/auth/register              Register form
/auth/forgot-password       Forgot password form
/auth/reset-password        Reset password form
/products                   Product listing (PLP)
/products/[slug]            Product detail (PDP)
/cart                       Cart page
/wishlist                   Wishlist page
/search                     Search + filters
/checkout                   Address selection
/checkout/payment           Razorpay payment
/checkout/success           Order confirmation
/account                    Profile overview
/account/orders             Order history
/account/orders/[id]        Order detail + cancel/return
/account/addresses          Address management
/account/settings           Change password, etc.

ADMIN PAGES:
/admin                      Dashboard
/admin/products             Product list
/admin/products/new         Create product
/admin/products/[id]/edit   Edit product
/admin/categories           Category management
/admin/orders               Order list
/admin/orders/[id]          Order detail
/admin/returns              Return requests
```

---

## Testing Checklist

```
PAYMENT FLOW:
□ Add item to cart
□ Proceed to checkout
□ Select address
□ See order summary
□ Click "Pay with Razorpay"
□ Use test card: 4111 1111 1111 1111
□ Complete payment
□ See success page
□ Verify order in DB
□ Verify inventory deducted
□ Check email received
□ Verify admin can see order

ORDER MANAGEMENT:
□ View order history
□ View order detail
□ Cancel PENDING order (verify stock restored)
□ Request return for DELIVERED order
□ Admin approves return (verify refund triggered)
□ Verify inventory restocked
□ Verify refund email sent

ADMIN OPERATIONS:
□ Create product with images
□ Edit product
□ Delete product
□ Create category
□ Update order status
□ View dashboard metrics
□ Approve return request

EDGE CASES:
□ Payment timeout (> 15 min) → locks released
□ Payment failed → retry available
□ Double-click checkout → prevent duplicate orders
□ Concurrent checkouts → inventory correct
□ Webhook retry → idempotent (no duplicate updates)
```

---

## Deployment Checklist

```
PRE-PRODUCTION:
□ All environment variables in .env (never git)
□ .env.example created with variable names
□ Razorpay keys obtained & configured
□ PostgreSQL database provisioned with backups
□ Cloudinary account setup
□ SMTP credentials obtained
□ SSL certificate obtained
□ Domain DNS configured

DOCKER:
□ Backend Dockerfile production-optimized
□ Frontend Dockerfile production-optimized
□ docker-compose.yml with PostgreSQL
□ Healthchecks configured
□ Non-root user in Dockerfile

SECURITY:
□ CORS properly configured (not wildcard)
□ JWT secrets in env (not hardcoded)
□ Payment webhook signature verification works
□ All admin routes role-protected
□ No sensitive logs (tokens, passwords)
□ Rate limiting enabled on auth/payment endpoints
□ HTTPS enforced

DATABASE:
□ All migrations applied
□ Backup strategy documented
□ Indexes created for queries
□ Prune old InventoryLock records (cron)

MONITORING:
□ Application logs aggregated (ELK / Datadog / CloudWatch)
□ Payment errors alerted
□ Webhook failures monitored
□ Database slow queries logged
□ Disk space monitored

LAUNCH:
□ Health check passes: GET /health
□ Payment test with Razorpay test mode
□ Full checkout flow tested end-to-end
□ Admin dashboard functional
□ Customer account functional
□ Logs reviewed for errors
```

---

## Success Criteria

```
✅ Phase 1 (Payments): Complete payment flow with webhook
✅ Phase 2 (Checkout): Customers can buy from frontend
✅ Phase 3 (Accounts): Customers can manage profile & orders
✅ Phase 4 (Catalog): Real product browsing & filtering
✅ Phase 5 (Admin): Admin can manage products & orders
✅ Phase 6 (Returns): Returns & refunds fully automated
✅ Phase 7 (Security): All security checks passed
✅ Phase 8 (Launch): Live on production with monitoring

TIMELINE: 10 weeks to production-ready platform
```
