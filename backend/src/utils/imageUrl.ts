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
export function transformImageUrlToCDN(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // Already a CDN URL
  if (imageUrl.includes('cdn.orashop.in')) {
    return imageUrl;
  }

  // Supabase URL - extract the filename and use CDN
  if (imageUrl.includes('supabase.co')) {
    const filenameMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/products/${filename}`;
    }
  }

  // R2 bucket URL - transform to CDN
  if (imageUrl.includes('.r2.dev') || imageUrl.includes('r2.dev')) {
    const filenameMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/products/${filename}`;
    }
  }

  // Relative path - prepend CDN URL
  if (!imageUrl.startsWith('http')) {
    return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/${imageUrl}`;
  }

  // Unknown format - return as is
  return imageUrl;
}

/**
 * Transform all product images to use CDN URLs.
 */
export async function transformProductImages(product: any, forPublic: boolean = true) {
  if (!product.images || product.images.length === 0) {
    return product;
  }

  const transformedImages = product.images.map((img: any) => {
    if (!img.imageUrl) {
      return img;
    }

    const cdnUrl = transformImageUrlToCDN(img.imageUrl);
    return { ...img, imageUrl: cdnUrl };
  });

  return { ...product, images: transformedImages };
}
