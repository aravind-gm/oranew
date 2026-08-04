'use client';

/**
 * OfferBanner — Homepage Campaign Section
 * Split layout: left = copy, right = decorative visual.
 * ORA palette: charcoal #0F0F14, gold #C6A85B.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Gift, Sparkles, Check } from 'lucide-react';
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
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C6A85B] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0">

          {/* ── LEFT: Copy ── */}
          <div className="py-6 md:py-8 lg:py-10 lg:pr-10">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6A85B]"
            >
              <Sparkles className="h-2.5 w-2.5" />
              Limited Time · Launch Offer
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-2xl font-light leading-[1.1] tracking-tight text-white sm:text-3xl lg:text-4xl"
            >
              Buy Any
              <br />
              Necklace.
              <br />
              <span className="text-[#C6A85B] italic">Get a Ring FREE.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.22 }}
              className="mt-3 text-sm text-neutral-400 max-w-sm"
            >
              Our best launch offer — automatically applied. No codes, no hassle.
            </motion.p>

            {/* Perks list */}
            <motion.ul
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-4 space-y-2"
            >
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-neutral-300">
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#C6A85B]" strokeWidth={2.5} />
                  {p}
                </li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex flex-col gap-2 sm:flex-row"
            >
              <Link
                href="/collections/combos"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#C6A85B] px-8 py-3.5 text-sm font-bold text-[#0F0F14] transition-all hover:bg-[#b8985a] hover:shadow-lg hover:shadow-[#C6A85B]/20"
              >
                Shop the Offer
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/collections/combos#rings"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-white/80 transition-all hover:border-white/40 hover:text-white"
              >
                <Gift className="h-3.5 w-3.5 text-[#C6A85B]" />
                Claim Your Free Ring
              </Link>
            </motion.div>
          </div>

          {/* ── RIGHT: Visual ── */}
          <div className="hidden lg:flex items-center justify-center relative h-full min-h-[280px]">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-56 w-56 rounded-full bg-[#C6A85B]/12 blur-[60px]" />
            </div>

            {/* Decorative ring of dots */}
            <div className="relative flex items-center justify-center h-48 w-48">
              {/* Outer circle */}
              <div className="absolute inset-0 rounded-full border border-[#C6A85B]/15" />
              <div className="absolute inset-6 rounded-full border border-[#C6A85B]/10 border-dashed" />

              {/* Center content */}
              <div className="relative z-10 flex flex-col items-center gap-5">
                {/* Necklace icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/8 text-2xl">
                  📿
                </div>

                <div className="flex items-center gap-2 text-[#C6A85B]/60 text-xl font-light">
                  <span>+</span>
                </div>

                {/* Ring icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/8 text-2xl">
                  💍
                </div>

                <div className="mt-2 text-center">
                  <p className="text-lg font-serif font-light text-white leading-tight">
                    = <span className="text-emerald-400 font-semibold">FREE</span>
                  </p>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                FREE
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-full bg-[#C6A85B] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#0F0F14] shadow-lg">
                No Code
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gold hairline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C6A85B] to-transparent" />
    </section>
  );
}
