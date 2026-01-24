# Quick Deployment & Testing Guide

## 🚀 Deploy the Fix

### Step 1: Rebuild Backend
```bash
cd c:\Users\selvi\Downloads\orashop.in\oranew
docker-compose down
docker-compose build backend
docker-compose up -d
```

### Step 2: Verify Services Started
```bash
docker-compose ps
# Should see: postgres ✓, backend ✓, frontend ✓

docker-compose logs backend | tail -20
# Should see: "listening on port 5000" and no errors
```

---

## ✅ Manual Testing Flow

### Test 1: Create Order → Payment Page
```
1. Go to http://localhost:3000
2. Login with existing user or create new one
3. Add 2-3 products to cart
4. Click "Checkout"
5. Enter shipping address
6. Click "Continue to Payment"
   ✓ Should go to /checkout/payment
   ✓ Should show order amount and "Pay Now" button
```

### Test 2: Complete Payment in Razorpay
```
7. Click "Pay Now"
   ✓ Razorpay modal opens
8. Fill payment form with test card:
   - Card: 4111 1111 1111 1111
   - Expiry: 12/25
   - CVV: 123
9. Click "Pay"
   ✓ Razorpay shows "Payment Successful"
```

### Test 3: Signature Verification
```
10. After Razorpay success, handler runs
    ✓ Console shows: "[Payment] Payment response: 200"
    ✓ Frontend calls POST /api/payments/verify
11. Backend response received
    ✓ Console shows: "[Verify] Signature verified successfully"
    ✓ Response has success: true
12. Page redirects to /checkout/success?orderId={id}
    ✓ Success page loads
    ✓ Shows "Waiting for webhook confirmation..."
```

### Test 4: Webhook Processing
```
13. Success page polls /api/payments/{orderId}/status
    ✓ Console shows: "[Status] Payment status check"
14. Webhook arrives from Razorpay
    ✓ Backend logs: "[Webhook] Received event: payment.captured"
    ✓ Backend logs: "[Webhook] Signature verified successfully"
15. Webhook processes payment
    ✓ Backend logs: "[Webhook] ✓ Payment marked CONFIRMED"
    ✓ Backend logs: "[Webhook] ✓ Order.paymentStatus set to CONFIRMED"
    ✓ Backend logs: "[Webhook] ✓ Inventory deducted and locks deleted"
    ✓ Backend logs: "[Webhook] ✓ Cart cleared for user"
    ✓ Backend logs: "[Webhook] ✅ All operations completed"
16. Success page detects status change
    ✓ Console shows: "[Success] Payment status check: isConfirmed=true"
    ✓ Confetti animation plays
    ✓ Shows "Payment Confirmed!" message
    ✓ Shows order details
```

### Test 5: Post-Payment State
```
17. Refresh page
    ✓ Still shows success (not redirected)
18. Go back to cart (http://localhost:3000)
    ✓ Cart is EMPTY (was cleared by webhook)
19. Check database
    ✓ Order.paymentStatus = 'CONFIRMED'
    ✓ Payment.status = 'CONFIRMED'
    ✓ InventoryLocks deleted
    ✓ Product.stockQuantity decreased
    ✓ CartItems deleted for this user
```

---

## 🔍 Log Monitoring

### Watch Real-Time Logs
```bash
# All backend logs
docker-compose logs -f backend

# Filter for payment flow
docker-compose logs backend | grep -E "(Payment|Webhook|Verify|Status)"

# Watch in real-time
docker-compose logs -f backend | grep -E "(Payment|Webhook|Verify)"
```

### Key Log Patterns to See

**Successful Flow:**
```
[Payment] Create payment request: orderId=xxx, userId=yyy
[Payment] Order found: status=PENDING
[Payment] Create payment endpoint returned Razorpay order
[Verify] Starting signature verification: orderId=xxx
[Verify] Signature verified successfully
[Webhook] Received event: payment.captured
[Webhook] Signature verified successfully
[Webhook] ✓ Payment marked CONFIRMED
[Webhook] ✓ Order.paymentStatus set to CONFIRMED
[Webhook] ✓ Inventory deducted and locks deleted
[Webhook] ✓ Cart cleared for user
[Webhook] ✅ All operations completed
[Status] Payment status check: isConfirmed=true
```

**Error Patterns to Watch For:**
```
[Verify] Signature verification FAILED  ← Signature mismatch
[Webhook] Signature verification FAILED  ← Webhook signature invalid
[Webhook] Amount mismatch  ← Amount doesn't match order
[Webhook] Order not found  ← Database issue
[Webhook] ❌ Error processing payment  ← Transaction failed
```

---

## 🧪 Database Verification

### Check Order Status
```sql
-- Connect to DB
docker-compose exec postgres psql -U ora_user -d ora_db

-- Check order
SELECT id, order_number, status, payment_status, total_amount, created_at 
FROM orders 
WHERE order_number = 'ORD-001' \G

-- Should see: payment_status = 'CONFIRMED'
```

### Check Payment Status
```sql
SELECT id, order_id, status, transaction_id, amount, created_at 
FROM payments 
WHERE order_id = '{orderId}' \G

-- Should see: status = 'CONFIRMED'
```

