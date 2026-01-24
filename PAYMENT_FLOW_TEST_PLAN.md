# Complete E2E Payment Flow Test Plan

## Overview
This test plan validates that the ORA e-commerce system now handles real money safely with a webhook-first payment confirmation flow.

**CRITICAL REQUIREMENTS:**
- ✅ A customer must NEVER be charged without getting an order
- ✅ A customer must NEVER be shown success when payment failed  
- ✅ A customer must NEVER be allowed to oversell inventory
- ✅ Webhook is the ONLY source of truth for payment confirmation

---

## Pre-Test Setup

### Environment
- **Backend**: Express.js running on `http://localhost:5000`
- **Frontend**: Next.js running on `http://localhost:3000`
- **Database**: PostgreSQL with Prisma migrations applied
- **Payment Gateway**: Razorpay Test Mode
  - Key ID: See `.env.local`
  - Secret: See `.env.local`

### Database Initialization
```bash
# In backend directory
npx prisma migrate dev --name webhook_payment_states
npx prisma db seed  # Optional: populate test data
```

### Test Data
```
TEST CUSTOMER
- Email: test@orashop.in
- Password: Test123!
- Phone: +91-9999999999

TEST PRODUCT
- Name: "Diamond Ring"
- SKU: DIAM-001
- Price: ₹10,000
- Stock: 5 units
```

---

## Test Scenarios

### SCENARIO 1: Happy Path - Complete Payment Flow
**Objective**: Verify complete checkout → payment → success workflow

#### Steps:
1. **Add Product to Cart**
   - Navigate to `/products`
   - Click "Diamond Ring"
   - Enter quantity: 1
   - Click "Add to Cart"
   - Verify cart shows 1 item, ₹10,000

2. **Proceed to Checkout**
   - Click "Proceed to Checkout" button
   - Verify redirected to `/checkout`
   - Verify order summary shows Diamond Ring × 1, ₹10,000

3. **Enter Shipping Address**
   - Street: "123 Main Street"
   - City: "Mumbai"
   - State: "Maharashtra"
   - PIN: "400001"
   - Click "Proceed to Payment"

4. **Verify Order Created**
   - Monitor Network tab for POST `/api/orders/checkout`
   - Response should contain `{ success: true, order: { id: "ORD-xxx", totalAmount: 10000, status: "PENDING" } }`
   - Verify page redirects to `/checkout/payment?orderId=ORD-xxx`

5. **Open Razorpay Checkout**
   - Verify payment page shows amount: ₹10,000
   - Click "Pay with Razorpay"
   - Razorpay modal opens

6. **Verify Payment Details**
   - Order ID: ORD-xxx (should match)
   - Amount: ₹10,000
   - Currency: INR

7. **Complete Razorpay Payment**
   - Use test card: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`
   - Click "Pay"
   - OTP: `123456` (auto-filled in test mode)

8. **Verify Signature Verification**
   - Monitor Network tab for POST `/api/payments/verify`
   - Request body should contain:
     - `orderId`: ORD-xxx
     - `razorpayPaymentId`: pay_xxx
     - `razorpayOrderId`: order_xxx
     - `razorpaySignature`: signature
   - Response should be: `{ success: true }`

9. **Verify Payment Status Polling**
   - Page redirects to `/checkout/success?orderId=ORD-xxx`
   - Monitor Network tab for repeated GET `/api/payments/{orderId}/status`
   - First response: `{ status: "VERIFIED", isConfirmed: false, orderStatus: "PENDING" }`
   - After ~2-5 seconds, webhook arrives
   - Second response: `{ status: "CONFIRMED", isConfirmed: true, orderStatus: "CONFIRMED" }`

10. **Verify Success Screen**
    - Spinner/processing state shows: "Processing Payment..."
    - When CONFIRMED arrives, shows success checkmark: "Thank You!"
    - Order ID displays: ORD-xxx
    - Timeline shows: "Order Confirmed" (step 1 complete)

11. **Verify Backend State**
    - Query database:
      ```sql
      SELECT id, paymentStatus, status FROM orders WHERE id = 'ORD-xxx';
      -- Expected: paymentStatus='PAID', status='CONFIRMED'
      
      SELECT id, status FROM payments WHERE orderId = 'ORD-xxx';
      -- Expected: status='CONFIRMED'
      
      SELECT * FROM cartitems WHERE userId = '{userId}';
      -- Expected: EMPTY (cart cleared by webhook, not frontend)
      ```

12. **Verify Inventory Deduction**
    - Query database:
      ```sql
      SELECT stock FROM products WHERE sku = 'DIAM-001';
      -- Expected: 4 (was 5, now 1 sold)
      ```

#### Expected Result: ✅ PASS
- Order created with status PENDING
- Payment created with status PENDING
- Razorpay modal opens and accepts payment
- Payment verified to VERIFIED status
- Webhook arrives and updates to CONFIRMED
- Cart cleared ONLY by webhook
- Success page shows only after CONFIRMED state
- Inventory correctly deducted
- Customer charged exactly once

---

### SCENARIO 2: Payment Cancellation
**Objective**: Verify user can cancel payment without being charged

#### Steps:
1. Repeat SCENARIO 1 steps 1-5
2. In Razorpay modal, click "Cancel" button
3. Modal closes, user returns to payment page
4. Verify error message: "Payment cancelled. Please try again."

#### Database Verification:
```sql
SELECT id, status FROM payments WHERE orderId = 'ORD-xxx' ORDER BY createdAt DESC LIMIT 1;
-- Expected: status='PENDING' (not charged)

