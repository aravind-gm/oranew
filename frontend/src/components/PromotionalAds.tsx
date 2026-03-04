'use client';

/**
 * PromotionalAds Component
 * 
 * Bottom-left sticky promotional card that rotates through REAL products.
 * Features:
 * - Only shows for LOGGED-IN users (not on login/auth pages)
 * - Fetches random products from the API
 * - Appears after 6-8 seconds
 * - Rotates every 10-12 seconds
 * - Session-based tracking (max 3 impressions per session)
 * - Close button (don't show again in session)
 * - Not shown on checkout/auth pages
 * - Mobile responsive
 * 
 * Usage:
 *   <PromotionalAds /> - Place in layout.tsx
 */

import { useAuthStore } from '@/store/authStore';
import { usePromotionalAdsStore } from '@/store/promotionalAdsStore';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface AdProduct {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  images: Array<{ imageUrl: string; isPrimary: boolean; altText: string }>;
}

export default function PromotionalAds() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthStore();
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
  const [products, setProducts] = useState<AdProduct[]>([]);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  // Pages where ads should never show
  const isHiddenPage = pathname?.includes('/checkout') || pathname?.includes('/auth') || pathname?.includes('/login');
  const isCartPage = pathname?.includes('/cart');
  const isLoggedIn = !!user && !authLoading;

  // Fetch random products from API
  const fetchRandomProducts = useCallback(async () => {
    if (fetchedOnce) return;
    try {
      // Get a page of products sorted randomly
      const randomPage = Math.floor(Math.random() * 3) + 1;
      const sorts = ['-sales', '-createdAt', 'price', '-price'];
      const randomSort = sorts[Math.floor(Math.random() * sorts.length)];
      
      const res = await api.get('/products', {
        params: { limit: 8, page: randomPage, sort: randomSort },
      });
      
      const allProds = (res.data.products || res.data.data?.products || []) as AdProduct[];
      // Shuffle
      const shuffled = allProds.sort(() => Math.random() - 0.5).slice(0, 5);
      
      if (shuffled.length > 0) {
        setProducts(shuffled);
        setFetchedOnce(true);
      }
    } catch {
      // Non-critical — fall back silently
    }
  }, [fetchedOnce]);

  // Only fetch products when user is logged in
  useEffect(() => {
    if (isLoggedIn && !fetchedOnce && !isHiddenPage) {
      fetchRandomProducts();
    }
  }, [isLoggedIn, fetchedOnce, isHiddenPage, fetchRandomProducts]);

  // Initialize ads after 6-8 seconds (only if logged in + products loaded)
  useEffect(() => {
    if (hasInitialized || !isLoggedIn || products.length === 0 || isHiddenPage) return;

    const delay = Math.random() * 2000 + 6000; // 6-8 seconds
    const timer = setTimeout(() => {
      if (shouldShowAds()) {
        setIsVisible(true);
        incrementShowCount();
        setHasInitialized(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [hasInitialized, isLoggedIn, products.length, isHiddenPage, setIsVisible, incrementShowCount, shouldShowAds]);

  // Rotate ads every 10-12 seconds
  useEffect(() => {
    if (!isVisible || closedThisSession || products.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentAdIndex((currentAdIndex + 1) % products.length);
    }, 10000 + Math.random() * 2000);

    return () => clearInterval(rotationInterval);
  }, [isVisible, closedThisSession, currentAdIndex, products.length, setCurrentAdIndex]);

  const handleClose = () => {
    setIsVisible(false);
    setClosedThisSession(true);
  };

  // Don't render if: not logged in, hidden page, closed, or no products
  const shouldShow = isLoggedIn && !isHiddenPage && !closedThisSession && shouldShowAds() && isVisible && products.length > 0;
  if (!shouldShow) return null;

  const product = products[currentAdIndex % products.length];
  if (!product) return null;
  
  const imgUrl = product.images?.find(i => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || '/oralogo.png';
  const hasDiscount = (product.discountPercent ?? 0) > 0;

  return (
    <AnimatePresence>
      <motion.div
        key={product.id}
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
          <Link href={`/products/${product.slug}`} className="block">
            <div className="relative">
              {/* Product Image */}
              <div className="relative h-40 bg-gradient-to-br from-[#FFE4EC] to-[#FFF7FA] overflow-hidden">
                <Image
                  src={imgUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="288px"
                />
              </div>

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#9B2C46] text-white rounded-full text-xs font-bold">
                  -{product.discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Text Content */}
            <div className="p-4">
              <h3 className="font-serif text-sm font-medium text-[#1A1A1A] line-clamp-2 mb-2">
                {product.name}
              </h3>
              
              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold text-[#9B2C46]">
                  ₹{Number(product.finalPrice).toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <button className="w-full py-2 px-3 bg-gradient-to-r from-[#9B2C46] to-[#C1354F] text-white rounded-lg font-medium text-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>View Product</span>
              </button>

              {/* Rotation indicator dots */}
              {products.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {products.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentAdIndex % products.length
                          ? 'w-4 bg-[#9B2C46]'
                          : 'w-1.5 bg-[#FFE4EC]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
