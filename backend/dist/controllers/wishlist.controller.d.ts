import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getWishlist: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addToWishlist: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const removeFromWishlist: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=wishlist.controller.d.ts.map