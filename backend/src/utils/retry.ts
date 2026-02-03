import { ensureDatabaseConnected } from '../config/database';

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
  ensureConnected?: boolean; // NEW: Try to recover connection before retrying
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  onRetry: () => {}, // Silent by default
  ensureConnected: true, // NEW: Default to true for connection recovery
};

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

      // Check if this error is retryable
      if (!isRetryableError(lastError)) {
        console.debug('[Retry] ❌ Non-retryable error, giving up immediately:', {
          message: lastError.message,
          code: (lastError as any).code,
        });
        throw lastError;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === config.maxRetries) {
        console.error('[Retry] ❌ Max retries exceeded after', config.maxRetries, 'attempts');
        break;
      }

      // NEW: Try to recover database connection before retrying
      if (config.ensureConnected && isConnectionError(lastError)) {
        console.warn('[Retry] 🔄 Detected connection error, attempting recovery...');
        const recovered = await ensureDatabaseConnected();
        if (recovered) {
          console.log('[Retry] ✅ Connection recovered, will retry query');
        } else {
          console.warn('[Retry] ⚠️  Connection recovery failed, will retry anyway');
        }
      }

      // Calculate delay for next attempt (exponential backoff)
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
export function isRetryableError(error: Error): boolean {
  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();
  const code = (error as any).code || '';

  // RETRYABLE errors (temporary issues)
  const retryableKeywords = [
    'econnrefused',    // Connection refused
    'econnreset',      // Connection reset
    'etimedout',       // Timeout
    'ehostunreach',    // Host unreachable
    'enetunreach',     // Network unreachable
    'p1001',           // Prisma: Can't reach database
    'p1002',           // Prisma: Connection timeout during startup
    'connection terminated',  // Unexpected disconnect
    'connection reset',       // Reset by peer
    'socket hang up',         // Socket closed
    'timeout',                // Generic timeout
    'temporarily unavailable', // Service unavailable
    'too many connections',    // Connection pool full
    'connection pool',         // Pool-related error
    'server closed the connection',  // DB restart
    'no connection',           // Not connected
  ];

  const isRetryable = retryableKeywords.some(
    (keyword) => message.includes(keyword) || name.includes(keyword)
  );

  // Also check Prisma error codes
  const prismaRetryableCodes = ['P1001', 'P1002', 'P1017'];
  const isPrismaRetryable = prismaRetryableCodes.some(
    (prismaCode) => message.includes(prismaCode) || code === prismaCode
  );

  return isRetryable || isPrismaRetryable;
}

/**
 * Check if an error is specifically a CONNECTION error
 * (vs a query execution error)
 * 
 * Used to determine if we should call ensureDatabaseConnected()
 */
export function isConnectionError(error: Error): boolean {
  const message = (error.message || '').toLowerCase();
  const connectionErrors = [
    'econnrefused',
    'econnreset',
    'p1001',
    'p1002',
    'connection',
    'socket',
    'timeout',
  ];
  return connectionErrors.some(keyword => message.includes(keyword));
}

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

// ============================================
// ERROR CLASSIFICATION FOR CLIENT
// ============================================
// Use this to determine what message to send to frontend

export interface ClassifiedError {
  message: string;
  retryable: boolean;
  statusCode: number;
  code?: string;
}

export function classifyDatabaseError(error: unknown): ClassifiedError {
  const err = error instanceof Error ? error : new Error(String(error));
  const code = (err as any).code || '';
  const message = err.message || 'Unknown error';

  // Connection errors → retryable
  if (isConnectionError(err)) {
    return {
      message: 'Database temporarily unavailable. Please try again.',
      retryable: true,
      statusCode: 503, // Service Unavailable
      code,
    };
  }

  // Query execution errors → not retryable
  if (message.includes('P2022') || message.includes('does not exist')) {
    return {
      message: 'Database schema error (column missing). Contact support.',
      retryable: false,
      statusCode: 500,
      code,
    };
  }

  if (message.includes('P2025') || message.includes('not found')) {
    return {
      message: 'Record not found.',
      retryable: false,
      statusCode: 404,
      code,
    };
  }

  if (message.includes('P2002') || message.includes('unique')) {
    return {
      message: 'This record already exists.',
      retryable: false,
      statusCode: 409, // Conflict
      code,
    };
  }

  // Default: assume retryable (safer assumption)
  return {
    message: 'Database error. Please try again.',
    retryable: true,
    statusCode: 503,
    code,
  };
}

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
