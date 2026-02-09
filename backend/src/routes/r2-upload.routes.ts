/**
 * R2 Upload Routes
 * Production-grade image upload endpoints
 * 
 * All routes are protected - admin/staff only
 * 
 * @author ORA Engineering
 */

import { Router } from 'express';
import multer from 'multer';
import { authorize, protect } from '../middleware/auth';
import {
  checkR2Health,
  deleteImage,
  deleteProductImageEndpoint,
  reorderProductImages,
  toggleBannerVisibility,
  updateBanner,
  uploadBanner,
  uploadBrandAssetEndpoint,
  uploadCollection,
  uploadImages,
  uploadProductImages,
} from '../controllers/r2-upload.controller';

const router = Router();

// ============================================
// MULTER CONFIGURATION
// ============================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max (strict limit)
    files: 10, // Max 10 files at once
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed. Received: ${file.mimetype}`));
    }
  },
});

// ============================================
// PRODUCT IMAGE ROUTES
// ============================================

/**
 * Upload product images with variants
 * POST /api/r2/product-images
 * Body: { productId: string }
 * Files: images[]
 */
router.post(
  '/product-images',
  protect,
  authorize('ADMIN', 'STAFF'),
  upload.array('images', 10),
  uploadProductImages
);

/**
 * Delete a product image
 * DELETE /api/r2/product-images/:imageId
 */
router.delete(
  '/product-images/:imageId',
  protect,
  authorize('ADMIN', 'STAFF'),
  deleteProductImageEndpoint
);

/**
 * Reorder product images
 * PUT /api/r2/product-images/reorder
 * Body: { productId: string, imageOrder: string[] }
 */
router.put(
  '/product-images/reorder',
  protect,
  authorize('ADMIN', 'STAFF'),
  reorderProductImages
);

// ============================================
// BANNER ROUTES
// ============================================

/**
 * Upload banner image
 * POST /api/r2/banners
 * Body: { page: string, title?: string, ctaText?: string, ctaLink?: string, generateMobile?: boolean }
 * File: image
 */
router.post(
  '/banners',
  protect,
  authorize('ADMIN'),
  upload.single('image'),
  uploadBanner
);

/**
 * Update banner image
 * PUT /api/r2/banners/:bannerId
 * File: image
 */
router.put(
  '/banners/:bannerId',
  protect,
  authorize('ADMIN'),
  upload.single('image'),
  updateBanner
);

/**
 * Toggle banner visibility
 * PATCH /api/r2/banners/:bannerId/toggle
 */
router.patch(
  '/banners/:bannerId/toggle',
  protect,
  authorize('ADMIN'),
  toggleBannerVisibility
);

// ============================================
// COLLECTION IMAGE ROUTES
// ============================================

/**
 * Upload collection image
 * POST /api/r2/collections
 * Body: { collectionSlug: string, altText?: string }
 * File: image
 */
router.post(
  '/collections',
  protect,
  authorize('ADMIN'),
  upload.single('image'),
  uploadCollection
);

// ============================================
// BRAND ASSET ROUTES
// ============================================

/**
 * Upload brand asset
 * POST /api/r2/brand
 * Body: { assetType: 'logo' | 'favicon' | 'og_image' | 'watermark', altText?: string }
 * File: image
 */
router.post(
  '/brand',
  protect,
  authorize('ADMIN'),
  upload.single('image'),
  uploadBrandAssetEndpoint
);

// ============================================
// HEALTH & LEGACY ROUTES
// ============================================

/**
 * Check R2 storage health - PUBLIC endpoint
 * GET /api/r2/health
 */
router.get(
  '/health',
  checkR2Health
);

/**
 * Legacy upload endpoint for backwards compatibility
 * POST /api/r2/images
 * Files: images[]
 */
router.post(
  '/images',
  protect,
  authorize('ADMIN', 'STAFF'),
  upload.array('images', 10),
  uploadImages
);

/**
 * Legacy delete endpoint
 * DELETE /api/r2/images
 * Body: { url?: string, imageId?: string }
 */
router.delete(
  '/images',
  protect,
  authorize('ADMIN', 'STAFF'),
  deleteImage
);

export default router;
