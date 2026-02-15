'use client';

/**
 * BrandStatement — Centered Elegant Typography Block
 * 
 * Purpose: Establish brand identity with calm, refined messaging.
 * No marketing tone. No hype. No hearts.
 */

import { motion } from 'framer-motion';

export default function BrandStatement() {
  return (
    <section className="py-16 md:py-24 lg:py-28 bg-white">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-base md:text-lg lg:text-xl font-serif font-light text-neutral-600 leading-relaxed tracking-wide">
            ORA creates contemporary fashion jewellery designed for everyday elegance. 
            Each piece is thoughtfully crafted to complement modern wardrobes and meaningful moments.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
