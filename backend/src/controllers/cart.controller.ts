import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    res.json({ success: true, data: cartItems });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new AppError('Product not found', 404);
    }

    if (product.stockQuantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.user!.id,
          productId,
          quantity,
        },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });
    }

    res.status(201).json({ success: true, data: cartItem });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.cartItem.deleteMany({
      where: { id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.id },
    });

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
