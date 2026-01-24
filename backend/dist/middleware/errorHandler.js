"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.errorHandler = void 0;
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Log error with context
    if (process.env.NODE_ENV === 'development') {
        console.error('[Error Handler]', {
            endpoint: req.path,
            method: req.method,
            statusCode,
            message,
            stack: err.stack,
            body: req.body ? JSON.stringify(req.body).substring(0, 200) : 'no body',
        });
    }
    else {
        // Production: log minimal info
        console.error('[Error Handler]', {
            endpoint: req.path,
            method: req.method,
            statusCode,
            message,
        });
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=errorHandler.js.map