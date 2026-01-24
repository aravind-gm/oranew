import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getProductReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      include: {
        user: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, rating, title, reviewText } = req.body;

    // Check if user already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: req.user!.id,
      },
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this product', 400);
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user!.id,
        rating,
        title,
        reviewText,
      },
    });

    // Update product rating
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
    });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: avgRating,
        reviewCount: reviews.length,
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { rating, title, reviewText } = req.body;

    const review = await prisma.review.updateMany({
      where: { id, userId: req.user!.id },
      data: { rating, title, reviewText },
    });

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.review.deleteMany({
      where: { id, userId: req.user!.id },
    });

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
