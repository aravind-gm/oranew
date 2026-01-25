import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addToCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCartItem: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const removeFromCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const clearCart: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=cart.controller.d.ts.map