'use client';

/**
 * StickyCartBar — Mobile Sticky Bottom Cart Bar
 *
 * Shows cart item count + total at bottom of screen on mobile.
 * Only visible when there are items in cart.
 * Links to cart/checkout.
 */

import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function StickyCartBar() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
        >
          <div className="bg-[#1A1A1A] border-t border-neutral-800 px-4 py-3 safe-area-bottom">
            <Link
              href="/cart"
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <span className="text-sm text-neutral-300">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-white">
                  {formatPrice(totalPrice)}
                </span>
                <span className="px-4 py-2 bg-white text-[#1A1A1A] text-sm font-semibold rounded-full">
                  View Bag
                </span>
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
