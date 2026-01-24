'use client';

/**
 * Valentine's Day Drinkware Collection — ORA
 * 
 * A dedicated collection page for Valentine's Day drinkware combos featuring:
 * - Hero banner with "Sip Into Love" theme
 * - Three drinkware tiers (₹999, ₹1,499, ₹2,499)
 * - Conversion-optimized product cards with anchoring strategy
 * - Add-to-cart with upgrade options
 * - Limited time urgency messaging
 * 
 * Design: Premium, emotional, gift-focused
 */

import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Heart, Package, ShoppingBag, Star, Truck } from 'lucide-react';
import Image from 'next/image';
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
  description?: string;
  shortDescription?: string;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DRINKWARE_TIERS = [
  {
    id: 'ultimate-gift-box',
    name: 'Ultimate Valentine Gift Box',
    price: 2499,
    originalPrice: 3200,
    tagline: 'The gift that says "I went all out."',
    description: 'Complete Valentine experience with premium marble cup, floral gift box, and velvet carry pouch.',
    features: [
      'Premium Marble Quencher Cup',
      'Floral-themed gift box',
      'Soft velvet carry pouch',
      'Ready-to-gift presentation'
    ],
    badge: 'Best Value',
    popular: true,
    savings: 700
  },
  {
    id: 'marble-love-cup',
    name: 'Marble Love Cup',
    price: 1499,
    originalPrice: 1499,
    tagline: 'A little luxury, made to last.',
    description: 'Premium marble finish tumbler with double-wall insulation and elegant pastel tones.',
    features: [
      'Premium marble finish (no two alike)',
      'Double-wall insulated steel',
      'Elegant pastel tones',
      'Feels luxurious, looks exclusive'
    ],
    badge: 'Premium',
    popular: false,
    savings: 0
  },
  {
    id: 'everyday-love-cup',
    name: 'Everyday Love Cup',
    price: 999,
    originalPrice: 999,
    tagline: 'Simple. Thoughtful. Always there.',
    description: 'Lightweight tumbler perfect for daily use with spill-resistant lid and easy-grip handle.',
    features: [
      'Keeps drinks hot & cold for hours',
      'Lightweight & easy-grip handle',
      'Perfect everyday Valentine gift',
      'Spill-resistant lid'
    ],
    badge: null,
    popular: false,
    savings: 0
  },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ValentineDrinkwareCollection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch drinkware products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: {
          category: 'drinkware',
          limit: 20,
          sort: '-price' // Show premium items first (anchoring strategy)
        }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch drinkware products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <main className="bg-background min-h-screen">
      {/* ================================================================
          HERO BANNER
          ================================================================ */}
      <section className="relative min-h-[70vh] bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary" />
          <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-accent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/30" />
        </div>

        <div className="relative z-10 container-luxury h-full min-h-[70vh] flex items-center py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Urgency Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 rounded-full border border-accent/20 mb-8"
            >
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-sm font-medium text-accent">⏰ Limited Valentine Stock — Once It's Gone, It's Gone</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.05] text-text-primary mb-6"
            >
              Sip Into Love
              <br />
              <span className="text-accent">💕</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl sm:text-2xl text-text-secondary leading-relaxed mb-8 max-w-2xl mx-auto"
            >
              Limited Valentine&apos;s Day Combos — Gifting Made Effortless
            </motion.p>

            {/* Value Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-6 text-sm text-text-muted mb-8"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>Free shipping on all combos</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span>Ready-to-gift packaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Thoughtfully curated</span>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <button 
                onClick={() => document.getElementById('valentine-combos')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover hover:scale-[1.02]"
              >
                <span>🩷 Shop Valentine Combos</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          VALENTINE DRINKWARE COMBOS (ANCHORING STRATEGY)
          ================================================================ */}
      <section id="valentine-combos" className="section-luxury bg-background-white">
        <div className="container-luxury">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-accent">🔥 Combo Structure (Clear & Simple)</span>
            <h2 className="heading-section mt-3 text-text-primary">Choose Your Perfect Combo</h2>
            <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
              From everyday elegance to luxury gift experiences — each combo designed to make gifting effortless.
            </p>
          </motion.div>

          {/* Combo Cards Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {DRINKWARE_TIERS.map((tier) => (
              <motion.div
                key={tier.id}
                variants={fadeInUp}
                className={`relative bg-background rounded-luxury p-8 border-2 transition-all duration-300 hover:shadow-luxury-hover ${
                  tier.popular 
                    ? 'border-accent shadow-luxury scale-105' 
                    : 'border-border hover:border-accent/50'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-accent text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Tier Badge */}
                {tier.badge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                    <Star className="w-3 h-3" />
                    <span>{tier.badge}</span>
                  </div>
                )}

                {/* Price (Anchoring) */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-serif text-4xl font-bold text-text-primary">
                      ₹{tier.price.toLocaleString('en-IN')}
                    </span>
                    {tier.savings > 0 && (
                      <span className="text-lg text-text-muted line-through">
                        ₹{tier.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {tier.savings > 0 && (
                    <p className="text-sm text-success font-medium">
                      💡 Perceived value = ₹{tier.originalPrice.toLocaleString('en-IN')}+ → Selling at ₹{tier.price.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                {/* Product Name & Tagline */}
                <div className="mb-4">
                  <h3 className="font-serif text-xl font-medium text-text-primary mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-accent font-medium text-sm">
                    {tier.tagline}
                  </p>
                </div>

                {/* Description */}
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  {tier.description}
                </p>

                {/* Features */}
                <div className="mb-8">
                  <p className="text-xs font-medium text-text-primary mb-3 uppercase tracking-wide">
                    What&apos;s included:
                  </p>
                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button className={`w-full py-3 px-6 font-medium rounded-full transition-all duration-300 ${
                  tier.popular
                    ? 'bg-accent text-white hover:bg-accent/90 shadow-luxury'
                    : 'bg-primary text-text-primary hover:bg-primary-dark'
                } hover:shadow-luxury-hover hover:scale-[1.02]`}>
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Conversion Strategy Info */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-success/10 rounded-full border border-success/20">
              <span className="text-success">✨</span>
              <span className="text-sm font-medium text-success">
                A sweet reminder with every sip — Because love deserves something special
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          GIFT ASSURANCE STRIP
          ================================================================ */}
      <section className="py-12 bg-background border-t border-border">
        <div className="container-luxury">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-text-primary text-sm mb-1">Free Shipping</p>
              <p className="text-xs text-text-muted">On all Valentine combos</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <p className="font-medium text-text-primary text-sm mb-1">Gift Ready</p>
              <p className="text-xs text-text-muted">Beautiful packaging included</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-text-primary text-sm mb-1">Love Guarantee</p>
              <p className="text-xs text-text-muted">30-day exchange policy</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <p className="font-medium text-text-primary text-sm mb-1">Premium Quality</p>
              <p className="text-xs text-text-muted">BPA-free, food-safe materials</p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}