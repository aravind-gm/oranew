import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';

// Async handler wrapper for route handlers
export const asyncHandler =
  (fn: (req: any, res: Response, next?: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Export AppError from here for convenience
export { AppError };

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORA${timestamp}${random}`;
};

export const generateSKU = (categoryName: string, productName: string): string => {
  const categoryCode = categoryName.substring(0, 3).toUpperCase();
  const productCode = productName.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${categoryCode}-${productCode}-${random}`;
};

export const calculateFinalPrice = (
  price: number,
  discountPercent: number
): number => {
  return price - (price * discountPercent) / 100;
};

export const calculateGST = (amount: number, gstRate: number = 3): number => {
  return (amount * gstRate) / 100;
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};
