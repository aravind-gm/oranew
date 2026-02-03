import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { classifyDatabaseError } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getWelcomeEmailTemplate, sendEmail } from '../utils/email';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';

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
          to: (user as any).email,
          subject: 'Welcome to ORA Jewellery',
          html: getWelcomeEmailTemplate((user as any).fullName),
        });
      } catch (emailError) {
        console.error('[Auth] Email error:', emailError);
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: (user as any).id,
          email: (user as any).email,
          fullName: (user as any).fullName,
          phone: (user as any).phone,
          role: (user as any).role,
          isVerified: (user as any).isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (DEPRECATED - Use Supabase OTP instead)
// @desc    OTP Login - Create/get user and return JWT
// @route   POST /api/auth/otp-login
// @access  Public (Requires valid supabaseId from Supabase Auth)
// 
// CRITICAL: This endpoint MUST:
// 1. Receive supabaseId from Supabase OTP flow (not auto-generated)
// 2. Link it to backend user record
// 3. Handle DB connection failures gracefully
// 4. Return structured error responses
export const otpLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { supabaseId, email, fullName } = req.body;

    console.log('[Auth] 📥 OTP Login:', { supabaseId, email });

    // ============================================
    // VALIDATION: Reject invalid requests
    // ============================================
    if (!supabaseId || !email) {
      console.error('[Auth] ❌ Invalid OTP payload:', { supabaseId, email });
      return res.status(400).json({
        success: false,
        error: 'supabaseId and email are required',
        retryable: false,
      });
    }

    // supabaseId must be a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supabaseId)) {
      console.error('[Auth] ❌ Invalid supabaseId format:', { supabaseId });
      return res.status(400).json({
        success: false,
        error: 'Invalid supabaseId format',
        retryable: false,
      });
    }

    try {
      // ============================================
      // STEP 1: Try to find user by supabaseId
      // ============================================
      let user = await withRetry(() =>
        prisma.user.findUnique({
          where: { supabaseId },
        })
      ) as any;

      if (user) {
        console.log('[Auth] 🔄 Found by supabaseId, updating:', { id: (user as any).id });
        // Update existing user
        user = await withRetry(() =>
          prisma.user.update({
            where: { id: (user as any).id },
            data: {
              email,
              fullName: fullName || (user as any).fullName,
              isVerified: true,
            },
          })
        ) as any;
      } else {
        // ============================================
        // STEP 2: Try to find user by email
        // ============================================
        user = await withRetry(() =>
          prisma.user.findUnique({
            where: { email },
          })
        ) as any;

        if (user) {
          console.log('[Auth] 🔄 Found by email, updating:', { id: (user as any).id });
          // Link supabaseId to existing user
          user = await withRetry(() =>
            prisma.user.update({
              where: { id: (user as any).id },
              data: {
                supabaseId,
                fullName: fullName || (user as any).fullName,
                isVerified: true,
              },
            })
          ) as any;
        } else {
          // ============================================
          // STEP 3: Create new user with supabaseId
          // ============================================
          console.log('[Auth] ✨ Creating new OTP user:', { email });
          user = await withRetry(() =>
            prisma.user.create({
              data: {
                supabaseId,
                email,
                fullName: fullName || 'User',
                isVerified: true,
                role: 'CUSTOMER' as const,
              },
            })
          ) as any;
        }
      }

      // ============================================
      // Generate JWT token for backend
      // ============================================
      const token = generateToken({
        id: (user as any).id,
        email: (user as any).email,
        role: (user as any).role,
      });

      console.log('[Auth] ✅ OTP login success:', { id: (user as any).id });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: (user as any).id,
            email: (user as any).email,
            fullName: (user as any).fullName,
            role: (user as any).role,
          },
          token,
        },
      });
    } catch (dbError) {
      // ============================================
      // Handle database errors with classification
      // ============================================
      const classified = classifyDatabaseError(dbError);
      
      console.error('[Auth] 💥 Database error in OTP login:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any).code,
        retryable: classified.retryable,
      });

      return res.status(classified.statusCode).json({
        success: false,
        error: classified.message,
        retryable: classified.retryable,
        code: classified.code,
      });
    }
  } catch (error) {
    console.error('[Auth] ❌ OTP login failed:', error instanceof Error ? error.message : String(error));
    next(error);
  }
};

// @desc    Admin Login - Email + password (SEPARATE FROM OTP)
// @route   POST /api/auth/admin-login
// @access  Public
//
// CRITICAL: This is a SEPARATE flow from OTP login!
// - OTP login: Uses Supabase-generated supabaseId
// - Admin login: Uses password + email (no OTP)
// - Never confuse the two or admin login will fail
export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    console.log('[Auth] 📥 Admin login attempt:', { email });

    // ============================================
    // VALIDATION
    // ============================================
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'email and password required',
        retryable: false,
      });
    }

    try {
      // ============================================
      // Find admin user
      // ============================================
      const admin = await withRetry(() =>
        prisma.user.findUnique({
          where: { email },
        })
      ) as any;

      if (!admin) {
        console.log('[Auth] ❌ Admin not found:', { email });
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          retryable: false,
        });
      }

      // ============================================
      // Check admin role
      // ============================================
      if ((admin as any).role !== 'ADMIN' && (admin as any).role !== 'STAFF') {
        console.log('[Auth] ❌ User is not admin:', { email, role: admin.role });
        return res.status(403).json({
          success: false,
          error: 'You do not have admin access',
          retryable: false,
        });
      }

      // ============================================
      // Verify password
      // ============================================
      const passwordField = (admin as any).password;
      if (!passwordField) {
        console.log('[Auth] ❌ Admin has no password set:', { email });
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          retryable: false,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, passwordField);
      if (!isPasswordValid) {
        console.log('[Auth] ❌ Invalid password:', { email });
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          retryable: false,
        });
      }

      // ============================================
      // Generate JWT token
      // ============================================
      const token = generateToken({
        id: (admin as any).id,
        email: (admin as any).email,
        role: (admin as any).role,
      });

      console.log('[Auth] ✅ Admin login success:', { id: (admin as any).id, email });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: (admin as any).id,
            email: (admin as any).email,
            fullName: (admin as any).fullName,
            role: (admin as any).role,
          },
          token,
        },
      });
    } catch (dbError) {
      // ============================================
      // Handle database errors
      // ============================================
      const classified = classifyDatabaseError(dbError);
      
      console.error('[Auth] 💥 Database error in admin login:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        retryable: classified.retryable,
      });

      return res.status(classified.statusCode).json({
        success: false,
        error: classified.message,
        retryable: classified.retryable,
      });
    }
  } catch (error) {
    console.error('[Auth] ❌ Admin login failed:', error instanceof Error ? error.message : String(error));
    next(error);
  }
};

// @desc    Legacy login (kept for backward compatibility)
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { supabaseId, email, password } = req.body;

  // If it's OTP login (has supabaseId)
  if (supabaseId) {
    return otpLogin(req, res, next);
  }

  // If it's admin login (has password)
  if (password) {
    return adminLogin(req, res, next);
  }

  // Invalid payload
  return res.status(400).json({
    success: false,
    error: 'Invalid payload',
  });
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