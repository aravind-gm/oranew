"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getProductByIdPublic = exports.getProductBySlug = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const database_1 = require("../config/database");
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
const supabaseUrlHelper_1 = require("../utils/supabaseUrlHelper");
// Helper function to ensure product images have correct public URLs
// PUBLIC storefront uses public URLs (no expiration)
// ADMIN uses signed URLs (temporary, secure access)
async function transformProductImages(product, forPublic = true) {
    if (!product.images || product.images.length === 0) {
        return product;
    }
    const transformedImages = product.images.map((img) => {
        // Ensure image URL is valid and public
        if (!img.imageUrl) {
            return img;
        }
        // For public storefront: ensure it's a public URL (no signing needed)
        if (forPublic) {
            // Normalize the URL to ensure correct format
            const normalizedUrl = (0, supabaseUrlHelper_1.normalizeSupabaseUrl)(img.imageUrl);
            return { ...img, imageUrl: normalizedUrl || img.imageUrl };
        }
        return img;
    });
    return { ...product, images: transformedImages };
}
// Helper function to transform product images to signed URLs (ADMIN only)
async function transformProductImagesToSigned(product) {
    if (!product.images || product.images.length === 0) {
        return product;
    }
    const imagesWithSignedUrls = await Promise.all(product.images.map(async (img) => {
        try {
            // Extract file path from imageUrl
            // URL format: https://[project].supabase.co/storage/v1/object/public/product-images/filename
            const urlMatch = img.imageUrl.match(/product-images\/(.*)/);
            const filePath = urlMatch ? urlMatch[1] : img.imageUrl;
            // Generate signed URL for reliable access (ADMIN only)
            const signedUrl = await (0, supabase_1.getSignedUrl)(filePath);
            return { ...img, imageUrl: signedUrl };
        }
        catch (error) {
            console.error('[Product Controller] ⚠️ Failed to generate signed URL:', {
                imageUrl: img.imageUrl,
                error: error instanceof Error ? error.message : String(error),
            });
            // Fallback to public URL if signed URL generation fails
            const fixed = img.imageUrl.replace('/object/', '/object/public/');
            return { ...img, imageUrl: fixed };
        }
    }));
    return { ...product, images: imagesWithSignedUrls };
}
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
        const { name, description, shortDescription, price, discountPercent, categoryId, material, careInstructions, weight, dimensions, stockQuantity, isFeatured, isActive, images, metaTitle, metaDescription, } = req.body;
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
        const { category, page = '1', limit = '16', maxPrice, sortBy } = req.query;
        // 📊 Log incoming request
        console.log('[Product Controller] 📊 getProducts() called', {
            category,
            page,
            limit,
            maxPrice,
            sortBy,
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
        const parsedSortBy = sortBy ? sortBy : 'createdAt';
        // 🔍 Validate sortBy to prevent injection and support valid sorts
        const allowedSortFields = ['createdAt', 'finalPrice', '-finalPrice', 'averageRating', '-averageRating'];
        const validSortBy = allowedSortFields.includes(parsedSortBy) ? parsedSortBy : 'createdAt';
        // 🔒 BUILD WHERE CLAUSE — MANDATORY isActive=true FOR STOREFRONT
        const whereClause = {
            isActive: true, // ← THIS IS MANDATORY. Products invisible without this.
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
        // 📊 Build sort order from parameter
        let orderByClause = { createdAt: 'desc' };
        if (validSortBy === 'finalPrice') {
            orderByClause = { finalPrice: 'asc' };
        }
        else if (validSortBy === '-finalPrice') {
            orderByClause = { finalPrice: 'desc' };
        }
        else if (validSortBy === 'averageRating') {
            orderByClause = { averageRating: 'desc' };
        }
        else if (validSortBy === '-averageRating') {
            orderByClause = { averageRating: 'asc' };
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
            updateData.slug = (0, helpers_1.slugify)(name);
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
// @desc    Delete product (Admin)
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
        // Delete product with all related records in transaction
        await database_1.prisma.$transaction(async (tx) => {
            // Delete images first
            if (product.images && product.images.length > 0) {
                await tx.productImage.deleteMany({ where: { productId: id } });
            }
            // Then delete product (cascade will handle reviews, wishlist items, etc.)
            await tx.product.delete({ where: { id } });
        });
        console.log('[Product Controller] ✅ Product deleted successfully:', {
            productId: id,
            productName: product.name,
            imagesCount: product.images?.length || 0,
        });
        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    }
    catch (error) {
        console.error('[Product Controller] ❌ Delete failed:', {
            productId: req.params.id,
            error: error instanceof Error ? error.message : String(error),
        });
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
// @desc    Search products (Public)
// @route   GET /api/products/search
// @access  Public
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