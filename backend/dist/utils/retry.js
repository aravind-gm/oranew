"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
exports.isRetryableError = isRetryableError;
exports.isConnectionError = isConnectionError;
exports.withRetryAndFallback = withRetryAndFallback;
exports.classifyDatabaseError = classifyDatabaseError;
const database_1 = require("../config/database");
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    onRetry: () => { }, // Silent by default
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
async function withRetry(fn, options) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError = new Error('Unknown error');
    let delayMs = config.initialDelayMs;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Check if this error is retryable
            if (!isRetryableError(lastError)) {
                console.debug('[Retry] ❌ Non-retryable error, giving up immediately:', {
                    message: lastError.message,
                    code: lastError.code,
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
                const recovered = await (0, database_1.ensureDatabaseConnected)();
                if (recovered) {
                    console.log('[Retry] ✅ Connection recovered, will retry query');
                }
                else {
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
function isRetryableError(error) {
    const message = (error.message || '').toLowerCase();
    const name = (error.name || '').toLowerCase();
    const code = error.code || '';
    // RETRYABLE errors (temporary issues)
    const retryableKeywords = [
        'econnrefused', // Connection refused
        'econnreset', // Connection reset
        'etimedout', // Timeout
        'ehostunreach', // Host unreachable
        'enetunreach', // Network unreachable
        'p1001', // Prisma: Can't reach database
        'p1002', // Prisma: Connection timeout during startup
        'connection terminated', // Unexpected disconnect
        'connection reset', // Reset by peer
        'socket hang up', // Socket closed
        'timeout', // Generic timeout
        'temporarily unavailable', // Service unavailable
        'too many connections', // Connection pool full
        'connection pool', // Pool-related error
        'server closed the connection', // DB restart
        'no connection', // Not connected
    ];
    const isRetryable = retryableKeywords.some((keyword) => message.includes(keyword) || name.includes(keyword));
    // Also check Prisma error codes
    const prismaRetryableCodes = ['P1001', 'P1002', 'P1017'];
    const isPrismaRetryable = prismaRetryableCodes.some((prismaCode) => message.includes(prismaCode) || code === prismaCode);
    return isRetryable || isPrismaRetryable;
}
/**
 * Check if an error is specifically a CONNECTION error
 * (vs a query execution error)
 *
 * Used to determine if we should call ensureDatabaseConnected()
 */
function isConnectionError(error) {
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
async function withRetryAndFallback(fn, options) {
    const { fallbackValue, ...retryOptions } = options || {};
    try {
        return await withRetry(fn, retryOptions);
    }
    catch (error) {
        if (fallbackValue !== undefined) {
            console.warn('[DB Fallback]', error instanceof Error ? error.message : String(error));
            return fallbackValue;
        }
        throw error;
    }
}
function classifyDatabaseError(error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const code = err.code || '';
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
//# sourceMappingURL=retry.js.map