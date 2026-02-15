'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * EmotionalStatement — Trust-building pause section
 * ORA Valentine's Special | Production-ready
 *
 * ▸ Centered quote with serif italic headline
 * ▸ Decorative hearts at ultra-low opacity
 * ▸ Scroll-triggered fade-up entrance
 * ▸ prefers-reduced-motion safe
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { memo } from 'react';

interface EmotionalStatementProps {
  headline?: string;
  supporting?: string;
}

function EmotionalStatement({
  headline = 'Because the right gift becomes a memory.',
  supporting = 'Every ORA piece comes gift-wrapped with love.',
}: EmotionalStatementProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="relative py-20 sm:py-28 bg-white overflow-hidden"
      aria-label="Brand Statement"
    >
      {/* Decorative hearts */}
      <div className="absolute top-10 left-[10%] opacity-[0.03] pointer-events-none" aria-hidden="true">
        <Heart className="w-32 h-32 text-rose-500 fill-rose-500" />
      </div>
      <div className="absolute bottom-10 right-[8%] opacity-[0.03] pointer-events-none rotate-12" aria-hidden="true">
        <Heart className="w-24 h-24 text-rose-500 fill-rose-500" />
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Top divider */}
          <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
            <span className="w-12 h-px bg-rose-200" />
            <Heart className="w-4 h-4 text-rose-300" />
            <span className="w-12 h-px bg-rose-200" />
          </div>

          <blockquote>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 font-light leading-snug mb-5 italic">
              &ldquo;{headline}&rdquo;
            </h2>
          </blockquote>

          <p className="text-neutral-500 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">
            {supporting}
          </p>

          {/* Bottom divider */}
          <div className="flex items-center justify-center gap-4 mt-8" aria-hidden="true">
            <span className="w-12 h-px bg-rose-200" />
            <Heart className="w-4 h-4 text-rose-300" />
            <span className="w-12 h-px bg-rose-200" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(EmotionalStatement);
