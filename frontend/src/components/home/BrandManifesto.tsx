'use client';

/**
 * BrandManifesto — Emotional Pause Section
 * 
 * Purpose: Build trust + emotional connection with the visitor.
 * UX: Centered serif typography, no images, breathing whitespace,
 *      tiny heart divider between lines.
 * Motion: Slow fade-in on scroll, staggered text reveal.
 * Mobile: Smaller type, tighter padding.
 */

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface BrandManifestoProps {
  lines?: string[];
}

export default function BrandManifesto({
  lines = [
    "Jewellery isn't just worn — it's felt.",
    "Every ORA piece celebrates her softness, strength, and style.",
  ],
}: BrandManifestoProps) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="max-w-3xl mx-auto px-5 text-center">
        {lines.map((line, i) => (
          <div key={i}>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: i * 0.3, ease: 'easeOut' }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-serif font-light text-[#1A1A1A] leading-relaxed italic"
            >
              &ldquo;{line}&rdquo;
            </motion.p>

            {/* Heart divider between lines */}
            {i < lines.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.3 + 0.4 }}
                className="flex justify-center my-6 md:my-8"
              >
                <Heart className="w-4 h-4 text-primary-300 fill-primary-200" />
              </motion.div>
            )}
          </div>
        ))}

        {/* Brand tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 md:mt-12"
        >
          <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-neutral-400 font-light">
            own · radiate · adorn
          </p>
        </motion.div>
      </div>
    </section>
  );
}
