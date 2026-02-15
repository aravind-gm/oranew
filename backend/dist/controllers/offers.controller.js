"use strict";
/**
 * Offers Controller — Campaign management + validation
 *
 * Handles:
 * - Active campaign info for storefront
 * - Admin campaign management
 * - Product offer settings
 * - Cart validation for offers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductOfferSettings = exports.getAdminOfferProducts = exports.updateAdminCampaign = exports.getAdminCampaign = exports.validateOfferAtCheckout = exports.getOfferProducts = exports.getActiveCampaign = void 0;
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
// ============================================================
// PUBLIC: Get active campaign
// ============================================================
const getActiveCampaign = async (req, res, next) => {
    try {
        // Try to get from OfferCampaign table
        let campaign = null;
        try {
            campaign = await (0, retry_1.withRetry)(() => database_1.prisma.offerCampaign.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            }));
        }
        catch {
            // Table may not exist yet, return default
        }
        if (campaign) {
            res.json({
                data: {
                    isActive: campaign.isActive,
                    name: campaign.name,
                    discountType: campaign.discountType,
                    discountValue: Number(campaign.discountValue),
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                    offerExpiry: campaign.endDate,
                    showCountdown: campaign.showCountdown,
                    bannerText: campaign.bannerText,
                },
            });
        }
        else {
            // Default campaign info
            const defaultExpiry = new Date();
            defaultExpiry.setDate(defaultExpiry.getDate() + 7);
            res.json({
                data: {
                    isActive: true,
                    name: 'Limited-Time Offers',
                    discountType: 'PERCENT',
                    discountValue: 20,
                    offerExpiry: defaultExpiry.toISOString(),
                    showCountdown: true,
                    bannerText: 'Handpicked designs at special prices',
                },
            });
        }
    }
    catch (error) {
        console.error('[Offers] Error fetching campaign:', error);
        res.status(500).json({ message: 'Failed to fetch campaign info' });
    }
};
exports.getActiveCampaign = getActiveCampaign;
// ============================================================
// PUBLIC: Get on-offer products
// ============================================================
const getOfferProducts = async (req, res, next) => {
    try {
        const { page = '1', limit = '16', offerType, maxPrice, sortBy } = req.query;
        const whereClause = {
            isActive: true,
            OR: [
                { isOnOffer: true },
                { discountPercent: { gt: 0 } },
            ],
        };
        if (offerType && typeof offerType === 'string') {
            whereClause.offerType = offerType;
        }
        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
            whereClause.finalPrice = { lte: parseFloat(maxPrice) };
        }
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'finalPrice')
            orderBy = { finalPrice: 'asc' };
        else if (sortBy === '-finalPrice')
            orderBy = { finalPrice: 'desc' };
        const [products, total] = await Promise.all([
            (0, retry_1.withRetry)(() => database_1.prisma.product.findMany({
                where: whereClause,
                orderBy,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    category: true,
                    images: true,
                },
            })),
            (0, retry_1.withRetry)(() => database_1.prisma.product.count({ where: whereClause })),
        ]);
        res.json({
            data: products,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('[Offers] Error fetching offer products:', error);
        res.status(500).json({ message: 'Failed to fetch offer products' });
    }
};
exports.getOfferProducts = getOfferProducts;
// ============================================================
// PUBLIC: Validate offer at checkout
// ============================================================
const validateOfferAtCheckout = async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        const product = await (0, retry_1.withRetry)(() => database_1.prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                name: true,
                price: true,
                finalPrice: true,
                discountPercent: true,
                isOnOffer: true,
                offerType: true,
                offerValue: true,
                offerExpiry: true,
                stockQuantity: true,
                isActive: true,
            },
        }));
        if (!product || !product.isActive) {
            return res.status(404).json({ message: 'Product not found or inactive' });
        }
        // Check if offer is still valid
        const now = new Date();
        const isOfferValid = product.isOnOffer &&
            (!product.offerExpiry || new Date(product.offerExpiry) > now);
        if (!isOfferValid && product.discountPercent <= 0) {
            return res.status(400).json({
                valid: false,
                message: 'This offer has expired',
                originalPrice: Number(product.price),
                finalPrice: Number(product.price), // No discount
            });
        }
        // Check stock
        if (product.stockQuantity < quantity) {
            return res.status(400).json({
                valid: false,
                message: 'Insufficient stock',
                availableQuantity: product.stockQuantity,
            });
        }
        // For BOGO: validate 2 eligible items at same tier
        if (product.offerType === 'BOGO') {
            const { pairedProductId } = req.body;
            if (!pairedProductId) {
                return res.status(400).json({
                    valid: false,
                    message: 'BOGO requires a paired product',
                });
            }
            const pairedProduct = await (0, retry_1.withRetry)(() => database_1.prisma.product.findUnique({
                where: { id: pairedProductId },
                select: {
                    id: true,
                    isOnOffer: true,
                    offerType: true,
                    finalPrice: true,
                    stockQuantity: true,
                    isActive: true,
                },
            }));
            if (!pairedProduct || !pairedProduct.isActive || pairedProduct.offerType !== 'BOGO') {
                return res.status(400).json({
                    valid: false,
                    message: 'Paired product is not eligible for BOGO',
                });
            }
            if (pairedProduct.stockQuantity < 1) {
                return res.status(400).json({
                    valid: false,
                    message: 'Paired product is out of stock',
                });
            }
            // BOGO: cheaper item is free
            const cheaperPrice = Math.min(Number(product.finalPrice), Number(pairedProduct.finalPrice));
            return res.json({
                valid: true,
                offerType: 'BOGO',
                savings: cheaperPrice,
                message: `You save ₹${cheaperPrice}! Cheaper item is free.`,
            });
        }
        // Standard offer validation
        const savings = Number(product.price) - Number(product.finalPrice);
        res.json({
            valid: true,
            productId: product.id,
            originalPrice: Number(product.price),
            finalPrice: Number(product.finalPrice),
            savings,
            offerType: product.offerType || 'PERCENT',
            message: savings > 0 ? `You save ₹${Math.round(savings)}!` : 'Offer applied',
        });
    }
    catch (error) {
        console.error('[Offers] Validation error:', error);
        res.status(500).json({ message: 'Failed to validate offer' });
    }
};
exports.validateOfferAtCheckout = validateOfferAtCheckout;
// ============================================================
// ADMIN: Get campaign settings
// ============================================================
const getAdminCampaign = async (req, res, next) => {
    try {
        let campaigns = [];
        try {
            campaigns = await (0, retry_1.withRetry)(() => database_1.prisma.offerCampaign.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            }));
        }
        catch {
            // Table may not exist
        }
        res.json({ data: campaigns });
    }
    catch (error) {
        console.error('[Offers Admin] Error:', error);
        res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
};
exports.getAdminCampaign = getAdminCampaign;
// ============================================================
// ADMIN: Update/Create campaign
// ============================================================
const updateAdminCampaign = async (req, res, next) => {
    try {
        const { id, name, isActive, discountType, discountValue, collections, startDate, endDate, showCountdown, bannerText, } = req.body;
        let campaign;
        if (id) {
            // Update existing
            campaign = await database_1.prisma.offerCampaign.update({
                where: { id },
                data: {
                    name,
                    isActive,
                    discountType,
                    discountValue: discountValue ? parseFloat(discountValue) : undefined,
                    collections: collections || [],
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    showCountdown,
                    bannerText,
                },
            });
        }
        else {
            // Create new
            campaign = await database_1.prisma.offerCampaign.create({
                data: {
                    name: name || 'New Campaign',
                    isActive: isActive ?? false,
                    discountType: discountType || 'PERCENT',
                    discountValue: discountValue ? parseFloat(discountValue) : 0,
                    collections: collections || [],
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    showCountdown: showCountdown ?? true,
                    bannerText,
                },
            });
        }
        res.json({ data: campaign, message: 'Campaign saved' });
    }
    catch (error) {
        console.error('[Offers Admin] Error updating campaign:', error);
        res.status(500).json({ message: 'Failed to update campaign' });
    }
};
exports.updateAdminCampaign = updateAdminCampaign;
// ============================================================
// ADMIN: List products with offer status
// ============================================================
const getAdminOfferProducts = async (req, res, next) => {
    try {
        const { page = '1', limit = '25', search } = req.query;
        const whereClause = {};
        if (search && typeof search === 'string') {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [products, total] = await Promise.all([
            (0, retry_1.withRetry)(() => database_1.prisma.product.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    sku: true,
                    price: true,
                    finalPrice: true,
                    discountPercent: true,
                    isActive: true,
                    isOnOffer: true,
                    offerType: true,
                    offerValue: true,
                    offerExpiry: true,
                    showCountdown: true,
                    stockQuantity: true,
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                },
            })),
            (0, retry_1.withRetry)(() => database_1.prisma.product.count({ where: whereClause })),
        ]);
        res.json({
            data: products,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('[Offers Admin] Error listing products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
};
exports.getAdminOfferProducts = getAdminOfferProducts;
// ============================================================
// ADMIN: Update offer settings on a product
// ============================================================
const updateProductOfferSettings = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isOnOffer, offerType, offerValue, offerExpiry, showCountdown, discountPercent, } = req.body;
        const updateData = {};
        if (isOnOffer !== undefined)
            updateData.isOnOffer = isOnOffer;
        if (offerType !== undefined)
            updateData.offerType = offerType;
        if (offerValue !== undefined)
            updateData.offerValue = parseFloat(offerValue);
        if (offerExpiry !== undefined)
            updateData.offerExpiry = offerExpiry ? new Date(offerExpiry) : null;
        if (showCountdown !== undefined)
            updateData.showCountdown = showCountdown;
        if (discountPercent !== undefined) {
            updateData.discountPercent = parseFloat(discountPercent);
            // Recalculate final price
            const product = await database_1.prisma.product.findUnique({
                where: { id },
                select: { price: true },
            });
            if (product) {
                updateData.finalPrice = Number(product.price) * (1 - parseFloat(discountPercent) / 100);
            }
        }
        const updated = await database_1.prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                images: { where: { isPrimary: true }, take: 1 },
            },
        });
        res.json({ data: updated, message: 'Product offer settings updated' });
    }
    catch (error) {
        console.error('[Offers Admin] Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product offer settings' });
    }
};
exports.updateProductOfferSettings = updateProductOfferSettings;
//# sourceMappingURL=offers.controller.js.map