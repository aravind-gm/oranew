# ORA E-COMMERCE — IMPLEMENTATION SNIPPETS

> These are code templates to accelerate Phase 1 (Payment Integration). Copy, adapt, and test locally before production.

---

## 1. Backend: Payment Controller Implementation

### File: `src/controllers/payment.controller.ts`

```typescript
import { NextFunction, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Razorpay from 'razorpay';

// Initialize Razorpay (add to src/server.ts)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ============================================
// CREATE RAZORPAY PAYMENT ORDER
// ============================================
export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new AppError('Order ID required', 400);
    }

    // Get order with validation
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify user owns order
    if (order.userId !== req.user!.id) {
      throw new AppError('Unauthorized', 403);
    }

    // Verify order status is PENDING
    if (order.status !== 'PENDING') {
      throw new AppError('Order cannot be paid', 400);
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount.toNumber() * 100), // Convert to paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        customerId: order.userId,
      },
    });

    // Create Payment record in database
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        paymentGateway: 'RAZORPAY',
        amount: order.totalAmount,
        currency: 'INR',
        status: 'PENDING',
        gatewayResponse: {
          razorpayOrderId: razorpayOrder.id,
          createdAt: new Date(),
        },
      },
    });

    // Response with Razorpay details
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VERIFY PAYMENT SIGNATURE (CLIENT-SIDE VERIFICATION)
// ============================================
export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;

    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError('Missing payment verification data', 400);
    }

    // Get order to verify it's valid
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== req.user!.id) {
      throw new AppError('Unauthorized', 403);
    }

    // CRITICAL: Verify signature using Razorpay key
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Signature is valid - frontend can proceed
    // IMPORTANT: Do NOT update order status here
    // Wait for webhook from Razorpay (which is the source of truth)

    res.json({
      success: true,
      message: 'Signature verified. Awaiting webhook confirmation.',
      orderId,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RAZORPAY WEBHOOK HANDLER (CRITICAL)
// ============================================
export const webhook = async (
  req: any, // Not AuthRequest - webhook has no auth
  res: Response,
  next: NextFunction
) => {
  try {
    // CRITICAL: Webhook body must be RAW, not parsed JSON
    // Express middleware must preserve raw body for signature verification
    const webhookSignature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody; // Set by middleware

    if (!webhookSignature || !rawBody) {
      return res.status(400).json({ error: 'Invalid webhook' });
    }

    // CRITICAL: Verify webhook signature
    const shasum = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET!);
    shasum.update(rawBody);
    const digest = shasum.digest('hex');

    if (digest !== webhookSignature) {
      console.warn('❌ Webhook signature verification failed', {
        expected: digest,
        received: webhookSignature,
      });
      return res.status(403).json({ error: 'Signature verification failed' });
    }

    // Signature verified - safe to process
    const event = req.body;
    const { event: eventType, payload } = event;

    console.log(`✅ Webhook verified: ${eventType}`);

    // Handle different webhook events
    if (eventType === 'payment.authorized' || eventType === 'payment.captured') {
      await handlePaymentSuccess(payload.payment);
    } else if (eventType === 'payment.failed') {
      await handlePaymentFailed(payload.payment);
    } else if (eventType === 'refund.created') {
      await handleRefundCreated(payload.refund);
    }

    // CRITICAL: Return 200 OK to Razorpay to acknowledge receipt
    // Razorpay will retry if we don't return 200
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Razorpay retries
    return res.status(200).json({ received: true });
  }
};

// ============================================
// PAYMENT SUCCESS HANDLER
// ============================================
async function handlePaymentSuccess(payment: any) {
  const { order_id: razorpayOrderId, id: paymentId, amount } = payment;

  // Find order by Razorpay order ID
  const order = await prisma.order.findFirst({
    where: {
      payments: {
        some: {
          gatewayResponse: {
            path: ['razorpayOrderId'],
            equals: razorpayOrderId,
          },
        },
      },
    },
    include: {
      items: true,
      user: true,
    },
  });

  if (!order) {
    console.warn(`Order not found for Razorpay order ${razorpayOrderId}`);
    return;
  }

  // CRITICAL: Check for duplicate payment (idempotency)
  const existingPayment = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
      transactionId: paymentId,
    },
  });

  if (existingPayment?.status === 'PAID') {
    console.log(`Payment already processed: ${paymentId}`);
    return;
  }

  // Update Payment record
  await prisma.payment.updateMany({
    where: {
      orderId: order.id,
      status: 'PENDING',
    },
    data: {
      status: 'PAID',
      transactionId: paymentId,
      gatewayResponse: {
        razorpayOrderId,
        paymentId,
        status: 'captured',
        amount,
        webhookReceivedAt: new Date(),
      },
    },
  });

  // Update Order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PAID',
      paymentStatus: 'PAID',
      updatedAt: new Date(),
    },
  });

  // CRITICAL: Deduct inventory ONLY on payment success
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stockQuantity: {
          decrement: item.quantity,
        },
      },
    });
  }

  // Release inventory locks
  await prisma.inventoryLock.deleteMany({
    where: { orderId: order.id },
  });

  // Clear cart
  await prisma.cartItem.deleteMany({
    where: { userId: order.userId },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed',
      message: `Your order ${order.orderNumber} has been confirmed and paid.`,
      metadata: { orderId: order.id },
    },
  });

  // Send email (optional - can fail without breaking webhook)
  try {
    const { sendEmail, getOrderConfirmationTemplate } = await import(
      '../utils/email'
    );
    await sendEmail({
      to: order.user!.email,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: getOrderConfirmationTemplate(order.orderNumber, order.totalAmount.toNumber()),
    });
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
  }

  console.log(`✅ Payment SUCCESS processed for order ${order.id}`);
}

// ============================================
// PAYMENT FAILED HANDLER
// ============================================
async function handlePaymentFailed(payment: any) {
  const { order_id: razorpayOrderId, id: paymentId } = payment;

  const order = await prisma.order.findFirst({
    where: {
      payments: {
        some: {
          gatewayResponse: {
            path: ['razorpayOrderId'],
            equals: razorpayOrderId,
          },
        },
      },
    },
    include: { user: true },
  });

  if (!order) return;

  // Update Payment record
  await prisma.payment.updateMany({
    where: {
      orderId: order.id,
      status: 'PENDING',
    },
    data: {
      status: 'FAILED',
      transactionId: paymentId,
    },
  });

  // Update Order (keep status PENDING to allow retry)
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'FAILED',
    },
  });

  // Release inventory locks
  await prisma.inventoryLock.deleteMany({
    where: { orderId: order.id },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: 'ORDER_FAILED',
      title: 'Payment Failed',
      message: `Payment for order ${order.orderNumber} failed. Please try again.`,
      metadata: { orderId: order.id },
    },
  });

  console.log(`❌ Payment FAILED for order ${order.id}`);
}

// ============================================
// REFUND HANDLER
// ============================================
async function handleRefundCreated(refund: any) {
  const { payment_id: paymentId } = refund;

  const payment = await prisma.payment.findUnique({
    where: { transactionId: paymentId },
    include: { order: true },
  });

  if (!payment) return;

  // Update Payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'REFUNDED',
      gatewayResponse: {
        ...payment.gatewayResponse,
        refundId: refund.id,
        refundedAt: new Date(),
      },
    },
  });

  // Update Order
  await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      status: 'RETURNED',
    },
  });

  console.log(`✅ Refund processed: ${refund.id}`);
}

// ============================================
// GET PAYMENT STATUS
// ============================================
export const getPaymentStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        order: {
          id: orderId,
          userId: req.user!.id, // Verify ownership
        },
      },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 2. Backend: Raw Body Middleware

### File: `src/middleware/rawBodyParser.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

