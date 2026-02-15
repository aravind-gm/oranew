'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * BrandManifesto — Editorial brand positioning
 * ORA Valentine's Special | Production-ready
 *
 * ▸ Centered serif manifesto text
 * ▸ Line-by-line staggered entrance
 * ▸ Minimal decorative dividers
 * ▸ Premium editorial white-space
 * ▸ No imagery — pure typography moment
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import { memo } from 'react';

interface BrandManifestoProps {
  lines?: string[];
  tagline?: string;
}

const DEFAULT_LINES = [
  'This Valentine\u2019s, we celebrate her.',
  'Her style. Her softness. Her strength.',
  'Because love isn\u2019t loud \u2014 it\u2019s personal.',
];

function BrandManifesto({
  lines = DEFAULT_LINES,
  tagline = 'Premium jewellery & lifestyle gifts designed for women.',
}: BrandManifestoProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="relative py-28 sm:py-36 lg:py-44 bg-white overflow-hidden"
      aria-label="Brand Manifesto"
    >
      <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
        {/* Top divider */}
        <motion.div
          className="flex items-center justify-center gap-6 mb-14"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          aria-hidden="true"
        >
          <span className="w-16 h-px bg-neutral-200" />
          <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
          <span className="w-16 h-px bg-neutral-200" />
        </motion.div>

        {/* Manifesto lines — staggered */}
        <div className="space-y-3 sm:space-y-4 mb-12">
          {lines.map((line, idx) => (
            <motion.p
              key={idx}
              className="font-serif text-2xl sm:text-3xl lg:text-4xl text-neutral-800 font-light leading-snug italic"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          className="text-sm sm:text-base text-neutral-400 tracking-wide max-w-md mx-auto leading-relaxed"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {tagline}
        </motion.p>

        {/* Bottom divider */}
        <motion.div
          className="flex items-center justify-center gap-6 mt-14"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          aria-hidden="true"
        >
          <span className="w-16 h-px bg-neutral-200" />
          <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
          <span className="w-16 h-px bg-neutral-200" />
        </motion.div>
      </div>
    </section>
  );
}

export default memo(BrandManifesto);
