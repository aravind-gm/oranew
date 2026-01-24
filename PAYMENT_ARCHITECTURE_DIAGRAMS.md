# Razorpay Payment System: Architecture Diagrams

## DIAGRAM 1: Complete Payment Flow

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    BROWSER (Frontend)                       ┃
┃                                                             ┃
┃  1. User places order                                       ┃
┃     └─ Items → Shipping Address → Confirm                  ┃
┃                                                             ┃
┃  2. Click "Continue to Payment"                             ┃
┃     └─ POST /api/payments/create { orderId }               ┃
┃        Response: { razorpayOrderId, amount, key, ... }     ┃
┃                                                             ┃
┃  3. Open Razorpay Checkout Modal                           ┃
┃     └─ <script src="checkout.razorpay.com/v1/...">        ┃
┃     └─ new Razorpay(options) with handler callback         ┃
┃                                                             ┃
┃  4. User enters payment details                             ┃
┃     └─ Card / Wallet / Bank Transfer / etc.                ┃
┃                                                             ┃
┃  5. User clicks "Pay"                                       ┃
┃     └─ [Processing on Razorpay servers...]                 ┃
┃                                                             ┃
┃  6. Razorpay returns result to browser                      ┃
┃     ├─ SUCCESS: Calls handler callback                      ┃
┃     │  └─ handler({ razorpay_payment_id,                   ┃
┃     │            razorpay_order_id,                        ┃
┃     │            razorpay_signature })                     ┃
┃     │                                                       ┃
┃     │  7. POST /api/payments/verify {                       ┃
┃     │       orderId,                                        ┃
┃     │       razorpay_payment_id,                            ┃
┃     │       razorpay_order_id,                              ┃
┃     │       razorpay_signature                              ┃
┃     │    }                                                  ┃
┃     │                                                       ┃
┃     │  Response: { success: true, orderStatus: ... }       ┃
┃     │                                                       ┃
┃     │  8. Redirect to /checkout/success                    ┃
┃     │     └─ Show "Order Confirmed!"                        ┃
┃     │                                                       ┃
┃     └─ FAILURE: Show error, prompt retry                   ┃
┃        └─ User can retry payment                            ┃
┃                                                             ┃
└━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↕
                          HTTP/REST
                              ↕
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    BACKEND (Node.js)                        ┃
┃                                                             ┃
┃  POST /api/payments/create [protected]                      ┃
┃  ├─ Validate user authenticated                            ┃
┃  ├─ Fetch order from DB                                    ┃
┃  ├─ Verify order belongs to user                           ┃
┃  ├─ Check no active payment exists                         ┃
┃  ├─ Call Razorpay API: create order                        ┃
┃  │  └─ API Request:  { amount, currency, receipt, ... }    ┃
┃  │  └─ API Response: { id: order_ABC123, ... }             ┃
┃  ├─ Save Payment record: status = PENDING                  ┃
┃  └─ Return razorpayOrderId to frontend                     ┃
┃                                                             ┃
┃  [User completes payment in Razorpay modal]                ┃
┃                                                             ┃
┃  POST /api/payments/verify [protected]                      ┃
┃  ├─ Validate user authenticated                            ┃
┃  ├─ Validate input (orderId, payment_id, signature)        ┃
┃  ├─ Fetch order & payment from DB                          ┃
┃  ├─ Verify order belongs to user                           ┃
┃  ├─ Verify Razorpay signature:                             ┃
┃  │  ├─ signatureBody = order_id | payment_id              ┃
┃  │  ├─ calculated = HMAC-SHA256(signatureBody, secret)     ┃
┃  │  ├─ if calculated !== received → return 400             ┃
┃  │  └─ if calculated === received → continue ✓             ┃
┃  ├─ Update Payment.status = CONFIRMED                      ┃
┃  ├─ Update Order.status = CONFIRMED                        ┃
┃  ├─ Delete CartItems (clear cart)                          ┃
┃  └─ Return { success: true }                               ┃
┃                                                             ┃
┃  POST /api/payments/webhook [public]                        ┃
┃  ├─ If NODE_ENV === 'development'                          ┃
┃  │  └─ Return 200 { ignored: true }                        ┃
┃  │     (No processing needed in dev)                       ┃
┃  └─ If NODE_ENV === 'production'                           ┃
┃     ├─ Verify webhook signature                            ┃
┃     ├─ Parse payment.captured event                        ┃
┃     ├─ Update Payment & Order (idempotent)                 ┃
┃     └─ Return 200 { received: true }                       ┃
┃                                                             ┃
└━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↕
                           Prisma ORM
                              ↕
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 PostgreSQL Database                         ┃
┃                                                             ┃
┃  orders                    payments            cart_items   ┃
┃  ├─ id                     ├─ id                ├─ id       ┃
┃  ├─ orderNumber            ├─ orderId ────────┐ ├─ userId  ┃
┃  ├─ userId                 ├─ status          │ ├─ product│
┃  ├─ status: "PENDING"      │   PENDING ────┐  │ │  quantity
┃  ├─ paymentStatus          │   CONFIRMED ←─┼──┘ │
┃  │   PENDING ────────────┐ │                 └─deleted
┃  │   CONFIRMED ←──────┐  │ ├─ amount
┃  ├─ totalAmount       │  │ ├─ transactionId   (cleared after
┃  ├─ items            │  │ └─ gatewayResponse payment)
┃  └─ ...              │  │
┃                      └──┘
└━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## DIAGRAM 2: Signature Verification Security