// Middleware to capture raw body for webhook signature verification
export const rawBodyParser = bodyParser.raw({ type: 'application/json' });

// Middleware to attach raw body to request object
export const attachRawBody = (req: any, res: Response, next: NextFunction) => {
  req.rawBody = req.body;
  
  if (typeof req.body === 'string') {
    req.rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString();
  }
  
  next();
};
```

### Update File: `src/server.ts`

```typescript
import { rawBodyParser, attachRawBody } from './middleware/rawBodyParser';

// CRITICAL: Parse raw body for webhook BEFORE JSON parser
app.post('/api/payments/webhook', rawBodyParser, attachRawBody, paymentWebhook);

// Then parse JSON normally for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

---

## 3. Backend: Inventory Management

### File: `src/utils/inventory.ts`

```typescript
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// ============================================
// VALIDATE STOCK AVAILABILITY
// ============================================
export const validateStock = async (
  items: { productId: string; quantity: number }[]
): Promise<boolean> => {
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new AppError(`Product ${item.productId} not found`, 404);
    }

    // Get available stock (committed - locked)
    const locks = await prisma.inventoryLock.aggregate({
      where: {
        productId: item.productId,
        expiresAt: { gt: new Date() },
      },
      _sum: { quantity: true },
    });

    const lockedQuantity = locks._sum.quantity || 0;
    const availableStock = product.stockQuantity - lockedQuantity;

    if (availableStock < item.quantity) {
      throw new AppError(
        `Insufficient stock for ${product.name}. Only ${availableStock} available.`,
        400
      );
    }
  }

  return true;
};

// ============================================
// LOCK INVENTORY (DURING CHECKOUT)
// ============================================
export const lockInventory = async (
  orderId: string,
  items: { productId: string; quantity: number }[]
): Promise<void> => {
  // Lock inventory for 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  for (const item of items) {
    await prisma.inventoryLock.create({
      data: {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        expiresAt,
      },
    });
  }
};

// ============================================
// DEDUCT INVENTORY (ON PAYMENT SUCCESS)
// ============================================
export const deductInventory = async (
  orderId: string,
  items: { productId: string; quantity: number }[]
): Promise<void> => {
  for (const item of items) {
    // Deduct from stock
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stockQuantity: {
          decrement: item.quantity,
        },
      },
    });

    // Remove lock
    await prisma.inventoryLock.deleteMany({
      where: {
        orderId,
        productId: item.productId,
      },
    });
  }
};

// ============================================
// RELEASE LOCKS (ON PAYMENT FAILURE OR TIMEOUT)
// ============================================
export const releaseLocks = async (orderId: string): Promise<void> => {
  await prisma.inventoryLock.deleteMany({
    where: { orderId },
  });
};

// ============================================
// RESTOCK INVENTORY (ON RETURN APPROVAL)
// ============================================
export const restockInventory = async (
  orderItems: { productId: string; quantity: number }[]
): Promise<void> => {
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stockQuantity: {
          increment: item.quantity,
        },
      },
    });
  }
};

// ============================================
// CLEANUP EXPIRED LOCKS (RUN AS CRON JOB)
// ============================================
export const cleanupExpiredLocks = async (): Promise<number> => {
  const expired = await prisma.inventoryLock.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  console.log(`🧹 Cleaned up ${expired.count} expired inventory locks`);
  return expired.count;
};
```

