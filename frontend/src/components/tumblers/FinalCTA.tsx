'use client';

/**
 * FinalCTA — Bottom-of-page urgency banner
 * ==========================================
 * Full-width dark banner with a "Don't miss out" CTA
 * that scrolls back up to the collection.
 *
 * Marketing:
 *  → Recency / urgency ("Limited Edition")
 *  → Social proof number ("Join 2,400+ happy sippers")
 *  → Dual CTA (Shop / Compare)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowUp } from 'lucide-react';

export default function FinalCTA() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="w-full py-16 lg:py-20 relative overflow-hidden" style={{ backgroundColor: '#FDECEF' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(231,84,128,0.1)_0%,_transparent_60%)]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E75480]/30 bg-[#E75480]/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E75480] animate-pulse" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase" style={{ color: '#E75480' }}>
              Free Delivery Across India
            </span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] leading-tight">
            Choose Your Edition
          </h2>

          <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-xl mx-auto">
            All three deliver 40oz capacity with progressive insulation performance (4-7h hot, 12-24h cold). Pick the tier that suits your needs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo('tumbler-collection')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl transition-all duration-300 active:scale-[0.98]"
              style={{ backgroundColor: '#E75480' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C2185B'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E75480'}
            >
              <ShoppingBag size={18} />
              Shop Now — From ₹1,099
            </button>
            <button
              onClick={() => scrollTo('comparison-table')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border text-[#111111] font-medium rounded-xl hover:bg-white/50 transition-all duration-300"
              style={{ borderColor: '#E75480' }}
            >
              <ArrowUp size={16} />
              Compare Editions
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex items-center justify-center gap-6 text-neutral-500 text-xs flex-wrap">
            {['Free Delivery Across India', '5-Day Returns', 'Straw + Handle Included'].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" style={{ color: '#E75480' }} fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
