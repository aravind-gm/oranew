'use client';

/**
 * StickyCartBar — Mobile Sticky Bottom Cart Bar
 *
 * Shows cart item count + total at bottom of screen on mobile.
 * Only visible when there are items in cart.
 * Links to cart/checkout.
 * 
 * Uses CSS animation instead of framer-motion to avoid transform
 * breaking position:fixed on mobile browsers.
 */

import { useCartStore } from '@/store/cartStore';
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

  if (itemCount === 0) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden animate-slideUpBar"
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
      </div>

      <style jsx>{`
        @keyframes slideUpBar {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUpBar {
          animation: slideUpBar 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
