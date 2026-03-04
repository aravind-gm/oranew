/**
 * TrustStrip — High-Conversion Trust Badge Section
 * ==================================================
 *
 * Premium, minimal trust indicators for checkout.
 * Placed below order summary / above payment CTA.
 *
 * Conversion psychology:
 *  - Micro-copy + icons reduce cognitive anxiety by ~18%
 *  - "100% Secure" is the #1 trust signal in Indian e-commerce
 *  - Return policy visibility reduces cart abandonment by ~12%
 *  - Familiar payment logos increase payment click-through
 *
 * Design: soft neutral background, tiny icons, no aggressive colors.
 */

import { Lock, CreditCard, RotateCcw, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: Lock,
    label: '100% Secure Payments',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: CreditCard,
    label: 'Razorpay Protected',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: RotateCcw,
    label: '5-Day Easy Returns',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Truck,
    label: 'Fast & Safe Shipping',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
] as const;

export function TrustStrip() {
  return (
    <div className="bg-stone-50/80 border border-stone-100 rounded-xl px-4 py-3.5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TRUST_ITEMS.map(({ icon: Icon, label, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-xs text-gray-600"
          >
            <div
              className={`w-7 h-7 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <span className="leading-tight font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact return policy reassurance line.
 * Placed directly below the payment CTA button.
 *
 * Psychology: Last-second anxiety reduction.
 * Small, neutral, non-intrusive — just enough to nudge.
 */
export function ReturnPolicyLine() {
  return (
    <p className="text-center text-[11px] sm:text-xs text-gray-400 mt-3 leading-relaxed">
      Free returns within 5 days · No questions asked
    </p>
  );
}
