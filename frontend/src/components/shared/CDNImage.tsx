/**
 * CDN Image Component
 * Production-grade image component optimized for Cloudflare CDN
 * 
 * Features:
 * - Automatic variant selection (thumbnail, listing, hero, zoom)
 * - Lazy loading with blur placeholder
 * - Aspect ratio preservation (no CLS)
 * - Priority loading for hero images
 * - SEO-optimized alt text
 * - Responsive srcset
 * 
 * @author ORA Engineering
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

export type ImageVariant = 'thumbnail' | 'listing' | 'hero' | 'zoom';

export interface CDNImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  /** Base CDN URL or product/collection/banner URL */
  src: string;
  /** Alt text for accessibility and SEO */
  alt: string;
  /** Image variant to load (affects resolution) */
  variant?: ImageVariant;
  /** Aspect ratio for the container (e.g., "1/1", "4/3", "16/9") */
  aspectRatio?: string;
  /** Enable blur placeholder */
  showPlaceholder?: boolean;
  /** Custom placeholder color */
  placeholderColor?: string;
  /** Whether this is a priority image (above the fold) */
  priority?: boolean;
  /** Custom class for the container */
  containerClassName?: string;
  /** Fallback image URL if main image fails to load */
  fallbackSrc?: string;
}

// ============================================
// CONSTANTS
// ============================================

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.orashop.in';

const VARIANT_WIDTHS: Record<ImageVariant, number> = {
  thumbnail: 300,
  listing: 600,
  hero: 1200,
  zoom: 2400,
};

const DEFAULT_PLACEHOLDER_COLOR = '#1a1a2e';
const DEFAULT_FALLBACK = '/images/placeholder-product.webp';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Transform a URL to use the correct variant
 * Handles both old Supabase URLs and new CDN URLs
 */
function getVariantUrl(src: string, variant: ImageVariant): string {
  // If already a CDN URL with variant pattern, replace variant
  if (src.includes('/products/') && src.includes('.webp')) {
    // Replace variant in URL: products/{id}/{variant}.webp
    return src.replace(/\/(thumbnail|listing|hero|zoom)\.webp$/, `/${variant}.webp`);
  }
  
  // If it's a Supabase URL, return as-is (legacy support)
  if (src.includes('supabase.co')) {
    return src;
  }
  
  // If it's a relative URL, prepend CDN base
  if (src.startsWith('/')) {
    return `${CDN_BASE_URL}${src}`;
  }
  
  return src;
}

/**
 * Generate blur data URL placeholder
 */
function generateBlurPlaceholder(color: string): string {
  // Simple 1x1 SVG placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="${color}" width="1" height="1"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ============================================
// COMPONENT
// ============================================

export function CDNImage({
  src,
  alt,
  variant = 'listing',
  aspectRatio = '1/1',
  showPlaceholder = true,
  placeholderColor = DEFAULT_PLACEHOLDER_COLOR,
  priority = false,
  containerClassName = '',
  fallbackSrc = DEFAULT_FALLBACK,
  fill,
  width,
  height,
  sizes,
  ...props
}: CDNImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Get the correct URL for the variant
  const imageSrc = useMemo(() => {
    if (error) return fallbackSrc;
    return getVariantUrl(src, variant);
  }, [src, variant, error, fallbackSrc]);

  // Generate placeholder
  const placeholder = useMemo(() => {
    if (!showPlaceholder) return undefined;
    return 'blur' as const;
  }, [showPlaceholder]);

  const blurDataURL = useMemo(() => {
    if (!showPlaceholder) return undefined;
    return generateBlurPlaceholder(placeholderColor);
  }, [showPlaceholder, placeholderColor]);

  // Default sizes based on variant
  const defaultSizes = useMemo(() => {
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
  }, [variant]);

  // Use fill mode by default for aspect ratio containers
  const useFill = fill !== undefined ? fill : !width && !height;

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ aspectRatio }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill={useFill}
        width={!useFill ? width : undefined}
        height={!useFill ? height : undefined}
        sizes={sizes || defaultSizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={() => setLoaded(true)}
        onError={() => {
          console.warn(`[CDNImage] Failed to load: ${imageSrc}`);
          setError(true);
        }}
        className={`
          object-cover transition-opacity duration-300
          ${loaded ? 'opacity-100' : 'opacity-0'}
          ${props.className || ''}
        `}
        {...props}
      />
      
      {/* Loading skeleton */}
      {!loaded && !error && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}
    </div>
  );
}

// ============================================
// SPECIALIZED COMPONENTS
// ============================================

/**
 * Product Thumbnail Image
 * Optimized for product cards and grids
 */
export function ProductThumbnail({
  src,
  alt,
  ...props
}: Omit<CDNImageProps, 'variant'>) {
  return (
    <CDNImage
      src={src}
      alt={alt}
      variant="thumbnail"
      aspectRatio="1/1"
      {...props}
    />
  );
}

/**
 * Product Listing Image
 * For product detail page gallery thumbnails
 */
export function ProductListingImage({
  src,
  alt,
  ...props
}: Omit<CDNImageProps, 'variant'>) {
  return (
    <CDNImage
      src={src}
      alt={alt}
      variant="listing"
      aspectRatio="1/1"
      {...props}
    />
  );
}

/**
 * Product Hero Image
 * For main product display
 */
export function ProductHeroImage({
  src,
  alt,
  ...props
}: Omit<CDNImageProps, 'variant' | 'priority'>) {
  return (
    <CDNImage
      src={src}
      alt={alt}
      variant="hero"
      aspectRatio="1/1"
      priority
      {...props}
    />
  );
}

/**
 * Product Zoom Image
 * For zoom/lightbox functionality
 */
export function ProductZoomImage({
  src,
  alt,
  ...props
}: Omit<CDNImageProps, 'variant'>) {
  return (
    <CDNImage
      src={src}
      alt={alt}
      variant="zoom"
      aspectRatio="1/1"
      {...props}
    />
  );
}

/**
 * Banner Image
 * For hero banners and promotional content
 */
export function BannerImage({
  src,
  alt,
  aspectRatio = '21/9',
  ...props
}: Omit<CDNImageProps, 'variant'>) {
  return (
    <CDNImage
      src={src}
      alt={alt}
      variant="hero"
      aspectRatio={aspectRatio}
      priority
      sizes="100vw"
      {...props}
    />
  );
}

/**
 * Collection Image
 * For collection hero and cards
 */
export function CollectionImage({
  src,
  alt,
  aspectRatio = '16/9',
  isHero = false,
  ...props
}: Omit<CDNImageProps, 'variant'> & { isHero?: boolean }) {
  return (
    <CDNImage
      src={src}
      alt={alt}
      variant={isHero ? 'hero' : 'listing'}
      aspectRatio={aspectRatio}
      priority={isHero}
      {...props}
    />
  );
}

export default CDNImage;
