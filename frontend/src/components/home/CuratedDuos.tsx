'use client';

/**
 * CuratedDuos — Subtle Combos Section
 * 
 * Title: Curated ORA Duos
 * Subtitle: Two complementary pieces styled together.
 * CTA: Explore Duos
 * 
 * No: Buy 1 Get 1, Save ₹, flash sale language.
 * Intentional, not promotional.
 */

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CuratedDuos() {
  return (
    <section className="py-16 md:py-24 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            Curated ORA Duos
          </h2>
          <p className="text-sm md:text-base text-neutral-500 max-w-md mx-auto mb-8 md:mb-10">
            Two complementary pieces styled together.
          </p>

          <Link
            href="/collections/combos"
            className="group inline-flex items-center gap-2.5 px-8 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] font-medium rounded-full hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
          >
            <span>Explore Duos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
