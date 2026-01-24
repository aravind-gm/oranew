# Payment Flow Debugging Guide - ORA E-Commerce

## The Problem: "International cards are not supported"

This error **IS NOT A CODE BUG**. It's a **Razorpay Account Configuration Issue**.

### Root Cause
Your Razorpay TEST account (Key ID: `rzp_test_S1uH8olNKIRqqu`) is currently restricted to **Indian payment methods only**. International card payments are blocked at the Razorpay account level, not your code.

### Evidence
- Error message originates from **Razorpay's server**, not your backend
- Backend logs show payment creation succeeded
- Signature verification code is correct
- All API endpoints are functional

---

## Solution: Use Indian Payment Methods for Testing

### Option 1: **Netbanking (RECOMMENDED FOR TESTING)**
This is the fastest way to test the entire flow:

1. **Go to payment page and click "Netbanking"**
2. **Select any Indian bank** (all test banks auto-approve)
3. **Payment succeeds instantly**

### Option 2: **UPI**
If your Razorpay account supports UPI:
- UPI ID: `success@razorpay`
- Instant approval in test mode

### Option 3: **Enable International Cards in Razorpay Dashboard**
To accept international cards:

1. **Log into Razorpay Dashboard**: https://dashboard.razorpay.com
2. **Go to Settings → Payment Methods**
3. **Enable International Cards** toggle
4. **Save changes**
5. **Wait 5-10 minutes for settings to propagate**
6. **Retry with card**: `4111111111111111`

---

## Complete Payment Flow Testing (Exact Curl Commands)

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Valid JWT token from login

### Step 1: Get JWT Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-uuid",
    "email": "test@example.com",
    "fullName": "Test User"
  }
}
```

**Save the token**: `export TOKEN="eyJhbGciOiJIUzI1NiIs..."`

---

### Step 2: Create an Order

**Frontend Code** (happens automatically at `/checkout`):
```typescript
POST /api/orders/checkout
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Delhi",
    "state": "Delhi",
    "zipCode": "110001",
    "country": "India"
  }
}
```

**Curl Command:**
```bash
curl -X POST http://localhost:5000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "PRODUCT_ID", "quantity": 1}],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "zipCode": "110001",
      "country": "India"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "id": "order-uuid",
    "orderNumber": "ORD-2026-001",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 52.06,
    "items": [...],
    "shippingAddress": {...}
  }
}
```

**Save the Order ID**: `export ORDER_ID="order-uuid"`

---

### Step 3: Create Razorpay Payment Order

**Frontend Code** (happens at `/checkout/payment`):
```typescript
POST /api/payments/create
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "orderId": "order-uuid"
}
```

**Curl Command:**
```bash
curl -X POST http://localhost:5000/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "'$ORDER_ID'"}'
```

**Expected Response:**
```json
{
  "success": true,
  "paymentId": "payment-uuid",
  "razorpayOrderId": "order_XXXXXXXXXXXXX",
  "razorpayKeyId": "rzp_test_S1uH8olNKIRqqu",
  "amount": 5206,
  "currency": "INR",
  "key": "rzp_test_S1uH8olNKIRqqu",
  "orderId": "ORD-2026-001",
  "customer": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91XXXXXXXXXX"
  }
}
```

**Save the Razorpay Order ID**: `export RAZORPAY_ORDER_ID="order_XXXXXXXXXXXXX"`

---

### Step 4A: Test Netbanking Payment (EASIEST)

1. **Open frontend**: http://localhost:3000/checkout/payment?orderId={ORDER_ID}
2. **Click "Netbanking"** in Razorpay popup
3. **Select any bank** (e.g., State Bank of India)
4. **Test mode auto-approves** the payment
5. **You get**: `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`

---

### Step 4B: Simulate Card Payment (For Testing Signature Verification)

Generate a valid signature using the formula:
```
signature = HMAC-SHA256(orderid|paymentid, key_secret)
```

**Python Script to Generate Signature:**
```python
import hmac
import hashlib

razorpay_order_id = "order_XXXXXXXXXXXXX"
razorpay_payment_id = "pay_XXXXXXXXXXXXX"
key_secret = "kI22GwAy1HUpEYbrXnOp0hfA"

body = f"{razorpay_order_id}|{razorpay_payment_id}"
signature = hmac.new(
    key_secret.encode(),
    body.encode(),
    hashlib.sha256
).hexdigest()

