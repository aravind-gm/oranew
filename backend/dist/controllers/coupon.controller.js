"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCoupons = exports.getCoupon = exports.redeemCoupon = exports.validateCoupon = void 0;
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
const helpers_1 = require("../utils/helpers");
/**
 * POST /api/coupons/:code/validate
 *
 * Validate and apply a coupon code
 * Returns discount amount if valid
 */
exports.validateCoupon = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { code } = req.params;
    const { orderAmount } = req.body;
    const userId = req.user?.id;
    if (!code) {
        throw new helpers_1.AppError('Coupon code is required', 400);
    }
    if (!orderAmount || orderAmount <= 0) {
        throw new helpers_1.AppError('Valid order amount is required', 400);
    }
    if (!userId) {
        throw new helpers_1.AppError('Authentication required', 401);
    }
    console.log('[Coupon.validate] Code:', code, 'Amount:', orderAmount);
    // Find coupon
    const coupon = await (0, retry_1.withRetry)(() => database_1.prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
    }));
    if (!coupon) {
        throw new helpers_1.AppError('Coupon code not found', 404);
    }
    // Check if coupon is active
    if (!coupon.isActive) {
        throw new helpers_1.AppError('This coupon code is no longer active', 400);
    }
    // Check validity dates
    const now = new Date();
    if (coupon.validFrom > now) {
        throw new helpers_1.AppError('This coupon code is not yet valid', 400);
    }
    if (coupon.validUntil < now) {
        throw new helpers_1.AppError('This coupon code has expired', 400);
    }
    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new helpers_1.AppError('This coupon code has reached its usage limit', 400);
    }
    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount.toNumber()) {
        throw new helpers_1.AppError(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`, 400);
    }
    // Calculate discount
    let discountAmount;
    if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (orderAmount * coupon.discountValue.toNumber()) / 100;
    }
    else {
        discountAmount = coupon.discountValue.toNumber();
    }
    // Apply max discount limit if set
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount.toNumber()) {
        discountAmount = coupon.maxDiscount.toNumber();
    }
    // Cannot exceed order amount
    if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
    }
    console.log('[Coupon.validate] ✓ Coupon valid. Discount:', discountAmount);
    res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
            couponCode: coupon.code,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            discountType: coupon.discountType,
            originalAmount: orderAmount,
            finalAmount: parseFloat((orderAmount - discountAmount).toFixed(2)),
        },
    });
});
/**
 * POST /api/coupons/:code/redeem
 *
 * Redeem a coupon when order is placed
 * Increments usage count
 */
exports.redeemCoupon = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { code, orderId } = req.body;
    const userId = req.user?.id;
    if (!code || !orderId) {
        throw new helpers_1.AppError('Coupon code and orderId are required', 400);
    }
    if (!userId) {
        throw new helpers_1.AppError('Authentication required', 401);
    }
    console.log('[Coupon.redeem] Code:', code, 'OrderId:', orderId);
    // Find coupon
    const coupon = await (0, retry_1.withRetry)(() => database_1.prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
    }));
    if (!coupon) {
        throw new helpers_1.AppError('Coupon code not found', 404);
    }
    // Find order
    const order = await (0, retry_1.withRetry)(() => database_1.prisma.order.findUnique({
        where: { id: orderId },
    }));
    if (!order) {
        throw new helpers_1.AppError('Order not found', 404);
    }
    if (order.userId !== userId) {
        throw new helpers_1.AppError('Unauthorized - order belongs to another user', 403);
    }
    // Increment usage count
    const updatedCoupon = await (0, retry_1.withRetry)(() => database_1.prisma.coupon.update({
        where: { id: coupon.id },
        data: {
            usageCount: coupon.usageCount + 1,
        },
    }));
    console.log('[Coupon.redeem] ✓ Coupon redeemed. New usage count:', updatedCoupon.usageCount);
    res.json({
        success: true,
        message: 'Coupon redeemed successfully',
        data: {
            couponCode: coupon.code,
            usageCount: updatedCoupon.usageCount,
            usageLimit: coupon.usageLimit,
        },
    });
});
/**
 * GET /api/coupons/:code
 *
 * Get coupon details (public info)
 */
exports.getCoupon = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { code } = req.params;
    if (!code) {
        throw new helpers_1.AppError('Coupon code is required', 400);
    }
    const coupon = await (0, retry_1.withRetry)(() => database_1.prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
        select: {
            code: true,
            description: true,
            discountType: true,
            discountValue: true,
            minOrderAmount: true,
            maxDiscount: true,
            usageLimit: true,
            usageCount: true,
            validFrom: true,
            validUntil: true,
            isActive: true,
        },
    }));
    if (!coupon) {
        throw new helpers_1.AppError('Coupon code not found', 404);
    }
    res.json({
        success: true,
        data: coupon,
    });
});
/**
 * GET /api/coupons
 *
 * List active coupons (admin only)
 */
exports.listCoupons = (0, helpers_1.asyncHandler)(async (req, res) => {
    const coupons = await database_1.prisma.coupon.findMany({
        where: { isActive: true },
        select: {
            id: true,
            code: true,
            description: true,
            discountType: true,
            discountValue: true,
            minOrderAmount: true,
            maxDiscount: true,
            usageLimit: true,
            usageCount: true,
            validFrom: true,
            validUntil: true,
            isActive: true,
        },
        orderBy: { validUntil: 'desc' },
    });
    res.json({
        success: true,
        data: coupons,
    });
});
//# sourceMappingURL=coupon.controller.js.map