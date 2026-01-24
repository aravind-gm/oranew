# 📊 ORDER FLOW DIAGRAM (Manual Mode)

## 🔄 COMPLETE ORDER LIFECYCLE

```
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOMER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

Step 1: PLACE ORDER
┌──────────────┐
│  Customer    │──→ Adds to cart
│  Browses     │──→ Checkout
│  Products    │──→ Enters address
└──────────────┘    ↓
                    Razorpay Payment Page
                    ↓
                ┌───────────┐
                │ Payment   │──→ Razorpay captures money
                │ Success   │──→ Money in YOUR account
                └───────────┘
                    ↓
              ┌──────────────┐
              │ Order Created│ Status: PENDING
              │ in Database  │ Payment: PENDING  
              └──────────────┘
                    ↓
              ✉️ EMAIL #1: "Order Placed"
              "We received your order. 
               Payment being verified..."


───────────────────────────────────────────────────────────────────

Step 2: ADMIN VERIFICATION (MANUAL)
                    ↓
          ┌──────────────────┐
          │  Admin Opens     │
          │  /admin/orders   │──→ Sees PENDING orders
          └──────────────────┘
                    ↓
          ┌──────────────────┐
          │  Admin Checks    │
          │  Razorpay        │──→ Verifies payment received
          │  Dashboard       │──→ Matches order number
          └──────────────────┘
                    ↓
              PAYMENT VERIFIED ✓
                    ↓
          ┌──────────────────┐
          │ Admin Changes    │
          │ Status to        │──→ Clicks "CONFIRMED"
          │ CONFIRMED        │──→ Clicks "Update Order"
          └──────────────────┘
                    ↓
              ✉️ EMAIL #2: "Order Confirmed"
              "Your payment is verified!
               We're preparing your items..."


───────────────────────────────────────────────────────────────────

Step 3: PACKING & SHIPPING (MANUAL)
                    ↓
          ┌──────────────────┐
          │  Warehouse       │
          │  Packs Items     │──→ Physical packing
          └──────────────────┘
                    ↓
          ┌──────────────────┐
          │  Generate        │
          │  Shipping Label  │──→ Via courier service
          │  (Delhivery etc) │──→ Get tracking number
          └──────────────────┘
                    ↓
          ┌──────────────────┐
          │  Admin Updates   │
          │  in System:      │
          │  • Status: SHIPPED │
          │  • Courier: Delhivery │
          │  • Tracking: ABC123XYZ │
          └──────────────────┘
                    ↓
              ✉️ EMAIL #3: "Order Shipped"
              "Your order is on the way!
               Tracking: ABC123XYZ
               Courier: Delhivery"


───────────────────────────────────────────────────────────────────

Step 4: DELIVERY (MANUAL)
                    ↓
          ┌──────────────────┐
          │  Courier         │
          │  Delivers        │──→ Customer receives
          │  Package         │──→ Customer confirms
          └──────────────────┘
                    ↓
          ┌──────────────────┐
          │  Admin Marks     │
          │  DELIVERED       │──→ After confirmation
          └──────────────────┘
                    ↓
              ✉️ EMAIL #4: "Order Delivered"
              "Your order arrived!
               Please review your purchase."


───────────────────────────────────────────────────────────────────

ALTERNATIVE: CANCELLATION
                    ↓
          ┌──────────────────┐
          │  Customer or     │
          │  Admin Cancels   │──→ Status: CANCELLED
          │                  │──→ Inventory restored
          └──────────────────┘
                    ↓
              🔄 Inventory unlocked
              Refund processed (if paid)
```

---

## 🎯 STATUS FLOW DIAGRAM

```
                    START
                      │
                      ↓
        ┌─────────────────────────┐
        │      PENDING            │  ← Order just placed
        │  (Awaiting payment      │    Payment not verified
        │   verification)         │    
        └─────────────────────────┘
                 │         │
        ┌────────┘         └──────────┐
        │                              │
        ↓                              ↓
┌──────────────┐            ┌──────────────────┐
│  CONFIRMED   │            │   CANCELLED      │
│ (Payment OK) │            │ (Order cancelled)│
└──────────────┘            └──────────────────┘
        │                              ↑
        ↓                              │
┌──────────────┐                       │
│  PROCESSING  │ (Optional)            │
│ (Packing)    │                       │
└──────────────┘                       │
        │                              │
        ↓                              │
┌──────────────┐                       │
│   SHIPPED    │ ← Add tracking   ─────┤ Can cancel
│ (In transit) │                       │ before ship
└──────────────┘                       │
        │                              │
        ↓                              │
┌──────────────┐                       │
│  DELIVERED   │ ← Order complete      │
│  (Complete)  │                       │
└──────────────┘                       │
                                       END
```

