import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { calculateFinalPrice, slugify } from '../utils/helpers';

// @desc    Create product (Admin)
// @route   POST /api/admin/products
// @access  Private/Admin
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 🔐 Verify admin authentication
    if (!req.user) {
      console.error('[Product Controller] ❌ NO USER IN REQUEST', {
        endpoint: '/admin/products',
        method: 'POST',
      });
      throw new AppError('Not authenticated', 401);
    }

    console.log('[Product Controller] 📝 Creating product...', {
      userId: req.user.id,
      userRole: req.user.role,
      userEmail: req.user.email,
    });

    const {
      name,
      description,
      shortDescription,
      price,
      discountPercent,
      categoryId,
      material,
      careInstructions,
      weight,
      dimensions,
      stockQuantity,
      isFeatured,
      isActive,
      images,
      metaTitle,
      metaDescription,
    } = req.body;

    // Validation
    const errors: string[] = [];

    if (!name || !name.trim()) {
      errors.push('Product name is required');
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      errors.push('Valid price (> 0) is required');
    }

    if (!categoryId || !categoryId.trim()) {
      errors.push('Category ID is required');
    }

    if (discountPercent && (isNaN(parseFloat(discountPercent)) || parseFloat(discountPercent) < 0 || parseFloat(discountPercent) > 100)) {
      errors.push('Discount must be between 0 and 100');
    }

    if (stockQuantity && (isNaN(parseInt(stockQuantity)) || parseInt(stockQuantity) < 0)) {
      errors.push('Stock quantity must be a non-negative number');
    }

    if (images && !Array.isArray(images)) {
      errors.push('Images must be an array');
    }

    if (errors.length > 0) {
      console.warn('[Product Controller] ⚠️ VALIDATION FAILED', { errors });
      throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError(`Category with ID ${categoryId} not found`, 400);
    }

    const slug = slugify(name);
    const finalPrice = calculateFinalPrice(
      parseFloat(price),
      parseFloat(discountPercent || 0)
    );

    console.log('[Product Controller] ✅ Validation passed, creating product...', {
      productName: name,
      price: parseFloat(price),
      finalPrice,
      imageCount: images?.length || 0,
    });

    // 🔐 ATOMIC TRANSACTION: Create product AND images together
    // If either fails, entire operation is rolled back
    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          name,
          slug,
          description,
          shortDescription,
          price: parseFloat(price),
          discountPercent: parseFloat(discountPercent || 0),
          finalPrice,
          sku: `ORA-${Date.now()}`,
          categoryId,
          material,
          careInstructions,
          weight,
          dimensions,
          stockQuantity: parseInt(stockQuantity || '0'),
          isFeatured: isFeatured || false,
          isActive: isActive !== false,
          metaTitle,
          metaDescription,
        },
      });

      // Create images if provided
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: any, index: number) => ({
            productId: createdProduct.id,
            imageUrl: img.url,
            altText: img.alt || name,
            sortOrder: index,
            isPrimary: img.isPrimary || index === 0,
          })),
        });
      }

      // Return product with images
      return tx.product.findUnique({
        where: { id: createdProduct.id },
        include: { images: true, category: true },
      });
    });

    console.log('[Product Controller] ✅ PRODUCT CREATED SUCCESSFULLY', {
      productId: product!.id,
      productName: product!.name,
      imageCount: product!.images.length,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
