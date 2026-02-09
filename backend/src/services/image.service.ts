/**
 * Image Processing Service
 * Production-grade image processing for ORA Jewellery
 * 
 * Features:
 * - Automatic WebP conversion
 * - Multi-variant generation (thumb, listing, hero, zoom)
 * - Quality optimization
 * - Metadata stripping for privacy
 * - Color profile handling
 * 
 * @author ORA Engineering
 */

import sharp from 'sharp';
import { ImageVariant, IMAGE_VARIANTS } from '../config/r2';

// ============================================
// TYPES
// ============================================

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ProcessedVariant {
  role: ImageVariant['role'];
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  hasAlpha: boolean;
  orientation?: number;
}

// ============================================
// IMAGE ANALYSIS
// ============================================

/**
 * Get image metadata without processing
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata();
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    hasAlpha: metadata.hasAlpha || false,
    orientation: metadata.orientation,
  };
}

/**
 * Check if image is valid and processable
 */
export async function isValidImage(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Cannot determine image dimensions' };
    }
    
    if (metadata.width < 100 || metadata.height < 100) {
      return { valid: false, error: 'Image too small (minimum 100x100 pixels)' };
    }
    
    if (metadata.width > 10000 || metadata.height > 10000) {
      return { valid: false, error: 'Image too large (maximum 10000x10000 pixels)' };
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: `Invalid image format: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// ============================================
// IMAGE PROCESSING
// ============================================

/**
 * Convert image to WebP format with optimization
 */
export async function convertToWebp(
  buffer: Buffer,
  quality: number = 85
): Promise<ProcessedImage> {
  const image = sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .removeAlpha() // Remove alpha channel for JPEG-like compression
    .webp({
      quality,
      effort: 4, // Balance between speed and compression
      smartSubsample: true,
    });

  const outputBuffer = await image.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: outputBuffer.length,
    format: 'webp',
  };
}

/**
 * Resize image to specific width while maintaining aspect ratio
 */
export async function resizeImage(
  buffer: Buffer,
  width: number,
  quality: number = 85
): Promise<ProcessedImage> {
  const image = sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(width, null, {
      fit: 'inside',
      withoutEnlargement: true, // Don't upscale small images
    })
    .webp({
      quality,
      effort: 4,
      smartSubsample: true,
    });

  const outputBuffer = await image.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: outputBuffer.length,
    format: 'webp',
  };
}

/**
 * Generate all image variants for a product
 * Returns: thumbnail (300px), listing (600px), hero (1200px), zoom (2400px)
 */
export async function generateProductVariants(
  buffer: Buffer,
  variants: ImageVariant[] = IMAGE_VARIANTS
): Promise<ProcessedVariant[]> {
  console.log('[Image Processing] 🖼️ Generating variants...', {
    variantCount: variants.length,
    inputSize: buffer.length,
  });

  const results: ProcessedVariant[] = [];

  // Get original metadata for logging
  const originalMeta = await getImageMetadata(buffer);
  console.log('[Image Processing] 📊 Original image:', {
    width: originalMeta.width,
    height: originalMeta.height,
    format: originalMeta.format,
  });

  // Process each variant
  for (const variant of variants) {
    try {
      const processed = await resizeImage(buffer, variant.width, variant.quality);
      
      results.push({
        role: variant.role,
        buffer: processed.buffer,
        width: processed.width,
        height: processed.height,
        size: processed.size,
      });

      console.log(`[Image Processing] ✅ ${variant.role}: ${processed.width}x${processed.height} (${(processed.size / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error(`[Image Processing] ❌ Failed to generate ${variant.role}:`, error);
      throw new Error(`Failed to generate ${variant.role} variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  console.log('[Image Processing] ✅ All variants generated:', {
    count: results.length,
    totalSize: `${(totalSize / 1024).toFixed(1)}KB`,
  });

  return results;
}

/**
 * Generate single hero image for collections/banners
 */
export async function generateHeroImage(
  buffer: Buffer,
  width: number = 1920,
  quality: number = 90
): Promise<ProcessedImage> {
  console.log('[Image Processing] 🖼️ Generating hero image...', {
    targetWidth: width,
    quality,
  });

  const processed = await resizeImage(buffer, width, quality);

  console.log('[Image Processing] ✅ Hero image generated:', {
    width: processed.width,
    height: processed.height,
    size: `${(processed.size / 1024).toFixed(1)}KB`,
  });

  return processed;
}

/**
 * Generate mobile-optimized image
 */
export async function generateMobileImage(
  buffer: Buffer,
  width: number = 768,
  quality: number = 80
): Promise<ProcessedImage> {
  return resizeImage(buffer, width, quality);
}

/**
 * Optimize existing image without resizing
 */
export async function optimizeImage(
  buffer: Buffer,
  quality: number = 85
): Promise<ProcessedImage> {
  return convertToWebp(buffer, quality);
}

// ============================================
// BATCH PROCESSING
// ============================================

/**
 * Process multiple images in parallel
 */
export async function processMultipleImages(
  buffers: Buffer[],
  processor: (buffer: Buffer) => Promise<ProcessedImage>
): Promise<ProcessedImage[]> {
  console.log('[Image Processing] 📦 Processing batch...', {
    imageCount: buffers.length,
  });

  const results = await Promise.all(
    buffers.map((buffer, index) =>
      processor(buffer).catch((error) => {
        console.error(`[Image Processing] ❌ Failed to process image ${index + 1}:`, error);
        throw error;
      })
    )
  );

  console.log('[Image Processing] ✅ Batch processing complete:', {
    processedCount: results.length,
  });

  return results;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Strip EXIF metadata for privacy
 */
export async function stripMetadata(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Apply EXIF rotation first
    .withMetadata({}) // Remove all metadata
    .toBuffer();
}

/**
 * Get dominant color from image (for placeholder/loading)
 */
export async function getDominantColor(buffer: Buffer): Promise<string> {
  const { dominant } = await sharp(buffer)
    .resize(1, 1)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // This is a simplified version - for production, use a proper color extraction library
  // Sharp's stats() can provide dominant color info
  const stats = await sharp(buffer).stats();
  const { r, g, b } = stats.dominant;
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate blur hash placeholder (base64 encoded tiny image)
 */
export async function generatePlaceholder(buffer: Buffer): Promise<string> {
  const placeholder = await sharp(buffer)
    .resize(10, 10, { fit: 'inside' })
    .blur(2)
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${placeholder.toString('base64')}`;
}
