/**
 * Supabase JWT Authentication Middleware
 * Validates tokens issued by Supabase Auth
 */

import { NextFunction, Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: {
        id: string;
        email?: string;
        phone?: string;
      };
    }
  }
}

export const protectSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized, no token provided', 401);
    }

    try {
      // Verify with Supabase
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        console.error('[Supabase Auth] ❌ Token validation failed:', error?.message);
        throw new AppError('Invalid token', 401);
      }

      // Attach Supabase user to request
      req.supabaseUser = {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
      };

      next();
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[Supabase Auth] 🔴 Unexpected error:', error);
      throw new AppError('Authentication failed', 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};
