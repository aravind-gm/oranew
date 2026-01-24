"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const protect = async (req, res, next) => {
    try {
        let token;
        // Extract token from Authorization header
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // 🚨 CRITICAL: Token validation
        if (!token) {
            console.error('[Auth Middleware] ❌ NO TOKEN PROVIDED', {
                endpoint: req.method + ' ' + req.path,
                authHeader: req.headers.authorization ? 'Present' : 'MISSING',
                timestamp: new Date().toISOString(),
            });
            throw new errorHandler_1.AppError('Not authorized, no token provided', 401);
        }
        console.log('[Auth Middleware] 🔐 Token validation starting...', {
            endpoint: req.method + ' ' + req.path,
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 30) + '...',
            timestamp: new Date().toISOString(),
        });
        // Verify token signature and expiry
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] ✅ Token verified successfully', {
            endpoint: req.method + ' ' + req.path,
            userId: decoded.id,
            userEmail: decoded.email,
            userRole: decoded.role,
            timestamp: new Date().toISOString(),
        });
        // Attach user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        let errorMsg = 'Not authorized, invalid token';
        let statusCode = 401;
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            errorMsg = 'Token has expired';
            statusCode = 401;
            console.error('[Auth Middleware] ⏰ TOKEN EXPIRED', {
                endpoint: req.method + ' ' + req.path,
                expiredAt: error.expiredAt,
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            errorMsg = 'Invalid token signature or format';
            statusCode = 401;
            console.error('[Auth Middleware] ❌ TOKEN INVALID', {
                endpoint: req.method + ' ' + req.path,
                error: error.message,
            });
        }
        else if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
            errorMsg = 'Token not yet valid';
            statusCode = 401;
            console.error('[Auth Middleware] ⏳ TOKEN NOT YET VALID', {
                endpoint: req.method + ' ' + req.path,
            });
        }
        else if (error instanceof errorHandler_1.AppError) {
            errorMsg = error.message;
            statusCode = error.statusCode;
        }
        else {
            errorMsg = 'Authentication failed';
            console.error('[Auth Middleware] 🔴 UNEXPECTED ERROR', {
                endpoint: req.method + ' ' + req.path,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        next(new errorHandler_1.AppError(errorMsg, statusCode));
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        // Ensure user is authenticated first
        if (!req.user) {
            console.error('[Auth Middleware] ❌ User not authenticated (no req.user)', {
                endpoint: req.method + ' ' + req.path,
            });
            return next(new errorHandler_1.AppError('Not authenticated', 401));
        }
        // Check role authorization
        if (!roles.includes(req.user.role)) {
            console.warn('[Auth Middleware] 🚫 USER ROLE NOT AUTHORIZED', {
                endpoint: req.method + ' ' + req.path,
                userRole: req.user.role,
                userId: req.user.id,
                userEmail: req.user.email,
                requiredRoles: roles,
            });
            return next(new errorHandler_1.AppError(`Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`, 403));
        }
        console.log('[Auth Middleware] ✅ Authorization granted', {
            endpoint: req.method + ' ' + req.path,
            userRole: req.user.role,
            userId: req.user.id,
        });
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map