import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to capture raw body for webhook signature verification
 * MUST be before any body parsing middleware
 */

// Not needed if using express.raw() in server.ts, but kept for reference or if you want to use custom raw body capture
export const rawBodyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/api/payments/webhook') {
    let data: Buffer[] = [];
    req.on('data', chunk => data.push(chunk));
    req.on('end', () => {
      (req as any).rawBody = Buffer.concat(data);
      next();
    });
    req.on('error', () => {
      console.error('[RawBody] Stream error');
      next();
    });
  } else {
    next();
  }
};
