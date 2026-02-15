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
    let tokenSource: 'cookie' | 'header' | 'none' = 'none';

    // 🔐 PRIORITY 1: Check HttpOnly cookie (NEW - more secure)
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
      tokenSource = 'cookie';
      console.log('[Auth Middleware] 🍪 Token found in HttpOnly cookie', {
        endpoint: req.method + ' ' + req.path,
        tokenLength: token.length,
      });
    }
    // 🔐 PRIORITY 2: Fallback to Authorization header (OLD - backward compatibility)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      tokenSource = 'header';
      console.log('[Auth Middleware] 📋 Token found in Authorization header', {
        endpoint: req.method + ' ' + req.path,
        tokenLength: token.length,
      });
    }

    // 🚨 CRITICAL: Token validation
    if (!token) {
      console.error('[Auth Middleware] ❌ NO TOKEN PROVIDED', {
        endpoint: req.method + ' ' + req.path,
        authHeader: req.headers.authorization ? 'Present' : 'MISSING',
        cookiePresent: !!req.cookies?.access_token,
        timestamp: new Date().toISOString(),
      });
      throw new AppError('Not authorized, no token provided', 401);
    }

    console.log('[Auth Middleware] 🔐 Token validation starting...', {
      endpoint: req.method + ' ' + req.path,
      tokenSource: tokenSource,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 30) + '...',
      timestamp: new Date().toISOString(),
    });

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: UserRole;
    };

    console.log('[Auth Middleware] ✅ Token verified successfully', {
      endpoint: req.method + ' ' + req.path,
      tokenSource: tokenSource,
      userId: decoded.id,
      userEmail: decoded.email,
      userRole: decoded.role,
      timestamp: new Date().toISOString(),
    });

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
