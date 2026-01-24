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

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '10', search = '', categoryId = '' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true, category: true },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID (Admin)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
export const getProductById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true, category: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, price, discountPercent, categoryId, stockQuantity, ...otherData } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const updateData: any = { ...otherData };
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }
    if (price) {
      updateData.price = parseFloat(price);
      if (discountPercent) {
        updateData.discountPercent = parseFloat(discountPercent);
        updateData.finalPrice = calculateFinalPrice(parseFloat(price), parseFloat(discountPercent));
      } else {
        updateData.finalPrice = parseFloat(price);
      }
    }
    if (categoryId) {
      updateData.categoryId = categoryId;
    }
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = parseInt(stockQuantity);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true, category: true },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products (Public)
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit = '8' } = req.query;

    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: { images: true, category: true },
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by slug (Public)
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: { images: true, category: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search products (Public)
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q, categoryId, minPrice, maxPrice, limit = '12', page = '1' } = req.query;

    if (!q) {
      throw new AppError('Search query is required', 400);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { material: { contains: q as string, mode: 'insensitive' } },
      ],
    };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (minPrice || maxPrice) {
      where.finalPrice = {};
      if (minPrice) {
        where.finalPrice.gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        where.finalPrice.lte = parseFloat(maxPrice as string);
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true, category: true },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
};
