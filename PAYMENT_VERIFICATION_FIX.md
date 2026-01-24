# Payment Verification Fix - Complete Guide

## Problem Statement

After Razorpay payment completion:
- ❌ POST `/api/payments/verify` returns 500 Internal Server Error
- ❌ Order stays PENDING
- ❌ Cart not cleared
- ❌ Inventory not updated
- ❌ Success page shows error

## Root Causes Identified

### 1. **Status Field Confusion**
**Issue:** The code was updating `Order.status` to "CONFIRMED" but the Order schema has TWO status fields:
- `Order.status` (OrderStatus): PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- `Order.paymentStatus` (PaymentStatus): PENDING → VERIFIED → CONFIRMED → FAILED → REFUNDED

**The Fix:** 
- `verifyPayment` should NOT update ANY status fields
- `webhook` should update BOTH:
  - `Order.paymentStatus` → CONFIRMED
  - Payment.status → CONFIRMED
- Frontend polls `Order.paymentStatus`, not `Order.status`

### 2. **Incorrect Signature Verification**
**Issue:** Signature body was `payment.transactionId|razorpayPaymentId` but should be `razorpayOrderId|razorpayPaymentId`

**The Fix:**
```typescript
// WRONG:
const body = `${payment.transactionId}|${razorpayPaymentId}`;

// CORRECT:
const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`;
```

### 3. **Missing Transaction Atomicity**
**Issue:** Webhook could fail mid-operation, leaving inconsistent state

**The Fix:** Wrapped all operations in `prisma.$transaction()`

### 4. **Non-Idempotent Operations**
**Issue:** If webhook ran twice, inventory could be deducted twice, notifications sent twice

**The Fix:** 
- Check if `Payment.status === 'CONFIRMED'` before processing
- Return 200 immediately on idempotent calls

---

## Changes Made

### File 1: `backend/src/controllers/payment.controller.ts`

#### Changed Function: `verifyPayment`

**Key Changes:**
1. Added `razorpayOrderId` to required fields
2. Changed signature verification from `payment.transactionId|razorpayPaymentId` to `razorpayOrderId|razorpayPaymentId`
3. Removed all status updates - just return success on valid signature
4. Frontend will poll status endpoint to wait for webhook

```typescript
// Verify Razorpay signature: SHA256(orderId|paymentId) = signature
const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`;
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
  .update(signatureBody)
  .digest('hex');

if (expectedSignature !== razorpaySignature) {
  throw new AppError('Payment signature verification failed', 400);
}

// Just return success - webhook will update statuses
res.json({
  success: true,
  message: 'Payment signature verified successfully.',
  paymentStatus: payment.status,
  note: 'Waiting for webhook confirmation. Poll status endpoint to track progress.',
});
```

#### Changed Function: `webhook`

**Key Changes:**
1. Proper raw body handling with validation
2. Signature verification with correct error handling
3. Idempotency check: return 200 if already CONFIRMED
4. Amount validation with paise conversion
5. Atomic transaction with all steps:
   - Update `Payment.status` → CONFIRMED
   - Update `Order.paymentStatus` → CONFIRMED (not Order.status!)
   - Deduct inventory via `confirmInventoryDeduction()`
   - Clear cart
   - Create notification
6. Always return 200 for valid Razorpay signature (even if internal error)

```typescript
// IDEMPOTENCY: If payment already confirmed, return success
if (payment.status === 'CONFIRMED') {
  console.log('[Webhook] Payment already CONFIRMED, returning 200');
  return res.json({ received: true });
}

// Atomic transaction
await prisma.$transaction(async (tx) => {
  // Step 1: Update Payment.status
  await tx.payment.update({
    where: { id: payment.id },
    data: { status: 'CONFIRMED', ... },
  });

  // Step 2: Update Order.paymentStatus (NOT Order.status!)
  await tx.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'CONFIRMED',
      paymentMethod: 'RAZORPAY',
    },
  });

  // Step 3: Deduct inventory
  await confirmInventoryDeduction(order.id);

  // Step 4: Clear cart
  await tx.cartItem.deleteMany({
    where: { userId: order.userId },
  });

  // Step 5: Notify user
  await tx.notification.create({ ... });
});
```

