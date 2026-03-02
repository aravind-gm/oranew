'use client';

/**
 * Free Gift Threshold Bar — AOV Booster
 * ========================================
 * Shows progress toward free-gift threshold (₹1,299).
 * Soft pink ORA branding. When unlocked, shows optional gift picker.
 */

import { useCartStore } from '@/store/cartStore';
import { Gift, Sparkles } from 'lucide-react';
import { useState } from 'react';

const FREE_GIFT_THRESHOLD = 1299; // ₹1,299

const GIFT_OPTIONS = [
  { id: 'pouch', label: 'Velvet Jewellery Pouch', emoji: '👛' },
  { id: 'cleaner', label: 'ORA Jewellery Cleaner', emoji: '✨' },
  { id: 'surprise', label: 'Surprise Me!', emoji: '🎁' },
];

export default function FreeShippingThreshold() {
  const { getTotal, items } = useCartStore();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const cartTotal = getTotal();

  // Don't show if cart is empty
  if (items.length === 0) return null;

  const remaining = FREE_GIFT_THRESHOLD - cartTotal;
  const progress = Math.min((cartTotal / FREE_GIFT_THRESHOLD) * 100, 100);
  const isUnlocked = remaining <= 0;

  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-500 ${
        isUnlocked
          ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200'
          : 'bg-pink-50/40 border-pink-100'
      }`}
    >
      {/* Status text */}
      <div className="flex items-center gap-2.5 mb-2.5">
        {isUnlocked ? (
          <>
            <Sparkles className="w-4 h-4 text-pink-600 flex-shrink-0" />
            <p className="text-sm font-medium text-pink-800">
              You&apos;ve unlocked a free gift!
            </p>
          </>
        ) : (
          <>
            <Gift className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <p className="text-sm text-pink-800">
              Add{' '}
              <span className="font-semibold">
                ₹{Math.ceil(remaining).toLocaleString('en-IN')}
              </span>{' '}
              more to unlock a{' '}
              <span className="font-semibold">free gift</span>
            </p>
          </>
        )}
      </div>

      {/* Progress Bar — soft pink */}
      <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isUnlocked
              ? 'bg-gradient-to-r from-pink-500 to-rose-500'
              : 'bg-pink-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Gift Picker — only when threshold met */}
      {isUnlocked && (
        <div className="mt-3 pt-3 border-t border-pink-100">
          <p className="text-xs text-pink-600 font-medium mb-2">Choose your gift:</p>
          <div className="flex flex-wrap gap-2">
            {GIFT_OPTIONS.map((gift) => (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedGift === gift.id
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-white text-pink-700 border border-pink-200 hover:border-pink-400'
                }`}
              >
                <span>{gift.emoji}</span>
                <span>{gift.label}</span>
              </button>
            ))}
          </div>
          {selectedGift && (
            <p className="text-xs text-pink-500 mt-2">
              Your gift will be included with your order.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
