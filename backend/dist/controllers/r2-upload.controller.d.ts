/**
 * R2 Upload Controller
 * Production-grade image upload endpoints for ORA Jewellery
 *
 * All uploads go through backend only - NO frontend uploads allowed
 * Images served via Cloudflare CDN
 *
 * @author ORA Engineering
 */
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Upload product images
 * @route POST /api/upload/product-images
 * @access Private (Admin/Staff)
 */
export declare const uploadProductImages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Upload images (backwards compatible endpoint)
 * @route POST /api/upload/images
 * @access Private (Admin/Staff)
 */
export declare const uploadImages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete a product image
 * @route DELETE /api/upload/product-images/:imageId
 * @access Private (Admin/Staff)
 */
export declare const deleteProductImageEndpoint: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Upload banner image
 * @route POST /api/upload/banners
 * @access Private (Admin)
 */
export declare const uploadBanner: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update banner image
 * @route PUT /api/upload/banners/:bannerId
 * @access Private (Admin)
 */
export declare const updateBanner: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Toggle banner visibility
 * @route PATCH /api/upload/banners/:bannerId/toggle
 * @access Private (Admin)
 */
export declare const toggleBannerVisibility: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Upload collection image
 * @route POST /api/upload/collections
 * @access Private (Admin)
 */
export declare const uploadCollection: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Upload brand asset
 * @route POST /api/upload/brand
 * @access Private (Admin)
 */
export declare const uploadBrandAssetEndpoint: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Reorder product images
 * @route PUT /api/upload/product-images/reorder
 * @access Private (Admin/Staff)
 */
export declare const reorderProductImages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Check R2 storage health
 * @route GET /api/upload/health
 * @access Private (Admin)
 */
export declare const checkR2Health: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all banners
 * @route GET /api/r2/banners
 * @access Private (Admin)
 */
export declare const getBanners: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete a banner
 * @route DELETE /api/r2/banners/:bannerId
 * @access Private (Admin)
 */
export declare const deleteBanner: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete an image (legacy endpoint for backwards compatibility)
 * @route DELETE /api/upload/images
 * @access Private (Admin/Staff)
 */
export declare const deleteImage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=r2-upload.controller.d.ts.map