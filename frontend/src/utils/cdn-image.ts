/**
 * CDN Image Utilities
 * Helper functions for working with Cloudflare R2 CDN images
 * 
 * @author ORA Engineering
 */

// ============================================
// TYPES
// ============================================

export type ImageVariant = 'thumbnail' | 'listing' | 'hero' | 'zoom';

export interface ProductImageUrls {
  thumbnail: string;
  listing: string;
  hero: string;
  zoom: string;
}

// ============================================
// CONSTANTS
// ============================================

// CDN base URL - should match R2_PUBLIC_BASE_URL in backend
export const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.orashop.in';

// Variant width sizes
export const VARIANT_SIZES: Record<ImageVariant, { width: number; height: number }> = {
  thumbnail: { width: 300, height: 300 },
  listing: { width: 600, height: 600 },
  hero: { width: 1200, height: 1200 },
  zoom: { width: 2400, height: 2400 },
};

// ============================================
// URL UTILITIES
// ============================================

/**
 * Check if a URL is from our CDN
 */
export function isCdnUrl(url: string): boolean {
  return url.includes(CDN_BASE_URL) || url.startsWith('/products/');
}

/**
 * Check if a URL is from Supabase Storage (legacy)
 */
export function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase.co');
}

/**
 * Get the CDN URL for a product image variant
 */
export function getProductImageUrl(productId: string, variant: ImageVariant = 'listing'): string {
  return `${CDN_BASE_URL}/products/${productId}/${variant}.webp`;
}

/**
 * Get all variant URLs for a product
 */
export function getProductImageUrls(productId: string): ProductImageUrls {
  return {
    thumbnail: getProductImageUrl(productId, 'thumbnail'),
    listing: getProductImageUrl(productId, 'listing'),
    hero: getProductImageUrl(productId, 'hero'),
    zoom: getProductImageUrl(productId, 'zoom'),
  };
}

/**
 * Get collection image URL
 */
export function getCollectionImageUrl(slug: string, variant: 'hero' | 'thumb' = 'hero'): string {
  return `${CDN_BASE_URL}/collections/${slug}/${variant}.webp`;
}

/**
 * Get banner image URL
 */
export function getBannerImageUrl(page: string, id: string): string {
  return `${CDN_BASE_URL}/banners/${page}/${id}.webp`;
}

/**
 * Get brand asset URL
 */
export function getBrandAssetUrl(assetType: 'logo' | 'favicon' | 'og_image' | 'watermark'): string {
  return `${CDN_BASE_URL}/brand/${assetType}.webp`;
}

/**
 * Transform any image URL to use the correct variant
 * Handles both old Supabase URLs and new CDN URLs
 */
export function transformToVariant(url: string, variant: ImageVariant): string {
  // If it's already a CDN URL with variant pattern
  if (isCdnUrl(url) && url.includes('.webp')) {
    return url.replace(/\/(thumbnail|listing|hero|zoom)\.webp$/, `/${variant}.webp`);
  }
  
  // If it's a legacy Supabase URL, return as-is
  // The migration script will handle these
  if (isSupabaseUrl(url)) {
    return url;
  }
  
  // If it's a relative URL, prepend CDN base
  if (url.startsWith('/')) {
    return `${CDN_BASE_URL}${url}`;
  }
  
  return url;
}

/**
 * Get srcset for responsive images
 */
export function getImageSrcSet(
  url: string,
  variants: ImageVariant[] = ['thumbnail', 'listing', 'hero']
): string {
  return variants
    .map((variant) => {
      const variantUrl = transformToVariant(url, variant);
      const size = VARIANT_SIZES[variant];
      return `${variantUrl} ${size.width}w`;
    })
    .join(', ');
}

/**
 * Get sizes attribute for responsive images
 */
export function getImageSizes(variant: ImageVariant): string {
  switch (variant) {
    case 'thumbnail':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px';
    case 'listing':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px';
    case 'hero':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px';
    case 'zoom':
      return '100vw';
    default:
      return '(max-width: 768px) 100vw, 600px';
  }
}

// ============================================
// PRELOADING
// ============================================

/**
 * Preload critical images
 * Call this for above-the-fold images
 */
export function preloadImage(url: string, variant: ImageVariant = 'hero'): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = transformToVariant(url, variant);
  link.type = 'image/webp';
  document.head.appendChild(link);
}

/**
 * Preload multiple product images
 */
export function preloadProductImages(productIds: string[], variant: ImageVariant = 'listing'): void {
  if (typeof window === 'undefined') return;
  
  productIds.slice(0, 6).forEach((id) => {
    preloadImage(getProductImageUrl(id, variant), variant);
  });
}

// ============================================
// VALIDATION
// ============================================

/**
 * Check if an image URL is valid
 */
export async function isImageValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get fallback image URL
 */
export function getFallbackImage(type: 'product' | 'collection' | 'banner' = 'product'): string {
  switch (type) {
    case 'product':
      return '/images/placeholder-product.webp';
    case 'collection':
      return '/images/placeholder-collection.webp';
    case 'banner':
      return '/images/placeholder-banner.webp';
    default:
      return '/images/placeholder.webp';
  }
}

// ============================================
// NEXT.JS IMAGE LOADER
// ============================================

/**
 * Custom image loader for Next.js Image component
 * Use with: <Image loader={cdnImageLoader} ... />
 */
export function cdnImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Determine variant based on requested width
  let variant: ImageVariant = 'listing';
  
  if (width <= 300) {
    variant = 'thumbnail';
  } else if (width <= 600) {
    variant = 'listing';
  } else if (width <= 1200) {
    variant = 'hero';
  } else {
    variant = 'zoom';
  }
  
  return transformToVariant(src, variant);
}
