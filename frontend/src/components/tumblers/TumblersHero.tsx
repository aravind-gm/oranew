'use client';

/**
 * TumblersHero — ORA Premium Tumblers Hero (Black Cinematic)
 * ===========================================================
 * Restored black background with baby pink accents
 * Clean headline: "40oz. One Size. Three Experiences."
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function TumblersHero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      className="relative w-full overflow-hidden" 
      style={{ 
        minHeight: 'clamp(440px, 58vh, 620px)',
        background: 'linear-gradient(135deg, #0F0F14 0%, #1B1B23 100%)'
      }}
    >
      {/* Subtle pink ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(231,84,128,0.08)_0%,_transparent_60%)]" />
      
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1zM0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center" style={{ minHeight: 'clamp(440px, 58vh, 620px)' }}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-16 lg:py-0">
          {/* Left — Copy */}
          <div className="text-center lg:text-left">
            <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E75480]/30 bg-[#E75480]/10 mb-6">
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#E75480]">
                ORA Tumblers Collection
              </span>
            </motion.div>

            <motion.h1 {...fadeUp(0.2)} className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-white leading-[1.1] tracking-tight">
              40oz. One Size.
              <br />
              <span className="text-[#E75480]">
                Three Experiences.
              </span>
            </motion.h1>

            <motion.p {...fadeUp(0.35)} className="mt-6 text-base sm:text-lg text-neutral-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Every edition delivers 40oz capacity with progressive insulation performance.
              <span className="text-white font-medium"> Choose the tier that matches your hydration needs.</span>
            </motion.p>

            <motion.div {...fadeUp(0.5)} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => scrollTo('tumbler-collection')}
                className="px-8 py-3.5 bg-[#E75480] hover:bg-[#C2185B] text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
              >
                Explore Editions
              </button>
              <button
                onClick={() => scrollTo('comparison-table')}
                className="px-8 py-3.5 border-2 border-[#E75480] text-[#E75480] font-medium rounded-full hover:bg-[#E75480]/10 transition-all duration-300"
              >
                Compare All Three
              </button>
            </motion.div>

            {/* Trust strip */}
            <motion.div {...fadeUp(0.65)} className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-neutral-400 text-xs flex-wrap">
              {['Free Delivery Across India', '5-Day Easy Returns', 'Straw + Handle Included'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#E75480]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  <span>{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Edition circles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:flex justify-center items-center"
          >
            <div className="relative w-[380px] h-[380px]">
              <div className="absolute inset-0 rounded-full border-2 border-[#E75480]/20" />
              <div className="absolute inset-6 rounded-full border border-[#E75480]/10" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-7xl font-serif font-light text-white">3</span>
                <span className="text-sm font-medium tracking-[0.2em] uppercase text-[#E75480] mt-1">Editions</span>
                <span className="text-xs text-neutral-500 mt-2">₹1,099 — ₹3,099</span>
              </div>

              {/* Edition labels */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-[#1A1A2E] border border-[#E75480]/30 rounded-lg text-center">
                <span className="text-[10px] text-neutral-400 block">Classic Flow</span>
                <span className="text-sm font-semibold text-white">₹1,099</span>
              </div>
              <div className="absolute bottom-8 -right-4 px-4 py-2 bg-[#E75480] rounded-lg text-center shadow-md">
                <span className="text-[10px] text-white/90 block">Marble Gloss</span>
                <span className="text-sm font-bold text-white">₹2,099</span>
              </div>
              <div className="absolute bottom-8 -left-4 px-4 py-2 bg-[#C6A85B] rounded-lg text-center shadow-md">
                <span className="text-[10px] text-white/90 block">Floral Gift</span>
                <span className="text-sm font-bold text-white">₹3,099</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={() => scrollTo('tumbler-collection')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-neutral-500 hover:text-[#E75480] transition-colors cursor-pointer"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        <ChevronDown size={16} className="animate-bounce" />
      </motion.button>
    </section>
  );
}
