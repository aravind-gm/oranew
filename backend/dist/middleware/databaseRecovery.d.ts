import { NextFunction, Request, Response } from 'express';
/**
 * DATABASE CONNECTION RECOVERY MIDDLEWARE
 *
 * Purpose:
 * - Detect database connection failures
 * - Attempt ONE graceful reconnect
 * - Retry the request ONCE
 * - If still failing, return clean 500 error
 *
 * This prevents cascading failures when Render wakes up or pool resets.
 *
 * Rules:
 * - No infinite retries (prevents tight loops)
 * - Only retries on connection errors (not validation errors)
 * - Logs are minimal but meaningful
 */
export declare const databaseRecoveryMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * QUERY RETRY WRAPPER
 *
 * Wraps database queries with ONE automatic retry on connection failure
 * Use in controllers that need resilience to connection drops
 *
 * Example:
 *   const categories = await retryOnDbError(() =>
 *     prisma.category.findMany({ ... })
 *   );
 */
export declare const retryOnDbError: <T>(queryFn: () => Promise<T>, operationName?: string) => Promise<T>;
//# sourceMappingURL=databaseRecovery.d.ts.map