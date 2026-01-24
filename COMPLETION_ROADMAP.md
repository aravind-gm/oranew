# ORA E-COMMERCE PLATFORM — COMPLETION ROADMAP
**Current Date:** January 9, 2026  
**Status:** Backend ~90%, Frontend ~40% → Target: 100% Production-Ready

---

## 1️⃣ MISSING FEATURES SUMMARY

### Backend Status
✅ **Implemented:**
- User authentication (register, login, JWT)
- Product & Category CRUD
- Cart & Wishlist management
- Order creation (checkout creates orders + clears cart)
- Basic address management
- Review management
- Email notifications (stubbed)
- Prisma schema (complete with Orders, Payments, Returns, Coupons)

❌ **CRITICAL GAPS:**
- **Razorpay integration** — Payment creation and webhook handling are TODO stubs
- **Inventory locking** — No stock validation/deduction at checkout
- **Payment webhook** — No signature verification, no payment status updates
- **Refunds** — No Razorpay refund API integration
- **Forgot password** — No reset token generation or email flow
- **Return processing** — Schema exists, endpoints missing
- **Coupon validation** — Schema exists, logic missing
- **Admin authorization** — Routes exist but need CRUD endpoints

### Frontend Status
✅ **Implemented:**
- Layout & Navigation (basic)
- Homepage (skeleton)
- Zustand stores (auth, cart, wishlist)
- API client (Axios with interceptors)
- TypeScript setup
- Tailwind + custom styling

❌ **CRITICAL GAPS:**
- **Auth pages** — No login/register/forgot password UI
- **Product pages** — PLP & PDP are placeholders (no data fetching)
- **Checkout flow** — No checkout page, no payment initiation
- **Order pages** — No order history, order detail, cancel/return UI
- **Admin UI** — Completely missing
- **Account pages** — Profile, addresses, order history not implemented
- **Real data fetching** — Most pages don't call APIs

---

## 2️⃣ BACKEND CHANGES REQUIRED (BY MODULE)

### A. Payment Module (`src/controllers/payment.controller.ts`)

**Current State:** All functions are TODO stubs

**What Needs to Be Done:**

```typescript
// 1. Initialize Razorpay in server.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// 2. Implement createPayment()
// - Validate orderId exists & belongs to user
// - Get order with items & amounts
// - Validate stock availability
// - Create Razorpay order
// - Create Payment record with status PENDING
// - Return Razorpay order ID + amount to frontend

// 3. Implement verifyPayment()
// - Extract razorpayOrderId, razorpayPaymentId, razorpaySignature from req.body
// - Use crypto to verify signature (CRITICAL for security)
// - Do NOT trust frontend verification result
// - Return success/failure to frontend

// 4. Implement webhook()
// - Route: POST /api/payments/webhook
// - CRITICAL: Use raw body parsing for signature verification
// - Verify webhook signature from Razorpay
// - Handle events:
//   - payment.authorized (should also check for payment.captured)
//   - payment.failed
//   - refund.created
// - Update Payment.status, Order.status, Order.paymentStatus
// - Deduct inventory ONLY on success
// - Send customer notification emails
// - Return 200 OK to Razorpay

// 5. Implement getPaymentStatus()
// - GET /api/payments/:orderId
// - Return payment status for order

// 6. Implement initiateRefund()
// - POST /api/payments/refund (requires ADMIN role)
// - Validate return is approved
// - Call Razorpay refunds API
// - Update Payment.status = REFUNDED
// - Restock inventory
```

**Environment Variables Required:**
```
RAZORPAY_KEY_ID=<from Razorpay Dashboard>
RAZORPAY_KEY_SECRET=<from Razorpay Dashboard>
WEBHOOK_SECRET=<generate secure random token for Razorpay webhook>
```

---

### B. Order Module (`src/controllers/order.controller.ts`)

**Current State:** Checkout creates order but:
- Clears cart before payment confirmation ❌
- Doesn't validate inventory
- Order status = PENDING (wrong — should wait for payment)

**What Needs to Be Done:**

```typescript
// 1. Update checkout() function
// - BEFORE creating order: validate all items in stock
// - Lock inventory (create InventoryLock records)
// - CREATE order with status PENDING + paymentStatus PENDING
// - DO NOT clear cart yet (only clear after payment confirmed)
// - Return order details including order ID for payment

// 2. Add clearCart() helper
// - Delete cart items for user
// - Release any inventory locks

// 3. Add getOrder() — GET /api/orders/:orderId
// - Return single order with items, addresses, payment status
// - Verify user owns order (authorization)

// 4. Add cancelOrder() — POST /api/orders/:orderId/cancel
// - Only PENDING or PROCESSING orders can be cancelled
// - Release inventory locks
// - Update order status
// - Notify customer

// 5. Update getOrders() if incomplete
// - Paginate results
// - Return with full details (items, addresses)

// 6. Add updateOrderStatus() — POST /api/orders/:orderId/status (ADMIN only)
// - Admin can update: PROCESSING → SHIPPED → DELIVERED
// - Trigger notifications on each status change
```

**New Model Needed:**
```typescript
// Add to Prisma schema:
model InventoryLock {
  id        String   @id @default(uuid())
  orderId   String   @map("order_id")
  productId String   @map("product_id")
  quantity  Int
  expiresAt DateTime @map("expires_at") // Auto-release after 15 min if not paid
  order     Order    @relation(fields: [orderId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
  @@unique([orderId, productId])
  @@map("inventory_locks")
}
```

---

### C. Auth Module (`src/controllers/auth.controller.ts`)

**Current State:** Register & login work. Forgot password & reset missing.

**What Needs to Be Done:**

