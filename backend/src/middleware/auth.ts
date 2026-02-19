import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../config/database';
import { setSentryUser } from '../config/sentry';

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
      throw new AppError('Not authorized, no token provided', 401);
    }

    // Verify token signature and expiry.
    // algorithm pinned to HS256 — prevents algorithm confusion attacks
    // (e.g., RS256 downgrade, 'none' algorithm bypass).
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    }) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // RE-VERIFY ROLE FROM DB
    // The JWT role may be stale if an admin was demoted after the token was
    // issued. We do a lightweight SELECT on every authenticated request.
    // This adds ~1 ms on a warm connection — acceptable tradeoff for
    // correct access control.
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!dbUser) {
      throw new AppError('User account no longer exists', 401);
    }

    // Only log user identity (not token bytes) and only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Token valid — userId:', dbUser.id, 'role:', dbUser.role);
    }

    // Attach live role from DB (not stale JWT claim)
    req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role };

    // Attach user to Sentry scope (userId only — no PII)
    setSentryUser(dbUser.id, dbUser.role);

    next();
  } catch (error) {
    let errorMsg = 'Not authorized, invalid token';
    let statusCode = 401;

    if (error instanceof jwt.TokenExpiredError) {
      errorMsg = 'Token has expired';
      statusCode = 401;
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
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Role not authorized', {
          endpoint: req.method + ' ' + req.path,
          userRole: req.user.role,
          requiredRoles: roles,
        });
      }
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};
