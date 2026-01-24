import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.body;

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: req.user!.id,
        productId,
      },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: wishlistItem });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.wishlist.deleteMany({
      where: { id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    next(error);
  }
};