#### Changed Function: `getPaymentStatus`

**Key Changes:**
1. Returns both `Payment.status` and `Order.paymentStatus`
2. `isConfirmed` only true when BOTH are CONFIRMED
3. Includes helpful `message` field

```typescript
const isPaymentConfirmed = payment.status === 'CONFIRMED';
const isOrderPaymentConfirmed = order.paymentStatus === 'CONFIRMED';

res.json({
  success: true,
  paymentStatus: payment.status,
  orderPaymentStatus: order.paymentStatus,
  isConfirmed: isPaymentConfirmed && isOrderPaymentConfirmed,
  isFailed: payment.status === 'FAILED' || order.paymentStatus === 'FAILED',
  message: isPaymentConfirmed && isOrderPaymentConfirmed 
    ? 'Payment confirmed! Order will be processed.'
    : 'Waiting for webhook confirmation...',
});
```

### File 2: `frontend/src/app/checkout/success/page.tsx`

**Key Changes:**
1. Updated interface to match new response structure
2. Changed polling logic to check both statuses
3. Handles failed payments

```typescript
interface PaymentStatus {
  paymentStatus: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  orderPaymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  isConfirmed: boolean;
  isFailed: boolean;
  message: string;
}

// Poll logic
if (status.isConfirmed && !status.isFailed) {
  // Payment successful
  setShowConfetti(true);
  clearInterval(pollInterval);
} else if (status.isFailed) {
  // Payment failed
  setError('Payment failed. Please try again or contact support.');
  clearInterval(pollInterval);
}
```

### File 3: `backend/src/routes/payment.routes.ts`

**Status:** ✅ No changes needed - already correct

Routes are properly configured:
```typescript
router.post('/create', protect, createPayment);      // Protected ✓
router.post('/verify', protect, verifyPayment);      // Protected ✓
router.get('/:orderId/status', protect, getPaymentStatus); // Protected ✓
router.post('/webhook', webhook);                    // Public (no auth) ✓
```

### File 4: `backend/src/middleware/rawBody.ts`

**Status:** ✅ No changes needed - already correct

Webhook signature verification requires raw body. Middleware correctly:
1. Captures raw body for `/api/payments/webhook` only
2. Makes it available as `req.rawBody`

---

## Data Flow After Fix

### 1. Payment Creation
```
User clicks "Continue to Payment"
↓
POST /api/payments/create (authenticated)
↓
Backend creates Order (status=PENDING) with InventoryLock
Backend creates Payment (status=PENDING, transactionId=razorpayOrderId)
↓
Returns razorpayOrderId and Razorpay key
↓
Frontend opens Razorpay modal
```

### 2. User Completes Payment in Razorpay
```
User fills payment details and completes payment
↓
Razorpay captures payment
↓
Razorpay sends webhook to /api/payments/webhook
```

### 3. Frontend Signature Verification (Optional)
```
Razorpay modal calls frontend handler with payment details
↓
Frontend POST /api/payments/verify (authenticated)
  - Verifies signature: SHA256(razorpayOrderId|razorpayPaymentId)
  - Returns 200 if valid
  - Does NOT update any status
↓
Frontend redirects to /checkout/success?orderId={id}
```

### 4. Success Page Polling
```
Success page POLLs /api/payments/{orderId}/status every 5 seconds
↓
Backend returns:
  - paymentStatus: PENDING (initially)
  - orderPaymentStatus: PENDING (initially)
  - isConfirmed: false
  - message: "Waiting for webhook confirmation..."
↓
[WAIT FOR WEBHOOK]
↓
Backend returns:
  - paymentStatus: CONFIRMED ✓
  - orderPaymentStatus: CONFIRMED ✓
  - isConfirmed: true ✓
  - message: "Payment confirmed! Order will be processed."
↓
Success page shows confirmation (confetti, order details)
```

