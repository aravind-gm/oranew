# Payment Flow Diagram & Architecture

## 1. Complete Payment Flow Sequence

```
USER (Frontend)         BACKEND             RAZORPAY
    │                     │                    │
    │─ Add to cart ───→   │                    │
    │                     │                    │
    │─ Checkout ────────→ │                    │
    │◄─ Order created ────│ (PENDING)          │
    │   (order-uuid)      │                    │
    │                     │                    │
    │─ Payment page ────→ │                    │
    │   (order-uuid)      │                    │
    │                     │                    │
    │◄─ Create payment ──│ POST /payments/    │
    │                     │ create             │
    │                     │ (validates user)   │
    │                     │                    │
    │                     │──────────────────→│
    │                     │ Create order      │
    │                     │◄──────────────────│
    │                     │ order_id,         │
    │                     │ amount             │
    │                     │                    │
    │◄─ Payment details ─│ (razorpayOrderId)  │
    │   (key, key_id)     │                    │
    │                     │                    │
    │─ Open Razorpay ────────────────────────→│
    │   (popup)           │                    │
    │                     │                    │
    │─ Select payment ─────────────────────→ │
    │   (Netbanking)      │                    │
    │                     │                    │
    │◄─ Payment complete ────────────────────│
    │   (razorpay_        │                    │
    │    payment_id,      │                    │
    │    razorpay_        │                    │
    │    order_id,        │                    │
    │    razorpay_        │                    │
    │    signature)       │                    │
    │                     │                    │
    │─ Verify signature ─→ POST /payments/   │
    │   (verify)           │ verify            │
    │                     │ (checks signature)│
    │                     │                    │
    │◄─ Verified ────────│ Status: VERIFIED  │
    │   (not confirmed)   │                    │
    │                     │                    │
    │─ Success page ─────→ GET /payments/    │
    │   (polling every    │ {id}/status       │
    │    5 seconds)       │ (returns VERIFIED)│
    │                     │                    │
    │                     │                    │ [WEBHOOK DELIVERY]
    │                     │◄──────────────────│
    │                     │ payment.captured  │
    │                     │ (validates sig)   │
    │                     │                    │
    │                     │ UPDATE: CONFIRMED │
    │                     │ UPDATE: Order     │
    │                     │ Deduct inventory  │
    │                     │ Clear cart        │
    │                     │                    │
    │◄─ Status changed ──│ GET /payments/    │
    │   (polling detects  │ {id}/status       │
    │    CONFIRMED)       │ (returns CONFIRMED)
    │                     │                    │
    │─ Show Success ─────│ ✅ Order confirmed│
    │   (Thank You!)      │                    │
    │                     │                    │

Legend:
→ HTTP Request
← HTTP Response
── Webhook
```

---

## 2. State Machine Diagram

```
                    ┌─────────────────────┐
                    │   ORDER CREATED     │
                    │   status: PENDING   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ PAYMENT CREATED     │
                    │ status: PENDING     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ USER PAYS VIA       │
                    │ RAZORPAY            │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ SIGNATURE VERIFIED  │
                    │ status: VERIFIED    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
    ┌─────────▼──────────┐        ┌────────────▼─────────┐
    │  WEBHOOK ARRIVED   │        │ WEBHOOK TIMEOUT      │
    │  (within 30s)      │        │ (polling continues)  │
    └─────────┬──────────┘        └────────────┬─────────┘
              │                                 │
    ┌─────────▼──────────────┐    ┌────────────▼─────────┐
    │ PAYMENT: CONFIRMED     │    │ WAIT FOR MANUAL      │
    │ ORDER: CONFIRMED       │    │ CONFIRMATION         │
    │ INVENTORY: DEDUCTED    │    │ (admin action)       │
    │ CART: CLEARED          │    │                      │
    │                        │    │                      │
    │ ✅ PAYMENT COMPLETE    │    │ (edge case)          │
    └────────────────────────┘    └──────────────────────┘

Alternate flows:
PENDING → FAILED (if payment declined)
PENDING → REFUNDED (if refund requested)
```

---

## 3. Database Schema Relationships

```
USER
  ├── id (UUID)
  ├── email
  ├── fullName
  └── phone

ORDER
  ├── id (UUID) ◄──────┐
  ├── userId (FK)      │
  ├── status ────────┐  │
  │  (PENDING/       │  │
  │   CONFIRMED/     │  │
  │   SHIPPED)       │  │
  ├── paymentStatus  │  │
  │  (PENDING)       │  │
  ├── totalAmount    │  │
  ├── orderNumber    │  │
  └── items[]        │  │
                     │  │
PAYMENT            │  │
  ├── id (UUID)     │  │
  ├── orderId (FK) ──┘  │
  ├── status ────────┐  │
  │  (PENDING/       │  │
  │   VERIFIED/      │  │
  │   CONFIRMED)     │  │
  ├── amount         │  │
  ├── transactionId ─┴──┘ (Razorpay order_id)
  ├── paymentGateway
  │  (RAZORPAY)
  └── gatewayResponse
     (raw webhook data)

INVENTORY
  ├── id
  ├── productId (FK)
  ├── quantity
  ├── locked
  └── lockedUntil

CART_ITEM
  ├── id
  ├── userId (FK)
  ├── productId (FK)
  └── quantity

Relationships:
USER (1) ──→ (N) ORDER
USER (1) ──→ (N) PAYMENT (via ORDER)
ORDER (1) ──→ (N) PAYMENT
ORDER (1) ──→ (N) CART_ITEM
```

