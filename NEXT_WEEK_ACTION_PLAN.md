# 🎯 ACTION PLAN - NEXT WEEK'S PRIORITIES

**Date:** January 15, 2026  
**Target Completion:** January 22, 2026  
**Focus:** Fix Critical Blockers + Complete Missing Features

---

## 📋 TASK BREAKDOWN BY PRIORITY

### 🔴 PHASE 1: CRITICAL BLOCKERS (Must Fix This Week)

#### Task 1.1: Create Order Details Page
**File:** `frontend/src/app/account/orders/[id]/page.tsx`  
**Status:** ❌ MISSING  
**Blocking:** Order tracking, returns, customer support  
**Effort:** 2-3 hours

**What needs to be built:**
```
Components:
- OrderHeader (order number, date, status)
- OrderItems (list of products, quantities, prices)
- OrderTimeline (order creation → shipped → delivered)
- ShippingAddress (delivery address)
- OrderSummary (subtotal, GST, shipping, total)
- CancelOrderButton (if order is PENDING/PROCESSING)
- ReturnRequestButton (if order is DELIVERED)
- PaymentInfo (payment method, transaction ID)
- ActionButtons (track shipment, download invoice, contact support)

Data Structure Needed:
- Fetch from: GET /api/orders/:orderId
- Display complete order details with items, addresses, payment
```

**Dependencies:**
- Backend must return full order details with items
- Verify GET /api/orders/:orderId exists and works

---

#### Task 1.2: Implement Return Request System
**Files:** 
- Backend: `backend/src/controllers/order.controller.ts` (add returnOrder function)
- Backend: `backend/src/routes/order.routes.ts` (add POST /returns route)
- Frontend: `frontend/src/app/account/orders/[id]/returns/page.tsx` (NEW)
- Frontend: `frontend/src/components/orders/ReturnForm.tsx` (NEW)

**Status:** ❌ NOT IMPLEMENTED  
**Blocking:** Customer returns, refunds  
**Effort:** 3-4 hours

**What needs to be built:**

Backend:
```typescript
// POST /api/orders/:orderId/return
export const requestReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Validate order exists and user owns it
  // 2. Check order is DELIVERED status
  // 3. Create Return record with status REQUESTED
  // 4. Send email to customer + admin
  // 5. Return success response
});

// GET /api/returns/:orderId (get return status)
// POST /api/returns/:orderId/approve (ADMIN only - approve return)
// POST /api/returns/:orderId/reject (ADMIN only - reject return)
```

Frontend:
```
Components:
- ReturnForm (reason selection, description, images)
- ReturnStatus (showing return request status)
- ReturnTimeline (requested → approved → refunded)
```

---

#### Task 1.3: Implement Refund Processing
**File:** `backend/src/controllers/payment.controller.ts`  
**Function:** `initiateRefund()`  
**Status:** ❌ MISSING  
**Blocking:** Return fulfillment  
**Effort:** 2-3 hours

**Implementation:**
```typescript
export const initiateRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { returnId } = req.body;
  
  // 1. Check user is ADMIN
  // 2. Fetch return + associated order + payment
  // 3. Call Razorpay refunds API
  // 4. Update Payment.status = REFUNDED
  // 5. Update Return.status = REFUNDED
  // 6. Restore inventory (restock)
  // 7. Send email to customer
  // 8. Return success response
});
```

**Dependencies:**
- Razorpay refund API key (already have)
- Return system must exist first (Task 1.2)

---

#### Task 1.4: Setup Webhook Testing with Ngrok
**Files:** None (setup task)  
**Status:** ❌ NOT STARTED  
**Blocking:** Payment testing  
**Effort:** 1-2 hours

**Steps:**
1. Download ngrok from https://ngrok.com (free account)
2. Run: `ngrok http 3000` (assuming backend on port 3000)
3. Copy public URL: `https://xxxx-xxxx-xxxx.ngrok.io`
4. Go to Razorpay Dashboard → Settings → Webhooks
5. Add webhook:
   - URL: `https://xxxx.ngrok.io/api/payments/webhook`
   - Events: payment.authorized, payment.failed, refund.created
   - Secret: Your WEBHOOK_SECRET from .env
6. Test webhook by making test payment

---

### 🟠 PHASE 2: HIGH PRIORITY (Complete This Week)

#### Task 2.1: Verify Product Pages Integration
**Files:** 
- `frontend/src/app/products/page.tsx` (PLP)
- `frontend/src/app/products/[slug]/page.tsx` (PDP)

**Status:** ⚠️ PARTIAL  
**Blocking:** Product browsing  
**Effort:** 1-2 hours

**Testing Checklist:**
- [ ] Navigate to /products → see product list
- [ ] Filter by price (low to high)
- [ ] Filter by category
- [ ] Search for product
- [ ] Sort by newest/popular
- [ ] Click product → see details
- [ ] See product reviews
- [ ] Add to cart/wishlist
- [ ] Check stock status
- [ ] Verify images load

---

#### Task 2.2: Complete Account Pages
**Files:** 
- `frontend/src/app/account/profile/page.tsx` (NEW)
- `frontend/src/app/account/addresses/page.tsx` (FIX)

**Status:** ⚠️ PARTIAL  
**Blocking:** Account management  
**Effort:** 2-3 hours

**What needs to be built:**
1. Profile Page:
   - Edit name, email, phone
   - Change password
   - Delete account option
   - Save/cancel buttons

2. Addresses Page:
   - List addresses
   - Add new address (modal form)
   - Edit existing address
   - Delete address
   - Set as default

