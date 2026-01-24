# Inventory Management & Payment Processing Implementation

## Overview
This document details the complete implementation of **Inventory Management with Time-Based Locking** and **Secure Payment Processing with Webhook Integration** for the ORA Jewellery e-commerce platform.

## System Architecture

### Core Concepts

#### 1. **Inventory Locking (Day 2-3)**
- **Duration**: 15 minutes per lock
- **Purpose**: Reserve inventory during checkout without permanent deduction
- **Auto-Release**: Expired locks are automatically cleaned up (no manual action needed)
- **Atomicity**: Uses database transactions to prevent race conditions

#### 2. **Payment Processing (Day 3-4)**
- **Two-Step Verification**:
  1. Client signature verification (frontend)
  2. Webhook signature verification (server-side)
- **Single Source of Truth**: Webhook is authoritative
- **Idempotency**: Safe to retry without duplicate processing
- **No Premature Cart Clearing**: Cart only cleared after payment webhook confirmation

#### 3. **Order Status Transitions (Day 5-6)**
- Optimized for concurrent request safety
- Proper handling of edge cases (race conditions, network failures)

## Database Schema

### New Models Added

#### PasswordReset
```
id          String   @id @default(cuid())
userId      String   @map("user_id")
token       String   @unique
expiresAt   DateTime @map("expires_at")
createdAt   DateTime @default(now())
```
**Used for**: Password reset functionality

#### InventoryLock
```
id        String   @id @default(cuid())
productId String   @map("product_id")
orderId   String?  @map("order_id")  // Optional - can be created without order
quantity  Int
expiresAt DateTime @map("expires_at")
createdAt DateTime @default(now())
```
**Used for**: Time-based inventory reservation

### Schema Updates

**Product Model** - Field Changes:
- `stock` → `stockQuantity`
- `lowStockThreshold` added
- `inventoryLocks` relation added

**Order Model** - Relation Updates:
- Added `inventoryLocks` relation

**Payment Model** - Field Addition:
- Changed status enum from PENDING/PAID/FAILED/REFUNDED to match PaymentStatus enum

## Implementation Details

### 1. Inventory Management (`backend/src/utils/inventory.ts`)

#### Main Functions

```typescript
lockInventory(orderId, items)
- Reserves inventory for 15 minutes
- Validates stock availability against locked amounts
- Returns: boolean
- Throws: AppError if insufficient stock

confirmInventoryDeduction(orderId)
- Permanently decreases stock after payment confirmed
- Deletes inventory locks for the order
- Called by payment webhook handler
- Atomic operation (transaction)

releaseInventoryLocks(orderId)
- Releases locks without decreasing stock
- Called when payment fails or order is cancelled
- Stock remains unchanged

restockInventory(orderId)
- Increases stock for cancelled/returned orders
- Fetches items from OrderItem records
- Handles refunds automatically

cleanupExpiredLocks()
- Removes expired locks (run periodically)
- Should be called every 5 minutes
- Returns: count of cleaned locks

getAvailableInventory(productId)
- Returns: available quantity = stock - locked
- Only counts non-expired locks

getInventoryStatus(productIds)
- Returns object with available/total for each product
```

### 2. Payment Processing (`backend/src/controllers/payment.controller.ts`)

#### Payment States

```
PENDING (initial)
  ↓
PAID (after signature verification)
  ↓
REFUNDED (if refund requested)
```

#### Endpoints

##### POST `/api/payments/create`
- Creates Razorpay order
- Returns payment details for frontend
- Idempotent (returns existing payment if already created)

Request:
```json
{ "orderId": "uuid" }
```

Response:
```json
{
  "success": true,
  "paymentId": "uuid",
  "razorpayOrderId": "order_xyz",
  "amount": 50000,
  "currency": "INR",
  "key": "rzp_live_xxx"
}
```

##### POST `/api/payments/verify`
- Verifies signature from Razorpay
- Updates payment status to PAID
- Called from frontend after payment

