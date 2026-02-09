/**
 * R2 Upload Service
 * Complete image upload pipeline for ORA Jewellery
 * 
 * Flow:
 * 1. Validate image file
 * 2. Process and generate variants
 * 3. Upload to Cloudflare R2
 * 4. Save URLs to Supabase DB
 * 5. Return CDN URLs
 * 
 * @author ORA Engineering
 */

import { prisma } from '../config/database';
import {
  deleteFromR2,
  deleteProductImages,
  EntityType,
  generateBannerImagePath,
  generateBrandAssetPath,
  generateCollectionImagePath,
  generateProductImagePath,
  getCdnUrl,
  IMAGE_VARIANTS,
  isR2Configured,
  MultiUploadResult,
  uploadToR2,
  validateImageFile,
} from '../config/r2';
import {
  generateHeroImage,
  generateMobileImage,
  generateProductVariants,
  getImageMetadata,
  isValidImage,
  ProcessedVariant,
} from './image.service';

// ============================================
// TYPES
// ============================================

export interface ProductImageUploadResult {
  success: boolean;
  productId: string;
  images: {
    role: string;
    url: string;
    width: number;
    height: number;
  }[];
  errors: string[];
}

export interface BannerUploadResult {
  success: boolean;
  bannerId: string;
  imageUrl: string;
  mobileImageUrl?: string;
}

export interface CollectionImageUploadResult {
  success: boolean;
  collectionSlug: string;
  heroUrl: string;
  thumbnailUrl?: string;
}

// ============================================
// PRODUCT IMAGE UPLOAD
// ============================================

/**
 * Upload product image and generate all variants
 * Stores: thumbnail, listing, hero, zoom versions
 */