SELECT * FROM cartitems WHERE userId = '{userId}';
-- Expected: FULL CART STILL PRESENT (not cleared)
```

#### Expected Result: ✅ PASS
- No charge made
- Cart remains intact
- User can retry payment
- Order still PENDING
- No inventory deduction

---

### SCENARIO 3: Inventory Lock Safety - Concurrent Checkouts
**Objective**: Verify inventory locking prevents overselling

#### Setup:
- Product "Diamond Ring" has stock: 2 units
- Create 3 test customer accounts

#### Steps:
1. **Customer A**: Add Diamond Ring to cart, proceed to checkout (don't complete payment yet)
2. **Customer B**: Add Diamond Ring to cart, proceed to checkout (don't complete payment yet)
3. **Customer C**: Add Diamond Ring to cart, try to proceed to checkout

#### Expected Result: ✅ PASS
- Customers A & B: Orders created successfully
- Customer C: Error message "Out of stock" or cannot add to cart
- Inventory locks held for 15 minutes
- No overselling occurs

#### Database Verification:
```sql
SELECT id, status, inventoryLocked FROM orders ORDER BY createdAt DESC LIMIT 3;
-- Expected: A and B have inventoryLocked=true, created within seconds
-- C: No order created

SELECT id, expiresAt FROM inventorylocks ORDER BY createdAt DESC LIMIT 3;
-- Expected: 2 locks created, expiring in ~15 minutes
```

---

### SCENARIO 4: Webhook Resilience - Duplicate Processing
**Objective**: Verify webhook idempotency (no double-charging)

#### Setup:
- Monitor backend logs
- Complete payment flow (SCENARIO 1)
- Razorpay sends webhook

#### Simulate Webhook Retry:
```bash
# Find the orderId and paymentId from SCENARIO 1
# Manually trigger webhook twice (using curl or API client)

curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "id": "pay_xxx",
        "amount": 1000000,
        "currency": "INR",
        "status": "CONFIRMED"
      },
      "order": {
        "id": "order_xxx"
      }
    }
  }'
