'use client';

/**
 * BOGOCampaign — Revenue Driver Section
 *
 * Dark background (#0F0F14)
 * Headline: "Buy 1. Get 1 Free."
 * Subtext: Choose any two from selected collections.
 * CTA: [ Start Selecting ]
 * Scarcity strip: "Only 18 combos left at this price"
 * Appears above categories.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function BOGOCampaign() {
  return (
    <section className="relative py-16 md:py-24 lg:py-28 bg-[#0F0F14] overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pink-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-5 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-pink-300 border border-pink-500/30 rounded-full bg-pink-500/5">
            Limited Time
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white mb-4 md:mb-6 leading-tight tracking-tight">
            Buy 1. Get 1 Free.
          </h2>
          <p className="text-base md:text-lg text-neutral-400 max-w-lg mx-auto mb-8 md:mb-10">
            Pick any two necklaces, rings, or bracelets from our combo collection.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="/collections?type=combo"
            className="group inline-flex items-center gap-3 px-10 py-4 bg-white text-[#0F0F14] font-semibold rounded-full hover:bg-neutral-100 transition-all duration-300 shadow-lg hover:shadow-xl text-base"
          >
            <span>Shop Combos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Scarcity Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 md:mt-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-pink-500/30 bg-pink-500/5"
        >
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-sm text-pink-400 font-medium tracking-wide">
            Offer valid while stocks last
          </span>
        </motion.div>
      </div>
    </section>
  );
}
