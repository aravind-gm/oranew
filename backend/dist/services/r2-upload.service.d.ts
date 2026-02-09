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
/**
 * Upload product image and generate all variants
 * Stores: thumbnail, listing, hero, zoom versions
 */
export declare function uploadProductImage(buffer: Buffer, mimeType: string, originalName: string, productId: string, altText?: string): Promise<ProductImageUploadResult>;
/**
 * Upload multiple product images
 */
export declare function uploadMultipleProductImages(files: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
}[], productId: string, baseAltText?: string): Promise<ProductImageUploadResult[]>;
/**
 * Replace existing product images
 */
export declare function replaceProductImage(buffer: Buffer, mimeType: string, originalName: string, productId: string, imageId: string, altText?: string): Promise<ProductImageUploadResult>;
/**
 * Delete product image (R2 + DB)
 */
export declare function deleteProductImage(imageId: string): Promise<boolean>;
/**
 * Upload banner image with optional mobile variant
 */
export declare function uploadBannerImage(buffer: Buffer, mimeType: string, originalName: string, page: string, options?: {
    title?: string;
    ctaText?: string;
    ctaLink?: string;
    position?: string;
    generateMobile?: boolean;
}): Promise<BannerUploadResult>;
/**
 * Update banner image
 */
export declare function updateBannerImage(bannerId: string, buffer: Buffer, mimeType: string, originalName: string): Promise<BannerUploadResult>;
/**
 * Upload collection hero image
 */
export declare function uploadCollectionImage(buffer: Buffer, mimeType: string, originalName: string, collectionSlug: string, altText?: string): Promise<CollectionImageUploadResult>;
/**
 * Upload brand asset (logo, favicon, etc.)
 */
export declare function uploadBrandAsset(buffer: Buffer, mimeType: string, originalName: string, assetType: 'logo' | 'favicon' | 'og_image' | 'watermark', altText?: string): Promise<{
    success: boolean;
    url: string;
}>;
/**
 * Get product image URLs by role
 */
export declare function getProductImageUrls(productId: string): Record<string, string>;
/**
 * Check if product has CDN images
 */
export declare function productHasCdnImages(productId: string): Promise<boolean>;
//# sourceMappingURL=r2-upload.service.d.ts.map