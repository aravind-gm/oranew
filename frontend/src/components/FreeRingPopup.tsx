'use client';

/**
 * FreeRingPopup — Site-wide offer popup
 *
 * States:
 *   • Promo mode  (no necklace in cart) — slides in after 4s, shows offer
 *   • Claim mode  (necklace added) — immediately replaces promo, urgent CTA
 *
 * Behaviour:
 *   • Hidden on /admin pages
 *   • Dismiss stores flag in sessionStorage (won't re-appear this session
 *     UNLESS a necklace is added — that always forces re-show)
 *   • Re-opens every time cartNecklaceCount increases
 */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useOfferStore } from '@/store/offerStore';

export default function FreeRingPopup() {
  const pathname = usePathname();
  const { items } = useCartStore();
  const { necklaces, cartNecklaceCount, syncCartCounts } = useOfferStore();

  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'promo' | 'claim'>('promo');
  const prevNecklaceCount = useRef(0);
  const promoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Don't show on admin pages
  const isAdmin = pathname?.startsWith('/admin');

  // Sync counts on mount
  useEffect(() => {
    syncCartCounts();
  }, [syncCartCounts, items]);

  // ── Promo mode: show after 4s if not already dismissed this session ──
  useEffect(() => {
    if (isAdmin) return;
    const dismissed = sessionStorage.getItem('freeRingPromoDismissed');
    if (dismissed) return;

    promoTimer.current = setTimeout(() => {
      setMode('promo');
      setVisible(true);
    }, 4000);

    return () => {
      if (promoTimer.current) clearTimeout(promoTimer.current);
    };
  }, [isAdmin]);

  // ── Claim mode: fires whenever necklace count goes UP ──
  useEffect(() => {
    if (isAdmin) return;
    if (cartNecklaceCount > prevNecklaceCount.current) {
      // Cancel promo timer if still pending
      if (promoTimer.current) clearTimeout(promoTimer.current);
      const hasFreeRing = items.some((i) => i.isFreeGift);
      if (!hasFreeRing) {
        setMode('claim');
        setVisible(true);
      }
    }
    prevNecklaceCount.current = cartNecklaceCount;
  }, [cartNecklaceCount, isAdmin, items]);

  const handleClose = () => {
    setVisible(false);
    if (mode === 'promo') {
      sessionStorage.setItem('freeRingPromoDismissed', '1');
    }
  };

  if (isAdmin) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={mode}
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-6 right-4 z-[1200] w-[calc(100vw-2rem)] max-w-xs"
        >
          {mode === 'promo' ? (
            /* ── Promo state ── */
            <div className="relative overflow-hidden rounded-2xl bg-[#0F0F14] shadow-2xl">
              {/* Gold glow */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#C6A85B]/20 blur-2xl" />

              <button
                onClick={handleClose}
                className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="relative p-5 pr-8">
                {/* Badge */}
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#C6A85B]">
                  <Sparkles className="h-2.5 w-2.5" /> Launch Offer
                </span>

                <h3 className="font-serif text-lg font-light leading-snug text-white">
                  Buy Any Necklace.<br />
                  <span className="text-[#C6A85B]">Get a Ring FREE.</span>
                </h3>
                <p className="mt-1.5 text-xs text-neutral-400">
                  No coupon needed — applied automatically at checkout.
                </p>

                <Link
                  href="/collections/combos"
                  onClick={handleClose}
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#C6A85B] px-5 py-2.5 text-sm font-semibold text-[#0F0F14] hover:bg-[#b8985a] transition-colors"
                >
                  Shop the Offer <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* ── Claim state ── */
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-2 ring-emerald-400/40">
              {/* Green shimmer */}
              <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-emerald-400/15 blur-xl" />

              <button
                onClick={handleClose}
                className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 hover:bg-neutral-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="relative p-5 pr-8">
                {/* Icon */}
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                  <Gift className="h-5 w-5 text-emerald-600" />
                </div>

                <h3 className="font-serif text-lg font-semibold text-neutral-900">
                  Claim Your Free Ring! 🎁
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Your necklace is in the bag — now pick a complimentary ring, on us.
                </p>

                <Link
                  href="/collections/combos#rings"
                  onClick={handleClose}
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  Choose Your Free Ring <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
