'use client';

import { motion } from 'framer-motion';
import { Heart, Sparkles, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full min-h-[90vh] lg:aspect-[16/9] lg:min-h-0 overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* Hero Image - Valentine's Special Banner */}
        <Image
          src="/val banner.png"
          alt="Elegant Indian woman wearing ORA jewellery"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Gradient Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent lg:from-background/90 lg:via-background/50" />
        {/* Subtle warm overlay for luxury feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full min-h-[90vh] lg:min-h-0 lg:aspect-[16/9] flex items-center">
        <div className="container-luxury w-full py-16 lg:py-0">
          <div className="max-w-xl lg:max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {/* Urgency Pill - Soft, Not Loud */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-accent/15 border border-accent/30"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent tracking-wide">
                  Valentine&apos;s Special · Ends Feb 14th
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.1] text-text-primary mb-6"
              >
                Adorn Your
                <br />
                <span className="italic text-accent">Love Story</span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-10 max-w-md"
              >
                Handcrafted pieces designed to celebrate your precious moments. 
                Timeless elegance, accessible luxury.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mb-10"
              >
                <Link 
                  href="/products" 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover hover:scale-[1.02]"
                >
                  <span>Shop Collection</span>
                  <svg 
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link 
                  href="/products?filter=new" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-text-primary/20 text-text-primary font-medium rounded-full transition-all duration-300 hover:border-primary hover:bg-primary/10"
                >
                  New Arrivals
                </Link>
              </motion.div>

              {/* Trust Indicators - Subtle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-wrap items-center gap-6 text-sm text-text-muted"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-accent" />
                  <span>Free Shipping on ₹999+</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent" />
                  <span>Handcrafted with Love</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade - Smooth Transition to Next Section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

      {/* Decorative Elements */}
      <motion.div
        className="absolute bottom-8 right-8 hidden lg:block z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="text-right">
          <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-1">Scroll to Explore</p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg className="w-5 h-5 text-accent mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
