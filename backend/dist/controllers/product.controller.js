"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getRecommendedProducts = exports.getProductByIdPublic = exports.getProductBySlug = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// Helper function to transform image URL to CDN URL
// Handles both Supabase legacy URLs and R2/CDN URLs
function transformImageUrlToCDN(imageUrl) {
    if (!imageUrl)
        return null;
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
async function transformProductImages(product, forPublic = true) {
    if (!product.images || product.images.length === 0) {
        return product;
    }
    const transformedImages = product.images.map((img) => {
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
const createProduct = async (req, res, next) => {
    try {
        // 🔐 Verify admin authentication
        if (!req.user) {
            console.error('[Product Controller] ❌ NO USER IN REQUEST', {
                endpoint: '/admin/products',
                method: 'POST',
            });
            throw new errorHandler_1.AppError('Not authenticated', 401);
        }
        console.log('[Product Controller] 📝 Creating product...', {
            userId: req.user.id,
            userRole: req.user.role,
            userEmail: req.user.email,
        });
        const { name, description, shortDescription, price, discountPercent, categoryId, material, careInstructions, weight, dimensions, stockQuantity, isFeatured, isActive, images, metaTitle, metaDescription, collections, occasions, isFeaturedGift, } = req.body;
        // Validation
        const errors = [];
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
            throw new errorHandler_1.AppError(`Validation failed: ${errors.join('; ')}`, 400);
        }
        // Verify category exists
        const category = await database_1.prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            throw new errorHandler_1.AppError(`Category with ID ${categoryId} not found`, 400);
        }
        const slug = (0, helpers_1.slugify)(name);
        // Ensure slug uniqueness — append random suffix if collision
        let finalSlug = slug;
        const existingSlug = await database_1.prisma.product.findUnique({ where: { slug: finalSlug } });
        if (existingSlug) {
            const suffix = Math.random().toString(36).substring(2, 7);
            finalSlug = `${slug}-${suffix}`;
        }
        const finalPrice = (0, helpers_1.calculateFinalPrice)(parseFloat(price), parseFloat(discountPercent || 0));
        console.log('[Product Controller] ✅ Validation passed, creating product...', {
            productName: name,
            price: parseFloat(price),
            finalPrice,
            imageCount: images?.length || 0,
        });
        // 🔐 ATOMIC TRANSACTION: Create product AND images together
        // If either fails, entire operation is rolled back
        const product = await database_1.prisma.$transaction(async (tx) => {
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
                    data: images.map((img, index) => ({
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
            productId: product.id,
            productName: product.name,
            imageCount: product.images.length,
        });
        res.status(201).json({
            success: true,
            data: product,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
// @desc    Get all products (Public)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
    try {
        const { category, page = '1', limit = '16', maxPrice, minPrice, sortBy, sort, // Add support for 'sort' parameter
        isNew, // Add support for 'isNew' parameter
        collection, // Gift collection filter
        occasion, // Occasion filter
        featuredGifts, // Featured gifts only
        // NEW: Tumbler & Offer filters
        hasDiscount, isOnOffer, offerType, minDiscount, material, capacity, inStock, isBestseller, isTumbler, search, } = req.query;
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
        let categoryId = undefined;
        // 🔑 Resolve category slug → categoryId
        if (category && typeof category === 'string') {
            const foundCategory = await database_1.prisma.category.findFirst({
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
            }
            else {
                console.warn('[Product Controller] ⚠️ Category slug not found', {
                    requestedSlug: category,
                    fallback: 'showing all active products',
                });
            }
        }
        // 📊 Parse optional filters
        const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : undefined;
        // Handle both 'sortBy' and 'sort' parameters
        let sortParam = sortBy || sort;
        const parsedSortBy = sortParam ? sortParam : 'createdAt';
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
        const whereClause = {
            isActive: true, // ← THIS IS MANDATORY. Products invisible without this.
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
        if (minPrice && !isNaN(parseFloat(minPrice))) {
            const parsedMinPrice = parseFloat(minPrice);
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
        if (minDiscount && !isNaN(parseFloat(minDiscount))) {
            whereClause.discountPercent = {
                ...whereClause.discountPercent,
                gte: parseFloat(minDiscount),
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
        let orderByClause = { createdAt: 'desc' };
        // Handle minus prefix for descending sort
        if (validSortBy.startsWith('-')) {
            const field = validSortBy.substring(1); // Remove minus prefix
            if (field === 'finalPrice') {
                orderByClause = { finalPrice: 'desc' };
            }
            else if (field === 'averageRating') {
                orderByClause = { averageRating: 'desc' };
            }
            else if (field === 'createdAt') {
                orderByClause = { createdAt: 'desc' };
            }
            else if (field === 'name') {
                orderByClause = { name: 'desc' };
            }
        }
        else {
            // Handle ascending sort (no minus prefix)
            if (validSortBy === 'finalPrice') {
                orderByClause = { finalPrice: 'asc' };
            }
            else if (validSortBy === 'averageRating') {
                orderByClause = { averageRating: 'asc' };
            }
            else if (validSortBy === 'createdAt') {
                orderByClause = { createdAt: 'asc' };
            }
            else if (validSortBy === 'name') {
                orderByClause = { name: 'asc' };
            }
        }
        // 🔍 Execute query with filters
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where: whereClause,
                orderBy: orderByClause,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    category: true,
                    images: true,
                },
            }),
            database_1.prisma.product.count({ where: whereClause }),
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
        const productsWithPublicUrls = await Promise.all(products.map((product) => transformProductImages(product, true)));
        res.json({
            data: productsWithPublicUrls,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('[Product Controller] ❌ getProducts() error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({ message: 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
// @desc    Get product by ID (Admin)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            include: { images: true, category: true },
        });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        // Transform images to signed URLs
        const productWithSignedUrls = await transformProductImages(product);
        res.json({
            success: true,
            data: productWithSignedUrls,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, discountPercent, categoryId, stockQuantity, ...otherData } = req.body;
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        const updateData = { ...otherData };
        if (name) {
            updateData.name = name;
            const newSlug = (0, helpers_1.slugify)(name);
            // Ensure slug uniqueness on rename
            const existingSlug = await database_1.prisma.product.findFirst({
                where: { slug: newSlug, id: { not: id } },
            });
            if (existingSlug) {
                const suffix = Math.random().toString(36).substring(2, 7);
                updateData.slug = `${newSlug}-${suffix}`;
            }
            else {
                updateData.slug = newSlug;
            }
        }
        if (price) {
            updateData.price = parseFloat(price);
            if (discountPercent) {
                updateData.discountPercent = parseFloat(discountPercent);
                updateData.finalPrice = (0, helpers_1.calculateFinalPrice)(parseFloat(price), parseFloat(discountPercent));
            }
            else {
                updateData.finalPrice = parseFloat(price);
            }
        }
        if (categoryId) {
            updateData.categoryId = categoryId;
        }
        if (stockQuantity !== undefined) {
            updateData.stockQuantity = parseInt(stockQuantity);
        }
        const updated = await database_1.prisma.product.update({
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
    }
    catch (error) {
        console.error('[Product Controller] ❌ Update failed:', {
            productId: req.params.id,
            error: error instanceof Error ? error.message : String(error),
        });
        next(error);
    }
};
exports.updateProduct = updateProduct;
// @desc    Delete product (Admin) — SOFT DELETE
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            include: { images: true }
        });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        // Check for pending orders before soft-deleting
        const pendingOrders = await database_1.prisma.orderItem.count({
            where: {
                productId: id,
                order: {
                    status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
                },
            },
        });
        if (pendingOrders > 0) {
            throw new errorHandler_1.AppError(`Cannot delete product "${product.name}" — it has ${pendingOrders} pending order(s). Cancel or complete them first.`, 400);
        }
        // Soft delete: set deletedAt + deactivate
        await database_1.prisma.product.update({
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
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
// @desc    Get featured products (Public)
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
    try {
        const { limit = '8' } = req.query;
        const products = await database_1.prisma.product.findMany({
            where: {
                isFeatured: true,
                isActive: true,
                deletedAt: null,
            },
            include: { images: true, category: true },
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
        });
        // Transform image URLs to signed URLs for reliable access
        const productsWithSignedUrls = await Promise.all(products.map((product) => transformProductImages(product)));
        res.json({
            success: true,
            data: productsWithSignedUrls,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeaturedProducts = getFeaturedProducts;
// @desc    Get product by slug (Public)
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const product = await database_1.prisma.product.findFirst({
            where: {
                slug,
                isActive: true,
                deletedAt: null,
            },
            include: { images: true, category: true },
        });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        // Transform images to PUBLIC URLs for storefront
        const productWithPublicUrls = await transformProductImages(product, true);
        res.json({
            success: true,
            data: productWithPublicUrls,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductBySlug = getProductBySlug;
// @desc    Get product by ID (Public - for cart stock validation)
// @route   GET /api/products/id/:id
// @access  Public
const getProductByIdPublic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            include: { images: true, category: true },
        });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        // Transform images to PUBLIC URLs for storefront
        const productWithPublicUrls = await transformProductImages(product, true);
        res.json({
            success: true,
            data: productWithPublicUrls,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductByIdPublic = getProductByIdPublic;
// @desc    Get recommended products for cross-sell
// @route   GET /api/products/recommended
// @access  Public
const getRecommendedProducts = async (req, res, next) => {
    try {
        const { productId, limit = '6' } = req.query;
        let excludeIds = [];
        let categoryId;
        // If productId provided, find similar products
        if (productId && typeof productId === 'string') {
            const sourceProduct = await database_1.prisma.product.findUnique({
                where: { id: productId },
                select: { id: true, categoryId: true },
            });
            if (sourceProduct) {
                excludeIds = [sourceProduct.id];
                categoryId = sourceProduct.categoryId;
            }
        }
        const whereClause = {
            isActive: true,
            stockQuantity: { gt: 0 },
            id: { notIn: excludeIds },
            images: { some: {} }, // Must have at least one image
        };
        // Prioritize same category
        if (categoryId) {
            whereClause.categoryId = categoryId;
        }
        let products = await database_1.prisma.product.findMany({
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
            const moreProducts = await database_1.prisma.product.findMany({
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
        const productsWithUrls = await Promise.all(products.map((product) => transformProductImages(product, true)));
        res.json({
            success: true,
            data: productsWithUrls,
        });
    }
    catch (error) {
        console.error('[Product] Error fetching recommendations:', error);
        res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
};
exports.getRecommendedProducts = getRecommendedProducts;
const searchProducts = async (req, res, next) => {
    try {
        const { q, categoryId, minPrice, maxPrice, limit = '12', page = '1' } = req.query;
        if (!q) {
            throw new errorHandler_1.AppError('Search query is required', 400);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            isActive: true,
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { material: { contains: q, mode: 'insensitive' } },
            ],
        };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (minPrice || maxPrice) {
            where.finalPrice = {};
            if (minPrice) {
                where.finalPrice.gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                where.finalPrice.lte = parseFloat(maxPrice);
            }
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                include: { images: true, category: true },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.product.count({ where }),
        ]);
        // Transform image URLs to signed URLs for reliable access
        const productsWithSignedUrls = await Promise.all(products.map((product) => transformProductImages(product)));
        res.json({
            success: true,
            data: productsWithSignedUrls,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchProducts = searchProducts;
//# sourceMappingURL=product.controller.js.map