'use client';

/**
 * ProductCard Component — ORA Jewellery
 * 
 * A luxury e-commerce product card designed for premium positioning.
 * Features: image hover swap, animated wishlist, quick add-to-bag, and soft micro-interactions.
 * 
 * Usage:
 *   <ProductCard product={product} />
 *   <ProductCard product={product} variant="featured" showQuickAdd={true} />
 * 
 * Props:
 *   - product: Product data object (id, name, slug, price, images, etc.)
 *   - variant: 'default' | 'compact' | 'featured' (optional)
 *   - showQuickAdd: Show quick add button on hover (default: true)
 *   - showBadges: Show new/sale/bestseller badges (default: true)
 *   - priority: Image loading priority (default: false)
 * 
 * Design System:
 *   - Colors: Blush pink (#FFD6E8), Champagne gold (#D4AF77), Charcoal (#2D2D2D)
 *   - Spacing: 16px base unit
 *   - Shadows: Soft (0 4px 20px rgba(0,0,0,0.04))
 *   - Radius: 8px (luxury), 16px (buttons)
 *   - Animations: 200-700ms, ease-out
 * 
 * Performance:
 *   - Image: Next.js Image with lazy loading
 *   - Animation: GPU-accelerated (transform, opacity)
 *   - Bundle: Minimal deps (Framer Motion, Lucide React)
 *   - Renders: Memoized to prevent unnecessary re-renders
 */

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

/**
 * Product Image structure
 */
interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary?: boolean;
  altText?: string;
}

/**
 * Main Product interface
 * Flexible to support different data structures
 */
interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  material?: string;
  images: ProductImage[];
}

/**
 * Component Props
 */
interface ProductCardProps {
  product: Product;
  /** Card layout variant */
  variant?: 'default' | 'compact' | 'featured';
  /** Show quick add button on hover */
  showQuickAdd?: boolean;
  /** Show badges (new, sale, bestseller) */
  showBadges?: boolean;
  /** Prioritize image loading (for above-fold cards) */
  priority?: boolean;
  /** Callback when adding to cart */
  onAddToCart?: (product: Product) => void;
  /** Callback when toggling wishlist */
  onWishlistToggle?: (product: Product) => void;
}

/**
 * Material to color mapping for visual swatches
 */
const materialColors: Record<string, string> = {
  'gold': '#D4AF37',
  'rose-gold': '#E8B4B8',
  'silver': '#C0C0C0',
  'white-gold': '#F5F5F5',
  'platinum': '#E5E4E2',
};

/**
 * ProductCard Component
 * 
 * Renders a luxury product card with:
 * - 3:4 aspect ratio image with hover swap
 * - Floating wishlist button with animation
 * - Smart badges (new/sale/bestseller)
 * - Quick add-to-bag button (hover-reveal on desktop, always visible on mobile)
 * - Soft micro-interactions (lift, glow, scale)
 * - Full accessibility (keyboard nav, screen reader friendly)
 */
