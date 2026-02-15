'use client';

/**
 * EmotionalPause — Centered text + soft decorative section
 * 
 * A visual breathing space between product browsing sections.
 * "Jewellery isn't just worn — it's felt."
 * Soft hearts in background. Minimal CTA.
 */

import { EmotionalPauseConfig } from '@/store/shopAllCmsStore';
import { motion } from 'framer-motion';

interface EmotionalPauseProps {
  config: EmotionalPauseConfig;
}

export default function EmotionalPause({ config }: EmotionalPauseProps) {
  if (!config.enabled) return null;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-[#FFF7FA]">
      {/* Background hearts */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Floating hearts */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-12 left-[10%] text-3xl opacity-[0.08]"
        >
          ♥
        </motion.div>
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-8 right-[15%] text-5xl opacity-[0.06]"
        >
          ♥
        </motion.div>
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-16 left-[25%] text-4xl opacity-[0.07]"
        >
          ♥
        </motion.div>
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute bottom-12 right-[20%] text-2xl opacity-[0.09]"
        >
          ♥
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/2 left-[5%] text-6xl opacity-[0.04]"
        >
          ♥
        </motion.div>
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute top-1/3 right-[8%] text-4xl opacity-[0.05]"
        >
          ♥
        </motion.div>

        {/* Soft glows */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-[#F8C8DC]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-[#E8B4B8]/15 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-12 h-px bg-[#D4AF37] mx-auto mb-8"
        />

        {/* Quote text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#1A1A1A] leading-relaxed italic"
        >
          &ldquo;{config.text}&rdquo;
        </motion.p>

        {/* Minimal CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <a
            href={config.ctaLink}
            className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase font-medium text-[#9B2C46] hover:text-[#7A2238] transition-colors"
          >
            <span>{config.ctaText}</span>
            <span className="text-xs">↓</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
