import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createProduct: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProductById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProduct: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteProduct: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getFeaturedProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProductBySlug: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const searchProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=product.controller.d.ts.map