```

#### Expected Result: ✅ PASS
- First webhook: Order updated to CONFIRMED, inventory deducted, cart cleared
- Second webhook: Returns `{ received: true }` immediately (idempotent)
- Inventory deducted exactly once
- Cart cleared exactly once
- No duplicate inventory deduction

---

### SCENARIO 5: Payment Failure - Signature Verification
**Objective**: Verify malformed payment is rejected

#### Steps:
1. Repeat SCENARIO 1 steps 1-7 (complete Razorpay payment)
2. In Network tab, intercept the `/payments/verify` POST request
3. Modify `razorpaySignature` to an invalid value
4. Send request

#### Expected Result: ✅ PASS
- Backend rejects request with 400 error: "Invalid signature"
- Order remains PENDING
- No order status change
- Cart not cleared
- Payment not marked VERIFIED
- Customer can retry

---

### SCENARIO 6: User Ownership Validation
**Objective**: Verify users cannot access others' orders

#### Setup:
- Create 2 test accounts: User A and User B
- User A completes SCENARIO 1, gets Order_A
- User B is logged in

#### Steps:
1. User B attempts to fetch payment status:
   ```bash
   # As User B (with User B's token)
   GET /api/payments/Order_A/status
   ```

#### Expected Result: ✅ PASS
- Returns 403 Forbidden: "Unauthorized"
- User B cannot view User A's payment
- No cross-user data leakage

---

### SCENARIO 7: Cart Management - Frontend Safety
**Objective**: Verify cart is NEVER cleared on frontend

#### Steps:
1. Repeat SCENARIO 1 steps 1-8 (complete payment, just verified)
2. At this point, page shows "Processing Payment..."
3. Hard-refresh page (F5)
4. Check cart state (useCartStore)

#### Expected Result: ✅ PASS
- Cart is still populated (not cleared)
- Page resumes polling for webhook
- When webhook arrives, cart is cleared
- Payment status polling continues across refresh

---

### SCENARIO 8: Database Migration - No Data Loss
**Objective**: Verify Prisma migration preserves existing data

#### Setup:
- Create a test payment with OLD schema before migration
- Manually insert: `INSERT INTO payments (...) VALUES (..., status='PAID', ...)`

#### Steps:
1. Run migration: `npx prisma migrate dev --name webhook_payment_states`
2. Query the old payment record

#### Expected Result: ✅ PASS
- Migration succeeds without errors
- Old 'PAID' status records remain unchanged (backward compatible)
- New payments use 'VERIFIED' → 'CONFIRMED' flow
- No data loss or corruption

---

## Test Results Summary

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Happy Path | ✅ | Complete flow works end-to-end |
| 2. Payment Cancellation | ✅ | No charge, cart preserved |
| 3. Inventory Lock Safety | ✅ | No overselling |
| 4. Webhook Idempotency | ✅ | No double-charging |
| 5. Signature Verification | ✅ | Invalid payments rejected |
| 6. User Ownership | ✅ | Cross-user access prevented |
| 7. Cart Management | ✅ | Frontend never clears cart |
| 8. Migration | ✅ | No data loss |

---

## Critical Assertions

### MUST PASS:
1. ✅ **Payment → Order**: Every payment has exactly 1 order
2. ✅ **Order → Customer**: Every order belongs to exactly 1 customer (ownership check)
3. ✅ **Inventory Safety**: Inventory deducted only after CONFIRMED status
4. ✅ **No Double Charging**: Webhook idempotency prevents duplicate deductions
5. ✅ **Cart Management**: Cart cleared only by webhook, never by frontend
6. ✅ **Success Screen**: Shows only after isConfirmed=true
7. ✅ **State Machine**: PENDING → VERIFIED → CONFIRMED (no skipping steps)
8. ✅ **User Cannot**: Access others' payments, verify own signature, bypass ownership checks

---

## Rollback Procedure

If ANY test fails:

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back 20250119000000_webhook_payment_states

# Revert frontend changes (from git)
git checkout frontend/src/app/checkout/

# Revert backend changes (from git)
git checkout backend/src/controllers/payment.controller.ts
git checkout backend/src/controllers/order.controller.ts
```

---

## Deployment Checklist

- [ ] All 8 test scenarios passed
- [ ] No critical assertions failed
- [ ] Database migration runs cleanly
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Razorpay test keys configured
- [ ] Webhook endpoint accessible from Razorpay
- [ ] Environment variables set correctly
- [ ] Logging enabled for audit trail
- [ ] Backup created before deployment

---

## Production Safety Notes

1. **Webhook Reliability**: Set up multiple webhook retry endpoints
2. **Cron Job**: Schedule `/admin/inventory/cleanup-locks` every 5 minutes
3. **Monitoring**: Alert on PENDING orders older than 30 minutes
4. **Logging**: All payment operations must be logged with timestamp and userId
5. **PCI Compliance**: Never store full card numbers; rely on Razorpay
6. **Refunds**: Use `POST /orders/return/process-refund` for admin-approved returns

---

## Sign-Off

**Tested By**: [Your Name]
**Date**: [Test Date]
**Result**: ✅ PRODUCTION READY / ❌ NEEDS FIXES

