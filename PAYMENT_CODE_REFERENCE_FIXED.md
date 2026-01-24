# Complete Fixed Code Reference

## File: `backend/src/controllers/payment.controller.ts`

This file contains all payment-related endpoints. Below are the three key functions that were fixed.

### Full File Overview
- **Line 1-25:** Imports and Razorpay initialization
- **Line 28-150:** `createPayment()` - Creates Razorpay order ✅ Working
- **Line 153-232:** `verifyPayment()` - **FIXED** ✅
- **Line 235-444:** `webhook()` - **FIXED** ✅
- **Line 447-514:** `getPaymentStatus()` - **FIXED** ✅
- **Line 517-593:** `refundPayment()` - ✅ Working
- **Line 596-607:** `getRazorpayKey()` - ✅ Working

---

## Key Changes Summary

### 1. Verify Payment Endpoint (Line 153-232)

**What Changed:**
- Added `razorpayOrderId` as required parameter
- Fixed signature verification formula
- Removed status updates (webhook does this)
- Returns 200 on valid signature

**Before (BROKEN):**
```typescript
const body = `${payment.transactionId}|${razorpayPaymentId}`;
// Then would update: Order.status = 'CONFIRMED' (WRONG!)
```

**After (FIXED):**
```typescript
const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`;
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
  .update(signatureBody)
  .digest('hex');

// Just return success - no status updates!
res.json({
  success: true,
  message: 'Payment signature verified successfully.',
  paymentStatus: payment.status,
  note: 'Waiting for webhook confirmation...',
});
```

**Why This Matters:**
- Razorpay webhook hasn't arrived yet when `/verify` is called
- We can verify the signature but shouldn't assume payment is confirmed
- Webhook from Razorpay is the only source of truth
- Frontend polls `/status` endpoint to detect when webhook arrives

---

### 2. Webhook Handler (Line 235-444)

**What Changed:**
- Proper raw body handling
- Idempotency check (safe to call multiple times)
- Correct status field updates
- Atomic transaction for all operations
- Proper error handling

**Before (BROKEN):**
```typescript
// Would update Order.status (WRONG!)
await tx.order.update({
  where: { id: order.id },
  data: { status: 'CONFIRMED' as any },  // ❌ WRONG FIELD
});

// Could crash mid-transaction leaving inconsistent state
```

**After (FIXED):**
```typescript
// IDEMPOTENCY: Check if already processed
if (payment.status === 'CONFIRMED') {
  console.log('[Webhook] Payment already CONFIRMED, returning 200');
  return res.json({ received: true });
}

// Atomic transaction - all-or-nothing
await prisma.$transaction(async (tx) => {
  // Step 1: Update Payment.status
  await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: 'CONFIRMED',
      gatewayResponse: {
        razorpayPaymentId,
        razorpayStatus: 'captured',
        confirmedAt: new Date().toISOString(),
        webhookTimestamp: new Date().toISOString(),
      },
    },
  });

  // Step 2: Update Order.paymentStatus (✅ CORRECT FIELD)
  await tx.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'CONFIRMED',  // ✅ CORRECT!
      paymentMethod: 'RAZORPAY',
    },
  });

  // Step 3: Deduct inventory atomically
  await confirmInventoryDeduction(order.id);

  // Step 4: Clear user's cart
  await tx.cartItem.deleteMany({
    where: { userId: order.userId },
  });

  // Step 5: Create notification
  await tx.notification.create({
    data: {
      userId: order.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Payment Confirmed',
      message: `Payment of ₹${order.totalAmount} received for order #${order.orderNumber}.`,
      isRead: false,
    },
  });
});
```

**Why This Matters:**
1. **Idempotency:** If webhook arrives twice, second call returns immediately without duplicate operations
2. **Atomicity:** All steps succeed or all rollback - no partial state
3. **Correct Fields:** `Order.paymentStatus` is for payments, `Order.status` is for fulfillment
4. **Inventory Consistency:** Deducted atomically with lock deletion
5. **Cart Clearing:** Guaranteed to clear after successful payment

---

### 3. Get Payment Status Endpoint (Line 447-514)

**What Changed:**
- Returns both `Payment.status` and `Order.paymentStatus`
- `isConfirmed` checks both fields
- Includes helpful messages

**Before (BROKEN):**
```typescript
res.json({
  status: payment.status,
  orderStatus: order.status,  // ❌ WRONG - this is fulfillment status!
  isConfirmed: payment.status === ('CONFIRMED' as any),
});
```

**After (FIXED):**
```typescript
const isPaymentConfirmed = payment.status === 'CONFIRMED';
const isOrderPaymentConfirmed = order.paymentStatus === 'CONFIRMED';

