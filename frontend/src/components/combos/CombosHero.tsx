'use client';

/**
 * CombosHero — Full-width dark campaign hero for "Combos for Her"
 *
 * Strict ORA palette:
 *   Background: #0F0F14 (deep charcoal)
 *   Accent:     #E91E63 (pink CTA)
 *   Gold:       #C6A85B (luxury badge)
 *
 * Features:
 *   - Emotional headline: "Buy 1. Get 1 Free. Because She Deserves More."
 *   - "2 Pieces. 1 Price." luxury badge
 *   - Urgency strip with live counters
 *   - Dual CTAs
 *   - No random gradients — structured dark hero
 */

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useCallback } from 'react';

export default function CombosHero() {
  const scrollToGrid = useCallback(() => {
    const el = document.getElementById('combos-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: '#0F0F14' }}
    >
      {/* Subtle decorative glow — no random gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(198,168,91,0.06) 0%, rgba(233,30,99,0.03) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-28 lg:py-36 max-w-4xl mx-auto">
        {/* Luxury Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
          style={{
            background: 'rgba(198,168,91,0.12)',
            border: '1px solid rgba(198,168,91,0.25)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#C6A85B' }} />
          <span
            className="text-xs font-sans font-semibold tracking-[0.2em] uppercase"
            style={{ color: '#C6A85B' }}
          >
            2 Pieces · 1 Price
          </span>
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#C6A85B' }} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-light text-white leading-[1.15] tracking-tight"
        >
          Buy 1. Get 1 Free.
          <br />
          <span style={{ color: '#C6A85B' }}>Because She Deserves More.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-5 text-base sm:text-lg font-sans font-light max-w-xl leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Curated jewellery combos crafted for gifting, celebrating, and
          glowing.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 mt-9"
        >
          <button
            onClick={scrollToGrid}
            className="px-9 py-3.5 font-sans text-sm font-semibold tracking-wider uppercase rounded-full transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#E91E63',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(233,30,99,0.3)',
            }}
          >
            Shop Combos
          </button>
          <a
            href="/products"
            className="px-9 py-3.5 font-sans text-sm font-semibold tracking-wider uppercase rounded-full transition-all duration-300 text-white hover:bg-white/5"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            View Best Sellers
          </a>
        </motion.div>

        {/* Simple offer text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 text-sm font-sans"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <span>
            Limited-time offer on selected styles.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