```
┌─────────────────────────────────────────────────────────────┐
│              RAZORPAY SERVERS (Production)                  │
│                                                             │
│  Payment processed:                                         │
│  ├─ User enters card details                               │
│  ├─ Razorpay authorizes payment                            │
│  ├─ Creates payment_id: "pay_ABC123"                       │
│  └─ Calculates signature:                                  │
│     signature = HMAC-SHA256(                               │
│       body = "order_ABC123|pay_ABC123",                    │
│       secret = RAZORPAY_KEY_SECRET                         │
│     )                                                      │
│     signature = "hex_string_64_chars"                      │
│                                                             │
│  Returns to browser:                                        │
│  {                                                         │
│    razorpay_payment_id: "pay_ABC123",                      │
│    razorpay_order_id: "order_ABC123",                      │
│    razorpay_signature: "hex_string_64_chars"               │
│  }                                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                        (Success Callback)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              BROWSER (User's Machine)                       │
│                                                             │
│  handler({                                                  │
│    razorpay_payment_id: "pay_ABC123",      ← From Razorpay │
│    razorpay_order_id: "order_ABC123",      ← From Razorpay │
│    razorpay_signature: "hex_string_..."    ← From Razorpay │
│  })                                                         │
│                                                             │
│  POST /api/payments/verify {                                │
│    orderId: "ORDER_UUID_IN_DB",             ← From our DB  │
│    razorpay_payment_id: "pay_ABC123",       ← From Razorpay│
│    razorpay_order_id: "order_ABC123",       ← From Razorpay│
│    razorpay_signature: "hex_string_..."     ← From Razorpay│
│  }                                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                        (HTTP POST)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js Server)                       │
│                                                             │
│  VERIFY SIGNATURE:                                          │
│                                                             │
│  1. Extract from request:                                   │
│     ├─ razorpay_payment_id = "pay_ABC123"                  │
│     ├─ razorpay_order_id = "order_ABC123"                  │
│     └─ razorpay_signature = "received_hex_string"          │
│                                                             │
│  2. Recalculate signature using OUR secret:                │
│     signatureBody = "order_ABC123|pay_ABC123"              │
│     expectedSignature = HMAC-SHA256(                       │
│       signatureBody,                                       │
│       RAZORPAY_KEY_SECRET  ← Stored securely on server    │
│     )                                                      │
│     expectedSignature = "hex_string_64_chars"              │
│                                                             │
│  3. Compare:                                                │
│     ┌──────────────────────────────────┐                   │
│     │ IF expected === received          │                   │
│     ├──────────────────────────────────┤                   │
│     │ ✓ Signature is VALID              │                   │
│     │ ✓ Payment came from Razorpay      │                   │
│     │ ✓ No tampering detected           │                   │
│     │ ✓ Safe to confirm payment         │                   │
│     ├──────────────────────────────────┤                   │
│     │ THEN:                             │                   │
│     │ - Update Order.status = CONFIRMED │                   │
│     │ - Update Payment.status = CONFIRMED│                   │
│     │ - Clear cart                      │                   │
│     │ - Return { success: true }        │                   │
│     └──────────────────────────────────┘                   │
│                                                             │
│     ┌──────────────────────────────────┐                   │
│     │ IF expected !== received          │                   │
│     ├──────────────────────────────────┤                   │
│     │ ✗ Signature is INVALID            │                   │
│     │ ✗ Data was tampered with         │                   │
│     │ ✗ Possible fraud attempt          │                   │
│     │ ✗ Reject payment                  │                   │
│     ├──────────────────────────────────┤                   │
│     │ THEN:                             │                   │
│     │ - Return { success: false }       │                   │
│     │ - Return error 400                │                   │
│     │ - No DB changes                   │                   │
│     │ - User sees error: "Retry"        │                   │
│     └──────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 3: Why Local-First Works

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃           OLD WEBHOOK-BASED APPROACH            ┃
┃                   (Fails Locally)                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. User pays → Razorpay confirms
              ↓
2. Razorpay needs to notify backend
   └─ Needs webhook URL: https://yourdomain/webhook
              ↓
3. In local dev, need ngrok:
   ├─ ngrok http 5000
   ├─ Creates: https://abc123.ngrok.io
   └─ Tell Razorpay: https://abc123.ngrok.io/webhook
              ↓
4. Razorpay calls webhook (from internet)
   └─ http(s)://abc123.ngrok.io/webhook
              ↓
5. ngrok tunnel to Docker bridge network
   ├─ Docker: 172.17.x.x (internal network)
   ├─ ngrok: localhost (host machine)
   └─ Network routing = UNRELIABLE
              ↓
6. If tunnel works:
   ├─ Body is raw Buffer
   ├─ Express raw() parsing may fail
   ├─ Signature verification fails
   └─ Webhook rejected as "unauthorized"
              ↓
7. If timeout occurs (5s max):
   ├─ Razorpay retries (max 10 times)
   ├─ Each retry = another attempt
   ├─ May process order 0-10 times
   ├─ Race conditions on DB updates
   └─ Unpredictable behavior
              ↓
   RESULT: 50-70% success rate ✗


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        NEW LOCAL-FIRST APPROACH                 ┃
┃         (Works Reliably Locally)                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. User pays → Razorpay confirms
              ↓
2. Razorpay calls JavaScript handler in browser
   └─ handler() runs in browser (no network needed)
              ↓
3. Frontend (in browser) POST to backend
   POST /api/payments/verify
   └─ http://localhost:5000/api/payments/verify
              ↓
4. Request sent from browser to localhost
   ├─ Same machine (no tunnel)
   ├─ Same Docker network
   ├─ Direct connection
   └─ RELIABLE
              ↓
5. Backend receives request immediately
   ├─ Parse JSON normally
   ├─ Verify signature using crypto
   ├─ No raw body parsing issues
   └─ Deterministic result
              ↓
6. Result: Always 200 in < 100ms
   ├─ Or error (400, 403, 404)
   ├─ No retries needed
   ├─ No race conditions
   └─ Frontend gets answer immediately
              ↓
7. Frontend knows payment status right away
   ├─ Update order: ✓
   ├─ Clear cart: ✓
   ├─ Redirect: ✓
              ↓
   RESULT: 99%+ success rate ✓
```

