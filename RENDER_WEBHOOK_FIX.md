# 🚨 CRITICAL FIX: Webhook Order Status Update on Render

## Problem Identified

On Render, when payment webhook arrives:
- ✅ Payment Status: CONFIRMED (webhook signature verified successfully)
- ❌ Order Status: PENDING (should be CONFIRMED)
- ❌ Cart: NOT cleared
- ❌ Inventory: NOT deducted

## Root Cause

**The `verifyPayment` endpoint was incorrectly updating the payment to `CONFIRMED`.**

This caused the webhook to skip processing because:
1. Frontend calls `POST /api/payments/verify` → Payment marked as CONFIRMED
2. Razorpay webhook arrives → Checks if `payment.status === 'CONFIRMED'`
3. Returns early with idempotency message → **Order never updated**

## Solution Implemented

### Changed File: `backend/src/controllers/payment.controller.ts`

**Lines 301-375: `verifyPayment()` endpoint**

```typescript
// BEFORE: Incorrectly updated payment to CONFIRMED
const result = await prisma.$transaction(async (tx) => {
  await tx.payment.update({
    data: { status: 'CONFIRMED' },  // ❌ WRONG
  });
  await tx.order.update({
    data: { status: 'CONFIRMED' },  // ❌ WRONG
  });
  // ... inventory deduction, cart clearing, etc.
});

// AFTER: Only marks as VERIFIED, waits for webhook
const updatedPayment = await prisma.payment.update({
  data: { status: 'VERIFIED' }  // ✅ CORRECT
});

return res.json({
  success: true,
  message: 'Signature verified. Awaiting webhook confirmation.',
  orderStatus: order.status,
  paymentStatus: updatedPayment.status,
});
```

## Payment Flow (Corrected)

```
T=0s:  POST /api/payments/create
       Order.status = PENDING
       Order.paymentStatus = PENDING
       Payment.status = PENDING

T=5s:  User pays via Razorpay
       (No database changes yet)

T=10s: POST /api/payments/verify (Frontend)
       ✅ Verifies signature
       ✅ Updates Payment.status = VERIFIED only
       ❌ Does NOT update Order status
       ❌ Does NOT clear cart

T=20s: Razorpay webhook arrives → POST /api/payments/webhook
       ✅ Verifies signature using raw body
       ✅ Updates Payment.status = CONFIRMED
       ✅ Updates Order.status = CONFIRMED ← **THIS WAS SKIPPED BEFORE**
       ✅ Deducts inventory ← **THIS WAS SKIPPED BEFORE**
       ✅ Clears user cart ← **THIS WAS SKIPPED BEFORE**

T=25s: GET /api/payments/:orderId/status
       ✅ Returns Order.status = CONFIRMED
       ✅ Frontend shows success page
```

## How to Deploy

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. No Database Changes Required
The Prisma schema already has `PaymentStatus: PENDING | VERIFIED | CONFIRMED | FAILED | REFUNDED`

### 3. Redeploy Backend on Render
```bash
# Push to trigger Render deployment
git add backend/src/controllers/payment.controller.ts
git commit -m "Fix: verifyPayment should only mark VERIFIED, not CONFIRMED"
git push origin main
```

### 4. Verify Environment Variables on Render

**Critical: These MUST be set in Render dashboard:**

```
RAZORPAY_KEY_ID=rzp_live_XXXXX
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx  ← This is CRITICAL
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...  (if using pooling)
```

### 5. Test on Production

**Test Flow:**
1. Go to ORA site on Render
2. Add item to cart
3. Checkout → Create order
4. Proceed to payment
5. Complete payment in Razorpay
6. Should see "Processing Payment..." screen
7. After 5-30 seconds: Should see "Thank You!" (success page)

**Check Database (via Render Postgres console):**
```sql
-- Find latest order
SELECT id, order_number, status, "paymentStatus" FROM orders 
ORDER BY created_at DESC LIMIT 1;

-- Should see:
-- status = CONFIRMED ✅
-- paymentStatus = CONFIRMED ✅
```

```sql
-- Check cart is cleared
SELECT COUNT(*) FROM cart_items WHERE user_id = 'USER_ID';
-- Should see: 0 ✅
```

## What Each Endpoint Does Now

### `POST /api/payments/create`
- ✅ Creates Razorpay order
- ✅ Validates user owns order
- ✅ Prevents duplicate payments
- ✅ Returns razorpayOrderId to frontend

### `POST /api/payments/verify`
- ✅ Verifies Razorpay signature (from frontend)
- ✅ **Marks Payment status = VERIFIED** (NOT CONFIRMED)
- ❌ Does NOT update order status
- ❌ Does NOT clear cart
- ✅ Returns success to frontend (tells it to wait for webhook)

### `POST /api/payments/webhook` (Called by Razorpay)
- ✅ Receives webhook from Razorpay (x-razorpay-signature header)
- ✅ Verifies signature using raw body + RAZORPAY_WEBHOOK_SECRET
- ✅ **Marks Payment status = CONFIRMED**
- ✅ **Updates Order status = CONFIRMED** ← **KEY FIX**
- ✅ Deducts inventory for each item
- ✅ Clears user's cart ← **KEY FIX**
- ✅ Deletes inventory locks
- ✅ Returns 200 OK to Razorpay

### `GET /api/payments/:orderId/status`
- ✅ Frontend polls this every 5 seconds
- ✅ Returns current order and payment status
- ✅ Frontend shows success when status = CONFIRMED

## Idempotency

The webhook is fully idempotent:
- If webhook arrives twice → Checks if `payment.status === 'CONFIRMED'`
- Returns success without reprocessing
- No double inventory deduction ✅
- No issues with duplicate executions ✅

## Verification Checklist

- [ ] Backend built successfully (no TypeScript errors)
- [ ] Pushed to git
- [ ] Render deployment completed
- [ ] Environment variables are set on Render
- [ ] Test payment flow locally first (`npm run dev`)
- [ ] Test payment flow on Render (production)
- [ ] Check database: Order status = CONFIRMED
- [ ] Check database: Cart is cleared
- [ ] Check database: Inventory is deducted

## Questions?

If webhook still isn't being called on Render:
1. Check Render backend logs for "[Webhook]" messages
2. Verify `RAZORPAY_WEBHOOK_SECRET` is set exactly as in Razorpay dashboard
3. Check webhook URL in Razorpay dashboard: `https://your-render-url.com/api/payments/webhook`
4. Test webhook URL with: `curl -X POST https://your-render-url.com/api/payments/webhook`

---

**Status:** ✅ FIXED and ready for deployment
