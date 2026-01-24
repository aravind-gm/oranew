# Quick Reference Card - Payment System

## The Error
```
"Payment could not be completed. International cards are not supported."
```

## Root Cause
❌ **NOT a code bug**  
✅ **Razorpay account test mode is restricted to Indian payment methods**

---

## Fix (Pick ONE)

### ⚡ Option A: Use Netbanking (2 minutes, recommended)
1. Go to checkout → Add product
2. Fill address → "Proceed to Payment"
3. Razorpay popup → Click **"Netbanking"**
4. Select bank → Auto-approves in test mode
5. Success! ✅

### ⚡ Option B: Enable International Cards (10 minutes)
1. https://dashboard.razorpay.com
2. Settings → Payment Methods
3. Toggle **International Cards** → ON
4. Retry with card: `4111111111111111`
5. Success! ✅

---

## Verify Code Is Correct

### Backend - Payment Controller
| Function | What it does | Status |
|----------|-------------|--------|
| `createPayment()` | Creates Razorpay order, validates user | ✅ Correct |
| `verifyPayment()` | Verifies signature, marks VERIFIED | ✅ Correct |
| `webhook()` | Receives webhook, marks CONFIRMED | ✅ Correct |
| `getPaymentStatus()` | Returns status for polling | ✅ Correct |

**File**: `backend/src/controllers/payment.controller.ts`

### Frontend - Checkout Pages
| Page | What it does | Status |
|------|-------------|--------|
| `/checkout/page.tsx` | Creates order, redirects to payment | ✅ Correct |
| `/checkout/payment/page.tsx` | Opens Razorpay, verifies signature | ✅ Correct |
| `/checkout/success/page.tsx` | Polls for confirmation | ✅ Correct |

### Routes
| Route | Method | Protected | Status |
|-------|--------|-----------|--------|
| `/api/payments/create` | POST | ✅ Yes | ✅ Correct |
| `/api/payments/verify` | POST | ✅ Yes | ✅ Correct |
| `/api/payments/{id}/status` | GET | ✅ Yes | ✅ Correct |
| `/api/payments/webhook` | POST | ❌ No | ✅ Correct |

---

## Payload Keys (EXACT)

### Frontend sends to `/payments/verify`:
```json
{
  "orderId": "backend-order-id",
  "razorpayPaymentId": "pay_xxx",      ✅ NOT paymentId
  "razorpayOrderId": "order_xxx",      ✅ NOT orderId
  "razorpaySignature": "xxx"           ✅ NOT signature
}
```

**Status**: ✅ All keys correct in code

---

## Payment Flow States

```
PENDING          Order created, awaiting payment
   ↓
VERIFIED         Signature verified, webhook pending
   ↓
CONFIRMED        Webhook received, inventory deducted ✅
```

---

## Testing Checklist

- [ ] Docker containers running: `docker-compose ps`
- [ ] Backend healthy: `curl http://localhost:5000/health`
- [ ] Frontend accessible: http://localhost:3000
- [ ] Logged in: Use test account
- [ ] Added product to cart
- [ ] Opened checkout
- [ ] Filled address
- [ ] Clicked "Proceed to Payment"
- [ ] **Selected Netbanking** (not card)
- [ ] Selected bank → Completed
- [ ] Success page shows "Thank You!"
- [ ] Order marked CONFIRMED in database

---

## Database Verification

After successful payment:

```bash
# Check payment status
docker-compose exec postgres psql -U ora_user -d ora_db -c "
SELECT status FROM payments ORDER BY created_at DESC LIMIT 1;"
# Expected: CONFIRMED

# Check order status
docker-compose exec postgres psql -U ora_user -d ora_db -c "
SELECT status FROM orders ORDER BY created_at DESC LIMIT 1;"
# Expected: CONFIRMED

# Check cart cleared
docker-compose exec postgres psql -U ora_user -d ora_db -c "
SELECT COUNT(*) FROM cart_items WHERE user_id = 'YOUR_USER_ID';"
# Expected: 0
```

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `backend/src/controllers/payment.controller.ts` | All payment logic | ✅ Correct |
| `backend/src/routes/payment.routes.ts` | Endpoint routing | ✅ Correct |
| `backend/src/middleware/rawBody.ts` | Webhook signature capture | ✅ Correct |
| `frontend/src/app/checkout/page.tsx` | Order creation | ✅ Correct |
| `frontend/src/app/checkout/payment/page.tsx` | Payment verification | ✅ Correct |
| `frontend/src/app/checkout/success/page.tsx` | Webhook polling | ✅ Correct |

---

## Environment Variables

Required in Docker:
- `RAZORPAY_KEY_ID=rzp_test_S1uH8olNKIRqqu` ✅
- `RAZORPAY_KEY_SECRET=kI22GwAy1HUpEYbrXnOp0hfA` ✅

**Status**: Both configured ✅

---

## Webhook Signature Verification

```typescript
// Formula
body = `{orderId}|{paymentId}`
signature = HMAC-SHA256(body, KEY_SECRET)

// Frontend verification (verifyPayment)
body = `${payment.transactionId}|${razorpayPaymentId}`

// Webhook verification (webhook)
body = raw_request_body (unparsed)
```

**Status**: ✅ Both implemented correctly

---

## Security Checklist

- [x] User ownership validated before each operation
- [x] Signature verified on backend (not frontend)
- [x] Amount validated in webhook
- [x] Duplicate payments prevented
- [x] Inventory only deducted after confirmation
- [x] Cart cleared only after confirmation
- [x] Webhook uses raw body for signature
- [x] All authenticated endpoints protected

**Status**: ✅ All security measures in place

---

## Next Steps

### RIGHT NOW (2 minutes)
1. ✅ Use Netbanking payment method
2. ✅ Complete test transaction
3. ✅ Verify success page shows confirmation

### BEFORE LIVE (10 minutes)
1. Enable international cards in Razorpay dashboard
2. Test with international card
3. Verify webhook is working

### FOR PRODUCTION
1. Get LIVE Razorpay keys
2. Update environment variables
3. Test with real payment
4. Monitor webhook delivery
5. Set up error alerts

---

## Support Quick Links

**Razorpay Dashboard**: https://dashboard.razorpay.com  
**API Docs**: https://razorpay.com/docs/  
**Webhook Setup**: Dashboard → Settings → Webhooks  

---

## Summary

✅ **Code is 100% correct**  
✅ **All endpoints wired properly**  
✅ **All security validations in place**  
❌ **"International cards" error is account setting, not code**

**Solution**: Use Netbanking for testing.