```typescript
// 1. Add forgotPassword() — POST /api/auth/forgot-password
// - Accept email
// - Check if user exists
// - Generate secure reset token (JWT with short expiry: 1 hour)
// - Store reset token in DB (via PasswordReset model)
// - Send reset email with link: /reset-password?token=...
// - Return 200 (don't reveal if email exists for security)

// 2. Add resetPassword() — POST /api/auth/reset-password
// - Accept token + newPassword
// - Verify token is valid + not expired
// - Hash new password
// - Update user passwordHash
// - Delete reset token
// - Return success

// 3. Add refreshToken() — POST /api/auth/refresh
// - Accept old token
// - Verify it's valid
// - Generate new token
// - Return new token
```

**New Models:**
```typescript
model PasswordReset {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("password_resets")
}
```

---

### D. Admin Module (`src/controllers/admin.controller.ts`)

**Current State:** Routes exist but controller is likely incomplete.

**What Needs to Be Done:**

```typescript
// 1. Product Management
// - createProduct() ✓ exists
// - updateProduct() ✓ exists
// - deleteProduct() ✓ exists
// - Need: Image upload to Cloudinary integration
// - Need: Bulk import/export

// 2. Category Management
// - createCategory() — POST /api/admin/categories
// - updateCategory() — PUT /api/admin/categories/:id
// - deleteCategory() — DELETE /api/admin/categories/:id
// - Manage subcategories (parentId)

// 3. Order Management
// - getOrders() (admin view — all orders, filterable)
// - getOrderDetail() — with customer info, payment status
// - updateOrderStatus()
// - cancelOrder()
// - printLabel() (for shipping)

// 4. Dashboard Metrics
// - getTodaysSales() — revenue, order count, order value
// - getLowStockProducts() — products below lowStockThreshold
// - getTopProducts() — by sales
// - getRecentOrders() — last 10

// 5. Return Management
// - getReturnRequests() — filterable by status
// - approveReturn() — mark as APPROVED, trigger refund
// - rejectReturn() — mark as REJECTED
// - processRefund() — call Razorpay API

// 6. User Management
// - listUsers() — paginated
// - getUserDetail()
// - toggleUserRole() — ADMIN ↔ STAFF ↔ CUSTOMER
```

---

### E. Return Module (`src/controllers/return.controller.ts`)

**Current State:** No endpoints exist (schema only)

**What Needs to Be Done:**

```typescript
// 1. requestReturn() — POST /api/returns
// - Customer creates return request
// - Validate order is DELIVERED
// - Accept reason + description
// - Create Return record (status REQUESTED)
// - Send admin notification

// 2. getReturns() — GET /api/returns
// - Get customer's returns

// 3. getReturnDetail() — GET /api/returns/:id
// - Get single return with order details

// 4. Admin endpoints (in admin.controller.ts)
// - approveReturn() — POST /api/admin/returns/:id/approve
// - rejectReturn() — POST /api/admin/returns/:id/reject
// - Both trigger notifications
```

---

### F. Inventory Module (New)

**What Needs to Be Done:**

```typescript
// Create src/utils/inventory.ts
export const validateStock = async (items: CartItem[]) => {
  // Check all items have sufficient stock
};

export const lockInventory = async (orderId: string, items: OrderItem[]) => {
  // Create InventoryLock records
  // Set expiry to 15 minutes
};

export const releaseLocks = async (orderId: string) => {
  // Delete InventoryLock records
};

export const deductInventory = async (items: OrderItem[]) => {
  // Subtract from Product.stockQuantity
  // Delete InventoryLock records
};

export const restockInventory = async (items: OrderItem[]) => {
  // Add back to Product.stockQuantity (on refund/return)
};

export const cleanupExpiredLocks = async () => {
  // Cron job: release locks > 15 min old
  // Notify customer of timeout
};
```

---

### G. Email & Notification Module

**What Needs to Be Done:**

```typescript
// Enhance src/utils/email.ts with templates:
// 1. OrderConfirmation ✓ exists
// 2. PaymentConfirmed (on webhook success)
// 3. OrderShipped (when status updated)
// 4. OrderDelivered (final status)
// 5. PaymentFailed (on webhook failure)
// 6. ReturnApproved (admin action)
// 7. RefundProcessed (after Razorpay)
// 8. PasswordReset (forgot password flow)

// Enhance src/utils/notification.ts:
// - Create Notification records for major events
// - Can be extended to push notifications / SMS later
```

---

## 3️⃣ FRONTEND PAGES/COMPONENTS TO BUILD

### Core Pages to Implement

```
frontend/src/app/
├── auth/
│   ├── login/page.tsx              ← NEW
│   ├── register/page.tsx            ← NEW
│   ├── forgot-password/page.tsx     ← NEW
│   └── reset-password/page.tsx      ← NEW (accepts ?token query)
│
├── checkout/
│   ├── page.tsx                     ← NEW (cart summary, address selection)
│   ├── payment/page.tsx             ← NEW (Razorpay payment form)
│   └── success/page.tsx             ← NEW (order confirmation)
│
├── account/
│   ├── page.tsx                     ← NEW (profile overview)
│   ├── orders/page.tsx              ← NEW (order history)
│   ├── orders/[orderId]/page.tsx    ← NEW (order detail + cancel/return UI)
│   ├── addresses/page.tsx           ← NEW (manage addresses)
│   └── settings/page.tsx            ← NEW (password change, etc.)
│
├── products/
│   ├── page.tsx                     ← REFACTOR (real PLP with filters)
│   ├── [slug]/page.tsx              ← NEW (real PDP)
│
├── admin/
│   ├── page.tsx                     ← NEW (dashboard)
│   ├── products/page.tsx            ← NEW (product list)
│   ├── products/new/page.tsx        ← NEW (create product)
│   ├── products/[id]/edit/page.tsx  ← NEW (edit product)
│   ├── categories/page.tsx          ← NEW (category list)
│   ├── orders/page.tsx              ← NEW (order list)
│   ├── orders/[id]/page.tsx         ← NEW (order detail)
│   └── returns/page.tsx             ← NEW (return requests)
│
├── page.tsx                          ← REFACTOR (real homepage)
├── cart/page.tsx                     ← REFACTOR (real cart page)
├── wishlist/page.tsx                 ← REFACTOR (real wishlist page)
└── search/page.tsx                   ← REFACTOR (real search + filters)
```

