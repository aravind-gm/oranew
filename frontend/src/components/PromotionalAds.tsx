'use client';

/**
 * PromotionalAds Component
 * 
 * Bottom-left sticky promotional card that rotates through products
 * Features:
 * - Appears after 6-8 seconds
 * - Rotates every 10-12 seconds
 * - Session-based tracking (max 2-3 times per session)
 * - Close button (don't show again in session)
 * - Not shown on checkout page
 * - Mobile responsive
 * 
 * Usage:
 *   <PromotionalAds /> - Place in layout.tsx
 */

import { usePromotionalAdsStore } from '@/store/promotionalAdsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const PROMOTIONAL_ADS = [
  {
    id: 'valentine-gift-1',
    type: 'valentine' as const,
    productName: 'Valentine Gift Combo',
    productImage: '/banners.png',
    discount: 20,
    ctaText: 'Explore',
    badge: '💕 Limited',
    href: '/valentine-drinkware',
  },
  {
    id: 'bestseller-1',
    type: 'bestseller' as const,
    productName: 'Bestseller Necklace',
    productImage: '/necklace.png',
    ctaText: 'View',
    badge: '⭐ Popular',
    href: '/collections?sort=-sales',
  },
  {
    id: 'combo-1',
    type: 'combo' as const,
    productName: 'Perfect Combo Set',
    productImage: '/rings.png',
    discount: 15,
    ctaText: 'Shop',
    badge: '🎁 Combo',
    href: '/collections?type=combo',
  },
  {
    id: 'stock-alert-1',
    type: 'stock-alert' as const,
    productName: 'Limited Stock Offer',
    productImage: '/bracelet.png',
    discount: 25,
    ctaText: 'Grab Now',
    badge: '⚡ Trending',
    href: '/collections',
  },
];

export default function PromotionalAds() {
  const pathname = usePathname();
  const {
    currentAdIndex,
    isVisible,
    closedThisSession,
    setCurrentAdIndex,
    setIsVisible,
    setClosedThisSession,
    incrementShowCount,
    shouldShowAds,
  } = usePromotionalAdsStore();

  const [hasInitialized, setHasInitialized] = useState(false);

  // Determine if we should show ads based on current page
  const isCheckoutPage = pathname?.includes('/checkout');
  const isCartPage = pathname?.includes('/cart');
  const shouldShow = shouldShowAds() && !isCheckoutPage && !closedThisSession;
  const currentAd = PROMOTIONAL_ADS[currentAdIndex % PROMOTIONAL_ADS.length];

  // Initialize ads after 6-8 seconds
  useEffect(() => {
    if (hasInitialized) return;

    const delay = Math.random() * 2000 + 6000; // 6-8 seconds
    const timer = setTimeout(() => {
      if (shouldShowAds()) {
        setIsVisible(true);
        incrementShowCount();
        setHasInitialized(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [hasInitialized, setIsVisible, incrementShowCount, shouldShowAds]);

  // Rotate ads every 10-12 seconds
  useEffect(() => {
    if (!isVisible || !shouldShow || closedThisSession) return;

    const rotationInterval = setInterval(() => {
      setCurrentAdIndex((currentAdIndex + 1) % PROMOTIONAL_ADS.length);
    }, 10000 + Math.random() * 2000); // 10-12 seconds

    return () => clearInterval(rotationInterval);
  }, [isVisible, shouldShow, closedThisSession, currentAdIndex, setCurrentAdIndex]);

  const handleClose = () => {
    setIsVisible(false);
    setClosedThisSession(true);
  };

  if (!shouldShow || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -50, y: 50 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -50, y: 50 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed left-4 z-40 pointer-events-auto ${
          isCartPage ? 'bottom-32 md:bottom-24' : 'bottom-6 md:bottom-8'
        }`}
      >
        <div className="w-64 md:w-72 bg-white rounded-xl shadow-lg border border-[#FFE4EC] overflow-hidden hover:shadow-xl transition-shadow duration-300">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-50 p-1.5 hover:bg-[#FFF7FA] rounded-full transition-colors"
            aria-label="Close promotional ad"
          >
            <X className="w-4 h-4 text-[#1A1A1A]/60" />
          </button>

          {/* Ad Content */}
          <Link href={currentAd.href} className="block">
            <div className="relative">
              {/* Product Image */}
              <div className="relative h-40 bg-gradient-to-br from-[#FFE4EC] to-[#FFF7FA] overflow-hidden">
                <Image
                  src={currentAd.productImage}
                  alt={currentAd.productName}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/10" />
              </div>

              {/* Badge */}
              {currentAd.badge && (
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-[#9B2C46]">
                  {currentAd.badge}
                </div>
              )}

              {/* Discount Badge */}
              {currentAd.discount && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-[#9B2C46] text-white rounded-lg text-xs font-bold">
                  -{currentAd.discount}%
                </div>
              )}
            </div>

            {/* Text Content */}
            <div className="p-4">
              <h3 className="font-serif text-sm font-medium text-[#1A1A1A] line-clamp-2 mb-3">
                {currentAd.productName}
              </h3>

              {/* CTA Button */}
              <button className="w-full py-2 px-3 bg-gradient-to-r from-[#9B2C46] to-[#C1354F] text-white rounded-lg font-medium text-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{currentAd.ctaText}</span>
              </button>

              {/* Ad indicator dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {PROMOTIONAL_ADS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentAdIndex
                        ? 'w-4 bg-[#9B2C46]'
                        : 'w-1.5 bg-[#FFE4EC]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
