/**
 * Payment Retry Controller
 *
 * Allows customers to retry a FAILED payment on the SAME order.
 * - No new order is created
 * - Stock reservation is preserved (InventoryLock still active)
 * - A short-lived token (15 min) validates the retry intent
 * - Cannot retry an already CONFIRMED or REFUNDED payment
 *
 * Routes:
 *   POST /api/payments/retry/token   → generate retry token
 *   POST /api/payments/retry/execute → use token to reinitialize Razorpay
 */

import crypto from 'crypto';
import { Response } from 'express';
import Razorpay from 'razorpay';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AppError, asyncHandler } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';
import { captureException } from '../config/sentry';

const RETRY_TOKEN_TTL_MINUTES = 15;

const getRazorpay = (): Razorpay => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new AppError('Payment gateway not configured', 500);
  if (process.env.NODE_ENV === 'production' && keyId.startsWith('rzp_test_')) {
    throw new AppError('FATAL: Production cannot use test keys', 500);
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/payments/retry/token
// Generate a short-lived retry token for a FAILED order
// ──────────────────────────────────────────────────────────────────────────────
export const generateRetryToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body;
  const userId = req.user?.id;

  if (!orderId) throw new AppError('Order ID is required', 400);

  const order = await withRetry(() =>
    prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
  );

  if (!order) throw new AppError('Order not found', 404);
  if (order.userId !== userId) throw new AppError('Access denied', 403);

  // Safety gates — cannot retry confirmed or refunded orders
  if (order.paymentStatus === 'CONFIRMED') {
    throw new AppError('This order has already been paid. No retry needed.', 409);
  }
  if (order.paymentStatus === 'REFUNDED') {
    throw new AppError('This order has been refunded and cannot be retried.', 409);
  }
  if (order.status === 'CANCELLED') {
    throw new AppError('This order has been cancelled and cannot be retried.', 409);
  }

  // Expire any existing unused tokens for this order (cleanup)
  await prisma.paymentRetryToken.updateMany({
    where: { orderId, used: false },
    data: { used: true },
  });

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RETRY_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.paymentRetryToken.create({
    data: { orderId, token, expiresAt },
  });

  res.json({
    success: true,
    data: {
      retryToken: token,
      expiresAt,
      orderId,
      totalAmount: order.totalAmount,
      orderNumber: order.orderNumber,
    },
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/payments/retry/execute
// Consume retry token → reinitialize Razorpay with the same internal order
// ──────────────────────────────────────────────────────────────────────────────
export const executeRetryPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { retryToken } = req.body;
  const userId = req.user?.id;

  if (!retryToken) throw new AppError('Retry token is required', 400);

  // Validate token
  const tokenRecord = await withRetry(() =>
    prisma.paymentRetryToken.findUnique({ where: { token: retryToken } })
  );

  if (!tokenRecord) throw new AppError('Invalid retry token', 400);
  if (tokenRecord.used) throw new AppError('Retry token has already been used', 400);
  if (new Date() > tokenRecord.expiresAt) {
    throw new AppError('Retry token has expired. Please request a new one.', 400);
  }

  // Fetch the order
  const order = await withRetry(() =>
    prisma.order.findUnique({
      where: { id: tokenRecord.orderId },
      include: {
        items: { include: { product: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
  );

  if (!order) throw new AppError('Order not found', 404);
  if (order.userId !== userId) throw new AppError('Access denied', 403);

  // Final safety check — double confirm it hasn't been paid since token was issued
  if (order.paymentStatus === 'CONFIRMED') {
    await prisma.paymentRetryToken.update({ where: { token: retryToken }, data: { used: true } });
    throw new AppError('Order has been paid since this token was issued.', 409);
  }

  // Create a new Razorpay order (same amount, same internal order)
  const razorpay = getRazorpay();
  const amountInPaise = Math.round(Number(order.totalAmount) * 100);

  let razorpayOrder: { id: string; amount: number; currency: string };
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id, retry: 'true' },
    });
  } catch (err) {
    captureException(err, { context: 'retry_razorpay_order_create', orderId: order.id });
    throw new AppError('Failed to create payment. Please try again.', 502);
  }

  // Create a fresh PENDING Payment record for this retry attempt
  await prisma.payment.create({
    data: {
      orderId: order.id,
      paymentGateway: 'RAZORPAY',
      transactionId: razorpayOrder.id,
      amount: order.totalAmount,
      currency: 'INR',
      status: 'PENDING',
    },
  });

  // Reset order payment status to PENDING so the verify webhook can update it
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'PENDING', status: 'PENDING' },
  });

  // Mark token as used (single-use)
  await prisma.paymentRetryToken.update({
    where: { token: retryToken },
    data: { used: true },
  });

  const keyId = process.env.RAZORPAY_KEY_ID!;
  const prefillUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true, phone: true },
  });

  res.json({
    success: true,
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: keyId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      prefill: {
        name: prefillUser?.fullName || '',
        email: prefillUser?.email || '',
        contact: prefillUser?.phone || '',
      },
    },
  });
});
