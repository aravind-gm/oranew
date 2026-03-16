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
import { Response } from 'express';
export declare const generateRetryToken: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const executeRetryPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=retryPayment.controller.d.ts.map