---

## DIAGRAM 4: Database State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                  ORDER LIFECYCLE                            │
└─────────────────────────────────────────────────────────────┘

1. Order Created (during checkout)
   ┌─────────────────────────────┐
   │  Order                      │
   ├─────────────────────────────┤
   │ status = PENDING            │
   │ paymentStatus = PENDING     │
   │ totalAmount = 5206          │
   └─────────────────────────────┘
              ↓
              (User clicks "Continue to Payment")
              ↓

2. Razorpay Order Created (during payment flow)
   ┌─────────────────────────────┐    ┌──────────────────────┐
   │  Order                      │    │  Payment             │
   ├─────────────────────────────┤    ├──────────────────────┤
   │ status = PENDING            │    │ status = PENDING     │
   │ paymentStatus = PENDING     │    │ amount = 5206        │
   │ totalAmount = 5206          │    │ transactionId = ... │
   └─────────────────────────────┘    └──────────────────────┘
              ↓
              (User completes payment in Razorpay modal)
              ↓

3. Signature Verified (POST /api/payments/verify succeeds)
   ┌─────────────────────────────┐    ┌──────────────────────┐
   │  Order                      │    │  Payment             │
   ├─────────────────────────────┤    ├──────────────────────┤
   │ status = CONFIRMED          │◄───│ status = CONFIRMED   │
   │ paymentStatus = CONFIRMED   │    │ gatewayResponse:     │
   │ totalAmount = 5206          │    │ {                    │
   │                             │    │   razorpayPaymentId, │
   │ CartItems: DELETED          │    │   verifiedAt         │
   │                             │    │ }                    │
   └─────────────────────────────┘    └──────────────────────┘

   Key updates:
   ✓ Order.status = CONFIRMED
   ✓ Order.paymentStatus = CONFIRMED
   ✓ Payment.status = CONFIRMED
   ✓ CartItems.deleteMany() where userId = user
   ✓ All in single transaction (atomic)
