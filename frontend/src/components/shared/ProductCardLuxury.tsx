'use client';

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

// Product interface for flexibility
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

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  showQuickAdd?: boolean;
  showBadges?: boolean;
  priority?: boolean;
}

// Color swatches for material variants
const materialColors: Record<string, string> = {
  'gold': '#D4AF37',
  'rose-gold': '#E8B4B8',
  'silver': '#C0C0C0',
  'white-gold': '#F5F5F5',
  'platinum': '#E5E4E2',
};

export default function ProductCardLuxury({ 
  product, 
  variant = 'default',
  showQuickAdd = true,
  showBadges = true,
  priority = false,
}: ProductCardProps) {
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlist } = useWishlistStore();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hoverImage = product.images?.find((img) => !img.isPrimary);
  const isInWishlist = wishlist.some((item) => item.productId === product.id);
  const hasDiscount = (product.discountPercent ?? 0) > 0;
  const discountPercent = product.discountPercent ?? 0;

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
      
      // Reset after showing success
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setIsAddingToCart(false);
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
        image: primaryImage?.imageUrl || '/placeholder.png',
      });
    }
    
    setTimeout(() => setWishlistAnimating(false), 400);
  };

  // Aspect ratio based on variant
  const aspectClass = variant === 'compact' ? 'aspect-square' : 'aspect-[3/4]';

  return (
    <Link href={`/products/${product.slug}`}>
      <motion.article 
        className="group relative"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className={`relative ${aspectClass} overflow-hidden rounded-luxury bg-background`}>
          {/* Primary Image */}
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
          
          {/* Hover Image (if available) */}
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

          {/* Badges - Top Left */}
          {showBadges && (
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {product.isNew && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="product-badge-new"
                >
                  New In
                </motion.span>
              )}
              {product.isBestseller && !product.isNew && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="product-badge-bestseller"
                >
                  Bestseller
                </motion.span>
              )}
              {hasDiscount && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="product-badge-sale"
                >
                  {Math.round(discountPercent)}% Off
                </motion.span>
              )}
            </div>
          )}

          {/* Wishlist Button - Top Right */}
          <motion.button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-background-white/90 backdrop-blur-sm flex items-center justify-center shadow-luxury transition-all duration-300 hover:shadow-luxury-hover hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
            whileTap={{ scale: 0.9 }}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <motion.div
              animate={wishlistAnimating ? { 
                scale: [1, 1.4, 1],
                rotate: isInWishlist ? [0, -15, 15, 0] : [0, 15, -15, 0]
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

          {/* Quick Add Button - Bottom, appears on hover */}
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
                    className={`w-full py-3.5 text-xs tracking-[0.15em] uppercase font-medium rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                      addedToCart 
                        ? 'bg-success text-text-primary' 
                        : 'bg-text-primary/95 backdrop-blur-sm text-background-white hover:bg-text-primary'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check size={14} />
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

          {/* Subtle overlay gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Product Info */}
        <div className="pt-4 space-y-2">
          {/* Material Swatches (if applicable) */}
          {product.material && materialColors[product.material] && (
            <div className="flex items-center gap-1.5 mb-1">
              <span 
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: materialColors[product.material] }}
                title={product.material.replace('-', ' ')}
              />
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                {product.material.replace('-', ' ')}
              </span>
            </div>
          )}

          {/* Product Name */}
          <h3 className="font-serif text-base font-medium text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300">
            {product.name}
          </h3>

          {/* Rating - Subtle, only show if has reviews */}
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <span className="text-accent text-sm">★</span>
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

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-serif font-semibold text-text-primary">
              {formatPrice(product.finalPrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-text-muted line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs font-medium text-accent">
                  Save {formatPrice(product.price - product.finalPrice)}
                </span>
              </>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