### 5. Webhook Processing (Server Side)
```
Razorpay sends payment.captured event
↓
Backend /api/payments/webhook:
  1. Validates signature with raw body
  2. Checks if Payment already CONFIRMED (idempotency)
  3. Validates amount matches order
  4. IN TRANSACTION:
     - Update Payment.status → CONFIRMED
     - Update Order.paymentStatus → CONFIRMED
     - Deduct inventory (via confirmInventoryDeduction)
     - Delete InventoryLocks
     - Clear CartItems
     - Create Notification
  5. Returns 200
↓
Frontend polling detects status change
↓
Success page shows confirmed
↓
Cart is cleared automatically next refresh
```

---

## Testing Checklist

### 1. Signature Verification
- [ ] Correct signature format: `razorpayOrderId|razorpayPaymentId`
- [ ] Correct HMAC-SHA256 with Razorpay key secret
- [ ] Signature verification rejects invalid signatures
- [ ] Frontend receives 200 on valid signature

### 2. Payment Status Progression
- [ ] Initial: `paymentStatus: PENDING`, `orderPaymentStatus: PENDING`
- [ ] After verify: Still PENDING (no status change)
- [ ] After webhook: Both become CONFIRMED

### 3. Idempotency
- [ ] Calling webhook twice doesn't duplicate inventory deduction
- [ ] Calling webhook twice doesn't duplicate cart clearing
- [ ] Calling webhook twice doesn't duplicate notifications
- [ ] Returns 200 both times

### 4. Inventory Management
- [ ] InventoryLock created during order creation
- [ ] InventoryLock deleted after webhook confirms
- [ ] Product.stockQuantity decremented correctly
- [ ] No double-decrementing on webhook retry

### 5. Cart Clearing
- [ ] Cart items NOT cleared on /verify endpoint
- [ ] Cart items ARE cleared by webhook only
- [ ] User's entire cart cleared, not just this order's items

### 6. Atomicity
- [ ] If any step fails in webhook transaction, all rollback
- [ ] No partial state (e.g., Payment confirmed but inventory not deducted)

### 7. Error Handling
- [ ] Webhook returns 200 for any valid Razorpay signature
- [ ] Internal errors logged but don't prevent 200 response
- [ ] Missing payment record returns 200 (acknowledged)
- [ ] Amount mismatch returns 200 but doesn't process (security)

---

## Deployment Steps

### 1. Backup Current Database
```bash
docker-compose exec postgres pg_dump -U ora_user ora_db > backup_$(date +%s).sql
```

### 2. Code Changes
```bash
# Copy the fixed controller file
cp backend/src/controllers/payment.controller.ts backend/src/controllers/payment.controller.ts.backup

# Apply fixes from PAYMENT_VERIFICATION_FIX.md
# ... (apply the controller changes)
```

### 3. Rebuild and Restart
```bash
cd c:\Users\selvi\Downloads\orashop.in\oranew

# Stop services
docker-compose down

# Rebuild backend
docker-compose build backend

# Start all services
docker-compose up -d

# Verify logs
docker-compose logs -f backend
```

### 4. Manual Testing
```bash
# 1. Create test user account
# 2. Add products to cart
# 3. Go to checkout
# 4. Enter address
# 5. Click "Continue to Payment"
# 6. In Razorpay modal, click "Pay" (test card: 4111 1111 1111 1111)
# 7. After payment succeeds, verify signature
# 8. Success page should show "Waiting for webhook confirmation..."
# 9. Wait 2-5 seconds for webhook to arrive
# 10. Success page should show "Payment confirmed!"
# 11. Verify cart is cleared (refresh and check)
# 12. Verify order in database has paymentStatus: CONFIRMED
```

---

## Troubleshooting

### Problem: Webhook not arriving
**Solution:**
1. Check Razorpay dashboard → Webhooks → Delivery
2. Check Docker logs: `docker-compose logs backend | grep Webhook`
3. Verify webhook URL configured in Razorpay matches your backend URL
4. Ensure `/api/payments/webhook` can receive POST from Razorpay IP whitelist

