'use client';

/**
 * LuxuryProductCard — Premium D2C Product Card
 *
 * Redesigned for luxury minimalism:
 *  - 4:5 aspect ratio (consistent)
 *  - White background + soft shadow
 *  - Image swap on hover with 300ms fade
 *  - "Quick Add" on hover
 *  - Wishlist heart top-right
 *  - Bold product name (16-18px)
 *  - Short 1-line description (muted)
 *  - Price ₹X,XXX + striked MRP
 *  - Gold savings text (Save ₹400) — NOT red percentage badges
 *  - ⭐ 4.8 (120 reviews) under price
 *  - Add to Bag button
 *  - Bestseller / Limited Stock / Most Gifted badges (gold, small)
 *  - Skeleton loader while images load
 *  - Hover lift animation + softer shadows
 */

import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Heart, ShoppingBag, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary?: boolean;
  altText?: string;
}

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
  description?: string;
  images: ProductImage[];
}

interface LuxuryProductCardProps {
  product: Product;
  badge?: 'bestseller' | 'limited' | 'most-gifted' | null;
  limitedStock?: number | null;
  priority?: boolean;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

function LuxuryProductCard({
  product,
  badge = null,
  limitedStock = null,
  priority = false,
}: LuxuryProductCardProps) {
  const { addItem } = useCartStore();
  const { showNotification } = useCartNotificationStore();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    items: wishlist,
  } = useWishlistStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hoverImage = product.images?.find((img) => !img.isPrimary);
  const isInWishlist = wishlist.some((item) => item.productId === product.id);
  const hasDiscount = (product.discountPercent ?? 0) > 0;
  const savings = product.price - product.finalPrice;

