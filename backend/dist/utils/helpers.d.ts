import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
export declare const asyncHandler: (fn: (req: any, res: Response, next?: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
export { AppError };
export declare const generateOrderNumber: () => string;
export declare const generateSKU: (categoryName: string, productName: string) => string;
export declare const calculateFinalPrice: (price: number, discountPercent: number) => number;
export declare const calculateGST: (amount: number, gstRate?: number) => number;
export declare const slugify: (text: string) => string;
//# sourceMappingURL=helpers.d.ts.map