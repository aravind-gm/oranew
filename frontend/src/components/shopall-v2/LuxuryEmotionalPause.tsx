'use client';

/**
 * LuxuryEmotionalPause — Immersive quote/breathing section
 * 
 * A luxurious visual pause between product sections.
 * Floating hearts, ambient glow, elegant serif quote.
 */

import { EmotionalPauseConfig } from '@/store/shopAllCmsStore';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LuxuryEmotionalPauseProps {
  config: EmotionalPauseConfig;
}

export default function LuxuryEmotionalPause({ config }: LuxuryEmotionalPauseProps) {
  if (!config.enabled) return null;

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#FFFBFD] via-[#FFF7FA] to-[#FFFBFD]">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Floating hearts */}
        {[
          { x: '8%', y: '15%', size: 20, delay: 0, dur: 7 },
          { x: '88%', y: '20%', size: 28, delay: 1.5, dur: 8 },
          { x: '22%', y: '75%', size: 18, delay: 3, dur: 6 },
          { x: '78%', y: '65%', size: 24, delay: 2, dur: 9 },
          { x: '50%', y: '10%', size: 16, delay: 4, dur: 7 },
          { x: '65%', y: '85%', size: 22, delay: 1, dur: 8 },
        ].map((heart, i) => (
          <motion.div
            key={i}
            className="absolute text-[#E8B4B8]"
            style={{ left: heart.x, top: heart.y }}
            animate={{
              y: [0, -18, 0],
              rotate: [0, 8, -8, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: heart.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: heart.delay,
            }}
          >
            <svg width={heart.size} height={heart.size} viewBox="0 0 24 24" fill="currentColor" opacity={0.08}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}

        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F8C8DC]/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#E8B4B8]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Decorative sparkle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Sparkles size={18} className="mx-auto text-[#D4AF37]/60" />
        </motion.div>

        {/* Gold line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-10"
        />

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#1A1A1A] leading-[1.4] italic"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          &ldquo;{config.text}&rdquo;
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10"
        >
          <a
            href={config.ctaLink}
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-semibold text-[#D4AF37] hover:text-[#BF8C2F] transition-colors duration-300"
          >
            <span>{config.ctaText}</span>
            <span className="text-xs">↓</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
