import { Request, Response } from 'express';
/**
 * POST /api/payments/create
 *
 * Called from frontend after user selects address
 * Creates a Razorpay order and saves Payment record with status = PENDING
 * Returns razorpayOrderId to frontend for opening checkout modal
 *
 * Request:  { orderId: string }
 * Response: { success: true, razorpayOrderId, amount, key, ... }
 */
export declare const createPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/payments/verify
 *
 * Called from frontend Razorpay success callback
 * Verifies the payment signature using Razorpay key secret
 * Updates Order.status = CONFIRMED and Payment.status = CONFIRMED
 * Clears the shopping cart
 *
 * CRITICAL SECURITY:
 * - Signature MUST be verified: SHA256(orderId|paymentId) using key_secret
 * - Amount MUST match order total
 * - User MUST own the order
 * - Cart is ONLY cleared after successful verification
 *
 * Request: {
 *   orderId: string,
 *   razorpay_payment_id: string,
 *   razorpay_order_id: string,
 *   razorpay_signature: string
 * }
 *
 * Response: { success: true }
 */
export declare const verifyPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/payments/webhook
 *
 * Receives Razorpay webhook events and processes them atomically:
 *
 * HANDLES:
 * - payment.captured → SUCCESS flow (confirms order, deducts inventory)
 * - payment.failed → FAILURE flow (cancels order)
 *
 * SECURITY:
 * 1. Uses raw body for signature verification
 * 2. Verifies HMAC-SHA256 signature using webhook secret
 * 3. Idempotent - safe to receive same webhook multiple times
 * 4. Atomic transaction - all or nothing
 *
 * IMPORTANT: This endpoint uses express.raw() middleware
 * configured in server.ts to receive raw body for signature verification.
 */
export declare const webhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/payments/:orderId/status
 *
 * Frontend uses this to poll payment status after verification
 * Returns current order and payment status with clear flags
 *
 * CRITICAL: This endpoint is polled by success page
 * Must return clear isConfirmed/isFailed flags for frontend
 */
export declare const getPaymentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/payments/refund
 * ADMIN ONLY - Process refund for approved returns
 *
 * Calls Razorpay refund API
 * Updates Payment.status = REFUNDED
 * Updates Return.status = REFUNDED
 * Restores inventory
 * Sends email to customer
 */
export declare const initiateRefund: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=payment.controller.d.ts.map