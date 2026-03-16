'use client';

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { normalizeImageUrl, isSupabaseImage } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  altText: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  videoUrl?: string;
  discountPercent: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  images: ProductImage[];
  stockQuantity?: number;
  lowStockThreshold?: number;
}

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
}

export default function ProductCard({ product, showQuickAdd = true }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlist } = useWishlistStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hoverImage = product.images?.find((img) => !img.isPrimary) || primaryImage;
  const hasVideo = Boolean(product.videoUrl && product.videoUrl.trim());
  const isInWishlist = wishlist.some((item) => item.productId === product.id);
  const hasDiscount = product.discountPercent > 0;

  // Format price in Indian currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setTimeout(() => setIsAddingToCart(false), 600);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
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
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <motion.div 
        className="group relative"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-luxury bg-background">
          {/* Primary Image */}
          {!hasVideo && primaryImage && (
            <Image
              src={normalizeImageUrl(primaryImage.imageUrl) || '/oralogo.png'}
              alt={primaryImage.altText || product.name}
              fill
              unoptimized={isSupabaseImage(primaryImage.imageUrl)}
              className={`object-cover transition-all duration-700 ${
                isHovered && hoverImage !== primaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          
          {/* Hover Image */}
          {!hasVideo && hoverImage && hoverImage !== primaryImage && (
            <Image
              src={normalizeImageUrl(hoverImage.imageUrl) || '/oralogo.png'}
              alt={`${product.name} alternate view`}
              fill
              unoptimized={isSupabaseImage(hoverImage.imageUrl)}
              className={`object-cover transition-all duration-700 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* Product Video */}
          {hasVideo && (
            <video
              src={product.videoUrl}
              poster={primaryImage ? normalizeImageUrl(primaryImage.imageUrl) || '/oralogo.png' : '/oralogo.png'}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          )}

          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.isNew && (
              <span className="px-3 py-1 text-[10px] tracking-[0.15em] uppercase font-medium bg-background-white/90 backdrop-blur-sm text-text-primary rounded-full">
                New
              </span>
            )}
            {hasDiscount && (
              <span className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase font-medium bg-accent/90 backdrop-blur-sm text-text-primary rounded-full">
                {Math.round(product.discountPercent)}% Off
              </span>
            )}
            {product.stockQuantity !== undefined &&
              product.stockQuantity > 0 &&
              product.stockQuantity <= (product.lowStockThreshold ?? 5) && (
              <span className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase font-medium bg-amber-500/90 backdrop-blur-sm text-white rounded-full">
                Only {product.stockQuantity} left
              </span>
            )}
          </div>

          {/* Wishlist Button - Top Right */}
          <motion.button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-background-white/90 backdrop-blur-sm flex items-center justify-center shadow-luxury transition-all duration-300 hover:shadow-luxury-hover hover:scale-105"
            whileTap={{ scale: 0.9 }}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <motion.div
              animate={wishlistAnimating ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Heart
                size={18}
                className={`transition-colors duration-300 ${
                  isInWishlist 
                    ? 'fill-accent text-accent' 
                    : 'text-text-muted hover:text-accent'
                }`}
              />
            </motion.div>
          </motion.button>

          {/* Quick Add Button - Desktop hover reveal only */}
          {showQuickAdd && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0, 
                y: isHovered ? 0 : 20 
              }}
              transition={{ duration: 0.3 }}
              className="hidden sm:block absolute bottom-0 left-0 right-0 p-4 z-10"
            >
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="w-full py-3 bg-text-primary/90 backdrop-blur-sm text-background-white text-xs tracking-[0.15em] uppercase font-medium rounded-full transition-all duration-300 hover:bg-text-primary disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={14} />
                <span>{isAddingToCart ? 'Adding...' : 'Add to Bag'}</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* Mobile Add to Cart — Below image */}
        {showQuickAdd && (
          <div className="sm:hidden mt-2">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full py-2.5 text-[11px] tracking-[0.08em] uppercase font-semibold rounded-lg border border-neutral-200 bg-white text-neutral-800 transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-[0.98] active:bg-neutral-50 disabled:opacity-70"
            >
              <ShoppingBag size={13} />
              <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </button>
          </div>
        )}

        {/* Product Info */}
        <div className="pt-4 space-y-2">
          {/* Rating - Subtle */}
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < Math.round(product.averageRating!) 
                        ? 'fill-accent text-accent' 
                        : 'text-border'
                    }
                  />
                ))}
              </div>
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-xs text-text-muted">({product.reviewCount})</span>
              )}
            </div>
          )}

          {/* Product Name */}
          <h3 className="font-sans text-sm sm:text-base font-medium text-text-primary line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-300">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-sans font-bold text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice(product.finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-text-muted line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
