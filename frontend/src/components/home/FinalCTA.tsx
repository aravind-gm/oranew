'use client';

/**
 * FinalCTA — Calm Brand Close
 * 
 * Purpose: Last invite before footer. Not emotional push.
 * No: hearts, pink gradients, urgency
 */

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FinalCTAProps {
  headline?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function FinalCTA({
  headline = 'Discover pieces that define your everyday.',
  ctaLabel = 'Shop ORA',
  ctaHref = '/collections',
}: FinalCTAProps) {
  return (
    <section className="py-20 md:py-28 lg:py-36 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-[#1A1A1A] mb-8 md:mb-10 leading-tight"
        >
          {headline}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-3 px-10 py-4 md:px-12 md:py-5 bg-[#1A1A1A] text-white font-medium rounded-full hover:bg-[#333] transition-all duration-300 text-base md:text-lg"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 text-xs tracking-[0.2em] uppercase text-neutral-400 font-light"
        >
          own · radiate · adorn
        </motion.p>
      </div>
    </section>
  );
}
