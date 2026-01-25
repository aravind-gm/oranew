import { Response } from 'express';
/**
 * POST /api/coupons/:code/validate
 *
 * Validate and apply a coupon code
 * Returns discount amount if valid
 */
export declare const validateCoupon: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/coupons/:code/redeem
 *
 * Redeem a coupon when order is placed
 * Increments usage count
 */
export declare const redeemCoupon: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/coupons/:code
 *
 * Get coupon details (public info)
 */
export declare const getCoupon: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/coupons
 *
 * List active coupons (admin only)
 */
export declare const listCoupons: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=coupon.controller.d.ts.map