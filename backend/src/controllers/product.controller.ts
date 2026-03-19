import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { getSignedUrl } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { calculateFinalPrice, slugify } from '../utils/helpers';
import { normalizeSupabaseUrl } from '../utils/supabaseUrlHelper';
import { logAdminAction } from '../utils/auditLog';
import { transformImageUrlToCDN, transformProductImages } from '../utils/imageUrl';
import { cacheGet, cacheSet } from '../config/redis';

const CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  tumbler: ['tumblers'],
  tumblers: ['tumbler'],
};

function getCategorySlugCandidates(rawSlug: string): string[] {
  const normalized = rawSlug.toLowerCase().trim();
  const aliases = CATEGORY_SLUG_ALIASES[normalized] || [];
  return [normalized, ...aliases];
}

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
      sku,
      material,
      careInstructions,
      weight,
      dimensions,
      stockQuantity,
      lowStockThreshold,
      isFeatured,
      isActive,
      images,
      metaTitle,
      metaDescription,
      primaryImageAlt,
      collections,
      occasions,
      isFeaturedGift,
      // BOGO fields
      isBOGOEligible,
      bogoPriceTier,
      bogoCategory,
      bogoActive,
      // Tumbler fields
      isTumbler,
      capacity,
      isBestseller,
      hsnCode,
      videoUrl,
      // Offer fields
      isOnOffer,
      offerType,
      offerValue,
      offerExpiry,
      showCountdown,
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

    if (metaTitle != null && String(metaTitle).length > 60) {
      errors.push('metaTitle must be 60 characters or less');
    }

    if (metaDescription != null && String(metaDescription).length > 160) {
      errors.push('metaDescription must be 160 characters or less');
    }

    if (primaryImageAlt != null && String(primaryImageAlt).length > 125) {
      errors.push('primaryImageAlt must be 125 characters or less');
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
          sku: sku && String(sku).trim() ? String(sku).trim() : `ORA-${Date.now()}`,
          categoryId,
          material,
          careInstructions,
          weight,
          dimensions,
          stockQuantity: parseInt(stockQuantity || '0'),
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : 5,
          isFeatured: isFeatured || false,
          isActive: isActive !== false,
          metaTitle: metaTitle == null ? null : String(metaTitle).trim().slice(0, 60),
          metaDescription: metaDescription == null ? null : String(metaDescription).trim().slice(0, 160),
          primaryImageAlt:
            primaryImageAlt == null ? null : String(primaryImageAlt).trim().slice(0, 125),
          collections: collections || [],
          occasions: occasions || [],
          isFeaturedGift: isFeaturedGift || false,
          // BOGO
          isBOGOEligible: isBOGOEligible || false,
          bogoPriceTier: bogoPriceTier ? parseInt(bogoPriceTier, 10) : 0,
          bogoCategory: bogoCategory || null,
          bogoActive: bogoActive || false,
          // Tumbler
          isTumbler: isTumbler || false,
          capacity: capacity || null,
          isBestseller: isBestseller || false,
          hsnCode: hsnCode && String(hsnCode).trim() ? String(hsnCode).trim() : null,
          videoUrl: videoUrl && String(videoUrl).trim() ? String(videoUrl).trim() : null,
          // Offers
          isOnOffer: isOnOffer || false,
          offerType: offerType || null,
          offerValue: offerValue ? parseFloat(offerValue) : null,
          offerExpiry: offerExpiry ? new Date(offerExpiry) : null,
          showCountdown: showCountdown || false,
        },
      });

      // Create images if provided
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: any, index: number) => {
            const isPrimaryImage = img.isPrimary || index === 0;
            return {
              productId: createdProduct.id,
              imageUrl: img.url,
              altText:
                img.alt ||
                (isPrimaryImage && primaryImageAlt ? String(primaryImageAlt).trim().slice(0, 125) : name),
              sortOrder: index,
              isPrimary: isPrimaryImage,
            };
          }),
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

    // Audit log — non-blocking
    logAdminAction(req, 'CREATE', 'PRODUCT', product!.id, {
      name: product!.name,
      price: Number(product!.price),
      categoryId: product!.categoryId,
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
      const categorySlugCandidates = getCategorySlugCandidates(category);

      const foundCategory = await prisma.category.findFirst({
        where: {
          slug: { in: categorySlugCandidates },
        },
        select: { id: true, slug: true },
      });

      if (foundCategory) {
        categoryId = foundCategory.id;
        console.log('[Product Controller] ✅ Category resolved', {
          slug: category,
          matchedSlug: foundCategory.slug,
          id: categoryId,
        });
      } else {
        console.warn('[Product Controller] ⚠️ Category slug not found', {
          requestedSlug: category,
          triedSlugs: categorySlugCandidates,
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
        skip: (Number(page) - 1) * Math.min(Number(limit) || 16, 100),
        take: Math.min(Number(limit) || 16, 100),
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

    // SECURITY: Explicit whitelist — NEVER spread req.body into Prisma.
    // Spreading otherData would allow callers to inject any DB column
    // (e.g. isDeleted, deletedAt, bogoActive, gstRate) bypassing all validation.
    const {
      name,
      slug,
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
      primaryImageAlt,
      collections,
      occasions,
      isFeaturedGift,
      isBOGOEligible,
      bogoPriceTier,
      bogoCategory,
      bogoActive,
      isTumbler,
      capacity,
      isBestseller,
      hsnCode,
      videoUrl,
      isOnOffer,
      offerType,
      offerValue,
      offerExpiry,
      showCountdown,
      lowStockThreshold,
      sku,
    } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Build update payload from whitelisted fields only
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = String(name).trim();
    }
    // Use explicit slug from frontend if provided (preserves SEO);
    // only regenerate from name if slug is NOT sent.
    if (slug !== undefined && String(slug).trim()) {
      const candidateSlug = String(slug).trim();
      const existingSlug = await prisma.product.findFirst({
        where: { slug: candidateSlug, id: { not: id } },
      });
      if (existingSlug) {
        const suffix = Math.random().toString(36).substring(2, 7);
        updateData.slug = `${candidateSlug}-${suffix}`;
      } else {
        updateData.slug = candidateSlug;
      }
    } else if (name !== undefined) {
      // Fallback: regenerate from name only if no slug provided
      const newSlug = slugify(String(name));
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
    if (description !== undefined) updateData.description = String(description);
    if (shortDescription !== undefined) updateData.shortDescription = String(shortDescription).slice(0, 500);
    if (price !== undefined) {
      updateData.price = parseFloat(price);
      const disc = discountPercent !== undefined ? parseFloat(discountPercent) : Number(product.discountPercent);
      updateData.discountPercent = disc;
      updateData.finalPrice = calculateFinalPrice(parseFloat(price), disc);
    } else if (discountPercent !== undefined) {
      updateData.discountPercent = parseFloat(discountPercent);
      updateData.finalPrice = calculateFinalPrice(Number(product.price), parseFloat(discountPercent));
    }
    if (categoryId !== undefined) updateData.categoryId = String(categoryId);
    if (material !== undefined) updateData.material = String(material);
    if (careInstructions !== undefined) updateData.careInstructions = String(careInstructions);
    if (weight !== undefined) updateData.weight = String(weight);
    if (dimensions !== undefined) updateData.dimensions = String(dimensions);
    if (stockQuantity !== undefined) {
      const qty = parseInt(stockQuantity, 10);
      if (isNaN(qty) || qty < 0) throw new AppError('stockQuantity must be a non-negative integer', 400);
      updateData.stockQuantity = qty;
    }
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold, 10);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (metaTitle !== undefined) {
      if (metaTitle == null || String(metaTitle).trim() === '') {
        updateData.metaTitle = null;
      } else {
        const value = String(metaTitle);
        if (value.length > 60) throw new AppError('metaTitle must be 60 characters or less', 400);
        updateData.metaTitle = value.trim();
      }
    }
    if (metaDescription !== undefined) {
      if (metaDescription == null || String(metaDescription).trim() === '') {
        updateData.metaDescription = null;
      } else {
        const value = String(metaDescription);
        if (value.length > 160) throw new AppError('metaDescription must be 160 characters or less', 400);
        updateData.metaDescription = value.trim();
      }
    }
    if (primaryImageAlt !== undefined) {
      if (primaryImageAlt == null || String(primaryImageAlt).trim() === '') {
        updateData.primaryImageAlt = null;
      } else {
        const value = String(primaryImageAlt);
        if (value.length > 125) throw new AppError('primaryImageAlt must be 125 characters or less', 400);
        updateData.primaryImageAlt = value.trim();
      }
    }
    if (collections !== undefined && Array.isArray(collections)) updateData.collections = collections.map(String);
    if (occasions !== undefined && Array.isArray(occasions)) updateData.occasions = occasions.map(String);
    if (isFeaturedGift !== undefined) updateData.isFeaturedGift = Boolean(isFeaturedGift);
    if (isBOGOEligible !== undefined) updateData.isBOGOEligible = Boolean(isBOGOEligible);
    if (bogoPriceTier !== undefined) updateData.bogoPriceTier = parseInt(bogoPriceTier, 10);
    if (bogoCategory !== undefined) updateData.bogoCategory = String(bogoCategory);
    if (bogoActive !== undefined) updateData.bogoActive = Boolean(bogoActive);
    if (isTumbler !== undefined) updateData.isTumbler = Boolean(isTumbler);
    if (capacity !== undefined) updateData.capacity = String(capacity);
    if (isBestseller !== undefined) updateData.isBestseller = Boolean(isBestseller);
    if (hsnCode !== undefined) updateData.hsnCode = String(hsnCode).trim() || null;
    if (videoUrl !== undefined) updateData.videoUrl = String(videoUrl).trim() || null;
    if (isOnOffer !== undefined) updateData.isOnOffer = Boolean(isOnOffer);
    if (offerType !== undefined) updateData.offerType = String(offerType);
    if (offerValue !== undefined) updateData.offerValue = parseFloat(offerValue);
    if (offerExpiry !== undefined) updateData.offerExpiry = new Date(offerExpiry);
    if (showCountdown !== undefined) updateData.showCountdown = Boolean(showCountdown);
    if (sku !== undefined && String(sku).trim()) updateData.sku = String(sku).trim();
    // Sync images: delete old, create new in a transaction
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      const updated = await prisma.$transaction(async (tx) => {
        // Update product fields
        const updatedProduct = await tx.product.update({
          where: { id },
          data: updateData,
        });

        // Delete existing images
        await tx.productImage.deleteMany({ where: { productId: id } });

        // Create new images
        await tx.productImage.createMany({
          data: images.map((img: any, index: number) => {
            const isPrimaryImage = img.isPrimary || index === 0;
            return {
              productId: id,
              imageUrl: img.url || img.imageUrl,
              altText:
                img.alt ||
                (isPrimaryImage && updatedProduct.primaryImageAlt ? updatedProduct.primaryImageAlt : updatedProduct.name),
              sortOrder: index,
              isPrimary: isPrimaryImage,
            };
          }),
        });

        return tx.product.findUnique({
          where: { id },
          include: { images: true, category: true },
        });
      });

      console.log('[Product Controller] ✅ Product updated successfully (with images):', {
        productId: id,
        productName: updated!.name,
        fieldsUpdated: Object.keys(updateData),
        imageCount: updated!.images.length,
      });

      logAdminAction(req, 'UPDATE', 'PRODUCT', id, {
        fieldsUpdated: [...Object.keys(updateData), 'images'],
      });

      return res.json({
        success: true,
        data: updated,
      });
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

    // Audit log — non-blocking
    logAdminAction(req, 'UPDATE', 'PRODUCT', id, {
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

    // Audit log — non-blocking
    logAdminAction(req, 'DELETE', 'PRODUCT', id, { name: product.name });

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
      take: Math.min(parseInt(limit as string) || 8, 100),
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

    // ── soldThisWeek: Redis cache (60s) with DB fallback ──────────────────
    let soldThisWeek = 0;
    const soldCacheKey = `sold:week:${product.id}`;
    try {
      const cached = await cacheGet<number>(soldCacheKey);
      if (cached !== null) {
        soldThisWeek = cached;
      } else {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        soldThisWeek = await prisma.orderItem.count({
          where: {
            productId: product.id,
            order: {
              status: 'CONFIRMED',
              createdAt: { gte: sevenDaysAgo },
            },
          },
        });
        await cacheSet(soldCacheKey, soldThisWeek, 60);
      }
    } catch {
      // Redis down — silently fall back to 0; non-blocking
      soldThisWeek = 0;
    }

    // Transform images to PUBLIC URLs for storefront
    const productWithPublicUrls = await transformProductImages(product, true);

    res.json({
      success: true,
      data: { ...productWithPublicUrls, soldThisWeek },
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
      take: Math.min(Number(limit) || 20, 100),
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
        take: Math.min(parseInt(limit as string) || 20, 100),
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