Request:
```json
{
  "orderId": "uuid",
  "razorpayPaymentId": "pay_xyz",
  "razorpaySignature": "hex_string"
}
```

##### POST `/api/payments/webhook` (NO AUTH)
- Receives webhook from Razorpay
- Authoritative source for payment status
- Triggers:
  1. Inventory deduction
  2. Cart clearing
  3. Order status update
  4. Notification creation

**Webhook Security**:
- Signature verified using HMAC-SHA256
- Raw request body captured
- MUST be placed before express.json() middleware

##### POST `/api/payments/refund`
- Refunds a completed payment
- Called by admin during return approval
- Can only refund PAID payments

### 3. Order Processing (`backend/src/controllers/order.controller.ts`)

#### Checkout Flow

1. **POST `/api/orders/checkout`**
   - Validates cart is not empty
   - Validates addresses belong to user
   - Creates order with status PENDING
   - **Locks inventory** for 15 minutes
   - **Does NOT clear cart** (wait for payment)

   Request:
   ```json
   {
     "shippingAddressId": "uuid",
     "billingAddressId": "uuid"
   }
   ```

#### Order Lifecycle

```
PENDING ─→ PROCESSING ─→ SHIPPED ─→ DELIVERED
   ↓            ↓
 CANCELLED   RETURNED
```

#### Status Management

- `PENDING`: Order created, awaiting payment
- `PROCESSING`: Payment confirmed, preparing shipment
- `SHIPPED`: Order shipped with tracking number
- `DELIVERED`: Confirmed delivered
- `CANCELLED`: Order cancelled before shipping
- `RETURNED`: Customer initiated return

### 4. Server Setup (`backend/src/server.ts`)

#### Middleware Order (CRITICAL)

```typescript
1. rawBodyMiddleware         // Captures raw request body
2. express.raw()             // Webhook route only
3. express.json()            // All other routes
4. express.urlencoded()
5. CORS
6. Static files
7. Routes
8. Error handling
```

**Why**: Razorpay signature verification requires exact original request body. JSON middleware modifies the stream.

## API Workflow

### Complete Payment Flow

#### Step 1: User Adds to Cart
```
POST /api/cart
├─ Adds items to CartItem table
└─ No inventory changes yet
```

#### Step 2: User Initiates Checkout
```
POST /api/orders/checkout
├─ Creates Order (PENDING status)
├─ Creates OrderItems
├─ Locks inventory for 15 minutes
└─ Response includes orderId
```

#### Step 3: User Proceeds to Payment
```
POST /api/payments/create
├─ Creates Razorpay order
├─ Stores in Payment table
└─ Returns razorpay order ID
```

#### Step 4: User Completes Payment (Frontend)
```
Razorpay.open()
├─ User enters card details
└─ Razorpay processes payment
```

#### Step 5: Frontend Verifies Signature
```
POST /api/payments/verify
├─ Verifies HMAC signature
├─ Updates payment status to PAID
└─ Wait for webhook confirmation
```

#### Step 6: Razorpay Sends Webhook
```
POST /api/payments/webhook (NO AUTH)
├─ Verify signature (HMAC-SHA256)
├─ Deduct inventory (permanent)
├─ Clear user's cart
├─ Update order to PROCESSING
└─ Create notification
```

#### Step 7: Query Payment Status (Optional)
```
GET /api/payments/:orderId
└─ Returns current payment status
```

## Time-Based Inventory Locking Details

### Lock Expiration Handling

1. **During Checkout**: When inventory is locked, all calculations account for locked quantities
2. **After 15 minutes**: If no payment received, locks automatically expire
3. **On Payment Confirmation**: Locks are converted to permanent stock deduction
4. **Cleanup Task**: Expired locks can be cleaned up (cron job)

### Example Scenario

