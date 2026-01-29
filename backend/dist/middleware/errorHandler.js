"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.errorHandler = void 0;
const dbErrors_1 = require("../utils/dbErrors");
// ============================================
// ERROR CATEGORIZATION HELPER
// ============================================
// Helps identify the source of errors for better diagnostics
function categorizeError(err) {
    const message = (err.message || '').toLowerCase();
    const name = (err.name || '').toLowerCase();
    // Cold start failures: connection takes too long
    const isColdStart = message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('connect etimedout');
    // Pool exhaustion: too many connections
    const isPoolExhaustion = message.includes('too many connections') ||
        message.includes('connection pool') ||
        message.includes('max client error');
    // Network drops: connection lost mid-query
    const isNetworkDrop = message.includes('connection terminated') ||
        message.includes('connection reset') ||
        message.includes('socket hang up') ||
        name.includes('econnreset');
    let category = err.category || 'server';
    if (message.includes('prisma') || message.includes('database') || message.includes('sql')) {
        category = 'database';
    }
    else if (message.includes('validation') || message.includes('invalid')) {
        category = 'validation';
    }
    else if (message.includes('unauthorized') || message.includes('forbidden')) {
        category = 'authentication';
    }
    return { category, isColdStart, isPoolExhaustion, isNetworkDrop };
}
const errorHandler = (err, req, res, _next) => {
    // CRITICAL: Handle Prisma initialization errors with 503 response
    // This allows frontend to retry without crashing
    if ((0, dbErrors_1.isPrismaInitError)(err)) {
        const { statusCode, body } = (0, dbErrors_1.toDatabaseErrorResponse)(err);
        console.warn('[ERROR] 🔴 Database Connection Error (Returning 503 Retry):', {
            timestamp: new Date().toISOString(),
            endpoint: req.path,
            method: req.method,
            message: err.message,
            retryable: body.retryable,
        });
        return res.status(statusCode).json(body);
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const { category, isColdStart, isPoolExhaustion, isNetworkDrop } = categorizeError(err);
    // Detailed logging for diagnostics
    const logData = {
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method,
        statusCode,
        category,
        message,
        isColdStart,
        isPoolExhaustion,
        isNetworkDrop,
    };
    if (process.env.NODE_ENV === 'development') {
        console.error('\n[ERROR] 🔴 Detailed Error Information:');
        console.error(JSON.stringify(logData, null, 2));
        if (err.stack) {
            console.error('\n[STACK TRACE]\n', err.stack);
        }
    }
    else {
        // Production: log with diagnostic hints
        if (isColdStart) {
            console.warn('[WARNING] ⏱️  COLD START: Database connection timeout. Server may be waking up.', logData);
        }
        else if (isPoolExhaustion) {
            console.error('[CRITICAL] 🔥 POOL EXHAUSTION: Too many connections. Recovery middleware may have failed.', logData);
        }
        else if (isNetworkDrop) {
            console.warn('[WARNING] 📡 NETWORK DROP: Connection lost mid-query. Recovery middleware should retry.', logData);
        }
        else {
            console.error('[ERROR] Generic server error:', logData);
        }
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            category,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack,
                diagnostics: { isColdStart, isPoolExhaustion, isNetworkDrop }
            }),
        },
    });
};
exports.errorHandler = errorHandler;
class AppError extends Error {
    constructor(message, statusCode = 500, category) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.category = category;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=errorHandler.js.map