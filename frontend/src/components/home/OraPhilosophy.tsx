'use client';

/**
 * OraPhilosophy — Homepage Brand Depth Section
 * 
 * Purpose: Add emotional storytelling to the homepage.
 * Placed after categories, before lifestyle strip.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function OraPhilosophy() {
  return (
    <section className="py-7 md:py-10 bg-white relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-50/60 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Section label */}
          <p className="text-[10px] tracking-[0.28em] uppercase text-neutral-400 mb-3 font-medium">
            Our Story
          </p>

          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1A1A1A] leading-tight mb-4">
            Own. Radiate. Adorn.
          </h2>

          {/* Decorative line */}
          <div className="w-10 h-[1px] bg-neutral-300 mx-auto mb-4" />

          {/* Body copy — condensed to one focused paragraph */}
          <div className="space-y-4">
            <p className="text-sm md:text-base font-light text-neutral-500 leading-relaxed">
              ORA was born from a simple belief — every woman deserves jewellery 
              that feels as premium as fine gold, without the fine-gold price tag.
              Anti-tarnish, skin-safe, crafted for every single day.
            </p>
          </div>

          {/* Brand promises row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 flex items-center justify-center gap-8 sm:gap-12"
          >
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-serif font-light text-[#1A1A1A]">✦</p>
              <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">Anti-Tarnish</p>
            </div>
            <div className="w-[1px] h-10 bg-neutral-200" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-serif font-light text-[#1A1A1A]">♡</p>
              <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">Skin-Safe</p>
            </div>
            <div className="w-[1px] h-10 bg-neutral-200" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-serif font-light text-[#1A1A1A]">◇</p>
              <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">Premium Finish</p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <div className="mt-12">
            <Link
              href="/about-ora"
              className="group inline-flex items-center gap-2.5 text-sm font-medium tracking-wider uppercase text-[#1A1A1A] border-b border-[#1A1A1A]/30 pb-1 hover:border-pink-500 hover:text-pink-500 transition-colors duration-300"
            >
              Read Our Full Story
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
