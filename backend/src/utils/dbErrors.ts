/**
 * Database Error Handler Utility
 * 
 * Identifies and handles database connection errors gracefully.
 * Converts PrismaClientInitializationError to proper HTTP 503 responses.
 */

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: 'INIT_ERROR' | 'CONNECTION_ERROR' | 'QUERY_ERROR' | 'UNKNOWN',
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Check if error is a Prisma initialization error
 * These errors occur when Prisma can't connect to the database
 */
export function isPrismaInitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'PrismaClientInitializationError' ||
      error.message.includes('PrismaClientInitializationError') ||
      error.message.includes("Can't reach database server")
    );
  }
  return false;
}

/**
 * Check if error is a connection-related error
 */
export function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('socket hang up')
    );
  }
  return false;
}

/**
 * Check if error is retriable (temporary) vs permanent
 */
export function isTemporaryError(error: unknown): boolean {
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
export function getDatabaseErrorStatus(error: unknown): {
  statusCode: number;
  retryable: boolean;
  message: string;
} {
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
export function toDatabaseErrorResponse(error: unknown): {
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
} {
  const { statusCode, message, retryable } = getDatabaseErrorStatus(error);

  return {
    statusCode,
    body: {
      success: false,
      message,
      retryable,
      error: {
        type: 'DatabaseError',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
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
