import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { getSignedUrl } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { calculateFinalPrice, slugify } from '../utils/helpers';
import { normalizeSupabaseUrl } from '../utils/supabaseUrlHelper';

// Helper function to transform image URL to CDN URL
// Handles both Supabase legacy URLs and R2/CDN URLs
function transformImageUrlToCDN(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // Already a CDN URL
  if (imageUrl.includes('cdn.orashop.in')) {
    return imageUrl;
  }

  // Supabase URL - extract the filename and use CDN
  if (imageUrl.includes('supabase.co')) {
    const filenameMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/products/${filename}`;
    }
  }

  // R2 bucket URL - transform to CDN
  if (imageUrl.includes('.r2.dev') || imageUrl.includes('r2.dev')) {
    const filenameMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/products/${filename}`;
    }
  }

  // Relative path - prepend CDN URL
  if (!imageUrl.startsWith('http')) {
    return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/${imageUrl}`;
  }

  // Unknown format - return as is
  return imageUrl;
}

// Helper function to ensure product images have correct CDN URLs
// Both storefront and admin now use CDN URLs for consistency
async function transformProductImages(product: any, forPublic: boolean = true) {
  if (!product.images || product.images.length === 0) {
    return product;
  }

  const transformedImages = product.images.map((img: any) => {
    if (!img.imageUrl) {
      return img;
    }

    // Transform to CDN URL
    const cdnUrl = transformImageUrlToCDN(img.imageUrl);
    return { ...img, imageUrl: cdnUrl };
  });

  return { ...product, images: transformedImages };
}

// Note: Signed URLs no longer needed - using CDN public URLs instead

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
      collections,
      occasions,
      isFeaturedGift,
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
    // Ensure slug uniqueness — append random suffix if collision
    let finalSlug = slug;
    const existingSlug = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      const suffix = Math.random().toString(36).substring(2, 7);
      finalSlug = `${slug}-${suffix}`;
    }
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
          slug: finalSlug,
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
          collections: collections || [],
          occasions: occasions || [],
          isFeaturedGift: isFeaturedGift || false,
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

// @desc    Get all products (Public)
// @route   GET /api/products
// @access  Public
export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      category, 
      page = '1', 
      limit = '16', 
      maxPrice,
      minPrice,
      sortBy, 
      sort, // Add support for 'sort' parameter
      isNew, // Add support for 'isNew' parameter
      collection, // Gift collection filter
      occasion, // Occasion filter
      featuredGifts, // Featured gifts only
      // NEW: Tumbler & Offer filters
      hasDiscount,
      isOnOffer,
      offerType,
      minDiscount,
      material,
      capacity,
      inStock,
      isBestseller,
      isTumbler,
      search,
    } = req.query;

    // 📊 Log incoming request
    console.log('[Product Controller] 📊 getProducts() called', {
      category,
      page,
      limit,
      maxPrice,
      sortBy,
      sort,
      isNew,
      collection,
      occasion,
      featuredGifts,
      timestamp: new Date().toISOString(),
    });

    let categoryId: string | undefined = undefined;

    // 🔑 Resolve category slug → categoryId
    if (category && typeof category === 'string') {
      const foundCategory = await prisma.category.findFirst({
        where: {
          slug: category.toLowerCase(),
        },
        select: { id: true },
      });

      if (foundCategory) {
        categoryId = foundCategory.id;
        console.log('[Product Controller] ✅ Category resolved', {
          slug: category,
          id: categoryId,
        });
      } else {
        console.warn('[Product Controller] ⚠️ Category slug not found', {
          requestedSlug: category,
          fallback: 'showing all active products',
        });
      }
    }

    // 📊 Parse optional filters
    const parsedMaxPrice = maxPrice ? parseFloat(maxPrice as string) : undefined;
    
    // Handle both 'sortBy' and 'sort' parameters
    let sortParam = sortBy || sort;
    const parsedSortBy = sortParam ? (sortParam as string) : 'createdAt';

    // 🔍 Validate sortBy to prevent injection and support valid sorts
    // Support both with and without minus prefix
    const allowedSortFields = [
      'createdAt', '-createdAt', 
      'finalPrice', '-finalPrice', 
      'averageRating', '-averageRating',
      'name', '-name'
    ];
    const validSortBy = allowedSortFields.includes(parsedSortBy) ? parsedSortBy : 'createdAt';

    // 🔒 BUILD WHERE CLAUSE — MANDATORY isActive=true FOR STOREFRONT
    const whereClause: any = {
      isActive: true,  // ← THIS IS MANDATORY. Products invisible without this.
      deletedAt: null, // Exclude soft-deleted products
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // 💰 Optional price filter
    if (parsedMaxPrice !== undefined && parsedMaxPrice > 0) {
      whereClause.finalPrice = {
        lte: parsedMaxPrice,
      };
    }

    // 🆕 Handle 'isNew' filter - products created in the last 30 days
    if (isNew && (isNew === 'true' || isNew === '1')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      whereClause.createdAt = {
        gte: thirtyDaysAgo,
      };
      
      console.log('[Product Controller] 🆕 Filtering for new products', {
        since: thirtyDaysAgo.toISOString(),
      });
    }

    // 🎁 Handle 'collection' filter - products in specific gift collection
    if (collection && typeof collection === 'string') {
      whereClause.collections = {
        has: collection,
      };
      console.log('[Product Controller] 🎁 Filtering by collection', { collection });
    }

    // 🎉 Handle 'occasion' filter - products for specific occasions
    if (occasion && typeof occasion === 'string') {
      // Support comma-separated occasions: "birthday,anniversary"
      const occasionList = occasion.split(',').map(o => o.trim());
      whereClause.occasions = {
        hasSome: occasionList,
      };
      console.log('[Product Controller] 🎉 Filtering by occasions', { occasionList });
    }

    // ⭐ Handle 'featuredGifts' filter - featured gifts only
    if (featuredGifts && (featuredGifts === 'true' || featuredGifts === '1')) {
      whereClause.isFeaturedGift = true;
      console.log('[Product Controller] ⭐ Filtering featured gifts only');
    }

    // 🥤 Handle minPrice filter
    if (minPrice && !isNaN(parseFloat(minPrice as string))) {
      const parsedMinPrice = parseFloat(minPrice as string);
      if (parsedMinPrice > 0) {
        whereClause.finalPrice = {
          ...whereClause.finalPrice,
          gte: parsedMinPrice,
        };
      }
    }

    // 🏷 Handle 'hasDiscount' filter - products with any discount > 0
    if (hasDiscount && (hasDiscount === 'true' || hasDiscount === '1')) {
      whereClause.discountPercent = { gt: 0 };
    }

    // 🏷 Handle 'isOnOffer' filter
    if (isOnOffer && (isOnOffer === 'true' || isOnOffer === '1')) {
      whereClause.OR = [
        { isOnOffer: true },
        { discountPercent: { gt: 0 } },
      ];
    }

    // 🏷 Handle 'offerType' filter
    if (offerType && typeof offerType === 'string') {
      whereClause.offerType = offerType;
    }

    // 🏷 Handle 'minDiscount' filter (clearance = 30%+)
    if (minDiscount && !isNaN(parseFloat(minDiscount as string))) {
      whereClause.discountPercent = {
        ...whereClause.discountPercent,
        gte: parseFloat(minDiscount as string),
      };
    }

    // 🥤 Handle 'material' filter
    if (material && typeof material === 'string') {
      whereClause.material = {
        contains: material,
        mode: 'insensitive',
      };
    }

    // 🥤 Handle 'capacity' filter
    if (capacity && typeof capacity === 'string') {
      whereClause.capacity = {
        contains: capacity,
        mode: 'insensitive',
      };
    }

    // 🥤 Handle 'inStock' filter
    if (inStock && (inStock === 'true' || inStock === '1')) {
      whereClause.stockQuantity = { gt: 0 };
    }

    // 🥤 Handle 'isBestseller' filter
    if (isBestseller && (isBestseller === 'true' || isBestseller === '1')) {
      whereClause.isBestseller = true;
    }

    // 🥤 Handle 'isTumbler' filter
    if (isTumbler && (isTumbler === 'true' || isTumbler === '1')) {
      whereClause.isTumbler = true;
    }

    // 🔍 Handle 'search' filter
    if (search && typeof search === 'string' && search.trim()) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { shortDescription: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // 📊 Build sort order from parameter
    let orderByClause: any = { createdAt: 'desc' };
    
    // Handle minus prefix for descending sort
    if (validSortBy.startsWith('-')) {
      const field = validSortBy.substring(1); // Remove minus prefix
      if (field === 'finalPrice') {
        orderByClause = { finalPrice: 'desc' };
      } else if (field === 'averageRating') {
        orderByClause = { averageRating: 'desc' };
      } else if (field === 'createdAt') {
        orderByClause = { createdAt: 'desc' };
      } else if (field === 'name') {
        orderByClause = { name: 'desc' };
      }
    } else {
      // Handle ascending sort (no minus prefix)
      if (validSortBy === 'finalPrice') {
        orderByClause = { finalPrice: 'asc' };
      } else if (validSortBy === 'averageRating') {
        orderByClause = { averageRating: 'asc' };
      } else if (validSortBy === 'createdAt') {
        orderByClause = { createdAt: 'asc' };
      } else if (validSortBy === 'name') {
        orderByClause = { name: 'asc' };
      }
    }

    // 🔍 Execute query with filters
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          category: true,
          images: true,
        },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // 📊 Log result
    console.log('[Product Controller] ✅ Products fetched for storefront', {
      totalAvailable: total,
      returnedCount: products.length,
      page: Number(page),
      filters: {
        hasCategory: !!categoryId,
        hasPriceFilter: parsedMaxPrice !== undefined,
        maxPrice: parsedMaxPrice,
        sortBy: validSortBy,
        isNew: !!isNew,
        isActiveFilter: 'MANDATORY ✅',
      },
    });

    // Transform image URLs to PUBLIC URLs for storefront (no expiration)
    const productsWithPublicUrls = await Promise.all(
      products.map((product) => transformProductImages(product, true))
    );

    res.json({
      data: productsWithPublicUrls,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[Product Controller] ❌ getProducts() error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ message: 'Failed to fetch products' });
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

    // Transform images to signed URLs
    const productWithSignedUrls = await transformProductImages(product);

    res.json({
      success: true,
      data: productWithSignedUrls,
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
      const newSlug = slugify(name);
      // Ensure slug uniqueness on rename
      const existingSlug = await prisma.product.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (existingSlug) {
        const suffix = Math.random().toString(36).substring(2, 7);
        updateData.slug = `${newSlug}-${suffix}`;
      } else {
        updateData.slug = newSlug;
      }
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

    console.log('[Product Controller] ✅ Product updated successfully:', {
      productId: id,
      productName: updated.name,
      fieldsUpdated: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[Product Controller] ❌ Update failed:', {
      productId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
};

// @desc    Delete product (Admin) — SOFT DELETE
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { images: true }
    });
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check for pending orders before soft-deleting
    const pendingOrders = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
        },
      },
    });

    if (pendingOrders > 0) {
      throw new AppError(
        `Cannot delete product "${product.name}" — it has ${pendingOrders} pending order(s). Cancel or complete them first.`,
        400
      );
    }

    // Soft delete: set deletedAt + deactivate
    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        bogoActive: false,
      },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully (soft delete)',
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
        deletedAt: null,
      },
      include: { images: true, category: true },
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });

    // Transform image URLs to signed URLs for reliable access
    const productsWithSignedUrls = await Promise.all(
      products.map((product) => transformProductImages(product))
    );

    res.json({
      success: true,
      data: productsWithSignedUrls,
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
        deletedAt: null,
      },
      include: { images: true, category: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Transform images to PUBLIC URLs for storefront
    const productWithPublicUrls = await transformProductImages(product, true);

    res.json({
      success: true,
      data: productWithPublicUrls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID (Public - for cart stock validation)
// @route   GET /api/products/id/:id
// @access  Public
export const getProductByIdPublic = async (
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

    // Transform images to PUBLIC URLs for storefront
    const productWithPublicUrls = await transformProductImages(product, true);

    res.json({
      success: true,
      data: productWithPublicUrls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended products for cross-sell
// @route   GET /api/products/recommended
// @access  Public
export const getRecommendedProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, limit = '6' } = req.query;

    let excludeIds: string[] = [];
    let categoryId: string | undefined;

    // If productId provided, find similar products
    if (productId && typeof productId === 'string') {
      const sourceProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, categoryId: true },
      });
      if (sourceProduct) {
        excludeIds = [sourceProduct.id];
        categoryId = sourceProduct.categoryId;
      }
    }

    const whereClause: any = {
      isActive: true,
      stockQuantity: { gt: 0 },
      id: { notIn: excludeIds },
      images: { some: {} }, // Must have at least one image
    };

    // Prioritize same category
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
      take: Number(limit),
      include: {
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    // If not enough same-category products, fill with popular ones
    if (products.length < Number(limit)) {
      const remaining = Number(limit) - products.length;
      const existingIds = [...excludeIds, ...products.map((p) => p.id)];

      const moreProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: { gt: 0 },
          id: { notIn: existingIds },
          images: { some: {} },
        },
        orderBy: [{ averageRating: 'desc' }, { reviewCount: 'desc' }],
        take: remaining,
        include: {
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      });

      products = [...products, ...moreProducts];
    }

    const productsWithUrls = await Promise.all(
      products.map((product) => transformProductImages(product, true))
    );

    res.json({
      success: true,
      data: productsWithUrls,
    });
  } catch (error) {
    console.error('[Product] Error fetching recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
};
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

    // Transform image URLs to signed URLs for reliable access
    const productsWithSignedUrls = await Promise.all(
      products.map((product) => transformProductImages(product))
    );

    res.json({
      success: true,
      data: productsWithSignedUrls,
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
