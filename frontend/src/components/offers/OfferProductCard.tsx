'use client';

/**
 * OfferProductCard — Premium offer card with urgency elements
 * Features: offer badge, countdown timer, savings in gold,
 * original vs offer price, "Grab Deal" CTA
 * ORA Design System
 */

import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Heart, ShoppingBag, Star, Truck, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useState, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';

interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary?: boolean;
  altText?: string;
}

interface OfferProduct {
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
  shortDescription?: string;
  stockQuantity?: number;
  images: ProductImage[];
  // Offer-specific fields
  isOnOffer?: boolean;
  offerType?: 'PERCENT' | 'BOGO' | 'FIXED';
  offerValue?: number;
  offerExpiry?: string;
  showCountdown?: boolean;
}

interface OfferProductCardProps {
  product: OfferProduct;
}

function getOfferBadge(product: OfferProduct): { text: string; color: string; bgColor: string } {
  // Always show subtle "Special Price" badge for refined positioning
  return { text: 'Special Price', color: '#E75480', bgColor: 'rgba(231, 84, 128, 0.08)' };
}

function OfferProductCard({ product }: OfferProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);
  const [imageError, setImageError] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const showNotification = useCartNotificationStore((s) => s.showNotification);
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  const isWishlisted = wishlistItems?.some((w: any) => w.productId === product.id);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hoverImage = product.images?.length > 1
    ? product.images.find((img) => !img.isPrimary) || product.images[1]
    : null;

  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const savings = hasDiscount ? Math.round(product.price - product.finalPrice) : 0;
  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;
  const badge = getOfferBadge(product);

  const handleAddToBag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOutOfStock) return;

      addItem({
        id: `cart-${product.id}`,
        productId: product.id,
        name: product.name,
        image: primaryImage?.imageUrl || '',
        price: product.finalPrice,
        quantity: 1,
        stockQuantity: product.stockQuantity,
      });

      showNotification?.({
        productId: product.id,
        productName: product.name,
        productImage: primaryImage?.imageUrl || '',
        productPrice: product.finalPrice,
        quantity: 1,
      });

      setAddedToBag(true);
      setTimeout(() => setAddedToBag(false), 2000);
    },
    [product, addItem, showNotification, primaryImage, isOutOfStock]
  );

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isWishlisted) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist({
          id: product.id,
          productId: product.id,
          slug: product.slug || product.id,
          name: product.name,
          image: primaryImage?.imageUrl || '',
          price: product.finalPrice,
        });
      }
    },
    [product, isWishlisted, addToWishlist, removeFromWishlist, primaryImage]
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <motion.div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div
          className="relative aspect-square overflow-hidden rounded-lg mb-3"
          style={{ backgroundColor: '#FAFAFA' }}
        >
          {/* Refined Badge - top right for subtlety */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className="px-2.5 py-1 text-[10px] font-medium tracking-wide rounded-full shadow-sm backdrop-blur-sm border"
                style={{
                  backgroundColor: badge.bgColor,
                  color: badge.color,
                  borderColor: 'rgba(231, 84, 128, 0.15)',
                }}
              >
                {badge.text}
              </span>
            </div>
          )}

          {/* Wishlist Heart */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-105"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={16}
              className={isWishlisted ? 'text-[#E75480]' : 'text-gray-400'}
              fill={isWishlisted ? '#E75480' : 'none'}
            />
          </button>

          {/* Product Image with hover zoom */}
          {primaryImage && !imageError ? (
            <div className="w-full h-full relative">
              <Image
                src={primaryImage.imageUrl}
                alt={primaryImage.altText || product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-contain transition-transform duration-500 ease-out"
                style={{
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                }}
                onError={() => setImageError(true)}
              />
              {hoverImage && (
                <Image
                  src={hoverImage.imageUrl}
                  alt={`${product.name} alternate`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain absolute inset-0 transition-opacity duration-500"
                  style={{ opacity: isHovered ? 1 : 0 }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <span className="text-gray-300 text-sm">No image</span>
            </div>
          )}

          {/* Quick Add on hover */}
          <AnimatePresence>
            {isHovered && !isOutOfStock && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-3 left-3 right-3 z-10"
              >
                <button
                  onClick={handleAddToBag}
                  className="w-full py-2.5 text-xs font-semibold tracking-wider uppercase text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                  style={{ backgroundColor: '#E75480' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C2185B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E75480')}
                >
                  {addedToBag ? (
                    <>
                      <Check size={14} />
                      Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} />
                      Quick Add
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <span className="text-sm font-medium text-gray-500 bg-white/80 px-3 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3
            className="text-sm font-medium leading-tight line-clamp-1 group-hover:text-[#E91E63] transition-colors"
            style={{ color: '#111111' }}
          >
            {product.name}
          </h3>

          {product.shortDescription && (
            <p className="text-xs line-clamp-1" style={{ color: '#7A7A85' }}>
              {product.shortDescription}
            </p>
          )}

          {/* Rating */}
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={11}
                    className={star <= Math.round(product.averageRating!) ? 'text-amber-400' : 'text-gray-200'}
                    fill={star <= Math.round(product.averageRating!) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              {(product.reviewCount || 0) > 0 && (
                <span className="text-xs" style={{ color: '#7A7A85' }}>({product.reviewCount})</span>
              )}
            </div>
          )}

          {/* Price - clean and refined */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-lg font-semibold" style={{ color: '#111111' }}>
                {formatPrice(product.finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm line-through" style={{ color: '#9CA3AF' }}>
                  MRP {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1 text-[10px]" style={{ color: '#7A7A85' }}>
              <Truck size={10} />
              Free Shipping
            </span>
            <span className="text-[10px]" style={{ color: '#7A7A85' }}>
              Arrives 3–5 days
            </span>
          </div>

          {/* CTA Button - refined */}
          <button
            onClick={handleAddToBag}
            disabled={isOutOfStock}
            className="w-full py-2.5 mt-2 text-xs font-semibold tracking-wider text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md flex items-center justify-center gap-2"
            style={{ backgroundColor: '#E75480' }}
            onMouseEnter={(e) => !isOutOfStock && (e.currentTarget.style.backgroundColor = '#C2185B')}
            onMouseLeave={(e) => !isOutOfStock && (e.currentTarget.style.backgroundColor = '#E75480')}
          >
            {isOutOfStock ? 'Out of Stock' : addedToBag ? '✓ Added to Bag' : 'Add to Bag'}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(OfferProductCard);
