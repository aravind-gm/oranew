'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * FinalValentineCTA — Emotional closing CTA
 * ORA Valentine's Special | Production-ready
 *
 * ▸ Rose gradient background with minimal decoration
 * ▸ Scroll-triggered fade-up entrance
 * ▸ Strong single CTA
 * ▸ Editorial white-space
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

interface FinalValentineCTAProps {
  headline?: string;
  headlineAccent?: string;
  supporting?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

function FinalValentineCTA({
  headline = 'Make this Valentine\u2019s',
  headlineAccent = 'unforgettable.',
  supporting = 'Every ORA piece comes gift-wrapped with love.',
  ctaLabel = 'Shop Valentine\u2019s Special',
  ctaHref = '#featured',
}: FinalValentineCTAProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="relative py-28 sm:py-40 bg-gradient-to-b from-white via-rose-50/30 to-white overflow-hidden"
      aria-label="Valentine's call to action"
    >
      {/* Decorative dots */}
      <div className="absolute top-16 left-[18%] w-2 h-2 rounded-full bg-rose-200 opacity-40" aria-hidden="true" />
      <div className="absolute bottom-20 right-[15%] w-3 h-3 rounded-full bg-rose-200 opacity-30" aria-hidden="true" />

      <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center relative z-10">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Divider */}
          <div className="flex items-center justify-center gap-6 mb-12" aria-hidden="true">
            <span className="w-16 h-px bg-neutral-200" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
            <span className="w-16 h-px bg-neutral-200" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 font-light leading-snug mb-6">
            {headline}
            <br />
            <em className="text-rose-700">{headlineAccent}</em>
          </h2>

          <p className="text-neutral-400 text-lg leading-relaxed mb-12 max-w-md mx-auto">
            {supporting}
          </p>

          <Link
            href={ctaHref}
            className="group inline-flex items-center justify-center gap-3 px-10 py-4 bg-rose-700 text-white font-medium rounded-full transition-all duration-300 hover:bg-rose-800 hover:shadow-xl hover:scale-[1.02] shadow-lg shadow-rose-900/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
          >
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            <span>{ctaLabel}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(FinalValentineCTA);
