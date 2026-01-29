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

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  onRetry: () => {}, // Silent by default
};

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
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error = new Error('Unknown error');
  let delayMs = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if we've exhausted attempts
      if (attempt === config.maxRetries) {
        break;
      }

      // Calculate delay for next attempt
      delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);

      // Call retry callback if provided
      config.onRetry(attempt + 1, lastError, delayMs);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Check if an error is retryable (temporary vs permanent)
 */
export function isRetryableError(error: Error): boolean {
  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  // Retryable: temporary connection issues
  const retryable = [
    'econnrefused',
    'econnreset',
    'etimedout',
    'ehostunreach',
    'enetunreach',
    'connection terminated',
    'connection reset',
    'socket hang up',
    'timeout',
    'temporarily unavailable',
    'too many connections',
    'connection pool',
  ];

  const isRetryable = retryable.some(
    (keyword) => message.includes(keyword) || name.includes(keyword)
  );

  return isRetryable;
}

/**
 * Wrap Prisma operation with retry logic AND error handling
 * 
 * @example
 * const user = await withRetryAndFallback(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   { fallbackValue: null } // Return null if all retries fail
 * );
 */
export async function withRetryAndFallback<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions> & { fallbackValue?: T }
): Promise<T> {
  const { fallbackValue, ...retryOptions } = options || {};

  try {
    return await withRetry(fn, retryOptions);
  } catch (error) {
    if (fallbackValue !== undefined) {
      console.warn(
        '[DB Fallback]',
        error instanceof Error ? error.message : String(error)
      );
      return fallbackValue;
    }
    throw error;
  }
}
