"use strict";
/**
 * R2 Upload Routes
 * Production-grade image upload endpoints
 *
 * All routes are protected - admin/staff only
 *
 * @author ORA Engineering
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const imageValidation_1 = require("../middleware/imageValidation");
const r2_upload_controller_1 = require("../controllers/r2-upload.controller");
const router = (0, express_1.Router)();
// ============================================
// MULTER CONFIGURATION
// ============================================
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 10, // Max 10 files at once
    },
    fileFilter: (_req, file, cb) => {
        // Accept only images
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
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
router.post('/product-images', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), upload.array('images', 10), imageValidation_1.validateImageUpload, // Security validation
r2_upload_controller_1.uploadProductImages);
/**
 * Delete a product image
 * DELETE /api/r2/product-images/:imageId
 */
router.delete('/product-images/:imageId', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), r2_upload_controller_1.deleteProductImageEndpoint);
/**
 * Reorder product images
 * PUT /api/r2/product-images/reorder
 * Body: { productId: string, imageOrder: string[] }
 */
router.put('/product-images/reorder', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), r2_upload_controller_1.reorderProductImages);
// ============================================
// BANNER ROUTES
// ============================================
/**
 * Get all banners
 * GET /api/r2/banners
 * Query: { position?: string, page?: string }
 */
router.get('/banners', auth_1.protect, (0, auth_1.authorize)('ADMIN'), r2_upload_controller_1.getBanners);
/**
 * Upload banner image
 * POST /api/r2/banners
 * Body: { page: string, title?: string, ctaText?: string, ctaLink?: string, generateMobile?: boolean }
 * File: image
 */
router.post('/banners', auth_1.protect, (0, auth_1.authorize)('ADMIN'), upload.single('image'), r2_upload_controller_1.uploadBanner);
/**
 * Update banner image
 * PUT /api/r2/banners/:bannerId
 * File: image
 */
router.put('/banners/:bannerId', auth_1.protect, (0, auth_1.authorize)('ADMIN'), upload.single('image'), r2_upload_controller_1.updateBanner);
/**
 * Toggle banner visibility
 * PATCH /api/r2/banners/:bannerId/toggle
 */
router.patch('/banners/:bannerId/toggle', auth_1.protect, (0, auth_1.authorize)('ADMIN'), r2_upload_controller_1.toggleBannerVisibility);
/**
 * Delete banner
 * DELETE /api/r2/banners/:bannerId
 */
router.delete('/banners/:bannerId', auth_1.protect, (0, auth_1.authorize)('ADMIN'), r2_upload_controller_1.deleteBanner);
// ============================================
// COLLECTION IMAGE ROUTES
// ============================================
/**
 * Upload collection image
 * POST /api/r2/collections
 * Body: { collectionSlug: string, altText?: string }
 * File: image
 */
router.post('/collections', auth_1.protect, (0, auth_1.authorize)('ADMIN'), upload.single('image'), r2_upload_controller_1.uploadCollection);
// ============================================
// BRAND ASSET ROUTES
// ============================================
/**
 * Upload brand asset
 * POST /api/r2/brand
 * Body: { assetType: 'logo' | 'favicon' | 'og_image' | 'watermark', altText?: string }
 * File: image
 */
router.post('/brand', auth_1.protect, (0, auth_1.authorize)('ADMIN'), upload.single('image'), r2_upload_controller_1.uploadBrandAssetEndpoint);
// ============================================
// HEALTH & LEGACY ROUTES
// ============================================
/**
 * Check R2 storage health - PUBLIC endpoint
 * GET /api/r2/health
 */
router.get('/health', r2_upload_controller_1.checkR2Health);
/**
 * Legacy upload endpoint for backwards compatibility
 * POST /api/r2/images
 * Files: images[]
 */
router.post('/images', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), upload.array('images', 10), r2_upload_controller_1.uploadImages);
/**
 * Legacy delete endpoint
 * DELETE /api/r2/images
 * Body: { url?: string, imageId?: string }
 */
router.delete('/images', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), r2_upload_controller_1.deleteImage);
exports.default = router;
//# sourceMappingURL=r2-upload.routes.js.map