"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const retryPayment_controller_1 = require("../controllers/retryPayment.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// ============================================
// PAYMENT ENDPOINTS
// ============================================
/**
 * POST /api/payments/create
 * Creates a Razorpay order and returns payment details
 *
 * Protected endpoint - requires authentication
 * Rate limited: 5 per 10 minutes
 * Called when user confirms order and proceeds to payment
 */
router.post('/create', auth_1.protect, rateLimiter_1.paymentLimiter, payment_controller_1.createPayment);
/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature from frontend callback
 * Updates order status to CONFIRMED and clears cart
 *
 * Protected endpoint - requires authentication
 * Rate limited: 5 per 10 minutes
 * Called from frontend Razorpay success callback
 */
router.post('/verify', auth_1.protect, rateLimiter_1.paymentLimiter, payment_controller_1.verifyPayment);
/**
 * GET /api/payments/:orderId/status
 * Returns current payment and order status
 *
 * Protected endpoint - requires authentication
 * Frontend polls this to check if order is confirmed
 */
router.get('/:orderId/status', auth_1.protect, payment_controller_1.getPaymentStatus);
/**
 * POST /api/payments/webhook
 * Receives webhooks from Razorpay
 *
 * IMPORTANT: This is a PUBLIC endpoint (no auth required)
 * Razorpay sends unsigned webhooks to this endpoint
 * In development: returns success immediately (disabled)
 * In production: verifies signature and processes payment
 *
 * This endpoint MUST be served as raw body
 * The express.raw() middleware is configured in server.ts BEFORE this route
 */
router.post('/webhook', payment_controller_1.webhook);
/**
 * POST /api/payments/refund
 * ADMIN ONLY - Process refund for approved returns
 * Calls Razorpay refund API and updates payment/return status
 *
 * Protected endpoint - requires ADMIN role
 * Called by admin after approving a return request
 */
router.post('/refund', auth_1.protect, (0, auth_1.authorize)('ADMIN'), payment_controller_1.initiateRefund);
/**
 * POST /api/payments/retry/token
 * Generate a 15-minute retry token for a FAILED order
 * Validates order ownership + confirms order hasn't been paid already
 */
router.post('/retry/token', auth_1.protect, rateLimiter_1.paymentLimiter, retryPayment_controller_1.generateRetryToken);
/**
 * POST /api/payments/retry/execute
 * Use a retry token to reinitialize Razorpay on the SAME order
 * No new order is created — preserves stock reservation
 */
router.post('/retry/execute', auth_1.protect, rateLimiter_1.paymentLimiter, retryPayment_controller_1.executeRetryPayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map