"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageMetadata = getImageMetadata;
exports.isValidImage = isValidImage;
exports.convertToWebp = convertToWebp;
exports.resizeImage = resizeImage;
exports.generateProductVariants = generateProductVariants;
exports.generateHeroImage = generateHeroImage;
exports.generateMobileImage = generateMobileImage;
exports.optimizeImage = optimizeImage;
exports.processMultipleImages = processMultipleImages;
exports.stripMetadata = stripMetadata;
exports.getDominantColor = getDominantColor;
exports.generatePlaceholder = generatePlaceholder;
const sharp_1 = __importDefault(require("sharp"));
const r2_1 = require("../config/r2");
// ============================================
// IMAGE ANALYSIS
// ============================================
/**
 * Get image metadata without processing
 */
async function getImageMetadata(buffer) {
    const metadata = await (0, sharp_1.default)(buffer).metadata();
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
async function isValidImage(buffer) {
    try {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
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
    }
    catch (error) {
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
async function convertToWebp(buffer, quality = 85) {
    const image = (0, sharp_1.default)(buffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .removeAlpha() // Remove alpha channel for JPEG-like compression
        .webp({
        quality,
        effort: 4, // Balance between speed and compression
        smartSubsample: true,
    });
    const outputBuffer = await image.toBuffer();
    const metadata = await (0, sharp_1.default)(outputBuffer).metadata();
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
async function resizeImage(buffer, width, quality = 85) {
    const image = (0, sharp_1.default)(buffer)
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
    const metadata = await (0, sharp_1.default)(outputBuffer).metadata();
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
async function generateProductVariants(buffer, variants = r2_1.IMAGE_VARIANTS) {
    console.log('[Image Processing] 🖼️ Generating variants...', {
        variantCount: variants.length,
        inputSize: buffer.length,
    });
    const results = [];
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
        }
        catch (error) {
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
async function generateHeroImage(buffer, width = 1920, quality = 90) {
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
async function generateMobileImage(buffer, width = 768, quality = 80) {
    return resizeImage(buffer, width, quality);
}
/**
 * Optimize existing image without resizing
 */
async function optimizeImage(buffer, quality = 85) {
    return convertToWebp(buffer, quality);
}
// ============================================
// BATCH PROCESSING
// ============================================
/**
 * Process multiple images in parallel
 */
async function processMultipleImages(buffers, processor) {
    console.log('[Image Processing] 📦 Processing batch...', {
        imageCount: buffers.length,
    });
    const results = await Promise.all(buffers.map((buffer, index) => processor(buffer).catch((error) => {
        console.error(`[Image Processing] ❌ Failed to process image ${index + 1}:`, error);
        throw error;
    })));
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
async function stripMetadata(buffer) {
    return (0, sharp_1.default)(buffer)
        .rotate() // Apply EXIF rotation first
        .withMetadata({}) // Remove all metadata
        .toBuffer();
}
/**
 * Get dominant color from image (for placeholder/loading)
 */
async function getDominantColor(buffer) {
    // Use sharp's stats() to get dominant color info
    const stats = await (0, sharp_1.default)(buffer).stats();
    const { r, g, b } = stats.dominant;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
/**
 * Generate blur hash placeholder (base64 encoded tiny image)
 */
async function generatePlaceholder(buffer) {
    const placeholder = await (0, sharp_1.default)(buffer)
        .resize(10, 10, { fit: 'inside' })
        .blur(2)
        .webp({ quality: 20 })
        .toBuffer();
    return `data:image/webp;base64,${placeholder.toString('base64')}`;
}
//# sourceMappingURL=image.service.js.map