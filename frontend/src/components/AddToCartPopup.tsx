'use client';

/**
 * AddToCartPopup Component
 * 
 * Premium add-to-cart notification popup that appears near the cart icon
 * Features:
 * - Auto-closes after 3-4 seconds
 * - Smooth slide-in animation from bottom (mobile) or top-right (desktop)
 * - Product thumbnail, name, price, quantity display
 * - "View Cart" and "Continue Shopping" buttons
 * - No page reflow or blocking
 * - Responsive design
 * 
 * Usage:
 *   <AddToCartPopup /> - Place in layout.tsx or app root
 */

import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AddToCartPopup() {
  const { notification, hideNotification } = useCartNotificationStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow animation to complete before clearing
        setTimeout(() => hideNotification(), 300);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => hideNotification(), 300);
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 0 }}
          animate={isVisible ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 20, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:max-w-sm z-[999] pointer-events-auto"
        >
          <div className="bg-white rounded-lg shadow-luxury-hover overflow-hidden border border-[#FFE4EC]">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#FFE4EC]/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFD6E5] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-[#9B2C46]" />
                </div>
                <span className="font-medium text-sm text-[#1A1A1A]">Added to Cart</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-[#FFF7FA] rounded-full transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 text-[#1A1A1A]/60" />
              </button>
            </div>

            {/* Product content */}
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                {/* Product image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#FFF7FA]">
                  <Image
                    src={notification.productImage}
                    alt={notification.productName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Product details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#1A1A1A] truncate mb-2">
                    {notification.productName}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-serif font-bold text-[#9B2C46]">
                      ₹{notification.productPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1A1A]/60">
                    Qty: <span className="font-medium text-[#1A1A1A]">{notification.quantity}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Link
                  href="/cart"
                  onClick={handleClose}
                  className="block w-full text-center px-4 py-3 bg-[#9B2C46] text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                >
                  View Cart
                </Link>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-3 bg-[#FFF7FA] text-[#9B2C46] font-medium rounded-lg hover:bg-[#FFE4EC] transition-colors text-sm"
                >
                  Continue Shopping
                </button>
              </div>
            </div>

            {/* Progress bar animation */}
            {isVisible && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3.5, ease: 'linear' }}
                style={{ transformOrigin: 'left' }}
                className="h-1 bg-gradient-to-r from-[#9B2C46] to-[#FFD6E5]"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
