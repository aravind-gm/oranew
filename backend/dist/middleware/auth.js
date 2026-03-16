"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const database_1 = require("../config/database");
const sentry_1 = require("../config/sentry");
const protect = async (req, res, next) => {
    try {
        let token;
        // SECURITY: NEVER log cookies, token values, or token prefixes.
        // All debug logging is gated behind NODE_ENV === 'development'.
        // ONLY source: HttpOnly cookie.
        // Bearer header fallback has been removed — it is an unnecessary
        // attack surface; all legitimate clients send the cookie automatically.
        if (req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
        }
        if (!token) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth] No token — endpoint:', req.method, req.path);
            }
            throw new errorHandler_1.AppError('Not authorized, no token provided', 401);
        }
        // Verify token signature and expiry.
        // algorithm pinned to HS256 — prevents algorithm confusion attacks
        // (e.g., RS256 downgrade, 'none' algorithm bypass).
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
        });
        // RE-VERIFY ROLE FROM DB
        // The JWT role may be stale if an admin was demoted after the token was
        // issued. We do a lightweight SELECT on every authenticated request.
        // This adds ~1 ms on a warm connection — acceptable tradeoff for
        // correct access control.
        const dbUser = await database_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true },
        });
        if (!dbUser) {
            throw new errorHandler_1.AppError('User account no longer exists', 401);
        }
        // Only log user identity (not token bytes) and only in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Token valid — userId:', dbUser.id, 'role:', dbUser.role);
        }
        // Attach live role from DB (not stale JWT claim)
        req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role };
        // Attach user to Sentry scope (userId only — no PII)
        (0, sentry_1.setSentryUser)(dbUser.id, dbUser.role);
        next();
    }
    catch (error) {
        let errorMsg = 'Not authorized, invalid token';
        let statusCode = 401;
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            errorMsg = 'Token has expired';
            statusCode = 401;
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
        if (!req.user) {
            return next(new errorHandler_1.AppError('Not authenticated', 401));
        }
        if (!roles.includes(req.user.role)) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Auth] Role not authorized', {
                    endpoint: req.method + ' ' + req.path,
                    userRole: req.user.role,
                    requiredRoles: roles,
                });
            }
            return next(new errorHandler_1.AppError(`Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Optional auth — attaches user if token exists, but does NOT block unauthenticated requests.
 * Used for guest checkout: allows `req.user` to be undefined.
 */
const optionalAuth = async (req, _res, next) => {
    try {
        if (req.cookies?.access_token) {
            const decoded = jsonwebtoken_1.default.verify(req.cookies.access_token, process.env.JWT_SECRET, {
                algorithms: ['HS256'],
            });
            const dbUser = await database_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, role: true },
            });
            if (dbUser) {
                req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role };
                (0, sentry_1.setSentryUser)(dbUser.id, dbUser.role);
            }
        }
    }
    catch {
        // Token invalid or expired — that's fine, continue as guest
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map