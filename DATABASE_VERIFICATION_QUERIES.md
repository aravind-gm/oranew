# 🔍 Database Verification Queries

Use these SQL queries in Render Postgres console to verify the payment flow is working after the fix.

## 1. Check Latest Order Status

```sql
SELECT 
  id, 
  order_number, 
  status, 
  "paymentStatus", 
  "totalAmount",
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected Result After Webhook:**
```
id              | order_number | status     | paymentStatus | totalAmount | created_at
────────────────┼──────────────┼────────────┼───────────────┼─────────────┼────────────
abc123...       | ORA123456789 | CONFIRMED  | CONFIRMED     | 5206.00     | 2026-01-15
```

❌ **Bad**: status = PENDING, paymentStatus = PENDING (webhook didn't run)  
❌ **Bad**: status = CONFIRMED, paymentStatus = PENDING (order updated but payment didn't)  
✅ **Good**: status = CONFIRMED, paymentStatus = CONFIRMED (webhook ran successfully)

---

## 2. Check Payment Status

```sql
SELECT 
  id,
  "orderId",
  status,
  amount,
  "transactionId",
  "gatewayResponse" ->> 'razorpayPaymentId' as razorpay_payment_id,
  "gatewayResponse" ->> 'verifiedBy' as verified_by,
  "gatewayResponse" ->> 'webhookReceivedAt' as webhook_received,
  created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected Result After Webhook:**
```
status          | verified_by | webhook_received       | razorpay_payment_id
────────────────┼─────────────┼──────────────────────┼─────────────────────
VERIFIED        | frontend    | (null)                | pay_XXXXX
CONFIRMED       | frontend    | 2026-01-15T10:25:30Z  | pay_XXXXX
```

✅ **Good**: Payment goes from VERIFIED → CONFIRMED  
❌ **Bad**: Payment stuck at VERIFIED (webhook not processing)

---

## 3. Check Cart is Cleared

```sql
SELECT 
  user_id,
  COUNT(*) as items_in_cart,
  (SELECT COUNT(*) FROM orders WHERE "userId" = cart_items."user_id") as user_orders
FROM cart_items 
GROUP BY user_id;
```

**For a user who just completed payment:**
```
user_id   | items_in_cart | user_orders
──────────┼───────────────┼────────────
user_id_1 | 0             | 1
```

