"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getProductBySlug = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
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
// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
const getProducts = async (req, res, next) => {
    try {
        const { page = '1', limit = '10', search = '', categoryId = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            isActive: true,
        };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (categoryId) {
            where.categoryId = categoryId;
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
        res.json({
            success: true,
            data: products,
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
        res.json({
            success: true,
            data: product,
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
        res.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
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
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        await database_1.prisma.$transaction(async (tx) => {
            await tx.productImage.deleteMany({ where: { productId: id } });
            await tx.product.delete({ where: { id } });
        });
        res.json({
            success: true,
            message: 'Product deleted successfully',
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
            },
            include: { images: true, category: true },
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: products,
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
        res.json({
            success: true,
            data: product,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductBySlug = getProductBySlug;
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
        res.json({
            success: true,
            data: products,
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