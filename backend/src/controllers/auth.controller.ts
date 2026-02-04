import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/email';
import { generateToken, verifyToken } from '../utils/jwt';
import { supabase } from '../config/supabase';

// ============================================
// OTP / MAGIC LINK AUTHENTICATION SYSTEM
// ============================================
// Supabase OTP is the SOURCE OF TRUTH
// Prisma users are synced via supabaseId

// @desc    Send OTP login link
// @route   POST /api/auth/otp-login
// @access  Public
export const otpLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Send OTP via Supabase Auth
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Auth] ❌ OTP send error:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to send OTP. Please try again.',
      });
    }

    console.log(`[Auth] ✅ OTP sent to: ${email}`);
    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
    });
  } catch (error) {
    console.error('[Auth] ❌ OTP login error:', error);
    next(error);
  }
};

// @desc    Verify OTP and create session
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
      });
    }

    // Verify OTP via Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token: otp,
      type: 'email',
    });

    if (error || !data.session) {
      console.error('[Auth] ❌ OTP verification error:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
    }

    // Get or create user in Prisma using supabaseId
    const supabaseId = data.user.id;
    let user = await prisma.user.findUnique({
      where: { supabaseId },
    });

    if (!user) {
      // First time OTP user - create in Prisma
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          supabaseId,
          fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          phone: data.user.user_metadata?.phone || null,
          role: 'CUSTOMER',
          isVerified: false,
        },
      });
    } else {
      // Mark as verified on successful OTP
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { supabaseId },
          data: { isVerified: true },
        });
      }
    }

    // Generate JWT token for backend session
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    console.log(`[Auth] ✅ User logged in via OTP: ${email}`);
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    console.error('[Auth] ❌ OTP verification error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[Auth] ❌ Get user error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Clear any backend sessions if needed
    console.log(`[Auth] ✅ User logged out: ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Auth] ❌ Logout error:', error);
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    // Delete user from Prisma
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`[Auth] ✅ Account deleted: ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('[Auth] ❌ Delete account error:', error);
    next(error);
  }
};