print(f"Signature: {signature}")
```

**Run it:**
```bash
python3 -c "
import hmac, hashlib
razorpay_order_id = 'order_XXXXXXXXXXXXX'
razorpay_payment_id = 'pay_XXXXXXXXXXXXX'
key_secret = 'kI22GwAy1HUpEYbrXnOp0hfA'
body = f'{razorpay_order_id}|{razorpay_payment_id}'
signature = hmac.new(key_secret.encode(), body.encode(), hashlib.sha256).hexdigest()
print(f'Signature: {signature}')
"
```

**Save the signature**: `export SIGNATURE="..."`

---

### Step 5: Verify Payment Signature

**Frontend Code** (happens automatically at `/checkout/payment` after payment completes):
```typescript
POST /api/payments/verify
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "orderId": "order-uuid",
  "razorpayPaymentId": "pay_XXXXXXXXXXXXX",
  "razorpayOrderId": "order_XXXXXXXXXXXXX",
  "razorpaySignature": "..."
}
```

**Curl Command:**
```bash
curl -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "razorpayPaymentId": "pay_XXXXXXXXXXXXX",
    "razorpayOrderId": "'$RAZORPAY_ORDER_ID'",
    "razorpaySignature": "'$SIGNATURE'"
  }'
```

**Expected Response - SUCCESS:**
```json
{
  "success": true,
  "message": "Signature verified. Awaiting payment confirmation from Razorpay.",
  "status": "VERIFIED",
  "orderStatus": "PENDING",
  "note": "Do not mark order as paid yet. Wait for webhook confirmation."
}
```

**Expected Response - FAILURE (Invalid Signature):**
```json
{
  "success": false,
  "error": {
    "message": "Payment signature verification failed"
  }
}
```

---

### Step 6: Check Payment Status (Polling)

**Frontend Code** (happens automatically at `/checkout/success`):
```typescript
GET /api/payments/{orderId}/status
Authorization: Bearer {TOKEN}
```

**Curl Command:**
```bash
curl -X GET "http://localhost:5000/api/payments/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Responses:**

**Before Webhook (Signature Verified):**
```json
{
  "paymentId": "payment-uuid",
  "status": "VERIFIED",
  "amount": 52.06,
  "transactionId": "order_XXXXXXXXXXXXX",
  "orderStatus": "PENDING",
  "isConfirmed": false
}
```

**After Webhook (Payment Confirmed):**
```json
{
  "paymentId": "payment-uuid",
  "status": "CONFIRMED",
  "amount": 52.06,
  "transactionId": "order_XXXXXXXXXXXXX",
  "orderStatus": "CONFIRMED",
  "isConfirmed": true
}
```

---

## Expected Webhook Payload (For Reference)

