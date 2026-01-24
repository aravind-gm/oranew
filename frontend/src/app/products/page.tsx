'use client';

/**
 * Products Page — Editorial Experience
 * 
 * Premium, curated editorial page for new jewellery drops.
 * NOT a traditional product listing—feels like a gallery opening.
 * 
 * Route: /products?category=new
 * Design: ZARA Studio × Cartier Editorial × Nykaa Luxe
 * Aesthetic: Fresh, curated, emotion-driven, conversion-focused
 * 
 * Sections:
 * 1. Editorial Hero (lifestyle, headline, CTAs)
 * 2. What's New This Season (3 editorial cards)
 * 3. Curated New Drop (4 featured products)
 * 4. Valentine's Gifting Highlight
 * 5. Why These Pieces (trust layer)
 * 6. Exit CTA (deeper funnel)
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  material?: string;
  category?: string;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

interface EditorialCard {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  category?: string;
  link: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EDITORIAL_CARDS: EditorialCard[] = [
  {
    id: 'valentine-edit',
    title: 'Valentine Edit',
    description: 'Thoughtful gifts under ₹1500 — designed for moments that matter.',
    emoji: '💝',
    link: '/valentines-special'
  },
  {
    id: 'everyday-luxe',
    title: 'Everyday Luxe',
    description: 'Minimal, wearable pieces perfect for daily elegance.',
    emoji: '✨',
    link: '/collections?maxPrice=1500'
  },
  {
    id: 'gold-finish',
    title: 'Gold Finish',
    description: 'Champagne gold — our signature luxury touch.',
    emoji: '✌️',
    link: '/collections?material=gold'
  }
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest products (max 4)
  const fetchNewProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: {
          limit: 4,
          sort: '-createdAt',
          isNew: true
        }
      });
      setProducts(response.data.data?.products || response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch new products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewProducts();
  }, [fetchNewProducts]);

  return (
    <main className="bg-background min-h-screen">
      {/* ================================================================
          SECTION 1: EDITORIAL HERO
          ================================================================ */}
      <section className="relative w-full min-h-[70vh] lg:min-h-[80vh] overflow-hidden">
        {/* Background Image - Subtle */}
        <div className="absolute inset-0">
          <Image
            src="/val banner.png"
            alt="Fresh designs from ORA Atelier"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Elegant gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full min-h-[70vh] lg:min-h-[80vh] flex items-center">
          <div className="container-luxury w-full py-20 lg:py-0">
            <div className="max-w-xl lg:max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Editorial Tag */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-3 mb-8"
                >
                  <span className="w-10 h-px bg-accent" />
                  <span className="text-xs tracking-[0.3em] uppercase text-accent font-medium">
                    Fresh Arrival
                  </span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.05] text-text-primary mb-6"
                >
                  Fresh from the
                  <br />
                  <span className="italic text-accent">ORA Atelier</span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-10 max-w-lg"
                >
                  New designs crafted in limited numbers. Each piece celebrates 
                  individuality and timeless beauty.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link 
                    href="#curated-drop"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover hover:scale-[1.02]"
                  >
                    <span>Explore This Edit</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/valentines-special"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-text-primary/20 text-text-primary font-medium rounded-full transition-all duration-300 hover:border-accent hover:bg-accent/5"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Valentine Specials</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs tracking-[0.2em] uppercase text-text-muted">Scroll</span>
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ================================================================
          SECTION 2: WHAT'S NEW THIS SEASON
          Editorial Content Cards (Not Products)
          ================================================================ */}
      <section className="section-luxury bg-background-white">
        <div className="container-luxury">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-accent">Curated Edit</span>
            <h2 className="heading-section mt-3 text-text-primary">What's New This Season</h2>
            <p className="text-text-secondary mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Discover our carefully selected collections for every mood and moment.
            </p>
          </motion.div>

          {/* Editorial Cards Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {EDITORIAL_CARDS.map((card) => (
              <motion.div
                key={card.id}
                variants={fadeInUp}
                className="group"
              >
                <Link href={card.link}>
                  <div className="relative bg-background rounded-luxury overflow-hidden transition-all duration-500 hover:shadow-luxury-hover cursor-pointer h-full flex flex-col">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 group-hover:from-primary/30 group-hover:to-accent/20 transition-all duration-500" />
                    
                    {/* Emoji / Icon */}
                    {card.emoji && (
                      <div className="relative pt-10 px-6">
                        <div className="text-5xl">{card.emoji}</div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative flex-1 px-6 pb-8 pt-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-2xl text-text-primary mb-3">
                          {card.title}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      {/* CTA Arrow */}
                      <div className="flex items-center gap-2 text-accent mt-6 transition-all duration-300 group-hover:gap-3">
                        <span className="text-xs font-medium tracking-[0.1em] uppercase">
                          Explore
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 3: CURATED NEW DROP
          Limited Products (4 items max, NO pagination)
          ================================================================ */}
      <section className="section-luxury bg-background" id="curated-drop">
        <div className="container-luxury">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-accent">New Designs</span>
            <h2 className="heading-section mt-3 text-text-primary">Limited New Drop</h2>
            <p className="text-text-secondary mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Handpicked pieces from our latest designs, curated for you.
            </p>
          </motion.div>

          {/* Product Grid (4 items max, no pagination) */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-border rounded-luxury mb-4" />
                  <div className="h-4 bg-border rounded w-3/4 mb-2" />
                  <div className="h-3 bg-border rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={fadeInUp}
                >
                  <ProductCardProduction product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <p className="text-text-secondary">Products coming soon. Check back soon!</p>
            </div>
          )}

          {/* View All CTA */}
          {products.length > 0 && (
            <motion.div 
              className="text-center mt-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link 
                href="/collections"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-text-primary/20 text-text-primary font-medium rounded-full transition-all duration-300 hover:border-accent hover:bg-accent/5 group"
              >
                <span>Browse All Collections</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ================================================================
          SECTION 4: VALENTINE'S GIFTING HIGHLIGHT
          ================================================================ */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary/15 to-accent/10 border-y border-border/50">
        <div className="container-luxury">
          <motion.div
            className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Content */}
            <div className="flex-1">
              <span className="text-xs tracking-[0.3em] uppercase text-accent font-medium">
                Perfect for Gifting
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary mt-3 mb-4 leading-tight">
                Thoughtful gifts for moments that matter
              </h2>
              <p className="text-text-secondary leading-relaxed mb-2">
                Choose from our curated selections:
              </p>
              <ul className="text-text-secondary space-y-2 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span className="text-sm">Delicate Necklaces — close to the heart</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span className="text-sm">Promise Rings — symbols of commitment</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span className="text-sm">Matching Bracelets — for couples</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span className="text-sm">Combo Sets — gift-ready, thoughtfully paired</span>
                </li>
              </ul>

              {/* CTA */}
              <Link 
                href="/valentines-special"
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover group"
              >
                <Heart className="w-5 h-5" />
                <span>Shop Valentine Combos</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Visual Element */}
            <div className="flex-1 w-full max-w-sm">
              <div className="aspect-square rounded-luxury bg-background-white shadow-luxury overflow-hidden border border-border/30">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                  <div className="text-center">
                    <Heart className="w-20 h-20 text-primary/40 mx-auto mb-4" />
                    <p className="text-text-secondary text-sm">Valentine's Specials</p>
                    <p className="text-text-muted text-xs mt-1">Under ₹1500</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 5: WHY THESE PIECES (Trust Layer)
          Minimal reassurance — no icon overload
          ================================================================ */}
      <section className="py-12 lg:py-16 bg-background-white">
        <div className="container-luxury">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Trust Point 1 */}
            <div className="text-center lg:text-left">
              <p className="font-medium text-text-primary mb-2">Designed for Gifting</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Each piece is curated with the gift-giver in mind. Thoughtful, elegant, meaningful.
              </p>
            </div>

            {/* Trust Point 2 */}
            <div className="text-center lg:text-left">
              <p className="font-medium text-text-primary mb-2">Premium Finish</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Champagne gold, soft pink, and ivory finishes that feel luxurious and timeless.
              </p>
            </div>

            {/* Trust Point 3 */}
            <div className="text-center lg:text-left">
              <p className="font-medium text-text-primary mb-2">Lightweight & Comfortable</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Perfect for all-day wear. Designed for comfort without compromising on elegance.
              </p>
            </div>

            {/* Trust Point 4 */}
            <div className="text-center lg:text-left">
              <p className="font-medium text-text-primary mb-2">Free Shipping</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                All orders over ₹999 ship free. Fast, secure, and beautifully packaged.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 6: EXIT CTA (Strong Close)
          Funnel users deeper into collections
          ================================================================ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-background to-primary/10">
        <div className="container-luxury">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-4xl sm:text-5xl text-text-primary mb-6 leading-tight">
              Discover the Full Collection
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-10 max-w-lg mx-auto">
              Explore our entire range of curated designs, from everyday essentials to statement pieces.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/collections"
                className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover hover:scale-[1.02] group"
              >
                <span>View All Jewellery</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link 
                href="/account/wishlist"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-text-primary/20 text-text-primary font-medium rounded-full transition-all duration-300 hover:border-accent hover:bg-accent/5"
              >
                <span>My Wishlist</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}


