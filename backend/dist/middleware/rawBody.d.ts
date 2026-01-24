import { NextFunction, Request, Response } from 'express';
/**
 * Middleware to capture raw body for webhook signature verification
 * MUST be before any body parsing middleware
 */
export declare const rawBodyMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rawBody.d.ts.map