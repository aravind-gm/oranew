import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const cartItems = await withRetry(() =>
      prisma.cartItem.findMany({
        where: { userId: req.user!.id },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      })
    );

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
    const product = await withRetry(() =>
      prisma.product.findUnique({
        where: { id: productId },
      })
    ) as any;

    if (!product || !(product as any).isActive || (product as any).deletedAt) {
      throw new AppError('Product not found or unavailable', 404);
    }

    if ((product as any).stockQuantity < quantity) {
      throw new AppError(`Only ${(product as any).stockQuantity} available for "${(product as any).name}"`, 400);
    }

    // Check if item already in cart
    const existingItem = await withRetry(() =>
      prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId,
          },
        },
      })
    ) as any;

    // Validate total quantity (existing + new) against stock
    const existingQty = existingItem ? (existingItem as any).quantity : 0;
    const newTotalQty = existingQty + quantity;

    if (newTotalQty > (product as any).stockQuantity) {
      const canAdd = (product as any).stockQuantity - existingQty;
      throw new AppError(
        canAdd > 0
          ? `Cannot add ${quantity} more. Only ${canAdd} more available.`
          : 'Maximum available stock already in cart.',
        400
      );
    }

    // Cap at max 10 per product
    if (newTotalQty > 10) {
      throw new AppError(
        `Maximum 10 items per product allowed. You already have ${existingQty} in cart.`,
        400
      );
    }

    let cartItem;

    if (existingItem) {
      // Update quantity
      cartItem = await withRetry(() =>
        prisma.cartItem.update({
          where: { id: (existingItem as any).id },
          data: { quantity: newTotalQty },
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        })
      );
    } else {
      // Create new cart item
      cartItem = await withRetry(() =>
        prisma.cartItem.create({
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
        })
      );
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

    const cartItem = await withRetry(() =>
      prisma.cartItem.findFirst({
        where: { id, userId: req.user!.id },
        include: { product: true },
      })
    );

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    // Validate stock before updating quantity
    if (quantity > (cartItem as any).product.stockQuantity) {
      throw new AppError(
        `Only ${(cartItem as any).product.stockQuantity} available for "${(cartItem as any).product.name}"`,
        400
      );
    }

    if (quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    // Cap at max 10 per product
    if (quantity > 10) {
      throw new AppError('Maximum 10 items per product allowed', 400);
    }

    const updatedItem = await withRetry(() =>
      prisma.cartItem.update({
        where: { id },
        data: { quantity },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      })
    );

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

    await withRetry(() =>
      prisma.cartItem.deleteMany({
        where: { id, userId: req.user!.id },
      })
    );

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
    await withRetry(() =>
      prisma.cartItem.deleteMany({
        where: { userId: req.user!.id },
      })
    );

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
