/**
 * Database Error Handler Utility
 *
 * Identifies and handles database connection errors gracefully.
 * Converts PrismaClientInitializationError to proper HTTP 503 responses.
 */
export declare class DatabaseError extends Error {
    readonly code: 'INIT_ERROR' | 'CONNECTION_ERROR' | 'QUERY_ERROR' | 'UNKNOWN';
    readonly retryable: boolean;
    constructor(message: string, code: 'INIT_ERROR' | 'CONNECTION_ERROR' | 'QUERY_ERROR' | 'UNKNOWN', retryable: boolean);
}
/**
 * Check if error is a Prisma initialization error
 * These errors occur when Prisma can't connect to the database
 */
export declare function isPrismaInitError(error: unknown): boolean;
/**
 * Check if error is a connection-related error
 */
export declare function isConnectionError(error: unknown): boolean;
/**
 * Check if error is retriable (temporary) vs permanent
 */
export declare function isTemporaryError(error: unknown): boolean;
/**
 * Get HTTP status code for database error
 * - 503 Service Unavailable: Temporary connection issues (should retry)
 * - 500 Internal Server Error: Permanent/unknown errors
 */
export declare function getDatabaseErrorStatus(error: unknown): {
    statusCode: number;
    retryable: boolean;
    message: string;
};
/**
 * Convert database error to API response
 */
export declare function toDatabaseErrorResponse(error: unknown): {
    statusCode: number;
    body: {
        success: boolean;
        message: string;
        retryable: boolean;
        error?: {
            type: string;
            details: string;
        };
    };
};
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
//# sourceMappingURL=dbErrors.d.ts.map