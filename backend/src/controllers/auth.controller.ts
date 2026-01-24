import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getPasswordResetEmailTemplate, getWelcomeEmailTemplate, sendEmail } from '../utils/email';
import { generateToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, fullName, phone } = req.body;

    console.log('Registration request:', { email, fullName, hasPassword: !!password, phone });

    // Validation
    if (!email || !password || !fullName) {
      console.log('Validation failed:', { email: !!email, password: !!password, fullName: !!fullName });
      throw new AppError('Please provide all required fields (email, password, fullName)', 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Send welcome email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to ORA Jewellery',
        html: getWelcomeEmailTemplate(user.fullName),
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
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
    });

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

    const user = await prisma.user.update({
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
    });

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
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    }

    // Generate reset token (crypto random)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Create password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetTokenHash,
        expiresAt,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your ORA Password',
        html: getPasswordResetEmailTemplate(user.fullName, resetUrl),
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      throw new AppError('Failed to send reset email. Please try again.', 500);
    }

    res.json({
      success: true,
      message: 'Password reset instructions sent to email',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, email, newPassword, confirmPassword } = req.body;

    if (!token || !email || !newPassword) {
      throw new AppError('Missing required fields', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid reset request', 400);
    }

    // Hash the token to compare
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        token: resetTokenHash,
        expiresAt: { gt: new Date() }, // Not expired
      },
    });

    if (!passwordReset) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password and delete reset token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      }),
    ]);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (for logged-in users)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError('Please provide current password, new password, and confirm password', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('New passwords do not match', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
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

    // 4. Delete password reset tokens
    await prisma.passwordReset.deleteMany({
      where: { userId },
    });

    // 5. Delete reviews
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