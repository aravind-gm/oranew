/**
 * Image URL validation and normalization utility
 * Ensures Supabase image URLs are in correct format for public access
 */

/**
 * Check if URL is from Supabase storage
 * Supabase URLs have .supabase.co domain
 */
export function isSupabaseImage(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('.supabase.co');
}

export function normalizeImageUrl(imageUrl: string | undefined): string {
  if (!imageUrl) {
    return '/placeholder.png';
  }

  // If it's already a signed URL (has ?token), use as-is
  if (imageUrl.includes('?token=')) {
    return imageUrl;
  }

  // If it's a Supabase URL, ensure it has /public/ path
  if (imageUrl.includes('supabase.co')) {
    // Replace /object/ with /object/public/ if not already there
    if (!imageUrl.includes('/object/public/')) {
      return imageUrl.replace('/object/', '/object/public/');
    }
    return imageUrl;
  }

  // Any other URL, return as-is (could be cloudinary, local, etc.)
  return imageUrl;
}

/**
 * Safely get product image with fallback
 */
export function getProductImageUrl(
  product: { images?: Array<{ imageUrl: string; isPrimary?: boolean }> },
  isPrimary: boolean = true
): string {
  const images = product.images || [];
  
  if (images.length === 0) {
    return '/placeholder.png';
  }

  // Find primary image
  if (isPrimary) {
    const primaryImage = images.find((img) => img.isPrimary);
    if (primaryImage?.imageUrl) {
      return normalizeImageUrl(primaryImage.imageUrl);
    }
  }

  // Fallback to first image
  if (images[0]?.imageUrl) {
    return normalizeImageUrl(images[0].imageUrl);
  }

  return '/placeholder.png';
}

