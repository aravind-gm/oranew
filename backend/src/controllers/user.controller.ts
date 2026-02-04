import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { User } from '@prisma/client';

// @desc    Complete user profile (for new users)
// @route   PUT /api/users/complete-profile
// @access  Private
export const completeProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, phone, gender } = req.body;

    if (!fullName || fullName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Full name is required',
      });
    }

    const user = await withRetry<User>(() =>
      prisma.user.update({
        where: { id: req.user!.id },
        data: {
          fullName: fullName.trim(),
          phone: phone || null,
          gender: gender || null,
          profileCompleted: true,
        },
      })
    );

    console.log(`[User] ✅ Profile completed for: ${user.email}`);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        gender: user.gender,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (
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
          gender: true,
          role: true,
          profileCompleted: true,
          createdAt: true,
        },
      })
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, phone, gender } = req.body;

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined) updateData.gender = gender;

    const user = await withRetry<User>(() =>
      prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
      })
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        gender: user.gender,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const addresses = await withRetry(() =>
      prisma.address.findMany({
        where: { userId: req.user!.id },
        orderBy: { isDefault: 'desc' },
      })
    );

    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      isDefault,
      addressType,
    } = req.body;

    // If this is default, unset other defaults
    if (isDefault) {
      await withRetry(() =>
        prisma.address.updateMany({
          where: { userId: req.user!.id },
          data: { isDefault: false },
        })
      );
    }

    const address = await withRetry(() =>
      prisma.address.create({
        data: {
          userId: req.user!.id,
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          country: country || 'India',
          isDefault,
          addressType,
        },
      })
    );

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      await withRetry(() =>
        prisma.address.updateMany({
          where: { userId: req.user!.id },
          data: { isDefault: false },
        })
      );
    }

    const address = await withRetry(() =>
      prisma.address.updateMany({
        where: { id, userId: req.user!.id },
        data: updateData,
      })
    );

    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await withRetry(() =>
      prisma.address.deleteMany({
        where: { id, userId: req.user!.id },
      })
    );

    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};