---

## 📧 EMAIL TIMELINE

```
Time        Customer Action          Admin Action          Email Sent
────────────────────────────────────────────────────────────────────
T+0 min     Places order            -                     ✉️ Order Placed
            Pays via Razorpay                             
            
T+10 min    -                       Checks Razorpay       -
                                    Sees payment ✓
                                    
T+15 min    -                       Clicks CONFIRMED      ✉️ Order Confirmed
                                    
T+1 day     -                       Packs items           -
                                    Gets tracking #
                                    
T+1 day     -                       Marks SHIPPED         ✉️ Order Shipped
            +2hrs                   Enters tracking       (with tracking)
            
T+3-7       Receives package        -                     -
days        
            
T+3-7       -                       Marks DELIVERED       ✉️ Order Delivered
days                                after confirmation    (with review request)
+2hrs
```

---

## 🔐 PAYMENT FLOW (Current Manual Mode)

```
┌──────────────────────────────────────────────────────────────┐
│                    PAYMENT VERIFICATION                       │
└──────────────────────────────────────────────────────────────┘

Customer Side                   System                 Admin Side
─────────────                   ──────                 ──────────

Click "Pay Now"
    │
    ↓
Enter card details
    │
    ↓                          
Pay ₹5,000        ────→    Razorpay Gateway
    │                            │
    │                            ↓
    │                      Payment Captured
    │                      Money in account
    │                            │
    │                            ↓
    │                      Create Order
    │                      Status: PENDING
    │                      Payment: PENDING
    │                            │
    │                            ↓
    │                      Send Email #1
    │                      "Order Placed"
    │                            
Sees "Order                      │
Successful"                      │
    │                            │
    │                            ↓
    │                      ORDER IN DATABASE
    │                            │
    │                            │         Admin logs in
    │                            │         Opens /admin/orders
    │                            │         Sees PENDING order
    │                            │                │
    │                            │                ↓
    │                            │         Opens Razorpay
    │                            │         Checks payment
    │                            │                │
    │                            │                ↓
    │                            │         ✓ Payment confirmed
    │                            │         ✓ Amount matches
    │                            │                │
    │                            │                ↓
    │                            │         Clicks CONFIRMED
    │                            │                │
    │                            ↓                ↓
    │                      Update Order
    │                      Status: CONFIRMED
    │                      Payment: CONFIRMED
    │                            │
    │                            ↓
    │                      Send Email #2
    │                      "Order Confirmed"
    │                            │
    ↓                            ↓
Receives email              READY TO SHIP
"Order Confirmed"
```

---

## 🚀 FUTURE AUTOMATION (When Webhooks Enabled)

```
Current (Manual):                Future (Automated):
─────────────────               ──────────────────

Payment captured                Payment captured
       ↓                               ↓
Order: PENDING                  Webhook received
       ↓                               ↓
Admin checks Razorpay          Auto-verify signature
       ↓                               ↓
Admin clicks CONFIRMED         Auto-set CONFIRMED
       ↓                               ↓
Email sent                     Email sent
                               Inventory deducted
                               Cart cleared


TIME SAVED: 15-60 minutes per order
ERRORS REDUCED: 95%
```

---

## 📊 INVENTORY BEHAVIOR

```
Current System:
──────────────

Order Placed  →  Inventory LOCKED (15 min)
                 Not deducted from stock
                 ↓
                 Timer expires OR
                 Payment confirmed
                 ↓
                 Lock released
                 (Manual deduction later)


Future System:
─────────────

Order Placed  →  Inventory LOCKED
                 ↓
                 Payment confirmed via webhook
                 ↓
                 Inventory DEDUCTED permanently
                 Cart cleared
                 Lock released
```

---

## ✅ CHECKLIST FOR EACH ORDER

```
□ Order appears in /admin/orders
□ Status is PENDING
□ Open Razorpay dashboard
□ Find payment with matching order number
□ Verify amount matches
□ Change status to CONFIRMED
□ Customer receives "Confirmed" email
□ Pack items
□ Generate shipping label
□ Get tracking number
□ Change status to SHIPPED
□ Enter tracking number
□ Enter courier name
□ Customer receives "Shipped" email
□ Wait for delivery
□ Change status to DELIVERED
□ Customer receives "Delivered" email
□ Done! ✓
```

---

This diagram shows exactly how your system works right now.
All blue boxes = **Manual admin actions**
All green boxes = **Automatic system actions**
All red boxes = **Customer actions**

Everything in between is fully under YOUR control! 🎯
