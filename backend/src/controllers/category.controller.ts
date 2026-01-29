import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { slugify } from '../utils/helpers';

export const getCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await withRetry(() =>
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      })
    );

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const category = await withRetry(() =>
      prisma.category.findUnique({
        where: { slug },
        include: {
          children: { where: { isActive: true } },
          products: {
            where: { isActive: true },
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
            take: 12,
          },
        },
      })
    );

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, parentId, imageUrl } = req.body;

    const category = await withRetry(() =>
      prisma.category.create({
        data: {
          name,
          slug: slugify(name),
          description,
          parentId,
          imageUrl,
        },
      })
    );

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.name) {
      updateData.slug = slugify(updateData.name);
    }

    const category = await withRetry(() =>
      prisma.category.update({
        where: { id },
        data: updateData,
      })
    );

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await withRetry(() =>
      prisma.category.delete({ where: { id } })
    );

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