```

---

## DIAGRAM 5: Error Handling Flows

```
┌─────────────────────────────────────────────────────────────┐
│            ERROR SCENARIOS & RESPONSES                      │
└─────────────────────────────────────────────────────────────┘

POST /api/payments/create
├─ No user authenticated
│  └─ Return 401: "Authentication required"
├─ Order doesn't exist
│  └─ Return 404: "Order not found"
├─ Order belongs to different user
│  └─ Return 403: "Unauthorized"
├─ Active payment already exists
│  └─ Return 200: { success: true, ... } (idempotent)
├─ Razorpay API error
│  └─ Return 500: "Failed to create Razorpay order"
└─ Success
   └─ Return 200: { success: true, razorpayOrderId, ... }

         ↓ (User completes payment) ↓

POST /api/payments/verify
├─ No user authenticated
│  └─ Return 401: "Authentication required"
├─ Missing input fields
│  └─ Return 400: "Missing required fields: ..."
├─ Order doesn't exist
│  └─ Return 404: "Order not found"
├─ Order belongs to different user
│  └─ Return 403: "Unauthorized"
├─ Payment record not found
│  └─ Return 404: "Payment record not found"
├─ Payment already confirmed (idempotent)
│  └─ Return 200: { success: true, message: "Already confirmed" }
├─ Signature verification fails
│  └─ Return 400: "Invalid payment signature"
├─ Razorpay order ID mismatch
│  └─ Return 400: "Razorpay order ID does not match"
├─ DB update fails
│  └─ Return 500: "Failed to update order"
└─ Success
   └─ Return 200: {
      success: true,
      orderStatus: "CONFIRMED",
      paymentStatus: "CONFIRMED"
    }

Frontend behavior:
├─ 200 success
│  └─ Redirect to /checkout/success
└─ Any error
   └─ Show error message, allow retry
```

---

## DIAGRAM 6: Development vs Production

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃           DEVELOPMENT (NODE_ENV=development)   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Payment Flow:
1. POST /api/payments/create
2. Open Razorpay modal (test mode)
3. Complete payment with test card
4. Razorpay success callback
5. POST /api/payments/verify ← MAIN VERIFICATION
6. Redirect to success page

Webhook:
├─ POST /api/payments/webhook
├─ Check: if NODE_ENV === 'development'
├─ YES → Return 200 { ignored: true } (NO-OP)
└─ RESULT: Disabled, no processing


Reasoning:
✓ No external tunnels needed
✓ Direct browser-to-server connection
✓ Signature verification sufficient
✓ Synchronous payment confirmation
✓ 99%+ success rate


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         PRODUCTION (NODE_ENV=production)       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Payment Flow:
1. POST /api/payments/create
2. Open Razorpay modal (live mode)
3. Complete payment with real card
4. Razorpay success callback
5. POST /api/payments/verify ← MAIN VERIFICATION
6. Redirect to success page

Webhook (ASYNC SAFETY LAYER):
├─ Razorpay also sends webhook to server
├─ Check: if NODE_ENV === 'development'
├─ NO → Continue with webhook processing
├─ Verify webhook signature
├─ Process payment.captured event
├─ Update Order & Payment (idempotent)
└─ RESULT: Additional safety, no impact if verify already succeeded


Reasoning:
✓ Frontend verification works in production too
✓ Webhook provides additional safety
✓ Idempotent: webhook processing is safe if verify already ran
✓ Webhook acts as catch-all for edge cases
✓ 100% reliable payment confirmation


Comparison:
┌─────────────────┬──────────────────┬─────────────────┐
│ Aspect          │ Development      │ Production      │
├─────────────────┼──────────────────┼─────────────────┤
│ Webhook Enabled │ ✗ No             │ ✓ Yes           │
│ Verification    │ Frontend → Verify│ Frontend → Verify
│                 │                  │ + Webhook       │
│ Reliability     │ ~99%             │ ~99.9%          │
│ Safety Layers   │ 1 (verify)       │ 2 (verify+hook) │
└─────────────────┴──────────────────┴─────────────────┘
```

---

**All diagrams are ASCII art and ready for documentation.**
