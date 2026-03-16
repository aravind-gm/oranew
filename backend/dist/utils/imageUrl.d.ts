/**
 * Shared Image URL Utilities
 * ==========================
 * Single source of truth for transforming image URLs to CDN format.
 * Used by both product.controller and admin.controller.
 */
/**
 * Transform any image URL to CDN URL.
 * Handles Supabase legacy URLs, R2 bucket URLs, and relative paths.
 */
export declare function transformImageUrlToCDN(imageUrl: string | null | undefined): string | null;
/**
 * Transform all product images to use CDN URLs.
 */
export declare function transformProductImages(product: any, forPublic?: boolean): Promise<any>;
//# sourceMappingURL=imageUrl.d.ts.map