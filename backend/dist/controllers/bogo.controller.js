"use strict";
/**
 * BOGO Campaign Controller — REAL DATABASE INTEGRATION
 *
 * Admin:
 *   GET  /api/admin/bogo/campaign         — Get campaign settings
 *   PUT  /api/admin/bogo/campaign         — Update campaign settings
 *   GET  /api/admin/bogo/products         — List all products with BOGO status
 *   PUT  /api/admin/bogo/products/:id     — Toggle BOGO eligibility on a product
 *   GET  /api/admin/bogo/stats            — BOGO campaign statistics
 *
 * Public:
 *   GET  /api/products/bogo-eligible      — List BOGO-eligible products (filtered)
 *   POST /api/checkout/validate-bogo      — Validate BOGO pair at checkout
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBOGOCheckout = exports.getBogoEligibleProducts = exports.getBOGOStats = exports.updateProductBOGO = exports.getBOGOProducts = exports.updateBOGOCampaign = exports.getBOGOCampaign = void 0;
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
// ============================================================
// ADMIN: Get Campaign Settings
// ============================================================
const getBOGOCampaign = async (req, res, next) => {
    try {
        let campaign = await (0, retry_1.withRetry)(() => database_1.prisma.bOGOCampaign.findFirst({
            orderBy: { createdAt: 'desc' },
        }));
        if (!campaign) {
            campaign = await database_1.prisma.bOGOCampaign.create({
                data: {
                    name: 'Combos for Her — BOGO',
                    isActive: false,
                    discountType: 'FREE_CHEAPER',
                    discountValue: 0,
                    allowedTiers: [999, 1499, 1999, 2599],
                    allowedCategories: ['earrings', 'necklaces', 'rings', 'bracelets'],
                },
            });
        }
        res.json({ success: true, data: campaign });
    }
    catch (error) {
        next(error);
    }
};
exports.getBOGOCampaign = getBOGOCampaign;
// ============================================================
// ADMIN: Update Campaign Settings
// ============================================================
const updateBOGOCampaign = async (req, res, next) => {
    try {
        const { name, isActive, discountType, discountValue, allowedTiers, allowedCategories, startDate, endDate, maxUsesPerUser, } = req.body;
        let campaign = await database_1.prisma.bOGOCampaign.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        if (!campaign) {
            campaign = await database_1.prisma.bOGOCampaign.create({
                data: {
                    name: name || 'BOGO Campaign',
                    isActive: isActive ?? false,
                    discountType: discountType || 'FREE_CHEAPER',
                    discountValue: discountValue || 0,
                    allowedTiers: allowedTiers || [999, 1499, 1999, 2599],
                    allowedCategories: allowedCategories || [],
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    maxUsesPerUser: maxUsesPerUser || 0,
                },
            });
        }
        else {
            const updateData = {};
            if (name !== undefined)
                updateData.name = name;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            if (discountType !== undefined)
                updateData.discountType = discountType;
            if (discountValue !== undefined)
                updateData.discountValue = discountValue;
            if (allowedTiers !== undefined)
                updateData.allowedTiers = allowedTiers;
            if (allowedCategories !== undefined)
                updateData.allowedCategories = allowedCategories;
            if (startDate !== undefined)
                updateData.startDate = startDate ? new Date(startDate) : null;
            if (endDate !== undefined)
                updateData.endDate = endDate ? new Date(endDate) : null;
            if (maxUsesPerUser !== undefined)
                updateData.maxUsesPerUser = maxUsesPerUser;
            campaign = await database_1.prisma.bOGOCampaign.update({
                where: { id: campaign.id },
                data: updateData,
            });
            // Sync bogoActive flag on products
            if (isActive === true) {
                await database_1.prisma.product.updateMany({
                    where: { isBOGOEligible: true, deletedAt: null },
                    data: { bogoActive: true },
                });
            }
            if (isActive === false) {
                await database_1.prisma.product.updateMany({
                    where: { bogoActive: true, deletedAt: null },
                    data: { bogoActive: false },
                });
            }
        }
        res.json({
            success: true,
            data: campaign,
            message: 'BOGO campaign updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBOGOCampaign = updateBOGOCampaign;
// ============================================================
// ADMIN: Get All Products with BOGO Status
// ============================================================
const getBOGOProducts = async (req, res, next) => {
    try {
        const { search, tier, category, bogoOnly, page = '1', limit = '50', } = req.query;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (bogoOnly === 'true')
            where.isBOGOEligible = true;
        if (tier)
            where.bogoPriceTier = parseInt(tier);
        if (category && category !== 'all')
            where.bogoCategory = category;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                select: {
                    id: true, name: true, slug: true, price: true, finalPrice: true,
                    isBOGOEligible: true, bogoCategory: true, bogoPriceTier: true,
                    bogoActive: true, stockQuantity: true, averageRating: true,
                    reviewCount: true, isActive: true,
                    images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
                },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: [{ isBOGOEligible: 'desc' }, { name: 'asc' }],
            }),
            database_1.prisma.product.count({ where }),
        ]);
        const mappedProducts = products.map(p => ({
            ...p,
            image: p.images?.[0]?.imageUrl || null,
        }));
        res.json({
            success: true,
            data: mappedProducts,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBOGOProducts = getBOGOProducts;
// ============================================================
// ADMIN: Toggle BOGO Eligibility on a Product
// ============================================================
const updateProductBOGO = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isBOGOEligible, bogoPriceTier, bogoCategory } = req.body;
        const product = await database_1.prisma.product.findUnique({ where: { id, deletedAt: null } });
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        const updateData = {};
        if (isBOGOEligible !== undefined)
            updateData.isBOGOEligible = isBOGOEligible;
        if (bogoPriceTier !== undefined)
            updateData.bogoPriceTier = bogoPriceTier;
        if (bogoCategory !== undefined)
            updateData.bogoCategory = bogoCategory;
        if (isBOGOEligible === false) {
            updateData.bogoPriceTier = null;
            updateData.bogoCategory = null;
            updateData.bogoActive = false;
        }
        if (isBOGOEligible === true) {
            const activeCampaign = await database_1.prisma.bOGOCampaign.findFirst({ where: { isActive: true } });
            updateData.bogoActive = !!activeCampaign;
        }
        const updatedProduct = await database_1.prisma.product.update({
            where: { id },
            data: updateData,
            select: {
                id: true, name: true, slug: true, price: true, finalPrice: true,
                isBOGOEligible: true, bogoCategory: true, bogoPriceTier: true,
                bogoActive: true, stockQuantity: true,
            },
        });
        res.json({ success: true, data: updatedProduct, message: 'Product BOGO status updated' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProductBOGO = updateProductBOGO;
// ============================================================
// ADMIN: BOGO Campaign Statistics
// ============================================================
const getBOGOStats = async (req, res, next) => {
    try {
        const campaign = await database_1.prisma.bOGOCampaign.findFirst({ orderBy: { createdAt: 'desc' } });
        const [allProducts, eligibleProducts] = await Promise.all([
            database_1.prisma.product.count({ where: { deletedAt: null } }),
            database_1.prisma.product.findMany({
                where: { isBOGOEligible: true, deletedAt: null },
                select: { bogoPriceTier: true, bogoCategory: true },
            }),
        ]);
        const tierCounts = {};
        const categoryCounts = {};
        eligibleProducts.forEach((p) => {
            if (p.bogoPriceTier)
                tierCounts[p.bogoPriceTier] = (tierCounts[p.bogoPriceTier] || 0) + 1;
            if (p.bogoCategory)
                categoryCounts[p.bogoCategory] = (categoryCounts[p.bogoCategory] || 0) + 1;
        });
        res.json({
            success: true,
            data: {
                totalProducts: allProducts,
                totalEligibleProducts: eligibleProducts.length,
                totalUsageCount: campaign?.totalUsageCount ?? 0,
                discountType: campaign?.discountType ?? 'FREE_CHEAPER',
                campaignActive: campaign?.isActive ?? false,
                tierBreakdown: tierCounts,
                categoryBreakdown: categoryCounts,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBOGOStats = getBOGOStats;
// ============================================================
// PUBLIC: List BOGO-Eligible Products (for storefront)
// ============================================================
const getBogoEligibleProducts = async (req, res, next) => {
    try {
        const { tier, category } = req.query;
        const campaign = await (0, retry_1.withRetry)(() => database_1.prisma.bOGOCampaign.findFirst({
            where: {
                isActive: true,
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
            },
        }));
        if (!campaign) {
            res.json({
                success: true,
                data: [],
                campaign: { active: false, discountType: 'FREE_CHEAPER', discountValue: 0 },
            });
            return;
        }
        const where = {
            isBOGOEligible: true,
            bogoActive: true,
            isActive: true,
            deletedAt: null,
            stockQuantity: { gt: 0 },
        };
        if (tier)
            where.bogoPriceTier = parseInt(tier);
        if (category && category !== 'all')
            where.bogoCategory = category;
        const products = await (0, retry_1.withRetry)(() => database_1.prisma.product.findMany({
            where,
            select: {
                id: true, name: true, slug: true, price: true, finalPrice: true,
                isBOGOEligible: true, bogoCategory: true, bogoPriceTier: true,
                bogoActive: true, stockQuantity: true, averageRating: true,
                reviewCount: true, isActive: true,
                images: { orderBy: { sortOrder: 'asc' }, take: 2, select: { imageUrl: true, isPrimary: true } },
            },
            orderBy: [{ bogoPriceTier: 'asc' }, { name: 'asc' }],
        }));
        const mappedProducts = products.map((p) => {
            const primaryImg = p.images?.find(i => i.isPrimary) || p.images?.[0];
            const hoverImg = p.images?.length > 1 ? p.images[1] : null;
            return {
                id: p.id, name: p.name, slug: p.slug,
                price: Number(p.price), finalPrice: Number(p.finalPrice),
                image: primaryImg?.imageUrl || null,
                hoverImage: hoverImg?.imageUrl || null,
                isBOGOEligible: p.isBOGOEligible, bogoCategory: p.bogoCategory,
                bogoPriceTier: p.bogoPriceTier, stockQuantity: p.stockQuantity,
                averageRating: Number(p.averageRating), reviewCount: p.reviewCount,
                isActive: p.isActive,
            };
        });
        res.json({
            success: true,
            data: mappedProducts,
            campaign: {
                active: campaign.isActive,
                discountType: campaign.discountType,
                discountValue: Number(campaign.discountValue),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBogoEligibleProducts = getBogoEligibleProducts;
// ============================================================
// PUBLIC: Validate BOGO Pair at Checkout
// ============================================================
const validateBOGOCheckout = async (req, res, next) => {
    try {
        const { productId1, productId2 } = req.body;
        if (!productId1 || !productId2) {
            res.status(400).json({ success: false, message: 'Two product IDs are required for BOGO validation' });
            return;
        }
        if (productId1 === productId2) {
            res.status(400).json({ success: false, message: 'BOGO requires two different products' });
            return;
        }
        const campaign = await (0, retry_1.withRetry)(() => database_1.prisma.bOGOCampaign.findFirst({
            where: {
                isActive: true,
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
            },
        }));
        if (!campaign) {
            res.status(400).json({ success: false, message: 'BOGO campaign is not currently active' });
            return;
        }
        const [product1, product2] = await Promise.all([
            (0, retry_1.withRetry)(() => database_1.prisma.product.findUnique({
                where: { id: productId1, deletedAt: null },
                select: { id: true, name: true, finalPrice: true, isBOGOEligible: true, bogoActive: true, bogoPriceTier: true, stockQuantity: true, isActive: true },
            })),
            (0, retry_1.withRetry)(() => database_1.prisma.product.findUnique({
                where: { id: productId2, deletedAt: null },
                select: { id: true, name: true, finalPrice: true, isBOGOEligible: true, bogoActive: true, bogoPriceTier: true, stockQuantity: true, isActive: true },
            })),
        ]);
        if (!product1 || !product2) {
            res.status(404).json({ success: false, message: 'One or both products not found' });
            return;
        }
        if (!product1.isBOGOEligible || !product1.bogoActive || !product2.isBOGOEligible || !product2.bogoActive) {
            res.status(400).json({ success: false, message: 'Both products must be BOGO-eligible with an active campaign' });
            return;
        }
        if (product1.bogoPriceTier !== product2.bogoPriceTier) {
            res.status(400).json({ success: false, message: 'Both products must be in the same price tier' });
            return;
        }
        if (product1.stockQuantity < 1 || product2.stockQuantity < 1) {
            res.status(400).json({ success: false, message: 'One or both products are out of stock' });
            return;
        }
        const p1Price = Number(product1.finalPrice);
        const p2Price = Number(product2.finalPrice);
        const cheaper = p1Price <= p2Price ? product1 : product2;
        const cheaperPrice = Math.min(p1Price, p2Price);
        let discountAmount = 0;
        if (campaign.discountType === 'FREE_CHEAPER') {
            discountAmount = cheaperPrice;
        }
        else if (campaign.discountType === 'PERCENT') {
            discountAmount = Math.round(cheaperPrice * (Number(campaign.discountValue) / 100));
        }
        else if (campaign.discountType === 'FIXED') {
            discountAmount = Math.min(Number(campaign.discountValue), cheaperPrice);
        }
        const totalBeforeDiscount = p1Price + p2Price;
        const totalAfterDiscount = totalBeforeDiscount - discountAmount;
        res.json({
            success: true,
            data: {
                valid: true,
                product1: { id: product1.id, name: product1.name, price: p1Price },
                product2: { id: product2.id, name: product2.name, price: p2Price },
                freeItem: { id: cheaper.id, name: cheaper.name },
                discountAmount,
                totalBeforeDiscount,
                totalAfterDiscount,
                savings: discountAmount,
                savingsPercent: Math.round((discountAmount / totalBeforeDiscount) * 100),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.validateBOGOCheckout = validateBOGOCheckout;
//# sourceMappingURL=bogo.controller.js.map