```
Product A: 10 items in stock

Time 00:00 - User 1 locks 5 items (Cart checkout)
├─ Lock expires at 00:15
└─ Available for others: 5 items

Time 00:05 - User 2 locks 6 items (Cart checkout)
├─ Lock expires at 00:20
└─ Available for User 3: 4 items (10 - 5 - 1 locked for User 2)

Time 00:08 - User 1 confirms payment
├─ Stock deduced by 5
├─ Inventory Lock deleted
├─ Available: 5 items (10 - 5)

Time 00:10 - User 2 confirms payment
├─ Stock deduced by 6
├─ Inventory Lock deleted
├─ Available: -1 items (ERROR - should have been prevented)
```

**Prevention**: `lockInventory()` checks available inventory including already-locked items before allowing new locks.

## Error Handling

### Payment Errors

1. **Invalid Order**: Returns 404
2. **Already Paid**: Returns idempotent response (safe to retry)
3. **Signature Mismatch**: Returns 400, payment marked as failed
4. **Webhook Timeout**: Retry mechanism in place

### Inventory Errors

1. **Insufficient Stock**: Order deleted, error thrown immediately
2. **Expired Lock**: Automatically cleaned, doesn't affect user experience
3. **Concurrent Checkout**: Prevented by stock validation during lock creation

## Environment Variables

```env
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx_secret
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db
```

## Database Migrations

Run this to apply schema changes:

```bash
cd backend
npx prisma migrate dev --name add_inventory_and_password_reset
npm run build
```

## Testing Checklist

- [ ] Create order without payment
- [ ] Verify inventory is locked
- [ ] Complete payment successfully
- [ ] Verify inventory deducted
- [ ] Verify cart cleared
- [ ] Try purchasing same item twice concurrently
- [ ] Test payment signature verification
- [ ] Test webhook retry (simulate network delay)
- [ ] Test inventory cleanup (wait 15+ minutes)
- [ ] Test refund flow
- [ ] Test order cancellation

## Performance Considerations

### Inventory Lookup (O(1))
```sql
SELECT stock FROM products WHERE id = ?
SELECT SUM(quantity) FROM inventory_locks 
WHERE product_id = ? AND expires_at > NOW()
```

### Payment Processing (Transaction)
```sql
BEGIN
  UPDATE payments SET status = PAID
  UPDATE orders SET status = PROCESSING
  UPDATE products SET stock = stock - qty (for each item)
  DELETE FROM inventory_locks WHERE order_id = ?
  DELETE FROM cart_items WHERE user_id = ?
  INSERT INTO notifications
COMMIT
```

### Indexes Required
```sql
CREATE INDEX idx_inventory_lock_expires ON inventory_locks(expires_at)
CREATE INDEX idx_inventory_lock_product ON inventory_locks(product_id)
CREATE INDEX idx_inventory_lock_order ON inventory_locks(order_id)
CREATE INDEX idx_payment_order ON payments(order_id)
CREATE INDEX idx_order_user ON orders(user_id)
```

## Security Considerations

1. **Webhook Signature Verification**: Always verify before processing
2. **Idempotency Keys**: Prevent duplicate processing
3. **Transaction Isolation**: Use database transactions
4. **Rate Limiting**: Apply to webhook endpoint
5. **Raw Body Capture**: Required for signature verification
6. **No SQL Injection**: Using Prisma ORM (parameterized queries)

## Monitoring & Logging

Key points to log:

```typescript
[Inventory Lock]
- lockInventory(orderId, items)
- releaseInventoryLocks(orderId)
- cleanupExpiredLocks() - count cleaned

[Payment]
- createPayment(orderId) - Razorpay order created
- verifyPayment(orderId) - Signature verified
- webhook - Each state transition

[Order]
- checkout() - Order created
- Payment confirmed - Status updated
```

## Future Enhancements

1. **Automatic Cleanup Job**: Cron task every 5 minutes
2. **Inventory Alerts**: Notify admin when stock < threshold
3. **Payment Retry Logic**: Automatic webhook retry
4. **Analytics**: Track payment failures, lock expirations
5. **Inventory Reservations**: Pre-order handling
6. **Multi-warehouse**: Support multiple inventory locations

## References

- [Razorpay Payment Integration](https://razorpay.com/docs)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [HMAC Signature Verification](https://en.wikipedia.org/wiki/HMAC)