export async function uploadProductImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  productId: string,
  altText?: string
): Promise<ProductImageUploadResult> {
  console.log('[R2 Upload] 📸 Starting product image upload...', {
    productId,
    originalName,
    size: buffer.length,
    mimeType,
  });

  const errors: string[] = [];
  const uploadedImages: ProductImageUploadResult['images'] = [];

  // Step 1: Validate R2 configuration
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured. Please set R2 environment variables.');
  }

  // Step 2: Validate file
  const fileValidation = validateImageFile(buffer, mimeType, originalName);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  // Step 3: Validate image content
  const imageValidation = await isValidImage(buffer);
  if (!imageValidation.valid) {
    throw new Error(imageValidation.error);
  }

  // Step 4: Generate all variants
  const variants = await generateProductVariants(buffer, IMAGE_VARIANTS);

  // Step 5: Upload each variant to R2
  for (const variant of variants) {
    try {
      const path = generateProductImagePath(productId, variant.role);
      const result = await uploadToR2(variant.buffer, path, 'image/webp');

      uploadedImages.push({
        role: variant.role,
        url: result.url,
        width: variant.width,
        height: variant.height,
      });
    } catch (error) {
      const errorMsg = `Failed to upload ${variant.role}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error('[R2 Upload] ❌', errorMsg);
    }
  }

  // Step 6: Save to database
  if (uploadedImages.length > 0) {
    try {
      // Get current max sort order for this product
      const maxSortOrder = await prisma.productImage.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });
      const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

      // Check if this is the first image (make it primary)
      const existingImages = await prisma.productImage.count({
        where: { productId },
      });
      const isPrimary = existingImages === 0;

      // Create product image records for each variant
      // We'll use the 'hero' variant as the main display image
      const heroImage = uploadedImages.find((img) => img.role === 'hero');
      if (heroImage) {
        await prisma.productImage.create({
          data: {
            productId,
            imageUrl: heroImage.url,
            altText: altText || `${productId} product image`,
            sortOrder: nextSortOrder,
            isPrimary,
            imageRole: 'HERO',
            cdnVerified: true,
          },
        });
      }

      console.log('[R2 Upload] ✅ Product image saved to database:', {
        productId,
        variantCount: uploadedImages.length,
        isPrimary,
      });
    } catch (dbError) {
      console.error('[R2 Upload] ❌ Failed to save to database:', dbError);
      errors.push(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
  }

  const success = uploadedImages.length > 0 && errors.length === 0;

  console.log('[R2 Upload] 📸 Product image upload complete:', {
    success,
    productId,
    uploadedCount: uploadedImages.length,
    errorCount: errors.length,
  });

  return {
    success,
    productId,
    images: uploadedImages,
    errors,
  };
}

/**
 * Upload multiple product images
 */
export async function uploadMultipleProductImages(
  files: { buffer: Buffer; mimeType: string; originalName: string }[],
  productId: string,
  baseAltText?: string
): Promise<ProductImageUploadResult[]> {
  console.log('[R2 Upload] 📸 Starting batch product image upload...', {
    productId,
    fileCount: files.length,
  });

  const results: ProductImageUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const altText = baseAltText ? `${baseAltText} - Image ${i + 1}` : undefined;

    try {
      // For multiple images, we need unique product IDs per image set
      // In practice, each image gets its own variant set
      const imageId = `${productId}-${Date.now()}-${i}`;
      const result = await uploadProductImage(
        file.buffer,
        file.mimeType,
        file.originalName,
        productId, // Keep same product ID for DB association
        altText
      );
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        productId,
        images: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  return results;
}

/**
 * Replace existing product images
 */
export async function replaceProductImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  productId: string,
  imageId: string,
  altText?: string
): Promise<ProductImageUploadResult> {
  console.log('[R2 Upload] 🔄 Replacing product image...', {
    productId,
    imageId,
  });

  // First, delete old R2 files
  await deleteProductImages(productId);

  // Delete old database record
  await prisma.productImage.delete({
    where: { id: imageId },
  });

  // Upload new image
  return uploadProductImage(buffer, mimeType, originalName, productId, altText);
}

/**
 * Delete product image (R2 + DB)
 */
export async function deleteProductImage(imageId: string): Promise<boolean> {
  console.log('[R2 Upload] 🗑️ Deleting product image...', { imageId });

  try {
    // Get image record
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      console.warn('[R2 Upload] ⚠️ Image not found:', { imageId });
      return false;
    }

    // Delete from R2 (all variants)
    await deleteProductImages(image.productId);

    // Delete from database
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    console.log('[R2 Upload] ✅ Product image deleted:', { imageId });
    return true;
  } catch (error) {
    console.error('[R2 Upload] ❌ Failed to delete image:', error);
    return false;
  }
}

// ============================================
// BANNER IMAGE UPLOAD
// ============================================

/**
 * Upload banner image with optional mobile variant
 */
export async function uploadBannerImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  page: string,
  options?: {
    title?: string;
    ctaText?: string;
    ctaLink?: string;
    position?: string;
    generateMobile?: boolean;
  }
): Promise<BannerUploadResult> {
  console.log('[R2 Upload] 🖼️ Starting banner image upload...', {
    page,
    originalName,
    size: buffer.length,
  });

  // Validate
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured.');
  }

  const fileValidation = validateImageFile(buffer, mimeType, originalName);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  const imageValidation = await isValidImage(buffer);
  if (!imageValidation.valid) {
    throw new Error(imageValidation.error);
  }

  // Generate hero image (1920px for desktop)
  const heroImage = await generateHeroImage(buffer, 1920, 90);
  const bannerPath = generateBannerImagePath(page);
  const uploadResult = await uploadToR2(heroImage.buffer, bannerPath, 'image/webp');

  let mobileImageUrl: string | undefined;

  // Generate mobile variant if requested
  if (options?.generateMobile) {
    const mobileImage = await generateMobileImage(buffer, 768, 80);
    const mobilePath = bannerPath.replace('.webp', '-mobile.webp');
    const mobileResult = await uploadToR2(mobileImage.buffer, mobilePath, 'image/webp');
    mobileImageUrl = mobileResult.url;
  }

  // Create banner record in database
  const banner = await prisma.banner.create({
    data: {
      page,
      title: options?.title,
      imageUrl: uploadResult.url,
      mobileImageUrl,
      ctaText: options?.ctaText,
      ctaLink: options?.ctaLink,
      position: options?.position || 'hero',
      isActive: true,
    },
  });

  console.log('[R2 Upload] ✅ Banner image uploaded:', {
    bannerId: banner.id,
    page,
    imageUrl: uploadResult.url,
  });

  return {
    success: true,
    bannerId: banner.id,
    imageUrl: uploadResult.url,
    mobileImageUrl,
  };
}

/**
 * Update banner image
 */
export async function updateBannerImage(
  bannerId: string,
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<BannerUploadResult> {
  console.log('[R2 Upload] 🔄 Updating banner image...', { bannerId });

  // Get existing banner
  const banner = await prisma.banner.findUnique({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new Error('Banner not found');
  }

  // Delete old R2 files
  if (banner.imageUrl) {
    const oldPath = banner.imageUrl.replace(getCdnUrl(''), '').replace(/^\//, '');
    await deleteFromR2(oldPath);
  }
  if (banner.mobileImageUrl) {
    const oldMobilePath = banner.mobileImageUrl.replace(getCdnUrl(''), '').replace(/^\//, '');
    await deleteFromR2(oldMobilePath);
  }

  // Upload new image
  const heroImage = await generateHeroImage(buffer, 1920, 90);
  const bannerPath = generateBannerImagePath(banner.page);
  const uploadResult = await uploadToR2(heroImage.buffer, bannerPath, 'image/webp');

  // Update database
  await prisma.banner.update({
    where: { id: bannerId },
    data: {
      imageUrl: uploadResult.url,
    },
  });

  return {
    success: true,
    bannerId,
    imageUrl: uploadResult.url,
  };
}

// ============================================
// COLLECTION IMAGE UPLOAD
// ============================================

/**
 * Upload collection hero image
 */
export async function uploadCollectionImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  collectionSlug: string,
  altText?: string
): Promise<CollectionImageUploadResult> {
  console.log('[R2 Upload] 🖼️ Starting collection image upload...', {
    collectionSlug,
    originalName,
  });

  // Validate
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured.');
  }

  const fileValidation = validateImageFile(buffer, mimeType, originalName);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  const imageValidation = await isValidImage(buffer);
  if (!imageValidation.valid) {
    throw new Error(imageValidation.error);
  }

  // Generate hero image
  const heroImage = await generateHeroImage(buffer, 1920, 90);
  const heroPath = generateCollectionImagePath(collectionSlug, 'hero');
  const heroResult = await uploadToR2(heroImage.buffer, heroPath, 'image/webp');

  // Generate thumbnail
  const thumbImage = await generateHeroImage(buffer, 400, 80);
  const thumbPath = generateCollectionImagePath(collectionSlug, 'thumb');
  const thumbResult = await uploadToR2(thumbImage.buffer, thumbPath, 'image/webp');

  // Upsert collection image record
  await prisma.collectionImage.upsert({
    where: { collectionSlug },
    create: {
      collectionSlug,
      heroUrl: heroResult.url,
      thumbnailUrl: thumbResult.url,
      altText: altText || `${collectionSlug} collection`,
    },
    update: {
      heroUrl: heroResult.url,
      thumbnailUrl: thumbResult.url,
      altText: altText || `${collectionSlug} collection`,
    },
  });

  console.log('[R2 Upload] ✅ Collection image uploaded:', {
    collectionSlug,
    heroUrl: heroResult.url,
  });

  return {
    success: true,
    collectionSlug,
    heroUrl: heroResult.url,
    thumbnailUrl: thumbResult.url,
  };
}

// ============================================
// BRAND ASSET UPLOAD
// ============================================

/**
 * Upload brand asset (logo, favicon, etc.)
 */
export async function uploadBrandAsset(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  assetType: 'logo' | 'favicon' | 'og_image' | 'watermark',
  altText?: string
): Promise<{ success: boolean; url: string }> {
  console.log('[R2 Upload] 🏷️ Starting brand asset upload...', {
    assetType,
    originalName,
  });

  // Validate
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured.');
  }

  const fileValidation = validateImageFile(buffer, mimeType, originalName);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  // Deactivate existing asset of same type
  await prisma.brandAsset.updateMany({
    where: { assetType, isActive: true },
    data: { isActive: false },
  });

  // Process based on asset type
  let processedBuffer: Buffer;
  let targetWidth: number;

  switch (assetType) {
    case 'logo':
      targetWidth = 400;
      break;
    case 'favicon':
      targetWidth = 64;
      break;
    case 'og_image':
      targetWidth = 1200;
      break;
    case 'watermark':
      targetWidth = 200;
      break;
    default:
      targetWidth = 400;
  }

  const processed = await generateHeroImage(buffer, targetWidth, 90);
  processedBuffer = processed.buffer;

  // Upload to R2
  const path = generateBrandAssetPath(assetType);
  const result = await uploadToR2(processedBuffer, path, 'image/webp');

  // Create brand asset record
  await prisma.brandAsset.create({
    data: {
      assetType,
      imageUrl: result.url,
      altText: altText || `ORA ${assetType}`,
      isActive: true,
    },
  });

  console.log('[R2 Upload] ✅ Brand asset uploaded:', {
    assetType,
    url: result.url,
  });

  return {
    success: true,
    url: result.url,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get product image URLs by role
 */
export function getProductImageUrls(
  productId: string
): Record<string, string> {
  return {
    thumbnail: getCdnUrl(generateProductImagePath(productId, 'thumbnail')),
    listing: getCdnUrl(generateProductImagePath(productId, 'listing')),
    hero: getCdnUrl(generateProductImagePath(productId, 'hero')),
    zoom: getCdnUrl(generateProductImagePath(productId, 'zoom')),
  };
}

/**
 * Check if product has CDN images
 */
export async function productHasCdnImages(productId: string): Promise<boolean> {
  const image = await prisma.productImage.findFirst({
    where: {
      productId,
      cdnVerified: true,
    },
  });
  return !!image;
}
