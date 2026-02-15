'use client';

/**
 * OffersHero — Refined hero for curated selections page
 * Baby pink theme, premium positioning, no urgency
 * ORA Design System
 */

import { motion } from 'framer-motion';

export default function OffersHero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#FDECEF' }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(231,84,128,0.08)_0%,_transparent_60%)]" />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Refined badge */}
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase mb-5"
            style={{
              backgroundColor: 'rgba(231, 84, 128, 0.1)',
              color: '#E75480',
              border: '1px solid rgba(231, 84, 128, 0.2)',
            }}
          >
            Curated for You
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light leading-tight mb-4"
            style={{ color: '#111111' }}
          >
            Curated Selections at{' '}
            <span style={{ color: '#E75480' }}>Special Prices</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm sm:text-base leading-relaxed text-neutral-600 mb-8 max-w-xl mx-auto"
          >
            A refined edit of select ORA pieces — thoughtfully priced.
          </motion.p>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            href="#offer-products"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg rounded-full"
            style={{ backgroundColor: '#E75480' }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#C2185B';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#E75480';
            }}
          >
            Explore Selections
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