### Reusable Components to Build

```
frontend/src/components/
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ForgotPasswordForm.tsx
│   └── ResetPasswordForm.tsx
│
├── checkout/
│   ├── AddressSelector.tsx (select existing or create new)
│   ├── OrderSummary.tsx (items, totals, GST breakdown)
│   ├── PaymentForm.tsx (integrates Razorpay SDK)
│   └── PaymentStatus.tsx (loading, success, error states)
│
├── account/
│   ├── AddressCard.tsx
│   ├── AddressForm.tsx
│   ├── OrderCard.tsx
│   ├── OrderTimeline.tsx
│   └── ReturnForm.tsx
│
├── admin/
│   ├── ProductForm.tsx (create/edit with image upload)
│   ├── ProductTable.tsx
│   ├── OrderTable.tsx
│   ├── OrderDetailModal.tsx
│   ├── ReturnApprovalForm.tsx
│   ├── StatsCard.tsx
│   └── InventoryAlertBanner.tsx
│
├── product/
│   ├── ProductCard.tsx (refactor for consistency)
│   ├── ProductGallery.tsx
│   ├── ProductSpecs.tsx
│   ├── ReviewSection.tsx
│   └── RelatedProducts.tsx
│
└── common/
    ├── PaginationControls.tsx
    ├── FilterSidebar.tsx
    ├── LoadingSpinner.tsx
    ├── EmptyState.tsx
    └── ErrorBoundary.tsx
```

### Store Updates (Zustand)

```typescript
// frontend/src/store/cartStore.ts
// - Add clearCart() action
// - Sync with localStorage safely (no module-level access)

// frontend/src/store/orderStore.ts (NEW)
// - store: orders[], currentOrder, filters
// - actions: fetchOrders(), fetchOrder(id), cancelOrder(id), requestReturn()

// frontend/src/store/adminStore.ts (NEW)
// - store: products[], categories[], orders[], metrics
// - actions: fetchMetrics(), updateOrderStatus(), approveReturn()

// frontend/src/store/uiStore.ts (NEW)
// - store: modals, notifications, loading states
// - actions: openModal(), closeModal(), showToast()
```

---

## 4️⃣ RAZORPAY PAYMENT FLOW (STEP-BY-STEP)

### Frontend → Backend → Razorpay → Webhook → DB

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INITIATES CHECKOUT                                      │
├─────────────────────────────────────────────────────────────────┤
│ - Frontend: Cart page → "Proceed to Checkout"                   │
│ - Validate address selection                                    │
│ - POST /api/orders (create order)                               │
│ - Backend: Check stock, lock inventory, create Order            │
│ - Response: { orderId, totalAmount }                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. INITIATE RAZORPAY PAYMENT                                    │
├─────────────────────────────────────────────────────────────────┤
│ - Frontend: POST /api/payments/create                           │
│   Body: { orderId, amount }                                     │
│ - Backend:                                                      │
│   a) Get Order (verify user owns it, amount matches)            │
│   b) Create Razorpay order via SDK                              │
│      razorpay.orders.create({                                   │
│        amount: totalAmount * 100, // paise                      │
│        currency: 'INR',                                         │
│        receipt: orderId,                                        │
│        notes: { orderId }                                       │
│      })                                                         │
│   c) Create Payment record in DB (status: PENDING)              │
│   d) Response: { razorpayOrderId, key: RAZORPAY_KEY_ID, ... }  │
│ - Frontend: Open Razorpay modal with orderId                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. CUSTOMER COMPLETES PAYMENT                                   │
├─────────────────────────────────────────────────────────────────┤
│ - Razorpay modal: customer enters card/UPI details              │
│ - Razorpay processes payment                                    │
│ - On SUCCESS: Razorpay returns {                                │
│     razorpayPaymentId,                                          │
│     razorpayOrderId,                                            │
│     razorpaySignature                                           │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND VERIFIES & NOTIFIES BACKEND                         │
├─────────────────────────────────────────────────────────────────┤
│ - Frontend: POST /api/payments/verify                           │
│   Body: {                                                       │
│     orderId,                                                    │
│     razorpayPaymentId,                                          │
│     razorpayOrderId,                                            │
│     razorpaySignature                                           │
│   }                                                             │
│ - Backend (CRITICAL):                                           │
│   a) Verify signature (NEVER trust frontend):                   │
│      const hmac = crypto                                        │
│        .createHmac('sha256', RAZORPAY_KEY_SECRET)               │
│        .update(`${orderId}|${razorpayPaymentId}`)               │
│        .digest('hex');                                          │
│      if (hmac !== razorpaySignature) → reject                   │
│   b) Get payment from Razorpay API to double-check              │
│   c) Response: { success: true, orderId }                       │
│ - Frontend: Show "Payment processing..." (wait for webhook)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 5. RAZORPAY WEBHOOK (MOST CRITICAL)                             │
├─────────────────────────────────────────────────────────────────┤
│ - Razorpay POST /api/payments/webhook (asynchronous)            │
│ - Webhook body (RAW, not JSON):                                 │
│   {                                                             │
│     event: 'payment.captured',  // or 'payment.authorized'      │
│     payload: {                                                  │
│       payment: {                                                │
│         id: 'pay_xxxxx',                                        │
│         entity: 'payment',                                      │
│         amount: 10000,                                          │
│         status: 'captured',                                     │
│         order_id: 'order_xxxxx',                                │
│         ...                                                     │
│       }                                                         │
│     },                                                          │
│     X-Razorpay-Signature: '<webhook_signature>'                 │
│   }                                                             │
│                                                                 │
│ - Backend Handler:                                              │
│   a) Verify webhook signature:                                  │
│      const signature = headers['x-razorpay-signature'];         │
│      const hmac = crypto                                        │
│        .createHmac('sha256', WEBHOOK_SECRET)                    │
│        .update(rawBody)  // IMPORTANT: raw, not parsed JSON     │
│        .digest('hex');                                          │
│      if (hmac !== signature) → return 403                       │
│   b) Extract event & payment details                            │
│   c) Find Order by razorpay order_id                            │
│   d) If event = 'payment.captured' or 'payment.authorized':     │
│      - Update Order: status = PAID, paymentStatus = PAID        │
│      - Update Payment: status = PAID, transactionId = pay_id    │
│      - Call deductInventory() → subtract from stock             │
│      - Delete InventoryLock records                             │
│      - Clear cart                                               │
│      - Create Notification: ORDER_CONFIRMED                     │
│      - Send email: OrderConfirmed                               │
│   e) If event = 'payment.failed':                               │
│      - Update Payment: status = FAILED                          │
│      - Update Order: status = PENDING (retry allowed)           │
│      - Release InventoryLock                                    │
│      - Create Notification: PAYMENT_FAILED                      │
│      - Send email: PaymentFailed                                │
│   f) Return 200 OK to Razorpay (acknowledge receipt)            │
│                                                                 │
│ - Frontend: Poll /api/orders/:id until paymentStatus = PAID     │
│   or listen to WebSocket (optional, future)                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 6. CUSTOMER SEES SUCCESS PAGE                                   │
├─────────────────────────────────────────────────────────────────┤
│ - Frontend receives order confirmation                          │
│ - Show order number, delivery estimate                          │
│ - Link to order detail page                                     │
│ - "Continue Shopping" button                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 7. FAILURE SCENARIOS                                            │
├─────────────────────────────────────────────────────────────────┤
│ Payment Failed:                                                 │
│ - Razorpay webhook with event = 'payment.failed'                │
│ - Order remains PENDING, paymentStatus = FAILED                 │
│ - Inventory locks released                                      │
│ - Customer notified, can retry checkout                         │
│                                                                 │
│ Timeout (no webhook after 15 min):                              │
│ - Cron job releases inventory locks                             │
│ - Order marked as CANCELLED or EXPIRED                          │
│ - Customer can retry                                            │
│                                                                 │
│ Webhook Timeout (Razorpay retries):                             │
│ - Razorpay retries webhook for 48 hours                         │
│ - Idempotency: check if Payment already exists before update    │
└─────────────────────────────────────────────────────────────────┘
```

### Critical Security Checks

```typescript
// In Payment Controller:

