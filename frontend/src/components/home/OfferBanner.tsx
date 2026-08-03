'use client';

/**
 * OfferBanner — Homepage Campaign Strip
 *
 * Luxurious dark section: "Buy Any Necklace. Get a Ring FREE."
 * ORA palette: charcoal #0F0F14, gold #C6A85B, white text.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Gift } from 'lucide-react';
import Link from 'next/link';

export default function OfferBanner() {
  return (
    <section className="relative overflow-hidden bg-[#0F0F14] py-20 md:py-28">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#C6A85B]/8 blur-[110px]" />
        <div className="absolute right-1/4 bottom-0 h-[200px] w-[200px] rounded-full bg-pink-600/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-7"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/8 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C6A85B]">
            <Sparkles className="h-3 w-3" />
            Launch Offer · Limited Time
            <Sparkles className="h-3 w-3" />
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-3xl font-light leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
        >
          Buy Any Necklace.
          <br />
          <span className="text-[#C6A85B]">Get a Ring FREE.</span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
          className="mx-auto mt-5 max-w-lg text-base text-neutral-400 md:text-lg"
        >
          No coupon needed. Add any necklace and your complimentary ring is unlocked automatically.
        </motion.p>

        {/* Value pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {['Any Necklace Qualifies', '1 Necklace = 1 Free Ring', 'No Code Required'].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70"
            >
              {t}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.38 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/collections/combos"
            className="group inline-flex items-center gap-3 rounded-full bg-[#C6A85B] px-10 py-4 text-base font-semibold text-[#0F0F14] shadow-lg transition-all hover:bg-[#b8985a] hover:shadow-xl"
          >
            Shop the Offer
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/collections/combos#rings"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-medium text-white transition-all hover:bg-white/5"
          >
            <Gift className="h-4 w-4 text-[#C6A85B]" />
            Browse Free Rings
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