---

## 4. HTTP Request/Response Flow

### Step 1: Create Order
```
POST /api/orders/checkout
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "items": [
    {"productId": "prod-uuid", "quantity": 1}
  ],
  "shippingAddress": {
    "street": "123 Main",
    "city": "Delhi",
    "state": "Delhi",
    "zipCode": "110001",
    "country": "India"
  }
}

─────────────────────────────

Response 200:
{
  "success": true,
  "order": {
    "id": "ord-uuid",           ◄── SAVE THIS
    "orderNumber": "ORD-001",
    "status": "PENDING",
    "totalAmount": 52.06,
    "items": [...]
  }
}
```

### Step 2: Create Payment
```
POST /api/payments/create
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "orderId": "ord-uuid"
}

─────────────────────────────

Response 200:
{
  "success": true,
  "paymentId": "pay-uuid",
  "razorpayOrderId": "order_ABC123",    ◄── SAVE THIS
  "razorpayKeyId": "rzp_test_XXXXX",
  "amount": 5206,
  "currency": "INR",
  "key": "rzp_test_XXXXX",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  }
}
```

### Step 3: Verify Signature (After Razorpay)
```
POST /api/payments/verify
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "orderId": "ord-uuid",
  "razorpayPaymentId": "pay_ABC123",
  "razorpayOrderId": "order_ABC123",
  "razorpaySignature": "HMAC_SIGNATURE"
}

─────────────────────────────

Response 200:
{
  "success": true,
  "message": "Signature verified. Awaiting webhook.",
  "status": "VERIFIED",
  "orderStatus": "PENDING"
}

Response 400:
{
  "success": false,
  "error": {
    "message": "Payment signature verification failed"
  }
}
```

### Step 4: Poll Status
```
GET /api/payments/{orderId}/status
Authorization: Bearer {TOKEN}

─────────────────────────────

Before Webhook (1-30s):
{
  "paymentId": "pay-uuid",
  "status": "VERIFIED",
  "isConfirmed": false,
  "orderStatus": "PENDING"
}

After Webhook (30-60s):
{
  "paymentId": "pay-uuid",
  "status": "CONFIRMED",
  "isConfirmed": true,
  "orderStatus": "CONFIRMED"
}
```

### Step 5: Webhook (From Razorpay)
```
POST /api/payments/webhook
X-Razorpay-Signature: {SIGNATURE}
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_ABC123",
        "order_id": "order_ABC123",
        "amount": 5206,
        "currency": "INR",
        "status": "captured",
        "method": "netbanking"
      }
    }
  }
}

─────────────────────────────

Response 200:
{
  "received": true
}

[Backend updates]:
- Payment status → CONFIRMED
- Order status → CONFIRMED
- Inventory deducted
- Cart cleared
```

---

## 5. File Organization

```
backend/
├── src/
│   ├── controllers/
│   │   ├── payment.controller.ts     ◄── Main logic
│   │   ├── order.controller.ts
│   │   └── ...
│   ├── routes/
│   │   ├── payment.routes.ts         ◄── Endpoints
│   │   ├── order.routes.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── rawBody.ts               ◄── Webhook signature
│   │   ├── auth.ts
│   │   └── ...
│   ├── utils/
│   │   ├── inventory.ts              ◄── Inventory logic
│   │   └── helpers.ts
│   ├── config/
│   │   └── database.ts
│   └── server.ts                    ◄── Setup middleware order
│
frontend/
├── src/
│   ├── app/
│   │   ├── checkout/
│   │   │   ├── page.tsx              ◄── Order creation
│   │   │   ├── payment/
│   │   │   │   └── page.tsx          ◄── Payment verification
│   │   │   └── success/
│   │   │       └── page.tsx          ◄── Polling & confirmation
│   │   └── ...
│   ├── store/
│   │   └── authStore.ts              ◄── Auth token
│   └── lib/
│       └── api.ts                    ◄── API client
│
prisma/
├── schema.prisma                    ◄── Database schema
└── migrations/
    └── */
        └── migration.sql             ◄── Schema changes
```

---

## 6. Signature Verification Process

### Frontend Verification (verifyPayment)

```
Razorpay gives you:
  - razorpay_order_id (matches order_id in /create response)
  - razorpay_payment_id (generated by Razorpay)
  - razorpay_signature (calculated by Razorpay)

Your code calculates:
  body = {razorpay_order_id}|{razorpay_payment_id}
  signature = HMAC-SHA256(body, RAZORPAY_KEY_SECRET)

Verification:
  ✅ If calculated_signature === razorpay_signature
     → Signature valid, mark VERIFIED
  ❌ Else
     → Fraud detected, return 400

Code location:
  backend/src/controllers/payment.controller.ts:195-205
```

### Webhook Verification

