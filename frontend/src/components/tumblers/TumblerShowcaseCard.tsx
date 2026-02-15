'use client';

/**
 * TumblerShowcaseCard — Full-width product showcase section
 * ==========================================================
 * Each of the 3 tumblers gets a cinematic half-and-half section:
 *  Left:  Large lifestyle image (alternates sides on even index)
 *  Right: Product info, USPs, price, Add-to-Cart CTA
 *
 * Marketing psychology:
 *  → Image-first (lifestyle aspiration)
 *  → USP bullets with icons (value justification)
 *  → "Most Popular" / "Best Value" / "Premium" tier badges
 *  → "Add to Bag" primary CTA + "View Details" secondary
 *  → Scarcity indicator ("Only X left")
 *  → Social proof micro-stat ("2,400+ sold")
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Star, Check, Truck, Shield, Droplets, ThermometerSun, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

// ============================================
// TUMBLER DATA — The single source of truth
// ============================================

export interface TumblerTier {
  id: string;
  productId: string;
  slug: string;
  tier: 'essential' | 'popular' | 'premium';
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  hoverImage?: string;
  badge: string;
  badgeColor: string;
  usps: { icon: React.ReactNode; text: string }[];
  capacity: string;
  rating: number | null;
  reviewCount: number | null;
  soldCount: string | null;
  stockLeft: number | null; // null = plenty in stock
  color: string; // accent color for this tier
}

// Default USPs if none provided
const DEFAULT_USPS = [
  { icon: <Droplets size={16} />, text: 'Leak-proof lid' },
  { icon: <ThermometerSun size={16} />, text: 'Double-wall insulated' },
  { icon: <Shield size={16} />, text: 'BPA-free materials' },
  { icon: <Truck size={16} />, text: 'Free shipping' },
];

// ============================================
// COMPONENT
// ============================================

interface Props {
  tumbler: TumblerTier;
  index: number; // 0, 1, 2 — used for alternating layout
}

export default function TumblerShowcaseCard({ tumbler, index }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();
  const [isAdding, setIsAdding] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const wishlisted = isInWishlist(tumbler.productId);
  const discountPercent = Math.round(((tumbler.originalPrice - tumbler.price) / tumbler.originalPrice) * 100);
  const isReversed = index % 2 === 1;
  const usps = tumbler.usps.length > 0 ? tumbler.usps : DEFAULT_USPS;

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      id: tumbler.id,
      productId: tumbler.productId,
      name: tumbler.name,
      image: tumbler.image,
      price: tumbler.price,
      quantity: 1,
    });
    setTimeout(() => setIsAdding(false), 1200);
  };

  const handleWishlist = () => {
    if (wishlisted) {
      removeWishlist(tumbler.productId);
    } else {
      addWishlist({
        id: tumbler.id,
        productId: tumbler.productId,
        slug: tumbler.slug,
        name: tumbler.name,
        image: tumbler.image,
        price: tumbler.price,
      });
    }
  };

  // Background color per tier
  const sectionBg = tumbler.tier === 'popular' ? '#FDFBF7' : '#FFFFFF';

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: sectionBg }}
    >
      {/* Popular tier gets a subtle top/bottom border */}
      {tumbler.tier === 'popular' && (
        <>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E91E63]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E91E63]/30 to-transparent" />
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isReversed ? 'lg:direction-rtl' : ''}`}>
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className={`relative group ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}
            style={{ direction: 'ltr' }}
          >
            <div className="relative aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden bg-[#F5F5F5]">
              {/* Skeleton */}
              {!imgLoaded && (
                <div className="absolute inset-0 bg-neutral-100 animate-pulse rounded-2xl" />
              )}

              <Image
                src={tumbler.image || '/images/placeholder-tumbler.webp'}
                alt={tumbler.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover transition-transform duration-700 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                priority={index === 0}
              />

              {/* Tier badge */}
              <div
                className="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: tumbler.badgeColor,
                  color: tumbler.tier === 'premium' ? '#0F0F14' : '#FFFFFF',
                }}
              >
                {tumbler.badge}
              </div>

              {/* Wishlist */}
              <button
                onClick={handleWishlist}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Heart
                  size={18}
                  className={wishlisted ? 'fill-[#E91E63] text-[#E91E63]' : 'text-[#7A7A85]'}
                />
              </button>
            </div>
          </motion.div>

          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`${isReversed ? 'lg:order-1' : 'lg:order-2'}`}
            style={{ direction: 'ltr' }}
          >
            {/* Tier label */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: tumbler.color }}
              >
                {tumbler.tier === 'essential' ? 'Tier 1 — Essential' :
                 tumbler.tier === 'popular' ? 'Tier 2 — Special Edition' :
                 'Tier 3 — Premium'}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] leading-tight">
              {tumbler.name}
            </h2>

            <p className="mt-2 text-sm text-[#7A7A85]">{tumbler.capacity}</p>

            <p className="mt-4 text-base text-[#555555] leading-relaxed max-w-md">
              {tumbler.description}
            </p>

            {/* Rating — Only show if available */}
            {tumbler.rating && tumbler.reviewCount && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(tumbler.rating!)
                        ? 'fill-[#F59E0B] text-[#F59E0B]'
                        : 'fill-[#E5E7EB] text-[#E5E7EB]'}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#7A7A85]">
                  {tumbler.rating} ({tumbler.reviewCount} reviews)
                </span>
                {tumbler.soldCount && (
                  <>
                    <span className="text-[#E5E7EB]">|</span>
                    <span className="text-sm text-[#7A7A85]">{tumbler.soldCount} sold</span>
                  </>
                )}
              </div>
            )}

            {/* USPs */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {usps.map((usp, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#555555]">
                  <span style={{ color: tumbler.color }}>{usp.icon}</span>
                  <span>{usp.text}</span>
                </div>
              ))}
            </div>

            {/* Price block */}
            <div className="mt-8 flex items-end gap-3 flex-wrap">
              <span className="text-4xl font-bold text-[#111111]">
                ₹{tumbler.price.toLocaleString('en-IN')}
              </span>
              {tumbler.originalPrice > tumbler.price && (
                <span className="text-base text-neutral-400 line-through">
                  MRP ₹{tumbler.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Scarcity */}
            {tumbler.stockLeft !== null && tumbler.stockLeft < 20 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                <span className="text-sm font-medium text-[#B45309]">
                  Only {tumbler.stockLeft} left — selling fast!
                </span>
              </div>
            )}

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 active:scale-[0.97] ${
                  isAdding
                    ? 'bg-[#16A34A]'
                    : 'bg-[#E91E63] hover:bg-[#C2185B] hover:shadow-[0_0_24px_rgba(233,30,99,0.3)]'
                }`}
              >
                {isAdding ? (
                  <>
                    <Check size={18} />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Add to Bag
                  </>
                )}
              </button>
              <button
                onClick={() => router.push(`/products/${tumbler.slug}`)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium border border-[#E5E7EB] text-[#111111] hover:bg-[#F9FAFB] transition-all"
              >
                View Details
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Delivery estimate */}
            <div className="mt-4 flex items-center gap-2 text-xs text-[#7A7A85]">
              <Truck size={14} className="text-[#C6A85B]" />
              <span>Free delivery by {new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
