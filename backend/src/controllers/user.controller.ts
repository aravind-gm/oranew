import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAddresses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { isDefault: 'desc' },
    });

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
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
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
    });

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
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.updateMany({
      where: { id, userId: req.user!.id },
      data: updateData,
    });

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

    await prisma.address.deleteMany({
      where: { id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};
