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
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getBOGOCampaign: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateBOGOCampaign: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getBOGOProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProductBOGO: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getBOGOStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getBogoEligibleProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBOGOCheckout: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=bogo.controller.d.ts.map