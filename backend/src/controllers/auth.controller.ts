import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getWelcomeEmailTemplate, sendEmail } from '../utils/email';
import { generateToken } from '../utils/jwt';

// @desc    Get or create user from Supabase Auth
// @route   POST /api/auth/me
// @access  Private (Requires Supabase JWT)
export const getOrCreateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    console.log('[Auth] 🔐 Getting/creating user:', req.user.email);

    // Try to find existing user
    let user = await withRetry(() =>
      prisma.user.findUnique({ 
        where: { email: req.user!.email },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          supabaseId: true,
        }
      })
    );

    // If user doesn't exist, create one
    if (!user) {
      console.log('[Auth] 👤 Creating new user from Supabase auth:', req.user.email);
      
      user = await withRetry(() =>
        prisma.user.create({
          data: {
            email: req.user!.email,
            fullName: req.user!.email.split('@')[0], // Placeholder
            isVerified: true, // Supabase verified the identity
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            supabaseId: true,
          },
        })
      );

      // Send welcome email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Welcome to ORA Jewellery',
          html: getWelcomeEmailTemplate(user.fullName),
        });
      } catch (emailError) {
        console.error('[Auth] Email error:', emailError);
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (DEPRECATED - Use Supabase OTP instead)
// @desc    OTP Login - Create/get user and return JWT
// @route   POST /api/auth/login
// @access  Public
let supabaseIdColumnAvailable: boolean | null = null;

const hasSupabaseIdColumn = async (): Promise<boolean> => {
  if (supabaseIdColumnAvailable !== null) {
    return supabaseIdColumnAvailable;
  }

  try {
    const result = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'supabase_id'
      LIMIT 1
    `;
    supabaseIdColumnAvailable = result.length > 0;
  } catch (error) {
    console.warn('[Auth] ⚠️ Could not verify supabase_id column availability:', {
      message: error instanceof Error ? error.message : String(error),
    });
    supabaseIdColumnAvailable = false;
  }

  return supabaseIdColumnAvailable;
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { supabaseId, email, fullName } = req.body;

    console.log('[Auth] 📥 POST /auth/login received:', { supabaseId, email, fullName });

    // ✅ HARD validation (only required fields)
    if (!supabaseId || !email) {
      console.error('[Auth] ❌ Missing required fields:', { supabaseId, email });
      return res.status(400).json({
        success: false,
        error: 'supabaseId and email are required',
      });
    }

    console.log('[Auth] 📧 OTP Login - Creating/updating user:', { supabaseId, email });

    const canUseSupabaseId = await hasSupabaseIdColumn();

    let user;
    if (canUseSupabaseId) {
      // FIX: Try to find existing user by supabaseId first (more reliable)
      // Then fall back to email if not found
      let existingUser = null;
      try {
        existingUser = await prisma.user.findUnique({
          where: { supabaseId },
        });
      } catch (err) {
        console.warn('[Auth] ⚠️ Could not query by supabaseId, falling back to email:', err instanceof Error ? err.message : String(err));
      }

      if (existingUser) {
        // Update existing user
        console.log('[Auth] 🔄 Updating existing user:', { supabaseId, userId: existingUser.id });
        user = await withRetry(() =>
          prisma.user.update({
            where: { supabaseId },
            data: {
              fullName: fullName || existingUser.fullName,
              isVerified: true,
            },
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              isVerified: true,
              createdAt: true,
            },
          })
        );
      } else {
        // Create new user (or upsert by email if exists)
        console.log('[Auth] ✨ Creating new user:', { supabaseId, email });
        user = await withRetry(() =>
          prisma.user.upsert({
            where: { email },
            update: {
              supabaseId, // Link supabaseId to existing email-based account
              fullName: fullName || undefined,
              isVerified: true,
            },
            create: {
              supabaseId,
              email,
              fullName: fullName || '',
              isVerified: true,
              role: 'CUSTOMER' as const,
            },
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              isVerified: true,
              createdAt: true,
            },
          })
        );
      }
    } else {
      console.warn('[Auth] ⚠️ supabase_id column missing. Falling back to email-only upsert.');
      user = await withRetry(() =>
        prisma.user.upsert({
          where: { email },
          update: {
            fullName: fullName || undefined,
            isVerified: true,
          },
          create: {
            email,
            fullName: fullName || '',
            isVerified: true,
            role: 'CUSTOMER' as const,
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isVerified: true,
            createdAt: true,
          },
        })
      );
    }

    console.log('[Auth] ✅ User created/updated:', { userId: user.id, email: user.email });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    console.log('[Auth] 🔐 JWT generated for user:', user.id);

    // ✅ Return success response with token
    return res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth] ❌ OTP login error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};

// @desc    Register new user (DEPRECATED - Use Supabase OTP instead)
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(410).json({
    success: false,
    error: 'Password-based registration is deprecated. Use Supabase OTP authentication instead.',
  });
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
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      })
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, phone } = req.body;

    const user = await withRetry(() =>
      prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(fullName && { fullName }),
          ...(phone && { phone }),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
        },
      })
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(410).json({
    success: false,
    error: 'Password-based authentication is deprecated. Use Supabase OTP login instead.',
  });
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(410).json({
    success: false,
    error: 'Password-based authentication is deprecated. Use Supabase OTP login instead.',
  });
};

// @desc    Change password (for logged-in users)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  res.status(410).json({
    success: false,
    error: 'Password-based authentication is deprecated. Use Supabase OTP login instead.',
  });
};
// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User ID not found', 401);
    }

    // Delete all user data in order
    // 1. Delete all orders and related data
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { id: true },
    });

    for (const order of orders) {
      // Delete inventory locks
      await prisma.inventoryLock.deleteMany({
        where: { orderId: order.id },
      });
      // Delete order items
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id },
      });
      // Delete payments
      await prisma.payment.deleteMany({
        where: { orderId: order.id },
      });
      // Delete returns
      await prisma.return.deleteMany({
        where: { orderId: order.id },
      });
      // Delete order
      await prisma.order.delete({
        where: { id: order.id },
      });
    }

    // 2. Delete cart items
    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    // 3. Delete addresses
    await prisma.address.deleteMany({
      where: { userId },
    });

    // 4. Delete reviews
    await prisma.review.deleteMany({
      where: { userId },
    });

    // 6. Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};