### Add to `src/server.ts`:

```typescript
// Cleanup expired locks every 5 minutes
setInterval(async () => {
  try {
    await cleanupExpiredLocks();
  } catch (error) {
    console.error('Error cleaning up expired locks:', error);
  }
}, 5 * 60 * 1000);
```

---

## 4. Backend: Update Order Controller

### Update File: `src/controllers/order.controller.ts`

```typescript
// Update the checkout function:

export const checkout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shippingAddressId, billingAddressId } = req.body;

    // Validate addresses
    if (!shippingAddressId || !billingAddressId) {
      throw new AppError('Shipping and billing address required', 400);
    }

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: { images: true },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // VALIDATE STOCK FIRST
    const { validateStock, lockInventory } = await import('../utils/inventory');
    await validateStock(
      cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    // Calculate totals
    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.product.finalPrice.toNumber() * item.quantity;
    }

    const gstAmount = calculateGST(subtotal);
    const shippingFee = subtotal >= 1000 ? 0 : 50;
    const totalAmount = subtotal + gstAmount + shippingFee;

    // Create order with status PENDING (not PAID yet)
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user!.id,
        subtotal,
        gstAmount,
        shippingFee,
        totalAmount,
        shippingAddressId,
        billingAddressId,
        status: 'PENDING', // Explicitly set PENDING
        paymentStatus: 'PENDING',
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images?.[0]?.imageUrl || '',
            quantity: item.quantity,
            unitPrice: item.product.finalPrice,
            gstRate: 3,
            totalPrice:
              item.product.finalPrice.toNumber() * item.quantity,
          })),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // LOCK INVENTORY (expires in 15 min)
    await lockInventory(
      order.id,
      cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    // DO NOT CLEAR CART YET - wait for payment confirmation via webhook

    // Create notification (payment pending)
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'ORDER_PLACED',
        title: 'Order Placed',
        message: `Order ${order.orderNumber} created. Proceed to payment.`,
        metadata: { orderId: order.id },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items,
          shippingAddress: order.shippingAddress,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new function to clear cart (called only from webhook)
export const clearCart = async (userId: string): Promise<void> => {
  await prisma.cartItem.deleteMany({
    where: { userId },
  });
};
```

