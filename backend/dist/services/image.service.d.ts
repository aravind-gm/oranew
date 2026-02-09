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
import { ImageVariant } from '../config/r2';
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
/**
 * Get image metadata without processing
 */
export declare function getImageMetadata(buffer: Buffer): Promise<ImageMetadata>;
/**
 * Check if image is valid and processable
 */
export declare function isValidImage(buffer: Buffer): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * Convert image to WebP format with optimization
 */
export declare function convertToWebp(buffer: Buffer, quality?: number): Promise<ProcessedImage>;
/**
 * Resize image to specific width while maintaining aspect ratio
 */
export declare function resizeImage(buffer: Buffer, width: number, quality?: number): Promise<ProcessedImage>;
/**
 * Generate all image variants for a product
 * Returns: thumbnail (300px), listing (600px), hero (1200px), zoom (2400px)
 */
export declare function generateProductVariants(buffer: Buffer, variants?: ImageVariant[]): Promise<ProcessedVariant[]>;
/**
 * Generate single hero image for collections/banners
 */
export declare function generateHeroImage(buffer: Buffer, width?: number, quality?: number): Promise<ProcessedImage>;
/**
 * Generate mobile-optimized image
 */
export declare function generateMobileImage(buffer: Buffer, width?: number, quality?: number): Promise<ProcessedImage>;
/**
 * Optimize existing image without resizing
 */
export declare function optimizeImage(buffer: Buffer, quality?: number): Promise<ProcessedImage>;
/**
 * Process multiple images in parallel
 */
export declare function processMultipleImages(buffers: Buffer[], processor: (buffer: Buffer) => Promise<ProcessedImage>): Promise<ProcessedImage[]>;
/**
 * Strip EXIF metadata for privacy
 */
export declare function stripMetadata(buffer: Buffer): Promise<Buffer>;
/**
 * Get dominant color from image (for placeholder/loading)
 */
export declare function getDominantColor(buffer: Buffer): Promise<string>;
/**
 * Generate blur hash placeholder (base64 encoded tiny image)
 */
export declare function generatePlaceholder(buffer: Buffer): Promise<string>;
//# sourceMappingURL=image.service.d.ts.map