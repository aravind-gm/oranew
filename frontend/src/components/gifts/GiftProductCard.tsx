'use client';

/**
 * GiftProductCard - Enhanced product card with emotional hooks
 * Better than default cards: ratings, savings, gift wrap badge, hover effects
 */

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Gift, Star } from 'lucide-react';
import { useState } from 'react';

export interface GiftProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  stockCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  giftWrapAvailable?: boolean;
  trendingTag?: string; // e.g., "Trending for Valentine's"
}

interface GiftProductCardProps {
  product: GiftProduct;
  onAddToCart?: (productId: string) => void;
  onWishlistToggle?: (productId: string) => void;
}

export default function GiftProductCard({ 
  product, 
  onAddToCart,
  onWishlistToggle 
}: GiftProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const discount = product.originalPrice - product.price;
  const discountPercent = Math.round((discount / product.originalPrice) * 100);

  // Fallback image if no images provided
  const PLACEHOLDER_IMAGE = '/images/placeholder-product.svg';
  const productImages = product.images?.length > 0 ? product.images : [PLACEHOLDER_IMAGE];
  const currentImageSrc = productImages[currentImage] || productImages[0] || PLACEHOLDER_IMAGE;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
    onWishlistToggle?.(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(product.id);
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#ECECF2] hover:border-[#E91E63]">
      
      {/* Image Container */}
      <Link 
        href={`/products/${product.slug}`}
        className="block relative aspect-square overflow-hidden bg-gray-50"
        onMouseEnter={() => productImages[1] && setCurrentImage(1)}
        onMouseLeave={() => setCurrentImage(0)}
      >
        {/* Main Product Image */}
        {currentImageSrc && (
          <Image
            src={currentImageSrc}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-300"
          />
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {/* Discount Badge */}
          {discountPercent > 0 && (
            <span className="px-3 py-1 bg-[#F6E9EE] text-[#C6A85B] text-xs font-bold rounded-full">
              {discountPercent}% OFF
            </span>
          )}
          
          {/* New/Bestseller Badge */}
          {product.isNew && (
            <span className="px-3 py-1 bg-[#111111] text-white text-xs font-medium rounded-full">
              NEW
            </span>
          )}
          {product.isBestseller && (
            <span className="px-3 py-1 bg-[#E91E63] text-white text-xs font-medium rounded-full">
              BESTSELLER
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-all duration-300 group/wishlist"
        >
          <Heart 
            className={`w-5 h-5 transition-all duration-300 ${
              isWishlisted 
                ? 'fill-[#E91E63] text-[#E91E63]' 
                : 'text-[#7A7A85] group-hover/wishlist:text-[#E91E63]'
            }`}
          />
        </button>

        {/* Low Stock Warning */}
        {product.stockCount && product.stockCount <= 8 && (
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="px-3 py-1.5 bg-[#111111]/90 text-white text-xs font-medium rounded-full text-center">
              ⚡ Only {product.stockCount} left in stock
            </div>
          </div>
        )}

        {/* Trending Tag */}
        {product.trendingTag && (
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="px-3 py-1.5 bg-white/95 text-[#E91E63] text-xs font-medium rounded-full text-center">
              🔥 {product.trendingTag}
            </div>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        
        {/* Product Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base font-semibold text-[#111111] group-hover:text-[#E91E63] transition-colors line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating & Reviews */}
        {product.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-[#C6A85B] text-[#C6A85B]" />
              <span className="text-sm font-medium text-[#111111] ml-1">
                {product.rating}
              </span>
            </div>
            <span className="text-xs text-[#7A7A85]">
              ({product.reviewCount} reviews)
            </span>
          </div>
        )}

        {/* Gold Divider */}
        <div className="w-full h-[1px] bg-[#C6A85B]/30"></div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#111111]">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-[#7A7A85] line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {discount > 0 && (
            <p className="text-xs text-[#C6A85B] font-medium">
              You save ₹{discount.toLocaleString()}
            </p>
          )}
        </div>

        {/* Gift Wrap Badge */}
        {product.giftWrapAvailable && (
          <div className="flex items-center gap-1.5 text-xs text-[#7A7A85]">
            <Gift className="w-4 h-4 text-[#E91E63]" />
            <span>Gift Wrap Available</span>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full py-2.5 bg-[#E91E63] text-white font-medium rounded-full hover:bg-[#C2185B] transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Bag
        </button>
      </div>
    </div>
  );
}
