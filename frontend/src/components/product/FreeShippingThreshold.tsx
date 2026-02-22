'use client';

/**
 * Free Shipping Threshold Bar — AOV Booster
 * ============================================
 * Shows progress toward free-gift / shipping threshold.
 * "Add ₹X more to unlock a free gift!"
 * Renders inline on the product page, just above or below the CTA.
 *
 * Design: subtle progress bar, emerald when complete.
 */

import { useCartStore } from '@/store/cartStore';
import { Gift, Truck } from 'lucide-react';

const FREE_GIFT_THRESHOLD = 1500; // ₹1,500

export default function FreeShippingThreshold() {
  const { getTotal, items } = useCartStore();
  const cartTotal = getTotal();

  // Don't show if cart is empty
  if (items.length === 0) return null;

  const remaining = FREE_GIFT_THRESHOLD - cartTotal;
  const progress = Math.min((cartTotal / FREE_GIFT_THRESHOLD) * 100, 100);
  const isUnlocked = remaining <= 0;

  return (
    <div
      className={`rounded-xl p-3.5 border transition-colors ${
        isUnlocked
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50/60 border-amber-200/60'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        {isUnlocked ? (
          <>
            <Gift className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              🎉 You&apos;ve unlocked a free gift!
            </p>
          </>
        ) : (
          <>
            <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Add <span className="font-semibold">₹{Math.ceil(remaining).toLocaleString()}</span> more to unlock a{' '}
              <span className="font-semibold">free gift</span>
            </p>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
