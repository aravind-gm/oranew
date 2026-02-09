/**
 * Cloudflare R2 Storage Service
 * Production-grade image upload service for ORA Jewellery
 *
 * Architecture:
 * - Backend ONLY handles uploads (no frontend uploads)
 * - All images served via Cloudflare CDN
 * - Automatic WebP conversion
 * - Multi-variant image generation (thumb, listing, hero, zoom)
 * - Secure private write access
 *
 * @author ORA Engineering
 */
import { S3Client } from '@aws-sdk/client-s3';
export interface R2Config {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicBaseUrl: string;
}
export interface ImageVariant {
    role: 'thumbnail' | 'listing' | 'hero' | 'zoom';
    width: number;
    quality: number;
}
export interface UploadResult {
    success: boolean;
    url: string;
    path: string;
    variant: string;
    size: number;
}
export interface MultiUploadResult {
    success: boolean;
    variants: UploadResult[];
    errors: string[];
}
export type EntityType = 'products' | 'collections' | 'banners' | 'brand';
export declare const IMAGE_VARIANTS: ImageVariant[];
/**
 * Check if R2 is properly configured
 */
export declare function isR2Configured(): boolean;
/**
 * Get or create R2 S3-compatible client
 */
export declare function getR2Client(): S3Client;
/**
 * Get current R2 config (after initialization)
 */
export declare function getCurrentR2Config(): R2Config;
/**
 * Sanitize filename - remove special characters
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Generate deterministic path for product images
 * Format: products/{productId}/{variant}.webp
 */
export declare function generateProductImagePath(productId: string, variant: string): string;
/**
 * Generate path for collection images
 * Format: collections/{collectionSlug}/hero.webp
 */
export declare function generateCollectionImagePath(collectionSlug: string, variant?: string): string;
/**
 * Generate path for banner images
 * Format: banners/{page}/{uniqueId}.webp
 */
export declare function generateBannerImagePath(page: string, uniqueId?: string): string;
/**
 * Generate path for brand assets
 * Format: brand/{assetType}.webp
 */
export declare function generateBrandAssetPath(assetType: string): string;
/**
 * Get public CDN URL from R2 path
 */
export declare function getCdnUrl(path: string): string;
/**
 * Validate uploaded file
 */
export declare function validateImageFile(buffer: Buffer, mimeType: string, originalName: string): {
    valid: boolean;
    error?: string;
};
/**
 * Upload a single file to R2
 */
export declare function uploadToR2(buffer: Buffer, path: string, contentType?: string): Promise<UploadResult>;
/**
 * Delete a file from R2
 */
export declare function deleteFromR2(path: string): Promise<boolean>;
/**
 * Check if a file exists in R2
 */
export declare function fileExistsInR2(path: string): Promise<boolean>;
/**
 * Delete all images for a product
 */
export declare function deleteProductImages(productId: string): Promise<void>;
/**
 * Test R2 connection and configuration
 */
export declare function testR2Connection(): Promise<{
    success: boolean;
    error?: string;
}>;
//# sourceMappingURL=r2.d.ts.map