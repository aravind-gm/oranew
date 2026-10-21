'use client';

/**
 * OfferBanner — Compact Campaign Support Strip
 * 
 * The main campaign promotion is now handled by the hero banner.
 * This section provides compact essential offer details without
 * competing visually. Horizontal strip on desktop, stacked on mobile.
 * ORA palette: charcoal #0F0F14, gold #C6A85B.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const PERKS = [
  'Any necklace qualifies — no minimum',
  '1 necklace = 1 complimentary ring',
  'No coupon code needed',
  'Ships together in gift-ready packaging',
];

export default function OfferBanner() {
  return (
    <section className="relative overflow-hidden bg-[#0F0F14]">
      {/* Top gold hairline */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C6A85B] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 lg:px-12 py-5 md:py-6">
        {/* Compact horizontal layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Left: Offer headline */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 flex-shrink-0"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#C6A85B]">
              <Sparkles className="h-2.5 w-2.5" />
              Offer
            </span>
            <h2 className="font-serif text-base md:text-lg font-light text-white leading-tight">
              Buy Any Necklace.{' '}
              <span className="text-[#C6A85B] italic">Get a Ring FREE.</span>
            </h2>
          </motion.div>

          {/* Center: Perks — horizontal on desktop */}
          <motion.ul
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="hidden lg:flex items-center gap-5"
          >
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-1.5 text-xs text-neutral-400 whitespace-nowrap">
                <Check className="h-3 w-3 flex-shrink-0 text-[#C6A85B]" strokeWidth={2.5} />
                {p}
              </li>
            ))}
          </motion.ul>

          {/* Mobile perks: compact 2-column */}
          <motion.ul
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-x-4 gap-y-1.5 lg:hidden"
          >
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <Check className="h-3 w-3 flex-shrink-0 text-[#C6A85B]" strokeWidth={2.5} />
                {p}
              </li>
            ))}
          </motion.ul>

          {/* Right: CTA */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex-shrink-0"
          >
            <Link
              href="/collections/combos"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#C6A85B] px-6 py-2.5 text-xs font-bold text-[#0F0F14] transition-all hover:bg-[#b8985a] hover:shadow-lg hover:shadow-[#C6A85B]/20 whitespace-nowrap"
            >
              Shop the Offer
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom gold hairline */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C6A85B] to-transparent" />
    </section>
  );
}