---

#### Task 2.3: Implement Coupon System
**Files:**
- Backend: `backend/src/controllers/coupon.controller.ts` (NEW)
- Backend: `backend/src/routes/coupon.routes.ts` (NEW)
- Frontend: `frontend/src/app/checkout/CouponForm.tsx` (NEW)

**Status:** ❌ NOT IMPLEMENTED  
**Blocking:** Marketing/discounts  
**Effort:** 2-3 hours

**Backend Logic:**
```typescript
// GET /api/coupons/:code/validate
// - Check coupon exists and is valid
// - Check expiry date
// - Check min order amount
// - Check if already used by user
// - Return discount amount

// Backend should calculate discount in checkout:
// - Apply coupon discount to order total
// - Update Payment amount
// - Save coupon usage
```

---

#### Task 2.4: Setup Email System
**Files:** Multiple notification endpoints  
**Status:** ❌ STUBBED  
**Blocking:** Customer communication  
**Effort:** 2-3 hours

**Setup:**
1. Create SendGrid account (sendgrid.com)
2. Get API key, add to .env: `SENDGRID_API_KEY=sk_...`
3. Create email templates for:
   - Order confirmation
   - Payment successful
   - Order shipped
   - Order delivered
   - Return approved
   - Refund processed
   - Password reset
4. Replace all console.log("Email sent") with actual SendGrid calls

---

### 🟡 PHASE 3: MEDIUM PRIORITY (Next Week)

#### Task 3.1: Admin Dashboard Features
- [ ] Product CRUD (Create, Read, Update, Delete)
- [ ] Inventory management (stock adjustment)
- [ ] Order management (update status, ship, deliver)
- [ ] Return approval workflow
- [ ] Refund processing
- [ ] Sales reports
- [ ] Inventory reports

---

#### Task 3.2: Full Integration Testing
- [ ] Auth flows
- [ ] Payment flow (with webhook)
- [ ] Order creation → delivery
- [ ] Returns → refunds
- [ ] Admin operations
- [ ] Error handling
- [ ] Mobile responsiveness

---

## 📊 WEEK SCHEDULE

### Monday & Tuesday
- [ ] Create Order Details Page (Task 1.1)
- [ ] Verify Product Pages (Task 2.1)
- [ ] Start Return System (Task 1.2)

### Wednesday & Thursday
- [ ] Complete Return System (Task 1.2)
- [ ] Implement Refund Processing (Task 1.3)
- [ ] Setup Account Pages (Task 2.2)

### Friday
- [ ] Setup Ngrok & Webhook Testing (Task 1.4)
- [ ] Test Payment Flow End-to-End
- [ ] Buffer/Debugging

---

## 🔧 IMPLEMENTATION TIPS

### For Order Details Page:
1. Check the order store in Zustand to see what data structure is available
2. Use the same card styling as used in account page
3. Add timeline component for order status progression
4. Make cancel/return buttons conditional on order status

### For Return System:
1. Update Prisma schema if Return model fields are missing
2. Create migration: `npm run prisma:migrate`
3. Add return validation (order must be DELIVERED, within 30 days)
4. Store return reason and images for admin review

### For Refund Processing:
1. Use Razorpay SDK's refunds.create() method
2. Handle both partial and full refunds
3. Update inventory when refund is processed
4. Send email confirmation to customer

### For Webhook Testing:
1. Keep ngrok terminal open while testing
2. Monitor backend logs for webhook receipt
3. Check database for payment status updates
4. Use Razorpay test card: 4111 1111 1111 1111 (any expiry, any CVV)

---

## ✅ VERIFICATION AFTER EACH TASK

**Order Details Page:**
- [ ] Page loads with correct order
- [ ] All order details display
- [ ] Cancel button works (for PENDING orders)
- [ ] Return button visible (for DELIVERED orders)

**Return System:**
- [ ] Return form submits successfully
- [ ] Return status shows in order details
- [ ] Admin can approve/reject returns
- [ ] Refund processes after approval

**Refund Processing:**
- [ ] Razorpay refund created successfully
- [ ] Inventory restored
- [ ] Customer email sent
- [ ] Payment status updated to REFUNDED

**Webhook Testing:**
- [ ] Ngrok URL in Razorpay dashboard
- [ ] Webhook events logged
- [ ] Signature verification succeeds
- [ ] Order/Payment status updated correctly

---

## 📝 NOTES FOR DEVELOPER

**Important Files to Check:**
- `prisma/schema.prisma` — Verify all models have required fields
- `backend/src/routes/` — Check all route definitions exist
- `frontend/src/store/` — Verify store structure matches what you use
- `frontend/src/lib/api.ts` — Verify API base URL and interceptors

**Environment Variables Needed:**
```
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
WEBHOOK_SECRET=some-random-secure-string
SENDGRID_API_KEY=SG.xxxxx (when ready)
```

**Testing Cards (Razorpay Test Mode):**
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002
- CVV: Any 3-4 digits
- Expiry: Any future date

**Common Issues to Watch For:**
1. Cart not clearing after payment — Check verifyPayment() in controller
2. Order not updating after webhook — Check webhook signature verification
3. Inventory not releasing on cancel — Check releaseInventoryLocks()
4. Email not sending — Check SENDGRID_API_KEY in .env
5. Images not loading — Check image URLs in database

---

**Generated:** January 15, 2026  
**Status:** Ready for Implementation  
**Estimated Completion:** January 22, 2026