```
Razorpay sends:
  - Header: X-Razorpay-Signature
  - Body: Raw JSON (payment.captured event)

Your code calculates:
  body = raw_request_body (not parsed)
  signature = HMAC-SHA256(body, RAZORPAY_KEY_SECRET)

Verification:
  ✅ If calculated_signature === X-Razorpay-Signature
     → Webhook valid, process payment
  ❌ Else
     → Fraud detected, return 400

Code location:
  backend/src/controllers/payment.controller.ts:274-282
```

---

## 7. Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ SECURITY LAYER 1: Authentication                        │
│ ✓ POST /payments/create requires JWT                    │
│ ✓ POST /payments/verify requires JWT                    │
│ ✓ GET /payments/{id}/status requires JWT                │
│ ✓ POST /payments/webhook (public, signature verified)   │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ SECURITY LAYER 2: User Ownership Validation             │
│ ✓ Verify request.user.id === order.userId              │
│ ✓ Verified in: createPayment, verifyPayment, etc        │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ SECURITY LAYER 3: Signature Verification                │
│ ✓ Frontend: HMAC-SHA256(order_id|payment_id, secret)   │
│ ✓ Webhook: HMAC-SHA256(body, secret) from header        │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ SECURITY LAYER 4: Amount Validation                     │
│ ✓ Webhook validates: amount === order.totalAmount       │
│ ✓ Prevents tampering: No amount modification allowed    │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ SECURITY LAYER 5: Duplicate Prevention                  │
│ ✓ One payment per order allowed                         │
│ ✓ Rejects if active payment exists                      │
│ ✓ Prevents double charges                               │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ SECURITY LAYER 6: Inventory Safety                      │
│ ✓ Deducted ONLY on webhook (CONFIRMED)                  │
│ ✓ Never deducted on signature verify (VERIFIED)         │
│ ✓ Prevents inventory loss if payment fails              │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ SECURITY LAYER 7: Idempotency                           │
│ ✓ Webhook can be called multiple times safely           │
│ ✓ Checks if already CONFIRMED, returns success          │
│ ✓ Prevents duplicate inventory deduction                │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling Paths

```
Payment Flow:

createPayment
  ├─ ❌ Order not found → 404
  ├─ ❌ User doesn't own order → 403
  ├─ ❌ Order not PENDING → 400
  ├─ ❌ Active payment exists → 200 (return existing)
  └─ ✅ Payment created

verifyPayment
  ├─ ❌ Missing fields → 400
  ├─ ❌ Order not found → 404
  ├─ ❌ User doesn't own order → 403
  ├─ ❌ Signature mismatch → 400
  ├─ ❌ Payment already CONFIRMED → 200 (success)
  └─ ✅ Payment marked VERIFIED

webhook
  ├─ ❌ Missing signature header → 400
  ├─ ❌ Signature verification failed → 400
  ├─ ❌ Missing event → 400
  ├─ ❌ Wrong event type → 200 (ignore)
  ├─ ❌ Missing payment entity → 400
  ├─ ❌ Payment not found → 400
  ├─ ❌ Order not found → 400
  ├─ ❌ Amount mismatch → 400
  ├─ ❌ Already CONFIRMED → 200 (idempotent)
  └─ ✅ Payment marked CONFIRMED, inventory deducted

getPaymentStatus
  ├─ ❌ Missing orderId → 400
  ├─ ❌ User doesn't own order → 403
  ├─ ❌ Payment not found → 404
  └─ ✅ Current status returned
```

---

## 9. Timeline Example

```
T+0:00   User adds product, clicks Checkout
         Order created: id=ord-123, status=PENDING

T+0:05   User fills address, clicks "Pay"
         Payment created: id=pay-456, status=PENDING
         Razorpay popup opens

T+0:15   User completes Netbanking payment
         Razorpay returns: payment_id, order_id, signature

T+0:16   Frontend: POST /verify with signature
         Backend: Signature verified ✓
         Payment updated: status=VERIFIED

T+0:17   Frontend: Redirect to success page
         Page polls: GET /status every 5s
         Response: status=VERIFIED, isConfirmed=false

T+0:22   [Backend receives webhook from Razorpay]
         Webhook signature verified ✓
         Amount validated ✓
         Payment updated: status=CONFIRMED
         Order updated: status=CONFIRMED
         Inventory deducted
         Cart cleared

T+0:27   Frontend: Polling detects CONFIRMED
         Page shows: "Thank You! Order Confirmed" ✅

---

Timeline:
- Payment to verification: 1 second
- Verification to success page: 1 second
- Success page to webhook: 5-10 seconds
- Total user experience: 5-30 seconds
```

---

## Key Takeaways

1. **Webhook is the source of truth** - Never trust frontend alone
2. **Signature verified twice** - Frontend AND webhook
3. **Inventory deducted only on webhook** - Safety first
4. **Polling handles webhook delays** - Eventual consistency
5. **Idempotent webhook processing** - Safe from duplicates
6. **Database transactions ensure atomicity** - No partial updates
7. **User ownership validated everywhere** - Security at every step
8. **Amount validated in webhook** - Prevents tampering

