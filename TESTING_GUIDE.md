# Testing Guide: Inventory & Payment Implementation

## Test Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- Razorpay test account
- Postman or similar API testing tool

### Environment Variables for Testing

Create `.env.test`:

```env
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost/ora_test
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx_secret_test
FRONTEND_URL=http://localhost:3000
```

### Database Reset

```bash
# Clear test database
npx prisma migrate reset --force

# Seed with test data
npx ts-node prisma/seed.ts
```

## Test Suites

### 1. Inventory Management Tests

```typescript
// tests/inventory.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '../src/config/database';
import {
  lockInventory,
  confirmInventoryDeduction,
  releaseInventoryLocks,
  getAvailableInventory,
  cleanupExpiredLocks,
} from '../src/utils/inventory';

describe('Inventory Management', () => {
  let productId: string;
  let orderId: string;

  beforeEach(async () => {
    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Ring',
        slug: 'test-ring',
        sku: 'TEST-001',
        price: new Decimal(5000),
        finalPrice: new Decimal(5000),
        stockQuantity: 10,
        categoryId: 'test-category-id',
      },
    });
    productId = product.id;

    // Create test order
    const order = await prisma.order.create({
      data: {
        orderNumber: 'TEST-001',
        userId: 'test-user-id',
        subtotal: new Decimal(5000),
        gstAmount: new Decimal(150),
        shippingFee: new Decimal(0),
        totalAmount: new Decimal(5150),
        shippingAddressId: 'test-addr-id',
        billingAddressId: 'test-addr-id',
      },
    });
    orderId = order.id;
  });

  describe('lockInventory', () => {
    it('should lock inventory successfully', async () => {
      const result = await lockInventory(orderId, [
        { productId, quantity: 3 },
      ]);

      expect(result).toBe(true);

      // Verify lock was created
      const locks = await prisma.inventoryLock.findMany({
        where: { orderId },
      });
      expect(locks).toHaveLength(1);
      expect(locks[0].quantity).toBe(3);
    });

    it('should throw error on insufficient stock', async () => {
      await expect(
        lockInventory(orderId, [{ productId, quantity: 20 }])
      ).rejects.toThrow('Insufficient stock');
    });

    it('should account for already-locked inventory', async () => {
      // Lock 7 items first
      await lockInventory('order-1', [{ productId, quantity: 7 }]);

      // Try to lock 4 more (total would be 11, exceeds stock of 10)
      await expect(
        lockInventory('order-2', [{ productId, quantity: 4 }])
      ).rejects.toThrow('Insufficient stock');

      // Lock 3 should succeed (total 10)
      const result = await lockInventory('order-2', [
        { productId, quantity: 3 },
      ]);
      expect(result).toBe(true);
    });

    it('should create multiple locks for multiple items', async () => {
      const product2 = await prisma.product.create({
        data: {
          name: 'Test Bracelet',
          slug: 'test-bracelet',
          sku: 'TEST-002',
          price: new Decimal(3000),
          finalPrice: new Decimal(3000),
          stockQuantity: 5,
          categoryId: 'test-category-id',
        },
      });

      const result = await lockInventory(orderId, [
        { productId, quantity: 2 },
        { productId: product2.id, quantity: 2 },
      ]);

      expect(result).toBe(true);

      const locks = await prisma.inventoryLock.findMany({
        where: { orderId },
      });
      expect(locks).toHaveLength(2);
    });
  });

  describe('confirmInventoryDeduction', () => {
    it('should deduct inventory and delete locks', async () => {
      // Lock inventory
      await lockInventory(orderId, [{ productId, quantity: 3 }]);

      // Create order items
      await prisma.orderItem.create({
        data: {
          orderId,
          productId,
          productName: 'Test Ring',
          quantity: 3,
          unitPrice: new Decimal(5000),
          gstRate: new Decimal(3),
          discount: new Decimal(0),
          totalPrice: new Decimal(15000),
        },
      });

      // Confirm deduction
      await confirmInventoryDeduction(orderId);

      // Verify stock was deducted
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      expect(product?.stockQuantity).toBe(7); // 10 - 3

      // Verify locks were deleted
      const locks = await prisma.inventoryLock.findMany({
        where: { orderId },
      });
      expect(locks).toHaveLength(0);
    });

    it('should be idempotent', async () => {
      // Lock and deduct once
      await lockInventory(orderId, [{ productId, quantity: 3 }]);
      await confirmInventoryDeduction(orderId);

      const product1 = await prisma.product.findUnique({
        where: { id: productId },
      });
      const stock1 = product1?.stockQuantity;

      // Call again
      await confirmInventoryDeduction(orderId);

      const product2 = await prisma.product.findUnique({
        where: { id: productId },
      });
      const stock2 = product2?.stockQuantity;

      expect(stock1).toBe(stock2);
    });
  });

  describe('releaseInventoryLocks', () => {
    it('should release locks without deducting stock', async () => {
      // Lock inventory
      await lockInventory(orderId, [{ productId, quantity: 3 }]);

      const stockBefore = (
        await prisma.product.findUnique({ where: { id: productId } })
      )?.stockQuantity;

      // Release locks
      await releaseInventoryLocks(orderId);

      // Verify stock unchanged
      const stockAfter = (
        await prisma.product.findUnique({ where: { id: productId } })
      )?.stockQuantity;
      expect(stockBefore).toBe(stockAfter);

      // Verify locks deleted
      const locks = await prisma.inventoryLock.findMany({
        where: { orderId },
      });
      expect(locks).toHaveLength(0);
    });
  });

  describe('getAvailableInventory', () => {
    it('should return available inventory accounting for locks', async () => {
      // Initial available = 10
      let available = await getAvailableInventory(productId);
      expect(available).toBe(10);

      // Lock 3 items
      await lockInventory(orderId, [{ productId, quantity: 3 }]);

      // Available should be 7
      available = await getAvailableInventory(productId);
      expect(available).toBe(7);

      // Deduct stock by 2 (outside of this lock)
      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: { decrement: 2 } },
      });

      // Available should be 5 (8 stock - 3 locked)
      available = await getAvailableInventory(productId);
      expect(available).toBe(5);
    });
  });

  describe('cleanupExpiredLocks', () => {
    it('should delete expired locks', async () => {
      // Create expired lock manually
      await prisma.inventoryLock.create({
        data: {
          productId,
          quantity: 2,
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      // Create non-expired lock
      await prisma.inventoryLock.create({
        data: {
          productId,
          quantity: 1,
          expiresAt: new Date(Date.now() + 60000), // Expires in 60s
        },
      });

      // Cleanup
      const count = await cleanupExpiredLocks();

      expect(count).toBe(1);

      const locks = await prisma.inventoryLock.findMany({
        where: { productId },
      });
      expect(locks).toHaveLength(1);
      expect(locks[0].quantity).toBe(1);
    });
  });
});
```

