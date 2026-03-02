'use client';

/**
 * OraPhilosophy — Homepage Brand Depth Section
 * 
 * Purpose: Add emotional storytelling to the homepage.
 * Placed after featured collections, before trust strip / newsletter.
 * 
 * Calm. Confident. Minimal. Premium.
 * No aggressive marketing. No urgency messaging.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function OraPhilosophy() {
  return (
    <section className="py-24 md:py-32 lg:py-36 bg-oraLight/30 relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-oraPink/10 blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Section label */}
          <p className="text-xs tracking-[0.3em] uppercase text-oraAccent/60 mb-6 font-medium">
            Our Story
          </p>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-serif font-light text-[#1A1A1A] leading-tight mb-10">
            The ORA Philosophy
          </h2>

          {/* Body copy — editorial, airy */}
          <div className="space-y-6">
            <p className="text-base md:text-lg font-light text-neutral-500 leading-relaxed">
              Luxury isn&apos;t about excess.
              <br />
              It&apos;s about intention.
            </p>

            <p className="text-base md:text-lg font-light text-neutral-500 leading-relaxed">
              At ORA, we design jewellery that feels modern, minimal, and powerful —
              <br className="hidden md:block" />
              made for women who don&apos;t need permission to shine.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mt-12">
            <Link
              href="/about-ora"
              className="group inline-flex items-center gap-2.5 text-sm font-medium tracking-wider uppercase text-[#1A1A1A] border-b border-[#1A1A1A]/30 pb-1 hover:border-oraAccent hover:text-oraAccent transition-colors duration-300"
            >
              Discover Our Story
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Micro copy */}
          <p className="mt-10 text-xs tracking-[0.2em] uppercase text-neutral-400/70 font-light">
            Effortless elegance.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
