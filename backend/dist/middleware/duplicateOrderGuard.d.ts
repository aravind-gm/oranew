/**
 * Duplicate Order Guard Middleware
 *
 * Prevents duplicate order creation within 10 seconds using a server-side guard.
 * Uses in-memory SHA-256 cart hash to only block exact same cart resubmissions.
 *
 * Strategy: Check if a checkout was attempted with identical:
 * - userId + cartHash + timestamp (within 10s)
 *
 * This prevents accidental double-clicks and browser back-button issues
 * without blocking legitimate different orders by the same user.
 */
import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
/**
 * Middleware: Detect duplicate order attempts
 *
 * Called BEFORE checkout endpoint processes the request.
 * Stores a dedup key in req for the checkout to finalize after order is created.
 */
export declare const duplicateOrderGuard: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Optional: Extract dedup key and perform post-order cleanup
 * Call this after order is successfully created.
 */
export declare function cleanupDedupKey(dedupKey?: string): void;
//# sourceMappingURL=duplicateOrderGuard.d.ts.map