### 2. Payment Processing Tests

```typescript
// tests/payment.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/server';
import { prisma } from '../src/config/database';
import crypto from 'crypto';

describe('Payment Processing', () => {
  let userId: string;
  let orderId: string;
  let paymentId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        fullName: 'Test User',
        phone: '1234567890',
      },
    });
    userId = user.id;

    // Create test order
    const order = await prisma.order.create({
      data: {
        orderNumber: 'TEST-ORDER-001',
        userId,
        subtotal: new Decimal(5000),
        gstAmount: new Decimal(150),
        shippingFee: new Decimal(0),
        totalAmount: new Decimal(5150),
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
      },
    });
    orderId = order.id;
  });

  describe('POST /api/payments/create', () => {
    it('should create a payment order', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ orderId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.razorpayOrderId).toBeDefined();
      expect(response.body.amount).toBe(515000); // 5150 * 100 in paise
    });

    it('should be idempotent', async () => {
      const response1 = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ orderId });

      const response2 = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ orderId });

      expect(response1.body.paymentId).toBe(response2.body.paymentId);
    });

    it('should reject invalid order', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ orderId: 'invalid-id' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/payments/verify', () => {
    beforeEach(async () => {
      // Create payment first
      const payment = await prisma.payment.create({
        data: {
          orderId,
          paymentGateway: 'RAZORPAY',
          transactionId: 'order_123',
          amount: new Decimal(5150),
          status: 'PENDING',
        },
      });
      paymentId = payment.id;
    });

    it('should verify payment signature', async () => {
      const razorpayPaymentId = 'pay_123';
      const body = `order_123|${razorpayPaymentId}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          orderId,
          razorpayPaymentId,
          razorpaySignature: signature,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify payment status updated
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });
      expect(payment?.status).toBe('PAID');
    });

    it('should reject invalid signature', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          orderId,
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'invalid_signature',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payments/webhook', () => {
    beforeEach(async () => {
      // Create payment and order item
      const payment = await prisma.payment.create({
        data: {
          orderId,
          paymentGateway: 'RAZORPAY',
          transactionId: 'order_123',
          amount: new Decimal(5150),
          status: 'PAID',
        },
      });

      const product = await prisma.product.create({
        data: {
          name: 'Test Ring',
          slug: 'test-ring',
          sku: 'TEST-001',
          price: new Decimal(5000),
          finalPrice: new Decimal(5000),
          stockQuantity: 10,
          categoryId: 'test-cat',
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId,
          productId: product.id,
          productName: 'Test Ring',
          quantity: 1,
          unitPrice: new Decimal(5000),
          gstRate: new Decimal(3),
          discount: new Decimal(0),
          totalPrice: new Decimal(5000),
        },
      });

      paymentId = payment.id;
    });

    it('should process webhook and confirm payment', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              order_id: 'order_123',
              amount: 515000,
              status: 'captured',
            },
          },
        },
      };

      const body = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);

      // Verify order status updated
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      expect(order?.status).toBe('PROCESSING');
      expect(order?.paymentStatus).toBe('PAID');

      // Verify cart cleared
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
      });
      expect(cartItems).toHaveLength(0);
    });

    it('should be idempotent for webhook retries', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              order_id: 'order_123',
              amount: 515000,
            },
          },
        },
      };

      const body = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

      // Send webhook twice
      await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(payload);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      // Verify stock only deducted once
      const product = await prisma.product.findFirst({
        where: { slug: 'test-ring' },
      });
      expect(product?.stockQuantity).toBe(9); // Should be 9, not 8
    });

    it('should reject invalid signature', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              order_id: 'order_123',
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature')
        .send(payload);

      expect(response.status).toBe(400);
    });
  });
});
```

### 3. Order Checkout Tests

```typescript
// tests/order.test.ts

