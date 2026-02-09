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
import { AppError } from '../middleware/errorHandler';
import { isR2Configured, testR2Connection } from '../config/r2';
import {
  deleteProductImage,
  uploadBannerImage,
  uploadBrandAsset,
  uploadCollectionImage,
  uploadMultipleProductImages,
  uploadProductImage,
  updateBannerImage,
} from '../services/r2-upload.service';
import { prisma } from '../config/database';

// ============================================
// PRODUCT IMAGE ENDPOINTS
// ============================================

/**
 * Upload product images
 * @route POST /api/upload/product-images
 * @access Private (Admin/Staff)
 */
export const uploadProductImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verify admin authentication
    if (!req.user) {
      console.error('[R2 Upload Controller] ❌ NO USER IN REQUEST');
      throw new AppError('Not authenticated', 401);
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
      throw new AppError('Only admin/staff can upload images', 403);
    }

    console.log('[R2 Upload Controller] 📸 Starting product image upload...', {
      userId: req.user.id,
      userRole: req.user.role,
    });

    // Check R2 configuration
    if (!isR2Configured()) {
      throw new AppError(
        'R2 storage not configured. Please set R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ACCOUNT_ID, and R2_PUBLIC_BASE_URL in environment variables.',
        500
      );
    }

    const { productId } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];

    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Upload all images
    const fileData = files.map((f) => ({
      buffer: f.buffer,
      mimeType: f.mimetype,
      originalName: f.originalname,
    }));

    const results = await uploadMultipleProductImages(
      fileData,
      productId,
      product.name
    );

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
      message:
        allErrors.length > 0
          ? `Uploaded ${successCount} files, ${allErrors.length} failed`
          : `Successfully uploaded ${successCount} files`,
    });
  } catch (error) {
    console.error('[R2 Upload Controller] 🔴 UPLOAD FAILED:', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.id,
    });
    next(error);
  }
};

/**
 * Upload images (backwards compatible endpoint)
 * @route POST /api/upload/images
 * @access Private (Admin/Staff)
 */