---

## 5. Frontend: Payment Page

### File: `frontend/src/app/checkout/payment/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface RazorpayWindow extends Window {
  Razorpay: any;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId || !user) {
      router.push('/checkout');
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Failed to load order');
        router.push('/checkout');
      }
    };

    fetchOrder();
  }, [orderId, user, router]);

  const handlePayment = async () => {
    if (!order || !user) return;

    setLoading(true);

    try {
      // Step 1: Create Razorpay payment order
      const paymentRes = await api.post('/payments/create', {
        orderId: order.id,
        amount: order.totalAmount,
      });

      const {
        razorpayOrderId,
        razorpayKeyId,
        amount,
      } = paymentRes.data.data;

      // Step 2: Open Razorpay modal
      const Razorpay = (window as RazorpayWindow).Razorpay;

      const options = {
        key: razorpayKeyId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'ORA Jewellery',
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment on backend
            const verifyRes = await api.post('/payments/verify', {
              orderId: order.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              // Step 4: Poll for webhook confirmation
              let paymentConfirmed = false;
              let attempts = 0;

              while (!paymentConfirmed && attempts < 30) {
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const statusRes = await api.get(
                  `/payments/${order.id}`
                );

                if (
                  statusRes.data.data.status === 'PAID'
                ) {
                  paymentConfirmed = true;
                  toast.success('Payment successful!');
                  router.push(
                    `/checkout/success?orderId=${order.id}`
                  );
                }

                attempts++;
              }

              if (!paymentConfirmed) {
                toast.error(
                  'Payment processing delayed. Check your orders.'
                );
                router.push('/account/orders');
              }
            }
          } catch (error) {
            console.error('Verification failed:', error);
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            toast.error('Payment cancelled');
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment creation failed:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return <div className="p-8 text-center">Loading order...</div>;
  }

  return (
    <>
      {/* Razorpay SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Order Summary</h1>

          <div className="space-y-4 mb-8 border-b pb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (3%):</span>
              <span>₹{order.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>₹{order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold">Shipping Address:</h3>
            <p className="text-sm text-gray-600">
              {order.shippingAddress?.addressLine1}
              <br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
              {order.shippingAddress?.pincode}
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? 'Processing...' : 'Pay with Razorpay'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Secure payment by Razorpay
          </p>
        </div>
      </div>
    </>
  );
}
```

---

## 6. Frontend: Payment Success Page

### File: `frontend/src/app/checkout/success/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h1>Order not found</h1>
        <Link href="/" className="text-blue-600">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Thank you for your purchase
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-lg font-bold">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="text-lg font-bold">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-2">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between py-2">
                  <span>
                    {item.productName} x {item.quantity}
                  </span>
                  <span>₹{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST:</span>
              <span>₹{order.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>₹{order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold bg-gray-50 p-2 rounded">
              <span>Total:</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
          <h3 className="font-semibold mb-3">Shipping Address</h3>
          <p className="text-sm">
            {order.shippingAddress?.fullName}
            <br />
            {order.shippingAddress?.addressLine1}
            <br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
            {order.shippingAddress?.pincode}
            <br />
            {order.shippingAddress?.phone}
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 rounded-lg p-6 mb-8 border border-green-200">
          <h3 className="font-semibold mb-2">What's Next?</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ Order confirmation email sent to your inbox</li>
            <li>✓ We're processing your order</li>
            <li>✓ You'll receive shipping notification within 24 hours</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href={`/account/orders/${order.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-center transition"
          >
            View Order Details
          </Link>
          <Link
            href="/products"
            className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-lg text-center transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Prisma Migration

### File: `prisma/migrations/20260109_add_payment_features/migration.sql`

```sql
-- Add InventoryLock table
CREATE TABLE "inventory_locks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_locks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE,
    CONSTRAINT "inventory_locks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE,
    UNIQUE KEY "inventory_locks_order_id_product_id_key"("order_id", "product_id")
);

-- Add PasswordReset table
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX "inventory_locks_order_id_idx" ON "inventory_locks"("order_id");
CREATE INDEX "inventory_locks_product_id_idx" ON "inventory_locks"("product_id");
CREATE INDEX "inventory_locks_expires_at_idx" ON "inventory_locks"("expires_at");
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");
```

---

## Critical Environment Variables

```bash
# .env (never commit this file)

# ============== PAYMENT ==============
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx_secret
WEBHOOK_SECRET=generate_secure_random_token_here

# ============== DATABASE ==============
DATABASE_URL=postgresql://user:password@localhost:5432/oradb

# ============== JWT ==============
JWT_SECRET=your-super-secret-jwt-key-min-64-characters-long-here
JWT_EXPIRY=7d

# ============== CLOUDINARY ==============
CLOUDINARY_NAME=your_account
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# ============== EMAIL ==============
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@orashop.in
SMTP_PASS=your_app_password_here
SMTP_FROM=noreply@orashop.in

# ============== FRONTEND ==============
FRONTEND_URL=http://localhost:3000

# ============== NODE ==============
NODE_ENV=development
PORT=5000
```

---

## Testing Checklist

```bash
# 1. Setup
npm install razorpay
npm run prisma:migrate

# 2. Start services
npm run dev  # backend
npm run dev  # frontend (in separate terminal)

# 3. Test payment flow
- Register account
- Add products to cart
- Proceed to checkout
- Select addresses
- Click "Pay with Razorpay"
- Use test card: 4111 1111 1111 1111, exp: any future date, CVV: any 3 digits
- Complete payment
- Verify order in database
- Check email received
- Verify inventory deducted

# 4. Check logs
# Backend logs should show:
# ✅ Webhook verified: payment.authorized
# ✅ Payment SUCCESS processed for order xxx

# 5. Verify database
SELECT status, payment_status FROM orders WHERE id = 'xxx';
SELECT * FROM inventory_locks WHERE order_id = 'xxx';  -- should be empty (deducted)
```

---

These snippets are production-ready but should be tested locally first. Adapt the Razorpay key configuration and email settings to your environment.