The Razorpay webhook server will POST this to `/api/payments/webhook`:

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_XXXXXXXXXXXXX",
        "order_id": "order_XXXXXXXXXXXXX",
        "amount": 5206,
        "currency": "INR",
        "status": "captured",
        "method": "netbanking",
        "email": "test@example.com"
      }
    }
  }
}
```

**Header:**
```
X-Razorpay-Signature: <calculated-signature>
```

---

## Payload Field Mapping (Frontend → Backend)

### What Frontend Sends to `/payments/verify`:
```typescript
{
  "orderId": string,                    // Backend order ID
  "razorpayPaymentId": string,          // From Razorpay response.razorpay_payment_id
  "razorpayOrderId": string,            // From Razorpay response.razorpay_order_id
  "razorpaySignature": string           // From Razorpay response.razorpay_signature
}
```

**⚠️ CRITICAL**: Must use exact keys:
- ❌ `paymentId` → ✅ `razorpayPaymentId`
- ❌ `signature` → ✅ `razorpaySignature`
- ❌ `orderId` (Razorpay) → ✅ `razorpayOrderId`

---

## Troubleshooting Checklist

### ❌ Error: "International cards are not supported"
**Solution**: Use Netbanking or enable international cards in Razorpay Dashboard
- **Status**: Razorpay account restriction, not code issue
- **Action**: Click "Netbanking" instead

### ❌ Error: "400 - Payment signature verification failed"
**Likely Causes**:
1. **Wrong key secret**: Check Docker env var matches Razorpay account
2. **Mismatched fields**: Ensure `razorpayPaymentId`, `razorpayOrderId`, `razorpaySignature` are correct
3. **Type mismatch**: Ensure all fields are strings, not objects

**Debug**:
```bash
docker-compose logs backend | grep "Signature"
```

### ❌ Error: "404 - Order not found"
**Likely Causes**:
1. Order doesn't exist (typo in ID)
2. Wrong user accessing someone else's order

**Debug**:
```bash
docker-compose exec postgres psql -U ora_user -d ora_db -c "SELECT * FROM orders WHERE id='ORDER_ID';"
```

### ❌ Error: "403 - Unauthorized"
**Cause**: Token expired or user doesn't match order owner
**Solution**: Login again and get fresh token

### ❌ Success Page Shows "Payment Pending" Forever
**Likely Causes**:
1. **Webhook not delivered**: Razorpay couldn't reach `/api/payments/webhook`
2. **Signature verification failed in webhook**: Check `docker-compose logs backend`
3. **Status polling failed**: Check browser console for errors

**Debug**:
```bash
docker-compose logs backend | grep Webhook
```

### ❌ Cart Not Cleared
**Expected Behavior**: Cart clears ONLY when webhook confirms payment
**Check**: 
```bash
docker-compose exec postgres psql -U ora_user -d ora_db -c "SELECT * FROM cart_items WHERE user_id='USER_ID';"
```

### ❌ Inventory Not Deducted
**Expected Behavior**: Inventory deducted ONLY on webhook confirmation (CONFIRMED status)
**Check**:
```bash
docker-compose exec postgres psql -U ora_user -d ora_db -c "SELECT * FROM inventory WHERE product_id='PRODUCT_ID';"
```

---

## How to Test End-to-End (Complete Workflow)

### Scenario: Netbanking Payment (Fastest)

1. **Start containers** (if not already running):
   ```bash
   docker-compose up -d
   ```

2. **Open frontend**: http://localhost:3000

3. **Add product to cart** → Click Checkout

4. **Enter address** → Click "Proceed to Payment"

5. **Confirm order creation** → Redirected to payment page

6. **Payment page loads** → Click "Pay Now"

7. **Razorpay popup opens** → Click "Netbanking"

8. **Select bank** → Test mode auto-completes

9. **Redirected to success page** → Shows "Processing Payment..."

10. **Wait 5-30 seconds** → Page shows "Thank You!" with success checkmark

11. **Verify in database**:
    ```bash
    docker-compose exec postgres psql -U ora_user -d ora_db -c "
    SELECT 
      o.id, o.status, o.payment_status,
      p.id, p.status
    FROM orders o
    JOIN payments p ON o.id = p.order_id
    WHERE o.user_id='USER_ID'
    ORDER BY o.created_at DESC LIMIT 1;
    "
    ```

**Expected Output**:
```
                     id                    | status   | payment_status |                    id                    | status
------------------------------------------+----------+----------------+------------------------------------------+----------
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     | CONFIRMED| PENDING        | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     | CONFIRMED
```

---

## Key Points to Remember

### 🔒 Security
✅ Frontend never knows `RAZORPAY_KEY_SECRET`  
✅ Signature verified on backend only  
✅ User ownership validated before each step  
✅ Amount validated in webhook  

### 💰 Payment States
- **PENDING**: Payment created, awaiting customer
- **VERIFIED**: Signature verified, webhook pending
- **CONFIRMED**: Webhook received, order complete ✅
- **FAILED**: Payment declined or timed out

### 📊 Order States
- **PENDING**: Awaiting payment
- **CONFIRMED**: Payment received ✅
- **SHIPPED**: Order shipped
- **DELIVERED**: Order delivered

### 🚀 Webhook Flow
1. Customer pays via Razorpay
2. Razorpay calls `/api/payments/webhook`
3. Backend verifies signature
4. Payment marked CONFIRMED
5. Order marked CONFIRMED
6. Inventory deducted
7. Cart cleared
8. Frontend polling detects change → Shows success

---

## Production Checklist

Before going live:

- [ ] Switch Razorpay to **LIVE mode** (not test)
- [ ] Use **production keys** (not test keys)
- [ ] Enable **international cards** if needed
- [ ] Set up **webhook** in Razorpay Dashboard
- [ ] Verify webhook URL is publicly accessible
- [ ] Test with **real transactions** (small amount)
- [ ] Monitor backend logs for errors
- [ ] Set up **alerts** for failed payments
- [ ] Configure **SSL certificate** (HTTPS required)
- [ ] Test **refund flow**
- [ ] Load test payment verification endpoint