export const uploadImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verify admin authentication
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
      throw new AppError('Only admin/staff can upload images', 403);
    }

    console.log('[R2 Upload Controller] 📸 Legacy image upload...', {
      userId: req.user.id,
    });

    // Check R2 configuration
    if (!isR2Configured()) {
      throw new AppError('R2 storage not configured.', 500);
    }

    const files = (req.files as Express.Multer.File[]) || [];

    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    // For backwards compatibility, we'll generate temporary IDs and return URLs
    // The product association will happen when the product is created
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Generate a temporary product ID for the upload
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        const result = await uploadProductImage(
          file.buffer,
          file.mimetype,
          file.originalname,
          tempId
        );

        if (result.success && result.images.length > 0) {
          // Return the hero variant URL for backwards compatibility
          const heroImage = result.images.find((img) => img.role === 'hero');
          if (heroImage) {
            uploadedUrls.push(heroImage.url);
          }
        } else {
          errors.push(...result.errors);
        }
      } catch (error) {
        const errorMsg = `Failed to upload ${file.originalname}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMsg);
      }
    }

    if (uploadedUrls.length === 0 && errors.length > 0) {
      throw new AppError(`All uploads failed: ${errors.join(', ')}`, 500);
    }

    res.json({
      success: true,
      data: {
        urls: uploadedUrls,
        errors: errors.length > 0 ? errors : undefined,
      },
      message:
        errors.length > 0
          ? `Uploaded ${uploadedUrls.length} files, ${errors.length} failed`
          : `Successfully uploaded ${uploadedUrls.length} files`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product image
 * @route DELETE /api/upload/product-images/:imageId
 * @access Private (Admin/Staff)
 */
export const deleteProductImageEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
      throw new AppError('Not authorized', 403);
    }

    const { imageId } = req.params;

    if (!imageId) {
      throw new AppError('Image ID is required', 400);
    }

    const success = await deleteProductImage(imageId);

    if (!success) {
      throw new AppError('Failed to delete image', 500);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// BANNER IMAGE ENDPOINTS
// ============================================

/**
 * Upload banner image
 * @route POST /api/upload/banners
 * @access Private (Admin)
 */
export const uploadBanner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new AppError('Only admin can upload banners', 403);
    }

    if (!isR2Configured()) {
      throw new AppError('R2 storage not configured', 500);
    }

    const file = req.file;
    const { page, title, ctaText, ctaLink, position, generateMobile } = req.body;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!page) {
      throw new AppError('Page is required (home, collection, checkout, cart)', 400);
    }

    console.log('[R2 Upload Controller] 🖼️ Uploading banner...', {
      page,
      fileName: file.originalname,
    });

    const result = await uploadBannerImage(
      file.buffer,
      file.mimetype,
      file.originalname,
      page,
      {
        title,
        ctaText,
        ctaLink,
        position,
        generateMobile: generateMobile === 'true' || generateMobile === true,
      }
    );

    res.json({
      success: true,
      data: result,
      message: 'Banner uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update banner image
 * @route PUT /api/upload/banners/:bannerId
 * @access Private (Admin)
 */
export const updateBanner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new AppError('Only admin can update banners', 403);
    }

    const { bannerId } = req.params;
    const file = req.file;

    if (!bannerId) {
      throw new AppError('Banner ID is required', 400);
    }

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const result = await updateBannerImage(
      bannerId,
      file.buffer,
      file.mimetype,
      file.originalname
    );

    res.json({
      success: true,
      data: result,
      message: 'Banner updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle banner visibility
 * @route PATCH /api/upload/banners/:bannerId/toggle
 * @access Private (Admin)
 */
export const toggleBannerVisibility = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new AppError('Only admin can toggle banners', 403);
    }

    const { bannerId } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      throw new AppError('Banner not found', 404);
    }

    const updated = await prisma.banner.update({
      where: { id: bannerId },
      data: { isActive: !banner.isActive },
    });

    res.json({
      success: true,
      data: { isActive: updated.isActive },
      message: `Banner ${updated.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// COLLECTION IMAGE ENDPOINTS
// ============================================

/**
 * Upload collection image
 * @route POST /api/upload/collections
 * @access Private (Admin)
 */
export const uploadCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new AppError('Only admin can upload collection images', 403);
    }

    if (!isR2Configured()) {
      throw new AppError('R2 storage not configured', 500);
    }

    const file = req.file;
    const { collectionSlug, altText } = req.body;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!collectionSlug) {
      throw new AppError('Collection slug is required', 400);
    }

    console.log('[R2 Upload Controller] 🖼️ Uploading collection image...', {
      collectionSlug,
      fileName: file.originalname,
    });

    const result = await uploadCollectionImage(
      file.buffer,
      file.mimetype,
      file.originalname,
      collectionSlug,
      altText
    );

    res.json({
      success: true,
      data: result,
      message: 'Collection image uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// BRAND ASSET ENDPOINTS
// ============================================

/**
 * Upload brand asset
 * @route POST /api/upload/brand
 * @access Private (Admin)
 */
export const uploadBrandAssetEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new AppError('Only admin can upload brand assets', 403);
    }

    if (!isR2Configured()) {
      throw new AppError('R2 storage not configured', 500);
    }

    const file = req.file;
    const { assetType, altText } = req.body;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!assetType || !['logo', 'favicon', 'og_image', 'watermark'].includes(assetType)) {
      throw new AppError('Valid asset type is required (logo, favicon, og_image, watermark)', 400);
    }

    console.log('[R2 Upload Controller] 🏷️ Uploading brand asset...', {
      assetType,
      fileName: file.originalname,
    });

    const result = await uploadBrandAsset(
      file.buffer,
      file.mimetype,
      file.originalname,
      assetType,
      altText
    );

    res.json({
      success: true,
      data: result,
      message: `Brand ${assetType} uploaded successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REORDER IMAGES
// ============================================

/**
 * Reorder product images
 * @route PUT /api/upload/product-images/reorder
 * @access Private (Admin/Staff)
 */
export const reorderProductImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
      throw new AppError('Not authorized', 403);
    }

    const { productId, imageOrder } = req.body;

    if (!productId || !Array.isArray(imageOrder)) {
      throw new AppError('Product ID and image order array are required', 400);
    }

    console.log('[R2 Upload Controller] 🔀 Reordering images...', {
      productId,
      imageCount: imageOrder.length,
    });

    // Update sort order for each image
    const updates = imageOrder.map((imageId: string, index: number) =>
      prisma.productImage.update({
        where: { id: imageId },
        data: {
          sortOrder: index,
          isPrimary: index === 0, // First image is primary
        },
      })
    );

    await prisma.$transaction(updates);

    res.json({
      success: true,
      message: 'Image order updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check R2 storage health
 * @route GET /api/upload/health
 * @access Private (Admin)
 */
export const checkR2Health = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Public health check - no auth required
    const configured = isR2Configured();

    if (!configured) {
      res.json({
        success: false,
        configured: false,
        message: 'R2 storage is not configured',
      });
      return;
    }

    const connectionTest = await testR2Connection();

    res.json({
      success: connectionTest.success,
      configured: true,
      connected: connectionTest.success,
      error: connectionTest.error,
      message: connectionTest.success
        ? 'R2 storage is healthy'
        : `R2 connection failed: ${connectionTest.error}`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE IMAGE (Legacy endpoint)
// ============================================

/**
 * Delete an image (legacy endpoint for backwards compatibility)
 * @route DELETE /api/upload/images
 * @access Private (Admin/Staff)
 */
export const deleteImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
      throw new AppError('Not authorized', 403);
    }

    const { url, imageId } = req.body;

    if (!url && !imageId) {
      throw new AppError('Image URL or ID is required', 400);
    }

    // If imageId is provided, delete by ID
    if (imageId) {
      const success = await deleteProductImage(imageId);
      if (!success) {
        throw new AppError('Failed to delete image', 500);
      }
    } else {
      // For legacy URL-based deletion, find the image by URL and delete
      const image = await prisma.productImage.findFirst({
        where: { imageUrl: url },
      });

      if (image) {
        await deleteProductImage(image.id);
      }
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
