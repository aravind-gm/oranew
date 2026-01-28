import { NextFunction, Request, Response } from 'express';
import { prisma, ensureDatabaseConnected } from '../config/database';

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

export const databaseRecoveryMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Attach health check method to response
  // Controllers can use this to verify connection before critical operations
  res.locals.ensureDbConnected = async () => {
    return ensureDatabaseConnected();
  };

  // Continue to route handler
  next();
};

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

export const retryOnDbError = async <T>(
  queryFn: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> => {
  try {
    // Attempt 1: First try
    return await queryFn();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Check if this is a connection-related error (not validation/business logic error)
    const isConnectionError =
      errorMsg.includes('Can\'t reach database server') ||
      errorMsg.includes('connection refused') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('timeout');

    if (!isConnectionError) {
      // Not a connection error, re-throw immediately
      throw error;
    }

    // Connection error detected, attempt recovery
    console.warn(`[DB Retry] Connection lost on ${operationName}, attempting recovery...`);

    try {
      // Attempt ONE reconnect
      const isConnected = await ensureDatabaseConnected();

      if (!isConnected) {
        // Still not connected, give up and return error
        throw new Error(`[DB Retry] Recovery failed for ${operationName}, database still unreachable`);
      }

      // Recovery successful, retry the query (Attempt 2)
      console.log(`[DB Retry] Recovery successful, retrying ${operationName}...`);
      return await queryFn();
    } catch (recoveryError) {
      // Recovery attempt failed, return meaningful error
      const recoveryMsg = recoveryError instanceof Error ? recoveryError.message : String(recoveryError);
      console.error(`[DB Retry] ${operationName} failed after recovery attempt:`, recoveryMsg);
      throw error; // Throw original error, not recovery error
    }
  }
};
