/**
 * Retry Utility with Exponential Backoff
 *
 * Handles temporary database disconnections gracefully
 * by retrying queries with exponential backoff delays.
 *
 * CRITICAL: This wrapper specifically handles:
 * - P1001: "Can't reach database server" (cold start)
 * - P1002: "Connection timeout during startup"
 * - ECONNREFUSED: Connection refused (DB restarting)
 * - ECONNRESET: Connection reset (network issue)
 * - timeout: Query timeout (transient)
 *
 * It DOES NOT retry:
 * - P2022: Column does not exist (schema error)
 * - P2025: Record not found (logic error)
 * - 400/401/403: Auth/validation errors
 *
 * Usage:
 *   const products = await withRetry(() =>
 *     prisma.product.findMany({ where, take, skip })
 *   );
 */
export interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
    ensureConnected?: boolean;
}
/**
 * Execute function with exponential backoff retry logic
 *
 * KEY IMPROVEMENTS:
 * 1. Detects connection errors specifically
 * 2. Calls ensureDatabaseConnected() before retrying
 * 3. Doesn't waste retries on non-retryable errors
 * 4. Returns structured error info for client
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise with result from fn
 *
 * @example
 * // Simple usage
 * const data = await withRetry(() => prisma.user.findUnique({ where: { id } }));
 *
 * // With custom options and logging
 * const data = await withRetry(
 *   () => prisma.product.findMany(),
 *   {
 *     maxRetries: 5,
 *     onRetry: (attempt, error, delayMs) => {
 *       console.log(`Retry ${attempt}: ${error.message} (waiting ${delayMs}ms)`);
 *     }
 *   }
 * );
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
/**
 * Check if an error is retryable (temporary vs permanent)
 *
 * RETRYABLE ERRORS (network/connection issues):
 * - ECONNREFUSED: DB not listening (cold start)
 * - ECONNRESET: Connection reset (network flake)
 * - ETIMEDOUT: Socket timeout (slow DB)
 * - P1001: Can't reach database server
 * - P1002: Connection timeout during startup
 * - connection terminated: Unexpected disconnection
 *
 * NON-RETRYABLE ERRORS (logic/schema issues):
 * - P2022: Column does not exist
 * - P2025: Record not found
 * - P2002: Unique constraint violation
 * - P2003: Foreign key constraint violation
 * - 400: Bad request
 * - 401: Unauthorized
 */
export declare function isRetryableError(error: Error): boolean;
/**
 * Check if an error is specifically a CONNECTION error
 * (vs a query execution error)
 *
 * Used to determine if we should call ensureDatabaseConnected()
 */
export declare function isConnectionError(error: Error): boolean;
/**
 * Wrap Prisma operation with retry logic AND error handling
 *
 * Provides fallback value if all retries fail
 * Useful for non-critical operations where we can use cached/default data
 *
 * @example
 * const user = await withRetryAndFallback(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   { fallbackValue: null } // Return null if all retries fail
 * );
 */
export declare function withRetryAndFallback<T>(fn: () => Promise<T>, options?: Partial<RetryOptions> & {
    fallbackValue?: T;
}): Promise<T>;
export interface ClassifiedError {
    message: string;
    retryable: boolean;
    statusCode: number;
    code?: string;
}
export declare function classifyDatabaseError(error: unknown): ClassifiedError;
//# sourceMappingURL=retry.d.ts.map