describe('Order Checkout', () => {
  it('should create order and lock inventory', async () => {
    // Create cart item
    await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity: 2,
      },
    });

    const response = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');

    // Verify inventory locked
    const locks = await prisma.inventoryLock.findMany({
      where: { orderId: response.body.data.id },
    });
    expect(locks).toHaveLength(1);
    expect(locks[0].quantity).toBe(2);

    // Verify cart NOT cleared yet
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
    });
    expect(cartItems).toHaveLength(1);
  });

  it('should fail if inventory lock fails', async () => {
    // Create cart with more items than available
    await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity: 20, // Only 10 in stock
      },
    });

    const response = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
      });

    expect(response.status).toBe(400);

    // Verify order not created
    const orders = await prisma.order.findMany({
      where: { userId },
    });
    expect(orders).toHaveLength(0);
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/inventory.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Manual Testing with Postman

### 1. Create Order
```
POST /api/orders/checkout
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "shippingAddressId": "addr-uuid",
  "billingAddressId": "addr-uuid"
}

Expected: 201, Order with PENDING status
```

### 2. Create Payment
```
POST /api/payments/create
Headers:
  Authorization: Bearer <token>

Body:
{
  "orderId": "order-uuid"
}

Expected: 200, Razorpay order details
```

### 3. Verify Payment (Simulated)
```
POST /api/payments/verify
Headers:
  Authorization: Bearer <token>

Body:
{
  "orderId": "order-uuid",
  "razorpayPaymentId": "pay_xyz",
  "razorpaySignature": "hex_signature"
}

Note: Generate signature using:
  const crypto = require('crypto');
  const body = "order_id|pay_id";
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
```

### 4. Webhook (Curl for RAW body)
```bash
curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: <signature>" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","order_id":"order_123"}}}}'
```

## Stress Testing

```typescript
// Load test
import autocannon from 'autocannon';

async function loadTest() {
  const result = await autocannon({
    url: 'http://localhost:5000/api/products',
    connections: 100,
    pipelining: 10,
    duration: 30,
  });

  console.log(result);
}
```

## Test Checklist

### Inventory
- [ ] Lock inventory successfully
- [ ] Prevent locking more than available
- [ ] Account for already-locked items
- [ ] Release locks without deducting
- [ ] Confirm deduction (permanent)
- [ ] Cleanup expired locks
- [ ] Idempotent operations

### Payment
- [ ] Create payment order
- [ ] Verify signature correctly
- [ ] Reject invalid signatures
- [ ] Process webhook and update status
- [ ] Webhook idempotency
- [ ] Cart cleared on payment confirmation
- [ ] Inventory deducted on payment confirmation

### Order
- [ ] Create order with inventory lock
- [ ] Prevent checkout with insufficient stock
- [ ] Don't clear cart before payment
- [ ] Update order status on payment

### Concurrent Operations
- [ ] Multiple concurrent checkouts
- [ ] Prevent overselling
- [ ] Race condition handling