✅ **Good**: items_in_cart = 0 (webhook cleared it)  
❌ **Bad**: items_in_cart > 0 (webhook didn't run)

---

## 4. Check Inventory was Deducted

```sql
SELECT 
  p.id,
  p.name,
  p."stockQuantity",
  p."isActive",
  oi.quantity,
  oi.id as order_item_id,
  o.id as order_id,
  o.status as order_status
FROM products p
JOIN order_items oi ON p.id = oi."productId"
JOIN orders o ON oi."orderId" = o.id
WHERE o.status = 'CONFIRMED'
ORDER BY o.created_at DESC
LIMIT 10;
```

**Expected:**
```
name        | stockQuantity | quantity | order_status
────────────┼───────────────┼──────────┼──────────────
Gold Ring   | 7             | 3        | CONFIRMED
Diamond Necklace | 12       | 1        | CONFIRMED
```

Stock should be reduced by ordered quantity.

✅ **Good**: stockQuantity is less than original stock  
❌ **Bad**: stockQuantity unchanged (inventory deduction didn't happen)

---

## 5. Check Inventory Locks are Deleted

```sql
SELECT 
  COUNT(*) as active_locks,
  "orderId",
  "productId"
FROM inventory_locks
WHERE "expiresAt" > NOW()
GROUP BY "orderId", "productId"
ORDER BY created_at DESC
LIMIT 10;
```

**Expected After Webhook (should be EMPTY):**
```
(0 rows)
```

✅ **Good**: No locks for CONFIRMED orders  
❌ **Bad**: Locks still exist (webhook didn't cleanup)

---

## 6. Check for Webhook Logs

Look for these patterns in Render backend logs:

```
[Webhook] Webhook received at: 2026-01-15T10:25:20Z
[Webhook] Signature verification: OK
[Webhook] Payment found: {paymentId: pay_xxx, status: VERIFIED}
[Webhook] Before transaction
[Webhook] Deducting inventory: product_id quantity
[Webhook] Clearing cart for user: user_id
[Webhook] After transaction
```

✅ **Good**: All these logs appear  
❌ **Bad**: No webhook logs (webhook not being called)  
❌ **Bad**: Logs stop at "Payment found" (transaction failed)

---

## 7. Complete Order Timeline Query

```sql
WITH order_timeline AS (
  SELECT 
    o.id,
    o.order_number,
    o.status as order_status,
    o."paymentStatus",
    o.created_at as order_created,
    p.id as payment_id,
    p.status as payment_status,
    p.created_at as payment_created,
    p."gatewayResponse" ->> 'verifiedAt' as verified_at,
    p."gatewayResponse" ->> 'webhookReceivedAt' as webhook_at
  FROM orders o
  LEFT JOIN payments p ON o.id = p."orderId"
  ORDER BY o.created_at DESC
  LIMIT 1
)
SELECT * FROM order_timeline;
```

**Perfect Timeline:**
```
order_status | payment_status | order_created        | verified_at          | webhook_at
──────────────┼────────────────┼──────────────────────┼──────────────────────┼──────────────────
PENDING       | PENDING        | 2026-01-15T10:20:00  | (null)               | (null)
PENDING       | VERIFIED       | 2026-01-15T10:20:00  | 2026-01-15T10:20:30  | (null)
CONFIRMED     | CONFIRMED      | 2026-01-15T10:20:00  | 2026-01-15T10:20:30  | 2026-01-15T10:20:35
```

---

## 8. Quick Health Check (One Query)

```sql
SELECT 
  COUNT(DISTINCT o.id) as total_orders,
  SUM(CASE WHEN o."paymentStatus" = 'CONFIRMED' THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN o."paymentStatus" = 'PENDING' THEN 1 ELSE 0 END) as pending_orders,
  SUM(CASE WHEN o.status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_orders,
  COUNT(DISTINCT ci."userId") as users_with_cart_items
FROM orders o
LEFT JOIN cart_items ci ON o."userId" = ci."user_id"
WHERE o.created_at > NOW() - INTERVAL '7 days';
```

**Expected:**
- confirmed_orders should equal paid_orders
- users_with_cart_items should be 0 (all carts cleared after payment)

---

## Use Case: Debugging a Specific Order

Replace `ORDER_ID` with the actual order ID:

```sql
-- Order details
SELECT * FROM orders WHERE id = 'ORDER_ID';

-- Payment details
SELECT * FROM payments WHERE "orderId" = 'ORDER_ID';

-- Order items
SELECT * FROM order_items WHERE "orderId" = 'ORDER_ID';

-- Inventory after deduction
SELECT p.name, p."stockQuantity", oi.quantity
FROM order_items oi
JOIN products p ON oi."productId" = p.id
WHERE oi."orderId" = 'ORDER_ID';

-- Cart (should be empty)
SELECT * FROM cart_items WHERE "userId" = (SELECT "userId" FROM orders WHERE id = 'ORDER_ID');

-- Inventory locks (should be gone)
SELECT * FROM inventory_locks WHERE "orderId" = 'ORDER_ID';
```

---

## What to Check If Payment Not Confirming

1. **Payment Status is VERIFIED but not CONFIRMED**
   - Webhook is not being called
   - Check Render logs for `[Webhook]` messages
   - Verify `RAZORPAY_WEBHOOK_SECRET` is set on Render

2. **Order Status is still PENDING**
   - Webhook ran but transaction failed
   - Check Render logs for transaction errors
   - Verify database connection is working

3. **Cart still has items**
   - Webhook transaction rolled back
   - Check for database errors in logs

4. **Inventory not deducted**
   - Same as above - transaction rolled back

---

**Note:** These queries show the state AFTER the fix is deployed. Before the fix, the order status would remain PENDING even though payment status shows CONFIRMED.