// ✅ ALWAYS verify signature (NEVER skip)
// ✅ Use raw body for webhook signature, not parsed JSON
// ✅ NEVER trust razorpay data from frontend (get from webhook)
// ✅ Check Order exists & amount matches
// ✅ Check Payment transaction hasn't been processed twice (idempotency)
// ✅ ALWAYS deduct inventory via webhook, never from frontend
// ✅ ALWAYS return 200 to Razorpay (success or failure)
// ✅ Log all webhook events for audit
// ✅ Rate limit verification endpoint (prevent brute force)
```

---

## 5️⃣ INVENTORY LOCKING & ORDER LIFECYCLE FLOW

### Inventory State Machine

```
Stock Available (stockQuantity = 10)
    ↓
Customer adds to cart (cart shows item, no stock change)
    ↓
Customer clicks "Checkout"
    ↓
[LOCK] Stock reserved in InventoryLock (effective stock = 7)
        - InventoryLock.expiresAt = now + 15 min
        - Product.stockQuantity still 10 (logical view: 7)
        - Prevent overselling even with concurrent checkouts
    ↓
[Payment Success via Webhook]
    ↓
[DEDUCT] Product.stockQuantity = 10 → 7
    - Delete InventoryLock
    - Inventory committed
    ↓
Order Status: PAID
    ↓
Fulfillment → Shipped → Delivered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Failure Scenarios:

[LOCK TIMEOUT] (15 min no payment)
    → Cron releases InventoryLock
    → Product.stockQuantity unchanged
    → Order expires
    → Customer retries with fresh locks

[PAYMENT FAILED via Webhook]
    → Delete InventoryLock
    → Product.stockQuantity unchanged
    → Customer can retry

[REFUND]
    → Add back to Product.stockQuantity
    → Delete InventoryLock
    → Create new inventory entry
```

### Order Lifecycle

```
PENDING → PAID → PROCESSING → SHIPPED → DELIVERED → COMPLETE
           ↓
         FAILED → (can retry)
           ↓
         CANCELLED (customer can cancel PENDING/PROCESSING)
           ↓
DELIVERED → RETURN_REQUESTED → RETURN_APPROVED → REFUNDED → COMPLETE
             ↓
           RETURN_REJECTED → COMPLETE
```

### Database Implementation

```sql
-- Products table
stockQuantity: 10       (actual committed stock)
lowStockThreshold: 5    (trigger warning at 5 or below)

-- InventoryLock table (during checkout)
├─ orderId: "order-1"
├─ productId: "prod-1"
├─ quantity: 3
└─ expiresAt: 2026-01-09 10:30:00

-- Effective Stock Calculation (query):
SELECT 
  p.id,
  p.stockQuantity AS committed,
  SUM(il.quantity) AS locked,
  (p.stockQuantity - COALESCE(SUM(il.quantity), 0)) AS available
