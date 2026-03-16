"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRetryPayment = exports.generateRetryToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const sentry_1 = require("../config/sentry");
const RETRY_TOKEN_TTL_MINUTES = 15;
const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret)
        throw new helpers_1.AppError('Payment gateway not configured', 500);
    if (process.env.NODE_ENV === 'production' && keyId.startsWith('rzp_test_')) {
        throw new helpers_1.AppError('FATAL: Production cannot use test keys', 500);
    }
    return new razorpay_1.default({ key_id: keyId, key_secret: keySecret });
};
// ──────────────────────────────────────────────────────────────────────────────
// POST /api/payments/retry/token
// Generate a short-lived retry token for a FAILED order
// ──────────────────────────────────────────────────────────────────────────────
exports.generateRetryToken = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.body;
    const userId = req.user?.id;
    if (!orderId)
        throw new helpers_1.AppError('Order ID is required', 400);
    const order = await database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order)
        throw new helpers_1.AppError('Order not found', 404);
    if (order.userId !== userId)
        throw new helpers_1.AppError('Access denied', 403);
    // Safety gates — cannot retry confirmed or refunded orders
    if (order.paymentStatus === 'CONFIRMED') {
        throw new helpers_1.AppError('This order has already been paid. No retry needed.', 409);
    }
    if (order.paymentStatus === 'REFUNDED') {
        throw new helpers_1.AppError('This order has been refunded and cannot be retried.', 409);
    }
    if (order.status === 'CANCELLED') {
        throw new helpers_1.AppError('This order has been cancelled and cannot be retried.', 409);
    }
    // Expire any existing unused tokens for this order (cleanup)
    await database_1.prisma.paymentRetryToken.updateMany({
        where: { orderId, used: false },
        data: { used: true },
    });
    // Generate a secure random token
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RETRY_TOKEN_TTL_MINUTES * 60 * 1000);
    await database_1.prisma.paymentRetryToken.create({
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
exports.executeRetryPayment = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { retryToken } = req.body;
    const userId = req.user?.id;
    if (!retryToken)
        throw new helpers_1.AppError('Retry token is required', 400);
    // Validate token
    const tokenRecord = await database_1.prisma.paymentRetryToken.findUnique({ where: { token: retryToken } });
    if (!tokenRecord)
        throw new helpers_1.AppError('Invalid retry token', 400);
    if (tokenRecord.used)
        throw new helpers_1.AppError('Retry token has already been used', 400);
    if (new Date() > tokenRecord.expiresAt) {
        throw new helpers_1.AppError('Retry token has expired. Please request a new one.', 400);
    }
    // Fetch the order
    const order = await database_1.prisma.order.findUnique({
        where: { id: tokenRecord.orderId },
        include: {
            items: { include: { product: true } },
            payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
    });
    if (!order)
        throw new helpers_1.AppError('Order not found', 404);
    if (order.userId !== userId)
        throw new helpers_1.AppError('Access denied', 403);
    // Final safety check — double confirm it hasn't been paid since token was issued
    if (order.paymentStatus === 'CONFIRMED') {
        await database_1.prisma.paymentRetryToken.update({ where: { token: retryToken }, data: { used: true } });
        throw new helpers_1.AppError('Order has been paid since this token was issued.', 409);
    }
    // Create a new Razorpay order (same amount, same internal order)
    const razorpay = getRazorpay();
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    let razorpayOrderId;
    let razorpayAmount;
    let razorpayCurrency;
    try {
        const rzpOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: order.orderNumber,
            notes: { orderId: order.id, retry: 'true' },
        });
        razorpayOrderId = rzpOrder.id;
        razorpayAmount = Number(rzpOrder.amount);
        razorpayCurrency = rzpOrder.currency;
    }
    catch (err) {
        (0, sentry_1.captureException)(err, { context: 'retry_razorpay_order_create', orderId: order.id });
        throw new helpers_1.AppError('Failed to create payment. Please try again.', 502);
    }
    // Create a fresh PENDING Payment record for this retry attempt
    await database_1.prisma.payment.create({
        data: {
            orderId: order.id,
            paymentGateway: 'RAZORPAY',
            transactionId: razorpayOrderId,
            amount: order.totalAmount,
            currency: 'INR',
            status: 'PENDING',
        },
    });
    // Reset order payment status to PENDING so the verify webhook can update it
    await database_1.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PENDING', status: 'PENDING' },
    });
    // Mark token as used (single-use)
    await database_1.prisma.paymentRetryToken.update({
        where: { token: retryToken },
        data: { used: true },
    });
    const keyId = process.env.RAZORPAY_KEY_ID;
    const prefillUser = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true, phone: true },
    });
    res.json({
        success: true,
        data: {
            razorpayOrderId,
            amount: razorpayAmount,
            currency: razorpayCurrency,
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
//# sourceMappingURL=retryPayment.controller.js.map