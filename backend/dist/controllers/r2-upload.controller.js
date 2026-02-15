"use strict";
/**
 * R2 Upload Controller
 * Production-grade image upload endpoints for ORA Jewellery
 *
 * All uploads go through backend only - NO frontend uploads allowed
 * Images served via Cloudflare CDN
 *
 * @author ORA Engineering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.deleteBanner = exports.getBanners = exports.checkR2Health = exports.reorderProductImages = exports.uploadBrandAssetEndpoint = exports.uploadCollection = exports.toggleBannerVisibility = exports.updateBanner = exports.uploadBanner = exports.deleteProductImageEndpoint = exports.uploadImages = exports.uploadProductImages = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const r2_1 = require("../config/r2");
const r2_upload_service_1 = require("../services/r2-upload.service");
const database_1 = require("../config/database");
// ============================================
// PRODUCT IMAGE ENDPOINTS
// ============================================
/**
 * Upload product images
 * @route POST /api/upload/product-images
 * @access Private (Admin/Staff)
 */
const uploadProductImages = async (req, res, next) => {
    try {
        // Verify admin authentication
        if (!req.user) {
            console.error('[R2 Upload Controller] ❌ NO USER IN REQUEST');
            throw new errorHandler_1.AppError('Not authenticated', 401);
        }
        if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
            throw new errorHandler_1.AppError('Only admin/staff can upload images', 403);
        }
        console.log('[R2 Upload Controller] 📸 Starting product image upload...', {
            userId: req.user.id,
            userRole: req.user.role,
        });
        // Check R2 configuration
        if (!(0, r2_1.isR2Configured)()) {
            throw new errorHandler_1.AppError('R2 storage not configured. Please set R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ACCOUNT_ID, and R2_PUBLIC_BASE_URL in environment variables.', 500);
        }
        const { productId } = req.body;
        const files = req.files || [];
        if (!productId) {
            throw new errorHandler_1.AppError('Product ID is required', 400);
        }
        if (!files || files.length === 0) {
            throw new errorHandler_1.AppError('No files uploaded', 400);
        }
        console.log('[R2 Upload Controller] 📁 Files received:', {
            productId,
            fileCount: files.length,
            files: files.map((f) => ({
                name: f.originalname,
                size: f.size,
                type: f.mimetype,
            })),
        });
        // Verify product exists
        const product = await database_1.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        // Upload all images
        const fileData = files.map((f) => ({
            buffer: f.buffer,
            mimeType: f.mimetype,
            originalName: f.originalname,
        }));
        const results = await (0, r2_upload_service_1.uploadMultipleProductImages)(fileData, productId, product.name);
        // Aggregate results
        const allImages = results.flatMap((r) => r.images);
        const allErrors = results.flatMap((r) => r.errors);
        const successCount = results.filter((r) => r.success).length;
        console.log('[R2 Upload Controller] ✅ Upload complete:', {
            productId,
            successCount,
            errorCount: allErrors.length,
            totalImages: allImages.length,
        });
        res.json({
            success: successCount > 0,
            data: {
                productId,
                images: allImages,
                urls: allImages.map((img) => img.url), // For backwards compatibility
                errors: allErrors.length > 0 ? allErrors : undefined,
            },
            message: allErrors.length > 0
                ? `Uploaded ${successCount} files, ${allErrors.length} failed`
                : `Successfully uploaded ${successCount} files`,
        });
    }
    catch (error) {
        console.error('[R2 Upload Controller] 🔴 UPLOAD FAILED:', {
            error: error instanceof Error ? error.message : String(error),
            userId: req.user?.id,
        });
        next(error);
    }
};
exports.uploadProductImages = uploadProductImages;
/**
 * Upload images (backwards compatible endpoint)
 * @route POST /api/upload/images
 * @access Private (Admin/Staff)
 */