FROM products p
LEFT JOIN inventory_locks il ON p.id = il.productId 
  AND il.expiresAt > NOW()
GROUP BY p.id;
```

---

## 6️⃣ ADMIN PANEL SCOPE (MVP)

### Admin Frontend Structure

```
/admin
├── Dashboard
│   ├── Today's Sales (revenue, orders, avg order value)
│   ├── Recent Orders (5 items, status)
│   ├── Low Stock Alert (items below threshold)
│   └── Quick Stats (total customers, products, reviews)
│
├── Products
│   ├── List (with pagination, search, filters)
│   │   ├─ Table: Name | SKU | Category | Stock | Price | Actions
│   │   └─ Actions: Edit | Delete | View Details
│   │
│   ├── Create Product
│   │   ├─ Name, Description, SKU
│   │   ├─ Price, Discount, Final Price (auto-calc)
│   │   ├─ Category, Subcategory
│   │   ├─ Stock & Threshold
│   │   ├─ Images (Cloudinary upload, reorder, primary)
│   │   ├─ Meta (SEO title, description)
│   │   └─ Publish checkbox
│   │
│   └── Edit Product (same as create)
│
├── Categories
│   ├── List (hierarchical: parent → children)
│   │   ├─ Table: Name | Slug | Type | Items | Actions
│   │   └─ Add / Edit / Delete
│   │
│   └── Create/Edit Category
│       ├─ Name, Slug, Description
│       ├─ Parent Category (optional for subcategories)
│       ├─ Banner Image
│       └─ Publish checkbox
│
├── Orders
│   ├── List (filterable by status, date, search by order #)
│   │   ├─ Table: Order # | Customer | Amount | Status | Date | Action
│   │   ├─ Quick Actions: View | Ship | Cancel
│   │   └─ Bulk Actions: Mark as Shipped
│   │
│   └── Order Detail
│       ├─ Customer Info (name, email, phone)
│       ├─ Shipping Address
│       ├─ Items (table with product images, qty, price)
│       ├─ Order Timeline (Pending → Paid → Shipped → Delivered)
│       ├─ Payment Status (Paid / Failed / Pending)
│       ├─ Tracking Number input (once shipped)
│       ├─ Update Status dropdown (Pending → Processing → Shipped → Delivered)
│       ├─ Notes textarea (internal)
│       └─ Actions: Cancel Order | Print Label
│
├── Returns
│   ├── List (filterable by status)
│   │   ├─ Table: Return ID | Order | Customer | Reason | Status | Date
│   │   └─ Actions: View | Approve | Reject
│   │
│   └── Return Detail
│       ├─ Order Summary
│       ├─ Reason & Description
│       ├─ Status Timeline
│       ├─ Refund Amount (auto-calculated from order items)
│       ├─ Actions:
│       │   ├─ Approve (triggers Razorpay refund, restocks inventory)
│       │   └─ Reject (with reason)
│       └─ Refund Status (Pending / Processing / Completed)
│
├── Customers
│   ├── List (name, email, phone, total spent, orders count)
│   ├── Search & Filter
│   └── Customer Detail
│       ├─ Profile
│       ├─ Order History
│       ├─ Reviews
│       └─ Actions: Edit | Deactivate
│
└── Settings (for admin user profile, webhooks, API keys)
    ├─ Profile
    ├─ Webhook Logs (Razorpay webhook history)
    └─ Export Data
```

### Admin API Endpoints Required

```
GET    /api/admin/dashboard/metrics      (sales, orders, stock)
POST   /api/admin/dashboard/export       (CSV export)

GET    /api/admin/products               (list, paginated)
POST   /api/admin/products               (create)
PUT    /api/admin/products/:id           (update)
DELETE /api/admin/products/:id           (soft delete)

GET    /api/admin/categories             (list)
POST   /api/admin/categories             (create)
PUT    /api/admin/categories/:id         (update)
DELETE /api/admin/categories/:id         (delete)

GET    /api/admin/orders                 (list, filters)
GET    /api/admin/orders/:id             (detail)
PUT    /api/admin/orders/:id/status      (update status)
POST   /api/admin/orders/:id/cancel      (cancel order)
POST   /api/admin/orders/:id/print       (shipping label)

GET    /api/admin/returns                (list)
GET    /api/admin/returns/:id            (detail)
POST   /api/admin/returns/:id/approve    (approve & refund)
POST   /api/admin/returns/:id/reject     (reject)

GET    /api/admin/customers              (list)
GET    /api/admin/customers/:id          (detail)

GET    /api/admin/webhooks               (logs)
```

### Admin Authentication

```typescript
// Middleware: verifyAdminRole
app.use('/api/admin', protect, authorize('ADMIN', 'STAFF'))

// Different permission levels:
ADMIN: all endpoints
STAFF: everything except customer delete, refund processing (requires manager)
```

---

## 7️⃣ SECURITY CHECKLIST

### Critical — Must Fix

- [ ] **Razorpay webhook signature verification** (raw body parsing)
- [ ] **No frontend payment status updates** (only via webhook)
- [ ] **JWT secrets in env variables** (not hardcoded)
- [ ] **CSRF protection** (if using cookies, add csrf-sync middleware)
- [ ] **SQL injection prevention** (Prisma handles, but validate inputs)
- [ ] **Rate limiting on auth endpoints** (prevent brute force)
- [ ] **Inventory deduction only on payment success** (prevent overselling)
- [ ] **Admin routes role-checked** (authorize middleware on all admin endpoints)
- [ ] **Forgot password token expires** (1 hour max)
- [ ] **Password reset requires old email verification** (optional but recommended)

### Important — Strongly Recommended

- [ ] **Input validation** (Zod schemas on all endpoints)
- [ ] **API error messages** (don't leak sensitive info)
- [ ] **Logging & audit trail** (especially payments & returns)
- [ ] **HTTPS enforced** (in production config)
- [ ] **CORS properly configured** (not wildcard)
- [ ] **Sensitive data not in logs** (no tokens, passwords)
- [ ] **Prisma secrets not printed** (check migrations)
- [ ] **Environment variables validated at startup**
- [ ] **Database backup strategy** (separate document)

### Nice to Have

- [ ] **API key rotation strategy** (Razorpay, Cloudinary)
- [ ] **Webhook signature mismatch alerts** (notify ops)
- [ ] **DDoS protection** (CloudFlare or similar)
- [ ] **Security headers** (HSTS, X-Frame-Options, etc.)

---

## 8️⃣ DEPLOYMENT CHECKLIST

### Before First Deployment

- [ ] Razorpay keys obtained & stored in .env (never in git)
- [ ] PostgreSQL database provisioned (with backups)
- [ ] Cloudinary account setup (image hosting)
- [ ] Email provider configured (Nodemailer SMTP)
- [ ] VPS or PaaS selected (Docker-ready)
- [ ] SSL certificate obtained
- [ ] DNS configured for your domain
- [ ] .env.example created (no secrets, just variable names)
- [ ] .gitignore includes .env files
- [ ] Docker images tested locally

### Database Migrations

```bash
# On fresh deployment:
docker exec ora-backend npx prisma migrate deploy
# or
docker exec ora-backend npx prisma migrate dev --name init

# Auto-seed test data (optional):
docker exec ora-backend npm run prisma:seed
```

### Docker Production Config

```dockerfile
# backend/Dockerfile should:
- Use node:20-alpine as base (small image)
- Run as non-root user
- Set NODE_ENV=production
- Install only prod dependencies
- Run healthcheck
- Expose correct port

# frontend/Dockerfile should:
- Build stage (next build)
- Runtime stage (next start)
- Healthcheck
```

### Environment Variables (Prod)

```
# Backend
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@db:5432/oradb
JWT_SECRET=<very-long-random-key>
RAZORPAY_KEY_ID=<from dashboard>
RAZORPAY_KEY_SECRET=<from dashboard>
WEBHOOK_SECRET=<generate secure random>
CLOUDINARY_NAME=<account name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@orashop.in
SMTP_PASS=<app password>
FRONTEND_URL=https://orashop.in

# Frontend
NEXT_PUBLIC_API_URL=https://api.orashop.in
NEXT_PUBLIC_RAZORPAY_KEY_ID=<public key only>
```

### Monitoring & Logs

- [ ] Application logs aggregated (e.g., ELK stack, Datadog, CloudWatch)
- [ ] Database slow query logs monitored
- [ ] Webhook delivery logs reviewed regularly
- [ ] Payment errors alerted immediately
- [ ] Disk space monitored
- [ ] Database backups tested weekly

### Post-Deployment Validation

```bash
# Health checks:
curl https://api.orashop.in/health
curl https://api.orashop.in/  # response should be JSON with version

# Payment test (in Razorpay test mode):
# 1. Register test account
# 2. Use test card: 4111 1111 1111 1111
# 3. Complete payment flow end-to-end
# 4. Verify webhook received & processed
# 5. Check order created in database

# Frontend test:
# 1. Load homepage
# 2. Browse products
# 3. Complete checkout flow
# 4. Verify order in admin panel
```

---

## 9️⃣ RECOMMENDED EXECUTION ORDER

### Phase 1: Payment Infrastructure (Week 1-2) — CRITICAL

**Goal:** Enable real payments with complete security

1. **Backend Payment Module** [CRITICAL]
   - [ ] Implement `createPayment()` → create Razorpay order
   - [ ] Implement `verifyPayment()` → verify signature (client-side double-check only)
   - [ ] Implement `webhook()` → Razorpay signature verify + update DB
   - [ ] Add `InventoryLock` model to Prisma
   - [ ] Implement inventory locking in checkout
   - [ ] Implement inventory deduction on webhook
   - [ ] Test locally with Razorpay SDK
   - **Deliverable:** Full payment flow with webhook tested

2. **Payment Routes**
   - [ ] POST /api/payments/create (auth required)
   - [ ] POST /api/payments/verify (auth required)
   - [ ] POST /api/payments/webhook (no auth, signature verified)
   - [ ] GET /api/payments/:orderId (auth required)
   - **Deliverable:** All routes wired

3. **Frontend Payment Page**
   - [ ] Create `/checkout/payment/page.tsx`
   - [ ] Integrate Razorpay SDK (react-razorpay)
   - [ ] Handle success/failure/modal close
   - [ ] Show order summary
   - **Deliverable:** End-to-end payment from UI

4. **Testing**
   - [ ] Razorpay test mode setup
   - [ ] Test successful payment
   - [ ] Test failed payment
   - [ ] Verify order status updates
   - [ ] Verify inventory deducted
   - [ ] Verify email sent
   - **Deliverable:** Payment flow 100% functional

---

### Phase 2: Checkout Flow (Week 2-3)

**Goal:** Complete checkout experience from cart to success page

1. **Order Creation Refactor**
   - [ ] Update `checkout()` to NOT clear cart before payment
   - [ ] Update `checkout()` to lock inventory
   - [ ] Create order with status PENDING
   - [ ] Return order ID to frontend
   - **Deliverable:** Order creation awaits payment confirmation

2. **Frontend Checkout Pages**
   - [ ] `/checkout/page.tsx` — address selection + order summary
   - [ ] Address selector component (existing addresses + create new)
   - [ ] Order summary with breakdown (subtotal, GST, shipping)
   - [ ] Proceed to payment button
   - [ ] `/checkout/success/page.tsx` — order confirmation
   - [ ] Order detail link
   - [ ] **Deliverable:** Full checkout UI

3. **Cart Integration**
   - [ ] Cart page shows items with current prices
   - [ ] "Proceed to Checkout" → validate address exists
   - [ ] Redirect to checkout page
   - [ ] **Deliverable:** Cart → Checkout flow works

---

### Phase 3: Customer Account Features (Week 3-4)

**Goal:** Customers can manage orders & profile

1. **Auth Pages**
   - [ ] `/auth/login/page.tsx`
   - [ ] `/auth/register/page.tsx`
   - [ ] `/auth/forgot-password/page.tsx`
   - [ ] `/auth/reset-password/page.tsx` (with token validation)
   - [ ] Add `PasswordReset` model to Prisma
   - [ ] Implement `forgotPassword()` controller
   - [ ] Implement `resetPassword()` controller
   - **Deliverable:** Full auth flow with password reset

2. **Customer Account Pages**
   - [ ] `/account/page.tsx` — profile overview
   - [ ] `/account/addresses/page.tsx` — manage addresses
   - [ ] `/account/orders/page.tsx` — order history (paginated)
   - [ ] `/account/orders/[orderId]/page.tsx` — order detail
   - [ ] Order cancel button (if PENDING/PROCESSING)
   - [ ] Return request form (if DELIVERED)
   - [ ] **Deliverable:** Customers can view orders & manage profile

3. **Order Management Controllers**
   - [ ] `getOrder()` — GET /api/orders/:id
   - [ ] `cancelOrder()` — POST /api/orders/:id/cancel
   - [ ] `requestReturn()` — POST /api/orders/:id/return
   - [ ] Update order routes
   - **Deliverable:** Backend order management APIs

---

### Phase 4: Product Pages & Catalog (Week 4-5)

**Goal:** Real product browsing experience

1. **Product Listing Page (PLP)**
   - [ ] `/products/page.tsx` — fetch from API
   - [ ] Grid layout with ProductCard components
   - [ ] Pagination
   - [ ] Category filters
   - [ ] Price range filter
   - [ ] Sort options (price, rating, newest)
   - [ ] Search box
   - **Deliverable:** Functional PLP with filters

2. **Product Detail Page (PDP)**
   - [ ] `/products/[slug]/page.tsx`
   - [ ] Fetch product by slug from API
   - [ ] Image gallery
   - [ ] Product specs (material, dimensions, weight)
   - [ ] Price with discount calculation
   - [ ] Add to cart button
   - [ ] Add to wishlist button
   - [ ] Reviews section
   - [ ] Related products
   - [ ] **Deliverable:** Full PDP with interactions

3. **Backend Product APIs** (likely already exist, verify)
   - [ ] GET /api/products (with filters: category, price, search)
   - [ ] GET /api/products/:slug
   - [ ] GET /api/products/featured
   - [ ] **Deliverable:** APIs support frontend filters

4. **Cart & Wishlist Pages**
   - [ ] Refactor `/cart/page.tsx` with real data
   - [ ] Refactor `/wishlist/page.tsx` with real data
   - [ ] Remove from cart/wishlist functionality
   - [ ] Checkout button
   - **Deliverable:** Cart & wishlist functional

---

### Phase 5: Admin Panel (Week 5-7)

**Goal:** Minimal viable admin UI for operations

1. **Admin Dashboard**
   - [ ] `/admin/page.tsx` — dashboard home
   - [ ] Metrics cards (today's sales, order count, customer count)
   - [ ] Recent orders table
   - [ ] Low stock alert banner
   - [ ] **Deliverable:** Admin dashboard view

2. **Admin Product Management**
   - [ ] `/admin/products/page.tsx` — product list
   - [ ] `/admin/products/new/page.tsx` — create product
   - [ ] `/admin/products/[id]/edit/page.tsx` — edit product
   - [ ] Product form with:
     - Basic info (name, SKU, description)
     - Pricing (price, discount, final price auto-calc)
     - Category selection
     - Stock management
     - Image upload to Cloudinary
     - Meta fields (SEO)
   - [ ] Delete product (soft delete)
   - [ ] **Deliverable:** Full product CRUD

3. **Admin Product Controllers**
   - [ ] Verify all product CRUD endpoints exist
   - [ ] Add Cloudinary image upload integration
   - [ ] **Deliverable:** Backend ready for admin

4. **Admin Category Management**
   - [ ] `/admin/categories/page.tsx`
   - [ ] Create, edit, delete categories
   - [ ] Manage subcategories (parent/child)
   - [ ] **Deliverable:** Category management UI + APIs

5. **Admin Order Management**
   - [ ] `/admin/orders/page.tsx` — order list (filters: status, date)
   - [ ] `/admin/orders/[id]/page.tsx` — order detail
   - [ ] Order timeline visualization
   - [ ] Update order status (Pending → Processing → Shipped → Delivered)
   - [ ] Add tracking number field
   - [ ] Cancel order button
   - [ ] **Deliverable:** Full order management

6. **Admin Return Management**
   - [ ] `/admin/returns/page.tsx` — return requests list
   - [ ] Return detail modal
   - [ ] Approve button (triggers Razorpay refund)
   - [ ] Reject button
   - [ ] Refund status tracking
   - [ ] **Deliverable:** Return approval workflow

7. **Admin Routes & Auth**
   - [ ] Implement admin role-based routes
   - [ ] Protect /api/admin/* with authorize('ADMIN', 'STAFF')
   - [ ] **Deliverable:** Admin APIs secured

---

### Phase 6: Returns & Refunds (Week 7-8)

**Goal:** Complete return lifecycle with Razorpay refunds

1. **Return Model & Controllers**
   - [ ] `requestReturn()` — POST /api/returns (customer)
   - [ ] `getReturns()` — GET /api/returns (customer)
   - [ ] Add return endpoints to admin controllers
   - [ ] **Deliverable:** Return APIs ready

2. **Return UI (Customer)**
   - [ ] Return form in order detail page
   - [ ] Reason dropdown + description text
   - [ ] Submit button
   - [ ] Confirm modal
   - [ ] **Deliverable:** Customer can request return

3. **Return Approval (Admin)**
   - [ ] Approve button in admin return detail
   - [ ] Call Razorpay refunds API
   - [ ] Update Payment.status = REFUNDED
   - [ ] Update Order.status = RETURNED
   - [ ] Restock inventory
   - [ ] Send customer notification
   - [ ] **Deliverable:** Refunds fully automated

4. **Razorpay Refund Integration**
   - [ ] Implement refunds API call
   - [ ] Handle refund failures
   - [ ] Webhook support for refund.created
   - [ ] **Deliverable:** Refund processing via Razorpay

---

### Phase 7: Production Hardening (Week 8-9)

**Goal:** Make system production-ready

1. **Security Audit**
   - [ ] Review all payment logic for security issues
   - [ ] Verify role-based access control on all endpoints
   - [ ] Input validation (Zod schemas)
   - [ ] Rate limiting on auth/payment endpoints
   - [ ] CORS properly configured
   - [ ] Secrets not in code/logs
   - [ ] **Deliverable:** Security checklist passed

2. **Database**
   - [ ] All migrations working
   - [ ] Indexes created for queries
   - [ ] Backup strategy documented
   - [ ] **Deliverable:** DB production-ready

3. **Docker & Deployment**
   - [ ] Backend Dockerfile optimized
   - [ ] Frontend Dockerfile optimized
   - [ ] docker-compose with PostgreSQL
   - [ ] Healthchecks configured
   - [ ] Environment variables validated
   - [ ] .env.example created
   - [ ] **Deliverable:** Ready to deploy

4. **Testing & QA**
   - [ ] End-to-end payment test
   - [ ] Order cancellation test
   - [ ] Return & refund test
   - [ ] Admin product CRUD test
   - [ ] Inventory accuracy test
   - [ ] **Deliverable:** All critical flows tested

5. **Documentation**
   - [ ] README updated with setup steps
   - [ ] API documentation (Postman collection or OpenAPI)
   - [ ] Deployment guide
   - [ ] Database backup procedure
   - [ ] **Deliverable:** Complete docs

---

### Phase 8: Launch & Monitoring (Week 9-10)

1. **Pre-Launch**
   - [ ] Razorpay production keys configured
   - [ ] Database backups automated
   - [ ] Monitoring & logging setup
   - [ ] Error alerts configured
   - [ ] **Deliverable:** Systems ready

2. **Launch**
   - [ ] Deploy to VPS
   - [ ] Run health checks
   - [ ] Test payment flow end-to-end
   - [ ] Monitor logs for errors
   - [ ] **Deliverable:** Live on production

3. **Post-Launch**
   - [ ] Monitor for issues
   - [ ] Gather user feedback
   - [ ] Plan Phase 2 features:
     - [ ] Mobile app (React Native)
     - [ ] Inventory auto-reorder alerts
     - [ ] Email marketing integration
     - [ ] Analytics dashboard
     - [ ] Customer reviews & ratings refinement

---

## Summary Timeline

| Phase | Duration | Focus | Outcome |
|-------|----------|-------|---------|
| 1 | 1-2 weeks | Payments + Security | Razorpay fully wired & tested |
| 2 | 1 week | Checkout | End-to-end checkout UX |
| 3 | 1-2 weeks | Auth + Accounts | Customer self-serve features |
| 4 | 1-2 weeks | Catalog | Product browsing & discovery |
| 5 | 2-3 weeks | Admin | Operational UI for admin |
| 6 | 1 week | Returns | Refund automation |
| 7 | 1-2 weeks | Hardening | Security & production-ready |
| 8 | 1 week | Launch | Live on production |
| **Total** | **~10 weeks** | **Full e-commerce platform** | **Production-ready site** |

---

## Files to Create/Modify Summary

### New Files (Backend)
- `src/controllers/return.controller.ts` — Return request handling
- `src/utils/inventory.ts` — Inventory lock/deduct/restock logic
- `src/utils/razorpay.ts` — Razorpay SDK initialization & helpers
- `src/routes/return.routes.ts` — Return endpoints
- `src/middleware/rawBodyParser.ts` — For webhook raw body parsing
- Migration for InventoryLock model
- Migration for PasswordReset model

### New Files (Frontend)
- Auth pages (login, register, forgot password, reset password)
- Checkout pages (address selection, payment, success)
- Customer account pages (profile, addresses, orders, order detail)
- Product pages (PLP, PDP refactored)
- Admin pages (dashboard, products, categories, orders, returns)
- Components (forms, tables, modals, etc.)
- Stores (orderStore, adminStore, uiStore)

### Modified Files (Backend)
- `src/controllers/order.controller.ts` — Update checkout logic
- `src/controllers/payment.controller.ts` — Full implementation
- `src/controllers/auth.controller.ts` — Add forgot/reset endpoints
- `prisma/schema.prisma` — Add InventoryLock, PasswordReset models
- `src/server.ts` — Add payment routes, webhook raw body parsing
- `src/middleware/auth.ts` — Ensure JWT secret from env

### Modified Files (Frontend)
- `src/lib/api.ts` — Ensure safe (no module-level localStorage access)
- `src/store/authStore.ts` — Hydration safety
- `src/app/layout.tsx` — Add auth check, global providers
- `src/app/page.tsx` — Real homepage with products

---

This roadmap is COMPLETE and IMPLEMENTATION-READY. All decisions are locked to the existing stack. Each phase is self-contained and testable.
