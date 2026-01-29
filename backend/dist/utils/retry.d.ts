/**
 * Retry Utility with Exponential Backoff
 *
 * Handles temporary database disconnections gracefully
 * by retrying queries with exponential backoff delays.
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
}
/**
 * Execute function with exponential backoff retry logic
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
 */
export declare function isRetryableError(error: Error): boolean;
/**
 * Wrap Prisma operation with retry logic AND error handling
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
//# sourceMappingURL=retry.d.ts.map