import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getProductReviews: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=review.controller.d.ts.map