### Problem: Signature verification fails
**Solution:**
1. Verify Razorpay key secret is correct in `.env`
2. Check signature format: `razorpayOrderId|razorpayPaymentId`
3. Ensure raw body is being used (not parsed JSON)
4. Verify middleware is capturing raw body correctly

### Problem: 500 error on /verify endpoint
**Solution:**
1. Check backend logs: `docker-compose logs backend | grep Verify`
2. Verify all required fields in request body: orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature
3. Verify order exists and user owns it

### Problem: Payment confirmed but inventory not deducted
**Solution:**
1. Check webhook logs: `docker-compose logs backend | grep Webhook`
2. Verify `confirmInventoryDeduction` helper executed (should see log: "Inventory deducted")
3. Check database: `SELECT * FROM inventory_locks WHERE order_id = '{orderId}';`
4. Check product stock: `SELECT stock_quantity FROM products WHERE id = '{productId}';`

### Problem: Cart not cleared
**Solution:**
1. Check webhook logs for "Cart cleared" message
2. Verify cart items exist before webhook: `SELECT * FROM cart_items WHERE user_id = '{userId}';`
3. Check if webhook actually ran (look for "CONFIRMED" in Payment record)

---

## Important Notes

### ⚠️ Critical Security Points
1. **Verify webhook signature with raw body**, not parsed JSON
2. **Validate amount matches** order total (in paise)
3. **Never trust frontend** for order confirmation
4. **Use transactions** to ensure atomicity
5. **Check order ownership** in verify endpoint

### ✅ Best Practices Applied
1. **Idempotent operations** - safe to call webhook multiple times
2. **Status field clarity** - `Order.paymentStatus` for payment, `Order.status` for fulfillment
3. **Atomic database updates** - all-or-nothing via transaction
4. **Proper error handling** - 200 for signature validation, 4xx for other issues
5. **Comprehensive logging** - debug any issues easily

### 📊 Status Field Mapping
| Field | Values | Meaning |
|-------|--------|---------|
| `Payment.status` | PENDING, VERIFIED, CONFIRMED, FAILED, REFUNDED | Payment gateway state |
| `Order.paymentStatus` | PENDING, CONFIRMED, FAILED, REFUNDED | Payment collected? |
| `Order.status` | PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED | Fulfillment state |

---

## Success Criteria

After applying these fixes:

✅ POST `/api/payments/verify` returns 200 with valid signature  
✅ Webhook receives `payment.captured` event from Razorpay  
✅ Webhook updates `Payment.status` → CONFIRMED  
✅ Webhook updates `Order.paymentStatus` → CONFIRMED  
✅ Webhook deducts inventory atomically  
✅ Webhook clears user's cart  
✅ Webhook creates notification  
✅ Frontend success page polls status correctly  
✅ Frontend shows "Payment confirmed!" when webhook completes  
✅ No 500 errors  
✅ No inventory duplication  
✅ No cart clearing duplicates  

---

## Files Modified

1. ✅ `backend/src/controllers/payment.controller.ts`
   - `verifyPayment()` - Fixed signature verification
   - `webhook()` - Fixed status updates and atomicity
   - `getPaymentStatus()` - Fixed response structure

2. ✅ `frontend/src/app/checkout/success/page.tsx`
   - Updated interface for new response
   - Fixed polling logic for both status fields

3. ✅ `backend/src/routes/payment.routes.ts`
   - Already correct, no changes needed

4. ✅ `backend/src/middleware/rawBody.ts`
   - Already correct, no changes needed

---

## Next Steps

1. Review all changes in this file
2. Apply changes to your codebase
3. Rebuild and restart services
4. Run manual testing checklist
5. Monitor webhook delivery in Razorpay dashboard
6. Check logs: `docker-compose logs -f backend | grep -E "(Payment|Webhook|Verify)"`
7. Verify cart is cleared after payment
8. Confirm inventory is deducted correctly
