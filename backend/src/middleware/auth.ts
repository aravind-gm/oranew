import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export type AuthRequest = Request;

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;
    const tokenSource: 'cookie' | 'header' | 'none' = 'none';

    // SECURITY: NEVER log cookies, token values, or token prefixes.
    // All debug logging is gated behind NODE_ENV === 'development'.

    // PRIORITY 1: HttpOnly cookie (preferred — not accessible via JS)
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    // PRIORITY 2: Authorization header fallback (for API clients / SSR)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] No token — endpoint:', req.method, req.path);
      }
      throw new AppError('Not authorized, no token provided', 401);
    }

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // Only log user identity (not token bytes) and only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Token valid — userId:', decoded.id, 'role:', decoded.role);
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    let errorMsg = 'Not authorized, invalid token';
    let statusCode = 401;

    if (error instanceof jwt.TokenExpiredError) {
      errorMsg = 'Token has expired';
      statusCode = 401;
      console.error('[Auth Middleware] ⏰ TOKEN EXPIRED', {
        endpoint: req.method + ' ' + req.path,
        expiredAt: error.expiredAt,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMsg = 'Invalid token signature or format';
      statusCode = 401;
      console.error('[Auth Middleware] ❌ TOKEN INVALID', {
        endpoint: req.method + ' ' + req.path,
        error: error.message,
      });
    } else if (error instanceof jwt.NotBeforeError) {
      errorMsg = 'Token not yet valid';
      statusCode = 401;
      console.error('[Auth Middleware] ⏳ TOKEN NOT YET VALID', {
        endpoint: req.method + ' ' + req.path,
      });
    } else if (error instanceof AppError) {
      errorMsg = error.message;
      statusCode = error.statusCode;
    } else {
      errorMsg = 'Authentication failed';
      console.error('[Auth Middleware] 🔴 UNEXPECTED ERROR', {
        endpoint: req.method + ' ' + req.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    next(new AppError(errorMsg, statusCode));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first
    if (!req.user) {
      console.error('[Auth Middleware] ❌ User not authenticated (no req.user)', {
        endpoint: req.method + ' ' + req.path,
      });
      return next(new AppError('Not authenticated', 401));
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
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    console.log('[Auth Middleware] ✅ Authorization granted', {
      endpoint: req.method + ' ' + req.path,
      userRole: req.user.role,
      userId: req.user.id,
    });

    next();
  };
};
