"use strict";
/**
 * Database Error Handler Utility
 *
 * Identifies and handles database connection errors gracefully.
 * Converts PrismaClientInitializationError to proper HTTP 503 responses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = void 0;
exports.isPrismaInitError = isPrismaInitError;
exports.isConnectionError = isConnectionError;
exports.isTemporaryError = isTemporaryError;
exports.getDatabaseErrorStatus = getDatabaseErrorStatus;
exports.toDatabaseErrorResponse = toDatabaseErrorResponse;
class DatabaseError extends Error {
    constructor(message, code, retryable) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Check if error is a Prisma initialization error
 * These errors occur when Prisma can't connect to the database
 */
function isPrismaInitError(error) {
    if (error instanceof Error) {
        return (error.name === 'PrismaClientInitializationError' ||
            error.message.includes('PrismaClientInitializationError') ||
            error.message.includes("Can't reach database server"));
    }
    return false;
}
/**
 * Check if error is a connection-related error
 */
function isConnectionError(error) {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (message.includes('econnrefused') ||
            message.includes('econnreset') ||
            message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('socket hang up'));
    }
    return false;
}
/**
 * Check if error is retriable (temporary) vs permanent
 */
function isTemporaryError(error) {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const temporaryErrors = [
            'econnrefused',
            'econnreset',
            'etimedout',
            'connection terminated',
            'connection reset',
            'socket hang up',
            'temporarily unavailable',
            'maintenance',
            'too many connections',
            'connection pool',
        ];
        return temporaryErrors.some((err) => message.includes(err));
    }
    return false;
}
/**
 * Get HTTP status code for database error
 * - 503 Service Unavailable: Temporary connection issues (should retry)
 * - 500 Internal Server Error: Permanent/unknown errors
 */
function getDatabaseErrorStatus(error) {
    if (isPrismaInitError(error)) {
        return {
            statusCode: 503,
            retryable: true,
            message: 'Database temporarily unavailable. Please retry.',
        };
    }
    if (isTemporaryError(error)) {
        return {
            statusCode: 503,
            retryable: true,
            message: 'Database connection temporarily unavailable. Retrying...',
        };
    }
    if (isConnectionError(error)) {
        return {
            statusCode: 503,
            retryable: true,
            message: 'Database connection failed. Please retry.',
        };
    }
    return {
        statusCode: 500,
        retryable: false,
        message: 'Database error occurred.',
    };
}
/**
 * Convert database error to API response
 */
function toDatabaseErrorResponse(error) {
    const { statusCode, message, retryable } = getDatabaseErrorStatus(error);
    return {
        statusCode,
        body: {
            success: false,
            message,
            retryable,
            error: {
                type: 'DatabaseError',
                details: process.env.NODE_ENV === 'development' && error instanceof Error
                    ? error.message
                    : undefined,
            },
        },
    };
}
/**
 * Example Express route handler with proper DB error handling:
 *
 * router.get('/products', async (req, res, next) => {
 *   try {
 *     const products = await withRetry(() =>
 *       prisma.product.findMany()
 *     );
 *     res.json({ success: true, data: products });
 *   } catch (error) {
 *     if (isPrismaInitError(error)) {
 *       const { statusCode, body } = toDatabaseErrorResponse(error);
 *       return res.status(statusCode).json(body);
 *     }
 *     next(error);
 *   }
 * });
 */
//# sourceMappingURL=dbErrors.js.map