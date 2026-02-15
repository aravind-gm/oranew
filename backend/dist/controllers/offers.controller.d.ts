/**
 * Offers Controller — Campaign management + validation
 *
 * Handles:
 * - Active campaign info for storefront
 * - Admin campaign management
 * - Product offer settings
 * - Cart validation for offers
 */
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getActiveCampaign: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getOfferProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateOfferAtCheckout: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getAdminCampaign: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAdminCampaign: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminOfferProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProductOfferSettings: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=offers.controller.d.ts.map