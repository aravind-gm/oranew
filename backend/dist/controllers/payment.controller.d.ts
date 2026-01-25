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
 * 1. Verifies signature using raw body + webhook secret
 * 2. Updates Payment → status = CONFIRMED
 * 3. Updates Order → status = CONFIRMED, paymentStatus = PAID
 * 4. Reduces inventory stock for each order item
 * 5. Clears user's cart
 *
 * All operations happen in a SINGLE Prisma transaction.
 * This ensures no partial updates if any step fails.
 *
 * IMPORTANT: This endpoint uses express.raw() middleware
 * configured in server.ts to receive raw body for signature verification.
 */
export declare const webhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/payments/:orderId/status
 *
 * Frontend uses this to poll payment status after verification
 * Returns current order and payment status
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