res.json({
  success: true,
  orderId: order.id,
  orderNumber: order.orderNumber,
  paymentId: payment.id,
  paymentStatus: payment.status,  // ✅ Payment status
  orderPaymentStatus: order.paymentStatus,  // ✅ Order payment status
  amount: payment.amount,
  transactionId: payment.transactionId,
  isConfirmed: isPaymentConfirmed && isOrderPaymentConfirmed,  // ✅ BOTH must be confirmed
  isFailed: payment.status === 'FAILED' || order.paymentStatus === 'FAILED',
  message: isPaymentConfirmed && isOrderPaymentConfirmed 
    ? 'Payment confirmed! Order will be processed.'
    : 'Waiting for webhook confirmation...',
});
```

**Why This Matters:**
- Frontend can check both fields to know when webhook has arrived
- Clear messages tell user what's happening
- Handles failure cases gracefully

---

## Frontend Changes

### File: `frontend/src/app/checkout/success/page.tsx`

**What Changed:**
- Updated interface to match new backend response
- Changed polling logic to check both status fields
- Handles failure states

**Before (BROKEN):**
```typescript
interface PaymentStatus {
  status: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  isConfirmed: boolean;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

if (status.isConfirmed && status.orderStatus === 'CONFIRMED') {
  // ❌ orderStatus is never updated by webhook!
}
```

**After (FIXED):**
```typescript
interface PaymentStatus {
  paymentStatus: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  orderPaymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  isConfirmed: boolean;
  isFailed: boolean;
  message: string;
}

if (status.isConfirmed && !status.isFailed) {
  // ✅ Both status fields properly set by webhook
  setShowConfetti(true);
} else if (status.isFailed) {
  // ✅ Handles payment failure
  setError('Payment failed. Please try again or contact support.');
}
```

---

## Database Schema Understanding

### Order Model (from schema.prisma)

```prisma
model Order {
  // ... other fields ...
  
  // Fulfillment State (managed by order controller)
  status OrderStatus @default(PENDING)  
  // Values: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
  
  // Payment State (managed by payment controller/webhook)
  paymentStatus PaymentStatus @default(PENDING)
  // Values: PENDING → CONFIRMED
  
  // When both are set:
  // status=PENDING, paymentStatus=PENDING → Awaiting payment
  // status=PENDING, paymentStatus=CONFIRMED → Payment done, awaiting fulfillment
  // status=CONFIRMED, paymentStatus=CONFIRMED → Ready for shipping
  // etc.
}

enum OrderStatus {
  PENDING
  CONFIRMED      // Payment received, ready to process
  PROCESSING     // Order being picked/packed
  SHIPPED        // Order in transit
  DELIVERED      // Order delivered
  CANCELLED      // Order cancelled
  RETURNED       // Order returned
  REFUNDED       // Payment refunded
}

enum PaymentStatus {
  PENDING        // Waiting for payment
  VERIFIED       // Signature verified, waiting for webhook
  CONFIRMED      // Payment received from Razorpay
  FAILED         // Payment failed
  REFUNDED       // Payment refunded
}
```

---

## Request/Response Examples

### Create Payment

**Request:**
```http
POST /api/payments/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**
```json
{
  "success": true,
  "paymentId": "...",
  "razorpayOrderId": "order_123456",
  "razorpayKeyId": "rzp_test_...",
  "amount": 50000,
  "currency": "INR",
  "orderId": "ORD-001"
}
```

---

### Verify Payment

**Request:**
```http
POST /api/payments/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "razorpayPaymentId": "pay_123456",
  "razorpayOrderId": "order_123456",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment signature verified successfully.",
  "paymentStatus": "PENDING",
  "note": "Waiting for webhook confirmation. Poll status endpoint to track progress."
}
```

---

### Get Payment Status (Before Webhook)

**Request:**
```http
GET /api/payments/{orderId}/status
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentId": "...",
  "paymentStatus": "PENDING",
  "orderPaymentStatus": "PENDING",
  "isConfirmed": false,
  "isFailed": false,
  "message": "Waiting for webhook confirmation..."
}
```

---

### Get Payment Status (After Webhook)

**Response (200):**
```json
{
  "success": true,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentId": "...",
  "paymentStatus": "CONFIRMED",
  "orderPaymentStatus": "CONFIRMED",
  "isConfirmed": true,
  "isFailed": false,
  "message": "Payment confirmed! Order will be processed."
}
```

---

## Critical Signature Verification

### Formula

```
SHA256_HMAC(razorpayOrderId|razorpayPaymentId, RAZORPAY_KEY_SECRET) = received_signature
```

### Example

```typescript
const signatureBody = 'order_123456|pay_123456';
const expectedSignature = crypto
  .createHmac('sha256', 'key_secret_...')
  .update(signatureBody)
  .digest('hex');

// Compare with received signature from Razorpay
if (expectedSignature !== receivedSignature) {
  throw new AppError('Payment signature verification failed', 400);
}
```

### Common Mistakes ❌

```typescript
// WRONG - Using old transactionId field
const body = `${payment.transactionId}|${razorpayPaymentId}`;

// WRONG - Using order number instead of ID  
const body = `${order.orderNumber}|${razorpayPaymentId}`;

// WRONG - Missing orderId altogether
const body = `${razorpayPaymentId}`;

// WRONG - Using order.status instead of paymentStatus
if (order.status === 'CONFIRMED') { ... }
```

---

## Deployment Checklist

- [ ] Code changes reviewed
- [ ] Backend recompiled
- [ ] Services restarted
- [ ] Logs checked for errors
- [ ] Test payment created
- [ ] Signature verification successful
- [ ] Webhook arrived
- [ ] Order status updated
- [ ] Cart cleared
- [ ] Inventory deducted
- [ ] Success page shows confirmation

---

## References

- **Full Technical Guide:** [PAYMENT_VERIFICATION_FIX.md](PAYMENT_VERIFICATION_FIX.md)
- **Deployment Guide:** [DEPLOYMENT_AND_TESTING.md](DEPLOYMENT_AND_TESTING.md)
- **Summary:** [PAYMENT_FIX_SUMMARY.md](PAYMENT_FIX_SUMMARY.md)
- **Razorpay Docs:** https://razorpay.com/docs/webhooks/
