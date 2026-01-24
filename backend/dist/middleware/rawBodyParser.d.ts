import { Request, Response, NextFunction } from 'express';
import type { RawBodyRequest } from 'express-serve-static-core';
/**
 * Middleware to capture raw request body for webhook signature verification
 *
 * This middleware MUST be used BEFORE json() middleware for webhook routes
 * because Razorpay signature verification requires the exact original request body
 *
 * Usage:
 * app.post('/api/payments/webhook', rawBodyParser, paymentController.webhook);
 */
export declare const rawBodyParser: (req: RawBodyRequest<Request>, res: Response, next: NextFunction) => void;
export default rawBodyParser;
//# sourceMappingURL=rawBodyParser.d.ts.map