### Check Inventory
```sql
-- Should see NO locks for this order
SELECT * FROM inventory_locks WHERE order_id = '{orderId}';
-- Should return 0 rows

-- Check stock was deducted
SELECT id, name, stock_quantity 
FROM products 
WHERE id IN (SELECT product_id FROM order_items WHERE order_id = '{orderId}');
-- Stock should be reduced
```

### Check Cart
```sql
-- Should be EMPTY after payment
SELECT * FROM cart_items WHERE user_id = '{userId}';
-- Should return 0 rows
```

---

## 🐛 Debugging Failed Payments

### If Webhook Never Arrives
```bash
# Check Razorpay dashboard
# 1. Go to: https://dashboard.razorpay.com/app/webhooks
# 2. Check "Delivery" tab to see if webhook was sent and what response was received
# 3. If 404: check backend webhook URL matches
# 4. If 500: check backend logs for errors

# Manually test webhook (use Razorpay dashboard > test webhook feature)
```

### If Signature Verification Fails
```bash
# Add detailed logging to backend
# Should see in logs:
# [Verify] Signature verification FAILED:
#   body: "{razorpayOrderId}|{razorpayPaymentId}"
#   expected: "{expected_signature}"
#   received: "{received_signature}"
#   match: false

# Check:
# 1. razorpayOrderId matches the one from /create response
# 2. razorpayPaymentId matches Razorpay's payment ID
# 3. Razorpay key secret in .env is correct (no extra spaces)
```

### If Inventory Not Deducted
```bash
# Check logs for:
# [Webhook] ✓ Inventory deducted and locks deleted

# If NOT present, webhook didn't complete
# Check for: [Webhook] ❌ Error processing payment: {error}

# Manually verify by checking:
docker-compose exec postgres psql -U ora_user -d ora_db -c \
  "SELECT id, order_id, product_id, quantity FROM inventory_locks WHERE order_id = '{orderId}';"

# Should return 0 rows (locks deleted after deduction)
```

### If Cart Not Cleared
```bash
# Check logs for:
# [Webhook] ✓ Cart cleared for user

# If NOT present, webhook stopped before this step
# Check logs for: [Webhook] ❌ Error processing payment

# Manually verify:
docker-compose exec postgres psql -U ora_user -d ora_db -c \
  "SELECT id, product_id FROM cart_items WHERE user_id = '{userId}';"

# Should return 0 rows
```

---

## 📊 Request/Response Inspection

### Open Browser DevTools
```
1. Open http://localhost:3000 in Chrome
2. Open DevTools (F12)
3. Go to "Network" tab
4. Complete payment flow
5. Look for:
   - POST /api/payments/create → Status 200
   - POST /api/payments/verify → Status 200
   - GET /api/payments/{orderId}/status → Status 200 (keep polling)
```

### Check Request Bodies
```
POST /api/payments/verify:
{
  "orderId": "...",
  "razorpayPaymentId": "pay_...",
  "razorpayOrderId": "order_...",
  "razorpaySignature": "..."
}

Response:
{
  "success": true,
  "message": "Payment signature verified successfully.",
  "paymentStatus": "PENDING",
  "note": "Waiting for webhook confirmation..."
}
```

### Check Polling Response
```
GET /api/payments/{orderId}/status:
Initial Response (before webhook):
{
  "success": true,
  "paymentStatus": "PENDING",
  "orderPaymentStatus": "PENDING",
  "isConfirmed": false,
  "message": "Waiting for webhook confirmation..."
}

After Webhook:
{
  "success": true,
  "paymentStatus": "CONFIRMED",
  "orderPaymentStatus": "CONFIRMED",
  "isConfirmed": true,
  "message": "Payment confirmed! Order will be processed."
}
```

---

## 🚨 Rollback Plan

If something goes wrong, you can rollback:

```bash
# Stop services
docker-compose down

# Restore database backup
docker-compose up -d postgres
docker-compose exec postgres psql -U ora_user -d ora_db < backup_$(date +%s).sql

# Restart all services
docker-compose up -d

# Restart backend with old code
git checkout backend/src/controllers/payment.controller.ts
docker-compose build backend
docker-compose up -d
```

---

## 📈 Success Metrics

After applying this fix, you should see:

| Metric | Before | After |
|--------|--------|-------|
| `/verify` endpoint crashes | 500 errors | 200 OK |
| Order status after payment | PENDING | CONFIRMED (in paymentStatus) |
| Cart after payment | Full | Empty ✓ |
| Inventory after payment | Locked | Deducted ✓ |
| Success page message | Error | "Payment confirmed!" ✓ |
| Webhook idempotency | Not tested | Safe ✓ |

---

## 📞 Support

If you encounter issues:

1. Check [PAYMENT_VERIFICATION_FIX.md](PAYMENT_VERIFICATION_FIX.md) for detailed explanation
2. Monitor logs: `docker-compose logs -f backend | grep -E "(Payment|Webhook)"`
3. Check database state at each step
4. Verify Razorpay webhook delivery in dashboard
5. Ensure all environment variables are set correctly

---

## ✨ Next Features to Consider

1. **Retry Logic**: Automatic retry if webhook fails
2. **Payment Timeout**: Cancel order if payment not completed in 30 minutes
3. **Admin Dashboard**: View payment status and reconcile failed payments
4. **Email Notifications**: Send order confirmation email when payment completes
5. **Multiple Payment Methods**: Add Stripe, UPI, COD alongside Razorpay