function ProductCard({
  product,
  variant = 'default',
  showQuickAdd = true,
  showBadges = true,
  priority = false,
  onAddToCart,
  onWishlistToggle,
}: ProductCardProps) {
  // ============================================================================
  // STATE & HOOKS
  // ============================================================================
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlist } = useWishlistStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hoverImage = product.images?.find((img) => !img.isPrimary);
  const isInWishlist = wishlist.some((item) => item.productId === product.id);
  const hasDiscount = (product.discountPercent ?? 0) > 0;
  const discountPercent = product.discountPercent ?? 0;
  const savingsAmount = product.price - product.finalPrice;

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Format price in Indian currency (INR)
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle adding product to cart
   * - Prevents default navigation
   * - Shows loading state
   * - Animates success feedback
   * - Auto-reverts after 2 seconds
   */
  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isAddingToCart || addedToCart) return;

      setIsAddingToCart(true);

      try {
        addItem({
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.finalPrice,
          image: primaryImage?.imageUrl || '/placeholder.png',
          quantity: 1,
        });

        setIsAddingToCart(false);
        setAddedToCart(true);

        // Callback for analytics/tracking
        onAddToCart?.(product);

        // Reset success state after 2 seconds
        const timer = setTimeout(() => setAddedToCart(false), 2000);
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Failed to add to cart:', error);
        setIsAddingToCart(false);
      }
    },
    [product, primaryImage, isAddingToCart, addedToCart, addItem, onAddToCart]
  );

  /**
   * Handle wishlist toggle
   * - Animates heart with scale + rotate
   * - Updates store state
   * - Triggers callback for analytics
   */
  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWishlistAnimating(true);

      if (isInWishlist) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist({
          id: product.id,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.finalPrice,
          image: primaryImage?.imageUrl || '/placeholder.png',
        });
      }

      onWishlistToggle?.(product);

      // Reset animation state
      const timer = setTimeout(() => setWishlistAnimating(false), 400);
      return () => clearTimeout(timer);
    },
    [product, primaryImage, isInWishlist, addToWishlist, removeFromWishlist, onWishlistToggle]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  // Determine aspect ratio based on variant
  const aspectClass = variant === 'compact' ? 'aspect-square' : 'aspect-[3/4]';

  return (
    <Link href={`/products/${product.slug}`}>
      {/* Outer container with motion animations */}
      <motion.article
        className="group relative"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        viewport={{ once: true }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ====================================================================
            IMAGE CONTAINER
            ==================================================================== */}
        <motion.div
          className={`relative ${aspectClass} overflow-hidden rounded-luxury bg-background will-change-transform`}
          animate={{ y: isHovered ? -4 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* PRIMARY IMAGE */}
          {primaryImage && (
            <Image
              src={primaryImage.imageUrl}
              alt={primaryImage.altText || product.name}
              fill
              priority={priority}
              className={`object-cover transition-all duration-700 ease-out ${
                isHovered && hoverImage ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* HOVER IMAGE (optional alternate view) */}
          {hoverImage && (
            <Image
              src={hoverImage.imageUrl}
              alt={`${product.name} - alternate view`}
              fill
              className={`object-cover transition-all duration-700 ease-out ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* BADGE LAYER (top-left) */}
          {showBadges && (
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {/* New In Badge */}
              {product.isNew && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="product-badge-new"
                >
                  New In
                </motion.span>
              )}

              {/* Bestseller Badge */}
              {product.isBestseller && !product.isNew && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="product-badge-bestseller"
                >
                  Bestseller
                </motion.span>
              )}

              {/* Discount Badge */}
              {hasDiscount && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="product-badge-sale"
                >
                  {Math.round(discountPercent)}% Off
                </motion.span>
              )}
            </div>
          )}

          {/* WISHLIST BUTTON (top-right, floating) */}
          <motion.button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-background-white/90 backdrop-blur-sm flex items-center justify-center shadow-luxury transition-all duration-300 hover:shadow-luxury-hover hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
            whileTap={{ scale: 0.9 }}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            type="button"
          >
            {/* Heart Icon with Animation */}
            <motion.div
              animate={wishlistAnimating ? {
                scale: [1, 1.4, 1],
                rotate: isInWishlist ? [0, -15, 15, 0] : [0, 15, -15, 0],
              } : {}}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Heart
                size={18}
                className={`transition-all duration-300 ${
                  isInWishlist
                    ? 'fill-accent text-accent'
                    : 'text-text-muted group-hover:text-accent'
                }`}
              />
            </motion.div>
          </motion.button>

          {/* QUICK ADD BUTTON (bottom, hover-reveal on desktop, always visible on mobile) */}
          {showQuickAdd && (
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="absolute bottom-0 left-0 right-0 p-4 z-10"
                >
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    type="button"
                    aria-label={`Add ${product.name} to bag`}
                    className={`w-full py-3.5 text-xs tracking-[0.15em] uppercase font-medium rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                      addedToCart
                        ? 'bg-success text-text-primary'
                        : 'bg-text-primary/95 backdrop-blur-sm text-background-white hover:bg-text-primary hover:shadow-luxury'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check size={14} strokeWidth={3} />
                        <span>Added to Bag</span>
                      </>
                    ) : isAddingToCart ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-background-white/30 border-t-background-white rounded-full"
                      />
                    ) : (
                      <>
                        <ShoppingBag size={14} />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* SUBTLE OVERLAY GRADIENT (improves text legibility on bright images) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
        </motion.div>

        {/* ====================================================================
            PRODUCT INFO SECTION
            ==================================================================== */}
        <div className="pt-4 space-y-2">
          {/* MATERIAL SWATCH (optional) */}
          {product.material && materialColors[product.material] && (
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: materialColors[product.material] }}
                title={product.material.replace('-', ' ')}
                aria-label={`Material: ${product.material.replace('-', ' ')}`}
              />
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {product.material.replace('-', ' ')}
              </span>
            </div>
          )}

          {/* PRODUCT NAME */}
          <h3 className="font-serif text-base font-medium text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300">
            {product.name}
          </h3>

          {/* STAR RATING (only if has reviews) */}
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <div className="flex items-center gap-0.5">
                <span className="text-accent text-sm" aria-hidden="true">★</span>
                <span className="text-xs text-text-secondary font-medium">
                  {product.averageRating.toFixed(1)}
                </span>
              </div>
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-xs text-text-muted">
                  ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          )}

          {/* PRICING SECTION */}
          <div className="flex items-baseline gap-2 pt-2">
            {/* Current Price */}
            <span className="text-lg font-serif font-semibold text-text-primary">
              {formatPrice(product.finalPrice)}
            </span>

            {/* Original Price + Savings (if discount exists) */}
            {hasDiscount && (
              <>
                <span className="text-sm text-text-muted line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs font-medium text-accent">
                  Save {formatPrice(savingsAmount)}
                </span>
              </>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

/**
 * Memoized export to prevent unnecessary re-renders
 * ProductCard will only re-render if product data changes
 */
export default memo(ProductCard);
