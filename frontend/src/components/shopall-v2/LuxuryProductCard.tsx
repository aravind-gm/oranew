'use client';

/**
 * LuxuryProductCard — Premium product card with hover image swap
 * 
 * Features:
 *   - White background product image (default)
 *   - Smooth fade to model/hover image on hover (300ms)
 *   - Slight zoom (1.05 scale) + shadow lift
 *   - Bestseller / Discount badges (top left)
 *   - Animated wishlist heart (top right)
 *   - Rating + review count
 *   - Price with strikethrough old price + discount text
 *   - Full-width "Add to Bag" button
 *   - Toast notification on add
 *   - No page reload
 */

import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Heart, ShoppingBag, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useState, useRef, useEffect } from 'react';

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
  images: ProductImage[];
}

interface LuxuryProductCardProps {
  product: Product;
  priority?: boolean;
  index?: number;
}

function LuxuryProductCard({ product, priority = false, index = 0 }: LuxuryProductCardProps) {
  const { addItem } = useCartStore();
  const { showNotification } = useCartNotificationStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlist } = useWishlistStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hoverImage = product.images?.find((img) => !img.isPrimary);
  const isInWishlist = wishlist.some((item) => item.productId === product.id);
  const hasDiscount = (product.discountPercent ?? 0) > 0;
  const discountPercent = product.discountPercent ?? 0;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

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

        setTimeout(() => setAddedToCart(false), 2500);
      } catch (error) {
        console.error('Failed to add to cart:', error);
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

  return (
    <div ref={cardRef}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
      >
        <Link href={`/products/${product.slug}`} className="block">
          <article
            className="group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* ===== IMAGE CONTAINER ===== */}
            <div className={`
              relative aspect-[3/4] overflow-hidden bg-[#F8F8F8] rounded-xl
              transition-all duration-500 ease-out will-change-transform
              ${isHovered ? 'shadow-[0_16px_48px_rgba(0,0,0,0.12)]' : 'shadow-[0_2px_8px_rgba(0,0,0,0.04)]'}
            `}>
              {/* Primary Image */}
              {primaryImage && (
                <Image
                  src={primaryImage.imageUrl}
                  alt={primaryImage.altText || product.name}
                  fill
                  priority={priority}
                  onLoad={() => setImageLoaded(true)}
                  className={`
                    object-cover transition-all duration-500 ease-out
                    ${isHovered && hoverImage ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}
                    ${imageLoaded ? '' : 'blur-sm'}
                  `}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}

              {/* Hover Image (Model Photo) */}
              {hoverImage && (
                <Image
                  src={hoverImage.imageUrl}
                  alt={`${product.name} - worn view`}
                  fill
                  className={`
                    object-cover transition-all duration-500 ease-out
                    ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.05]'}
                  `}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}

              {/* Skeleton loader */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-50 animate-pulse" />
              )}

              {/* ===== BADGES (Top Left) ===== */}
              <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1.5 z-10">
                {product.isBestseller && (
                  <motion.span
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="px-2.5 py-1 text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-semibold bg-[#C2185B] text-white rounded-md shadow-sm"
                  >
                    Bestseller
                  </motion.span>
                )}
                {product.isNew && !product.isBestseller && (
                  <motion.span
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="px-2.5 py-1 text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-semibold bg-[#1A1A1A] text-white rounded-md shadow-sm"
                  >
                    New
                  </motion.span>
                )}
                {hasDiscount && (
                  <motion.span
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="px-2.5 py-1 text-[9px] sm:text-[10px] tracking-[0.08em] uppercase font-semibold bg-[#E53935] text-white rounded-md shadow-sm"
                  >
                    {Math.round(discountPercent)}% Off
                  </motion.span>
                )}
              </div>

              {/* ===== WISHLIST HEART (Top Right) ===== */}
              <motion.button
                onClick={handleWishlistToggle}
                className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110 focus:outline-none min-h-0"
                whileTap={{ scale: 0.85 }}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                type="button"
              >
                <motion.div
                  animate={wishlistAnimating ? {
                    scale: [1, 1.4, 1],
                    rotate: isInWishlist ? [0, -15, 15, 0] : [0, 15, -15, 0],
                  } : {}}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <Heart
                    size={16}
                    className={`sm:w-[17px] sm:h-[17px] transition-all duration-300 ${
                      isInWishlist
                        ? 'fill-[#E53935] text-[#E53935]'
                        : 'text-neutral-400 group-hover:text-[#E53935]/60'
                    }`}
                  />
                </motion.div>
              </motion.button>

              {/* ===== ADD TO BAG — Desktop (hover reveal) ===== */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="hidden sm:block absolute bottom-0 left-0 right-0 p-3.5 z-10"
                  >
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      type="button"
                      className={`
                        w-full py-3.5 text-[11px] tracking-[0.18em] uppercase font-semibold rounded-lg
                        transition-all duration-300 flex items-center justify-center gap-2
                        ${addedToCart
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37] hover:shadow-xl'
                        }
                      `}
                    >
                      {addedToCart ? (
                        <><Check size={14} strokeWidth={3} /><span>Added to Cart</span></>
                      ) : isAddingToCart ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <><ShoppingBag size={14} /><span>Add to Cart</span></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover border glow */}
              <div className={`
                absolute inset-0 rounded-xl pointer-events-none transition-all duration-500
                ${isHovered ? 'ring-1 ring-[#D4AF37]/20' : 'ring-0 ring-transparent'}
              `} />
            </div>

            {/* ===== MOBILE ADD TO CART — Below image, not overlaying ===== */}
            <div className="sm:hidden mt-2">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                type="button"
                className={`
                  w-full py-2.5 text-[11px] tracking-[0.08em] uppercase font-semibold rounded-lg border
                  transition-all duration-300 flex items-center justify-center gap-1.5
                  ${addedToCart
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-neutral-800 border-neutral-200 active:scale-[0.98] active:bg-neutral-50'
                  }
                `}
              >
                {addedToCart ? (
                  <><Check size={13} strokeWidth={3} /><span>Added!</span></>
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

            {/* ===== PRODUCT INFO ===== */}
            <div className="pt-3.5 sm:pt-4 space-y-1.5">
              {/* Product Name */}
              <h3 
                className="text-[13px] sm:text-sm font-medium text-[#1A1A1A] leading-snug line-clamp-2 group-hover:text-[#9B2C46] transition-colors duration-300"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {product.name}
              </h3>

              {/* Rating + Reviews */}
              {product.averageRating !== undefined && product.averageRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-[#FFF8E1] px-1.5 py-0.5 rounded">
                    <span className="text-[11px] font-semibold text-[#1A1A1A]">
                      {product.averageRating.toFixed(1)}
                    </span>
                    <Star size={10} className="fill-[#D4AF37] text-[#D4AF37]" />
                  </div>
                  {product.reviewCount && product.reviewCount > 0 && (
                    <span className="text-[11px] text-neutral-400">
                      | {product.reviewCount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              )}

              {/* Price Block */}
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 pt-0.5">
                <span 
                  className="text-[15px] sm:text-base font-bold text-[#1A1A1A]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {formatPrice(product.finalPrice)}
                </span>

                {hasDiscount && (
                  <>
                    <span className="text-[11px] sm:text-xs text-neutral-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  </>
                )}
              </div>

              {/* Discount Text */}
              {hasDiscount && (
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#C2185B] tracking-wide uppercase">
                  EXTRA {Math.round(discountPercent)}% OFF with coupon
                </p>
              )}
            </div>
          </article>
        </Link>
      </motion.div>
    </div>
  );
}

export default memo(LuxuryProductCard);