const uploadImages = async (req, res, next) => {
    try {
        // Verify admin authentication
        if (!req.user) {
            throw new errorHandler_1.AppError('Not authenticated', 401);
        }
        if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
            throw new errorHandler_1.AppError('Only admin/staff can upload images', 403);
        }
        console.log('[R2 Upload Controller] 📸 Legacy image upload...', {
            userId: req.user.id,
        });
        // Check R2 configuration
        if (!(0, r2_1.isR2Configured)()) {
            throw new errorHandler_1.AppError('R2 storage not configured.', 500);
        }
        const files = req.files || [];
        if (!files || files.length === 0) {
            throw new errorHandler_1.AppError('No files uploaded', 400);
        }
        // For backwards compatibility, we'll generate temporary IDs and return URLs
        // The product association will happen when the product is created
        const uploadedUrls = [];
        const errors = [];
        for (const file of files) {
            try {
                // Generate a temporary product ID for the upload
                const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                const result = await (0, r2_upload_service_1.uploadProductImage)(file.buffer, file.mimetype, file.originalname, tempId);
                if (result.success && result.images.length > 0) {
                    // Return the hero variant URL for backwards compatibility
                    const heroImage = result.images.find((img) => img.role === 'hero');
                    if (heroImage) {
                        uploadedUrls.push(heroImage.url);
                    }
                }
                else {
                    errors.push(...result.errors);
                }
            }
            catch (error) {
                const errorMsg = `Failed to upload ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
            }
        }
        if (uploadedUrls.length === 0 && errors.length > 0) {
            throw new errorHandler_1.AppError(`All uploads failed: ${errors.join(', ')}`, 500);
        }
        res.json({
            success: true,
            data: {
                urls: uploadedUrls,
                errors: errors.length > 0 ? errors : undefined,
            },
            message: errors.length > 0
                ? `Uploaded ${uploadedUrls.length} files, ${errors.length} failed`
                : `Successfully uploaded ${uploadedUrls.length} files`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadImages = uploadImages;
/**
 * Delete a product image
 * @route DELETE /api/upload/product-images/:imageId
 * @access Private (Admin/Staff)
 */
const deleteProductImageEndpoint = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
            throw new errorHandler_1.AppError('Not authorized', 403);
        }
        const { imageId } = req.params;
        if (!imageId) {
            throw new errorHandler_1.AppError('Image ID is required', 400);
        }
        const success = await (0, r2_upload_service_1.deleteProductImage)(imageId);
        if (!success) {
            throw new errorHandler_1.AppError('Failed to delete image', 500);
        }
        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProductImageEndpoint = deleteProductImageEndpoint;
// ============================================
// BANNER IMAGE ENDPOINTS
// ============================================
/**
 * Upload banner image
 * @route POST /api/upload/banners
 * @access Private (Admin)
 */
const uploadBanner = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Only admin can upload banners', 403);
        }
        if (!(0, r2_1.isR2Configured)()) {
            throw new errorHandler_1.AppError('R2 storage not configured', 500);
        }
        const file = req.file;
        const { page, title, ctaText, ctaLink, position, generateMobile } = req.body;
        if (!file) {
            throw new errorHandler_1.AppError('No file uploaded', 400);
        }
        if (!page) {
            throw new errorHandler_1.AppError('Page is required (home, collection, checkout, cart)', 400);
        }
        console.log('[R2 Upload Controller] 🖼️ Uploading banner...', {
            page,
            fileName: file.originalname,
        });
        const result = await (0, r2_upload_service_1.uploadBannerImage)(file.buffer, file.mimetype, file.originalname, page, {
            title,
            ctaText,
            ctaLink,
            position,
            generateMobile: generateMobile === 'true' || generateMobile === true,
        });
        res.json({
            success: true,
            data: result,
            message: 'Banner uploaded successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadBanner = uploadBanner;
/**
 * Update banner image
 * @route PUT /api/upload/banners/:bannerId
 * @access Private (Admin)
 */
const updateBanner = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Only admin can update banners', 403);
        }
        const { bannerId } = req.params;
        const file = req.file;
        if (!bannerId) {
            throw new errorHandler_1.AppError('Banner ID is required', 400);
        }
        if (!file) {
            throw new errorHandler_1.AppError('No file uploaded', 400);
        }
        const result = await (0, r2_upload_service_1.updateBannerImage)(bannerId, file.buffer, file.mimetype, file.originalname);
        res.json({
            success: true,
            data: result,
            message: 'Banner updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBanner = updateBanner;
/**
 * Toggle banner visibility
 * @route PATCH /api/upload/banners/:bannerId/toggle
 * @access Private (Admin)
 */
const toggleBannerVisibility = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Only admin can toggle banners', 403);
        }
        const { bannerId } = req.params;
        const banner = await database_1.prisma.banner.findUnique({
            where: { id: bannerId },
        });
        if (!banner) {
            throw new errorHandler_1.AppError('Banner not found', 404);
        }
        const updated = await database_1.prisma.banner.update({
            where: { id: bannerId },
            data: { isActive: !banner.isActive },
        });
        res.json({
            success: true,
            data: { isActive: updated.isActive },
            message: `Banner ${updated.isActive ? 'activated' : 'deactivated'}`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleBannerVisibility = toggleBannerVisibility;
// ============================================
// COLLECTION IMAGE ENDPOINTS
// ============================================
/**
 * Upload collection image
 * @route POST /api/upload/collections
 * @access Private (Admin)
 */
const uploadCollection = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Only admin can upload collection images', 403);
        }
        if (!(0, r2_1.isR2Configured)()) {
            throw new errorHandler_1.AppError('R2 storage not configured', 500);
        }
        const file = req.file;
        const { collectionSlug, altText } = req.body;
        if (!file) {
            throw new errorHandler_1.AppError('No file uploaded', 400);
        }
        if (!collectionSlug) {
            throw new errorHandler_1.AppError('Collection slug is required', 400);
        }
        console.log('[R2 Upload Controller] 🖼️ Uploading collection image...', {
            collectionSlug,
            fileName: file.originalname,
        });
        const result = await (0, r2_upload_service_1.uploadCollectionImage)(file.buffer, file.mimetype, file.originalname, collectionSlug, altText);
        res.json({
            success: true,
            data: result,
            message: 'Collection image uploaded successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadCollection = uploadCollection;
// ============================================
// BRAND ASSET ENDPOINTS
// ============================================
/**
 * Upload brand asset
 * @route POST /api/upload/brand
 * @access Private (Admin)
 */
const uploadBrandAssetEndpoint = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Only admin can upload brand assets', 403);
        }
        if (!(0, r2_1.isR2Configured)()) {
            throw new errorHandler_1.AppError('R2 storage not configured', 500);
        }
        const file = req.file;
        const { assetType, altText } = req.body;
        if (!file) {
            throw new errorHandler_1.AppError('No file uploaded', 400);
        }
        if (!assetType || !['logo', 'favicon', 'og_image', 'watermark'].includes(assetType)) {
            throw new errorHandler_1.AppError('Valid asset type is required (logo, favicon, og_image, watermark)', 400);
        }
        console.log('[R2 Upload Controller] 🏷️ Uploading brand asset...', {
            assetType,
            fileName: file.originalname,
        });
        const result = await (0, r2_upload_service_1.uploadBrandAsset)(file.buffer, file.mimetype, file.originalname, assetType, altText);
        res.json({
            success: true,
            data: result,
            message: `Brand ${assetType} uploaded successfully`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadBrandAssetEndpoint = uploadBrandAssetEndpoint;
// ============================================
// REORDER IMAGES
// ============================================
/**
 * Reorder product images
 * @route PUT /api/upload/product-images/reorder
 * @access Private (Admin/Staff)
 */
const reorderProductImages = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
            throw new errorHandler_1.AppError('Not authorized', 403);
        }
        const { productId, imageOrder } = req.body;
        if (!productId || !Array.isArray(imageOrder)) {
            throw new errorHandler_1.AppError('Product ID and image order array are required', 400);
        }
        console.log('[R2 Upload Controller] 🔀 Reordering images...', {
            productId,
            imageCount: imageOrder.length,
        });
        // Update sort order for each image
        const updates = imageOrder.map((imageId, index) => database_1.prisma.productImage.update({
            where: { id: imageId },
            data: {
                sortOrder: index,
                isPrimary: index === 0, // First image is primary
            },
        }));
        await database_1.prisma.$transaction(updates);
        res.json({
            success: true,
            message: 'Image order updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reorderProductImages = reorderProductImages;
// ============================================
// HEALTH CHECK
// ============================================
/**
 * Check R2 storage health
 * @route GET /api/upload/health
 * @access Private (Admin)
 */
const checkR2Health = async (req, res, next) => {
    try {
        // Public health check - no auth required
        const configured = (0, r2_1.isR2Configured)();
        if (!configured) {
            res.json({
                success: false,
                configured: false,
                message: 'R2 storage is not configured',
            });
            return;
        }
        const connectionTest = await (0, r2_1.testR2Connection)();
        res.json({
            success: connectionTest.success,
            configured: true,
            connected: connectionTest.success,
            error: connectionTest.error,
            message: connectionTest.success
                ? 'R2 storage is healthy'
                : `R2 connection failed: ${connectionTest.error}`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkR2Health = checkR2Health;
// ============================================
// GET BANNERS
// ============================================
/**
 * Get all banners
 * @route GET /api/r2/banners
 * @access Private (Admin)
 */
const getBanners = async (req, res, next) => {
    try {
        console.log('[getBanners] Request received', {
            headers: req.headers.authorization ? '***' : 'NO_AUTH',
            user: req.user?.id,
            role: req.user?.role,
            query: req.query,
        });
        if (!req.user) {
            console.error('[getBanners] No user in request');
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        if (req.user.role !== 'ADMIN') {
            console.error('[getBanners] User is not admin', { role: req.user.role });
            throw new errorHandler_1.AppError('Only admin can view banners', 403);
        }
        const { position, page } = req.query;
        const where = {};
        if (position)
            where.position = position;
        if (page)
            where.page = page;
        console.log('[getBanners] Query filter:', where);
        const banners = await database_1.prisma.banner.findMany({
            where,
            orderBy: [
                { position: 'asc' },
                { sortOrder: 'asc' },
            ],
        });
        console.log('[getBanners] Found banners:', banners.length);
        res.json({
            success: true,
            banners,
        });
    }
    catch (error) {
        console.error('[getBanners] Error:', error);
        next(error);
    }
};
exports.getBanners = getBanners;
/**
 * Delete a banner
 * @route DELETE /api/r2/banners/:bannerId
 * @access Private (Admin)
 */
const deleteBanner = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Only admin can delete banners', 403);
        }
        const { bannerId } = req.params;
        const banner = await database_1.prisma.banner.findUnique({
            where: { id: bannerId },
        });
        if (!banner) {
            throw new errorHandler_1.AppError('Banner not found', 404);
        }
        // TODO: Delete image from R2 if needed
        await database_1.prisma.banner.delete({
            where: { id: bannerId },
        });
        res.json({
            success: true,
            message: 'Banner deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBanner = deleteBanner;
// ============================================
// DELETE IMAGE (Legacy endpoint)
// ============================================
/**
 * Delete an image (legacy endpoint for backwards compatibility)
 * @route DELETE /api/upload/images
 * @access Private (Admin/Staff)
 */
const deleteImage = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
            throw new errorHandler_1.AppError('Not authorized', 403);
        }
        const { url, imageId } = req.body;
        if (!url && !imageId) {
            throw new errorHandler_1.AppError('Image URL or ID is required', 400);
        }
        // If imageId is provided, delete by ID
        if (imageId) {
            const success = await (0, r2_upload_service_1.deleteProductImage)(imageId);
            if (!success) {
                throw new errorHandler_1.AppError('Failed to delete image', 500);
            }
        }
        else {
            // For legacy URL-based deletion, find the image by URL and delete
            const image = await database_1.prisma.productImage.findFirst({
                where: { imageUrl: url },
            });
            if (image) {
                await (0, r2_upload_service_1.deleteProductImage)(image.id);
            }
        }
        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteImage = deleteImage;
//# sourceMappingURL=r2-upload.controller.js.map