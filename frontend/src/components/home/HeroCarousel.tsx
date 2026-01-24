'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Sparkles, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// Hero slide data - Update with actual campaign images
const heroSlides = [
  {
    id: 1,
    image: '/hero/valentine-collection.jpg',
    alt: 'Indian woman wearing elegant ORA necklace set',
    pill: "Valentine's Special · Ends Feb 14th",
    pillIcon: 'sparkles',
    headline: 'Adorn Your',
    headlineAccent: 'Love Story',
    subheading: 'Handcrafted pieces designed to celebrate your precious moments. Timeless elegance, accessible luxury.',
    primaryCta: { text: 'Shop Collection', href: '/products' },
    secondaryCta: { text: 'New Arrivals', href: '/products?filter=new' },
  },
  {
    id: 2,
    image: '/hero/bridal-collection.jpg',
    alt: 'Bride wearing ORA bridal jewellery set',
    pill: 'Bridal Edit · New Season',
    pillIcon: 'heart',
    headline: 'Your Perfect',
    headlineAccent: 'Bridal Moment',
    subheading: 'Curated sets for your most precious day. From sangeet to reception, shine at every celebration.',
    primaryCta: { text: 'Shop Bridal', href: '/products?category=bridal' },
    secondaryCta: { text: 'View Lookbook', href: '/lookbook/bridal' },
  },
  {
    id: 3,
    image: '/hero/everyday-elegance.jpg',
    alt: 'Professional woman wearing minimal ORA earrings',
    pill: 'Free Shipping on ₹999+',
    pillIcon: 'truck',
    headline: 'Everyday',
    headlineAccent: 'Elegance',
    subheading: 'Minimal, modern pieces for the woman who carries her confidence. Office to evening, effortlessly.',
    primaryCta: { text: 'Shop Everyday', href: '/products?category=everyday' },
    secondaryCta: { text: 'Bestsellers', href: '/products?filter=bestsellers' },
  },
];

const PillIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'heart':
      return <Heart className="w-4 h-4 text-accent" />;
    case 'truck':
      return <Truck className="w-4 h-4 text-accent" />;
    default:
      return <Sparkles className="w-4 h-4 text-accent" />;
  }
};

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const slide = heroSlides[currentSlide];

  return (
    <section 
      className="relative w-full min-h-[90vh] lg:aspect-[16/9] lg:min-h-0 overflow-hidden bg-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with Crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Gradient Overlay for Text Legibility */}
          <div className="absolute inset-0 hero-gradient-left" />
          {/* Subtle warm overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative z-10 h-full min-h-[90vh] lg:min-h-0 lg:aspect-[16/9] flex items-center">
        <div className="container-luxury w-full py-16 lg:py-0">
          <div className="max-w-xl lg:max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* Urgency Pill */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-accent/15 border border-accent/30 backdrop-blur-sm"
                >
                  <PillIcon type={slide.pillIcon} />
                  <span className="text-sm font-medium text-accent tracking-wide">
                    {slide.pill}
                  </span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.1] text-text-primary mb-6 hero-text-shadow"
                >
                  {slide.headline}
                  <br />
                  <span className="italic text-accent">{slide.headlineAccent}</span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-10 max-w-md"
                >
                  {slide.subheading}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 mb-10"
                >
                  <Link 
                    href={slide.primaryCta.href}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover hover:scale-[1.02]"
                  >
                    <span>{slide.primaryCta.text}</span>
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
                    href={slide.secondaryCta.href}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-text-primary/20 text-text-primary font-medium rounded-full transition-all duration-300 hover:border-primary hover:bg-primary/10 backdrop-blur-sm"
                  >
                    {slide.secondaryCta.text}
                  </Link>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
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
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Desktop Only */}
      <div className="hidden lg:block">
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background-white/80 backdrop-blur-sm flex items-center justify-center text-text-primary shadow-luxury transition-all duration-300 hover:bg-background-white hover:shadow-luxury-hover hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background-white/80 backdrop-blur-sm flex items-center justify-center text-text-primary shadow-luxury transition-all duration-300 hover:bg-background-white hover:shadow-luxury-hover hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? 'w-8 bg-accent'
                : 'w-2 bg-text-primary/30 hover:bg-text-primary/50'
            }`}
          />
        ))}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

      {/* Scroll Indicator - Desktop Only */}
      <motion.div
        className="absolute bottom-8 right-8 hidden lg:block z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
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
