import { Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../utils/helpers';

/**
 * POST /api/coupons/:code/validate
 * 
 * Validate and apply a coupon code
 * Returns discount amount if valid
 */
export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.params;
  const { orderAmount } = req.body;
  const userId = req.user?.id;

  if (!code) {
    throw new AppError('Coupon code is required', 400);
  }

  if (!orderAmount || orderAmount <= 0) {
    throw new AppError('Valid order amount is required', 400);
  }

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  console.log('[Coupon.validate] Code:', code, 'Amount:', orderAmount);

  // Find coupon
  const coupon = await withRetry(() =>
    prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })
  );

  if (!coupon) {
    throw new AppError('Coupon code not found', 404);
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    throw new AppError('This coupon code is no longer active', 400);
  }

  // Check validity dates
  const now = new Date();
  if (coupon.validFrom > now) {
    throw new AppError('This coupon code is not yet valid', 400);
  }

  if (coupon.validUntil < now) {
    throw new AppError('This coupon code has expired', 400);
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('This coupon code has reached its usage limit', 400);
  }

  // Check minimum order amount
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount.toNumber()) {
    throw new AppError(
      `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      400
    );
  }

  // Calculate discount
  let discountAmount: number;

  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = (orderAmount * coupon.discountValue.toNumber()) / 100;
  } else {
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
export const redeemCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, orderId } = req.body;
  const userId = req.user?.id;

  if (!code || !orderId) {
    throw new AppError('Coupon code and orderId are required', 400);
  }

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  console.log('[Coupon.redeem] Code:', code, 'OrderId:', orderId);

  // Find coupon
  const coupon = await withRetry(() =>
    prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })
  );

  if (!coupon) {
    throw new AppError('Coupon code not found', 404);
  }

  // Find order
  const order = await withRetry(() =>
    prisma.order.findUnique({
      where: { id: orderId },
    })
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== userId) {
    throw new AppError('Unauthorized - order belongs to another user', 403);
  }

  // Increment usage count
  const updatedCoupon = await withRetry(() =>
    prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usageCount: coupon.usageCount + 1,
      },
    })
  );

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
export const getCoupon = asyncHandler(async (req: any, res: Response) => {
  const { code } = req.params;

  if (!code) {
    throw new AppError('Coupon code is required', 400);
  }

  const coupon = await withRetry(() =>
    prisma.coupon.findUnique({
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
    })
  );

  if (!coupon) {
    throw new AppError('Coupon code not found', 404);
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
export const listCoupons = asyncHandler(async (req: any, res: Response) => {
  const coupons = await prisma.coupon.findMany({
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
