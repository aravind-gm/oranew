'use client';

/**
 * LuxuryHero — Premium Emotional Above-the-Fold
 * 
 * Structure:
 *  - Large background model image (placeholder allowed)
 *  - Headline: "Own. Radiate. Adorn."
 *  - Subtext: Jewellery crafted for the modern woman.
 *  - Dual CTAs: Shop Bestsellers | Explore Combos
 *  - Trust line: ✨ 50,000+ Happy Customers | Free Shipping on All Orders
 *  - Minimal, luxury, no heavy overlays
 */

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LuxuryHero() {
  return (
    <section className="relative w-full h-[100svh] min-h-[600px] max-h-[950px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/banners.png"
          alt="ORA Jewellery — Premium Collection"
          fill
          className="object-cover object-center"
          priority
          quality={90}
          sizes="100vw"
        />
        {/* Subtle gradient overlay — minimal, not heavy */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-4 md:mb-6 tracking-tight leading-[1.1]"
          >
            Own. Radiate. <span className="italic">Adorn.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="text-base sm:text-lg md:text-xl mb-8 md:mb-10 opacity-90 font-light max-w-lg mx-auto"
          >
            Jewellery crafted for the modern woman.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <Link
              href="/collections?sort=bestseller"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-[#1A1A1A] font-medium rounded-full hover:bg-neutral-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span>Shop Bestsellers</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/collections?type=combo"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 border-2 border-white/80 text-white font-medium rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
            >
              <span>Explore Combos</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Trust Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8 md:mt-10 flex items-center justify-center gap-2 text-white/70 text-xs sm:text-sm tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
            <span>Premium Fashion Jewellery</span>
            <span className="text-white/40">|</span>
            <span>Free Delivery Across India</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