  // Derive badge from product data if not explicitly passed
  const effectiveBadge = badge || (product.isBestseller ? 'bestseller' : null);

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
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
          image: primaryImage?.imageUrl || '/oralogo.png',
          quantity: 1,
        });
        showNotification({
          productId: product.id,
          productName: product.name,
          productImage: primaryImage?.imageUrl || '/oralogo.png',
          productPrice: product.finalPrice,
          quantity: 1,
        });
        setIsAddingToCart(false);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      } catch {
        setIsAddingToCart(false);
      }
    },
    [product, primaryImage, isAddingToCart, addedToCart, addItem, showNotification]
  );

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
          image: primaryImage?.imageUrl || '/oralogo.png',
        });
      }
      setTimeout(() => setWishlistAnimating(false), 400);
    },
    [product, primaryImage, isInWishlist, addToWishlist, removeFromWishlist]
  );

  const badgeConfig: Record<string, { label: string; bg: string; text: string }> = {
    bestseller: { label: 'Bestseller', bg: 'bg-secondary-500/90', text: 'text-white' },
    'limited': { label: 'Limited Stock', bg: 'bg-secondary-500/90', text: 'text-white' },
    'most-gifted': { label: 'Most Gifted', bg: 'bg-secondary-500/90', text: 'text-white' },
  };

  return (
    <Link href={`/products/${product.slug}`} className="block">
      <motion.article
        className="group relative transition-transform duration-300 hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ============ IMAGE CONTAINER ============ */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white shadow-card-premium transition-shadow duration-300 group-hover:shadow-card-premium-hover">
          {/* Skeleton loader */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-neutral-100 animate-pulse rounded-xl" />
          )}

          {/* Primary Image */}
          {primaryImage && (
            <Image
              src={primaryImage.imageUrl}
              alt={primaryImage.altText || product.name}
              fill
              priority={priority}
              className={`object-cover transition-opacity duration-300 ease-in-out ${
                isHovered && hoverImage ? 'opacity-0' : 'opacity-100'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onLoad={() => setImgLoaded(true)}
            />
          )}

          {/* Hover Image (model shot swap) */}
          {hoverImage && (
            <Image
              src={hoverImage.imageUrl}
              alt={`${product.name} — alternate`}
              fill
              className={`object-cover transition-opacity duration-300 ease-in-out ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* Badge — small gold, top-left */}
          {effectiveBadge && badgeConfig[effectiveBadge] && (
            <span
              className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] tracking-[0.08em] uppercase font-semibold rounded-full ${badgeConfig[effectiveBadge].bg} ${badgeConfig[effectiveBadge].text} backdrop-blur-sm`}
            >
              {badgeConfig[effectiveBadge].label}
            </span>
          )}

          {/* Wishlist Heart — top-right */}
          <motion.button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-luxury transition-all duration-300 hover:scale-110"
            whileTap={{ scale: 0.85 }}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            type="button"
          >
            <motion.div
              animate={
                wishlistAnimating
                  ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] }
                  : {}
              }
              transition={{ duration: 0.4 }}
            >
              <Heart
                size={16}
                className={`sm:w-[18px] sm:h-[18px] transition-colors duration-300 ${
                  isInWishlist
                    ? 'fill-primary-500 text-primary-500'
                    : 'text-neutral-400 group-hover:text-primary-400'
                }`}
              />
            </motion.div>
          </motion.button>

          {/* Quick Add — desktop hover-reveal only (mobile button is below image) */}
          <>
            {/* Desktop: hover reveal */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="hidden sm:block absolute bottom-0 left-0 right-0 p-3 z-10"
                >
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    type="button"
                    className={`w-full py-3 text-xs tracking-[0.12em] uppercase font-medium rounded-full flex items-center justify-center gap-2 transition-all duration-300 ${
                      addedToCart
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#1A1A1A]/95 backdrop-blur-sm text-white hover:bg-[#1A1A1A]'
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
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <ShoppingBag size={14} />
                        <span>Quick Add</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        </div>

        {/* ============ MOBILE ADD TO CART — Below image ============ */}
        <div className="sm:hidden mt-2">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            type="button"
            className={`w-full py-2.5 text-[11px] tracking-[0.08em] uppercase font-semibold rounded-lg border transition-all duration-300 flex items-center justify-center gap-1.5 ${
              addedToCart
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-neutral-800 border-neutral-200 active:scale-[0.98] active:bg-neutral-50'
            }`}
          >
            {addedToCart ? (
              <><Check size={13} strokeWidth={3} /><span>Added</span></>
            ) : isAddingToCart ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-neutral-800 rounded-full"
              />
            ) : (
              <><ShoppingBag size={13} /><span>Add to Cart</span></>
            )}
          </button>
        </div>

        {/* ============ PRODUCT INFO ============ */}
        <div className="pt-4 space-y-1.5">
          {/* Product Name — bold, 16-18px */}
          <h3 className="font-sans text-[15px] sm:text-base font-semibold text-[#1A1A1A] leading-snug line-clamp-1 group-hover:text-secondary-600 transition-colors duration-300">
            {product.name}
          </h3>

          {/* Short description — muted, 1 line */}
          {product.material && (
            <p className="text-xs sm:text-[13px] text-neutral-400 line-clamp-1 capitalize">
              {product.material.replace('-', ' ')} finish
            </p>
          )}

          {/* Price Block */}
          <div className="flex flex-wrap items-baseline gap-2 pt-1">
            <span className="text-base sm:text-lg font-semibold text-[#1A1A1A]">
              {formatPrice(product.finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-neutral-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            {/* Gold savings — NOT red percentage */}
            {hasDiscount && savings > 0 && (
              <span className="text-xs sm:text-[13px] font-semibold text-secondary-500">
                Save {formatPrice(savings)}
              </span>
            )}
          </div>

          {/* Star Rating */}
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <Star size={13} className="fill-secondary-500 text-secondary-500" />
              <span className="text-xs font-medium text-[#1A1A1A]">
                {product.averageRating.toFixed(1)}
              </span>
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-xs text-neutral-400">
                  ({product.reviewCount} reviews)
                </span>
              )}
            </div>
          )}

          {/* Limited stock urgency */}
          {limitedStock !== null && limitedStock > 0 && limitedStock <= 10 && (
            <p className="text-[11px] font-medium text-primary-500 pt-0.5">
              Only {limitedStock} left
            </p>
          )}
        </div>

      </motion.article>
    </Link>
  );
}

export default memo(LuxuryProductCard);
