'use client';

/**
 * Home Page — Valentine's Special Edition
 * ORA Jewellery
 * 
 * A premium, editorial Valentine's Day destination page featuring:
 * - Editorial hero with emotional storytelling
 * - Gift by category (Necklaces, Rings, Bracelets)
 * - Curated Valentine combos (jewellery-only)
 * - Subtle lifestyle add-on section
 * - Valentine picks grid (max ₹1500)
 * - Gift assurance strip
 * 
 * Design: Emotional, editorial, luxury — no loud discounts or countdown timers
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Heart, Package, RefreshCw, Shield, Sparkles, Star, Truck } from 'lucide-react';
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

interface ComboItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  products: string[];
  originalPrice: number;
  comboPrice: number;
  image: string;
  badge?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PRICE = 1500;

const CATEGORIES = [
  { 
    id: 'necklaces', 
    label: 'Necklaces',
    tagline: 'Close to the heart',
    description: 'Delicate chains that whisper love',
    image: '/necklace.png'
  },
  { 
    id: 'rings', 
    label: 'Rings',
    tagline: 'A promise worn',
    description: 'Circles of eternal devotion',
    image: '/rings.png'
  },
  { 
    id: 'bracelets', 
    label: 'Bracelets',
    tagline: 'Wrapped in affection',
    description: 'Gentle reminders on her wrist',
    image: '/bracelet.png'
  },
] as const;

const VALENTINE_COMBOS: ComboItem[] = [
  {
    id: 'eternal-love',
    name: 'Eternal Love Set',
    tagline: 'For the one who has your heart',
    description: 'A delicate necklace paired with matching stud earrings — timeless elegance for everyday wear.',
    products: ['necklace', 'earrings'],
    originalPrice: 1499,
    comboPrice: 1299,
    image: '/combo-eternal.jpg',
    badge: 'Most Gifted'
  },
  {
    id: 'promise-duo',
    name: 'Promise Duo',
    tagline: 'Two hearts, one promise',
    description: 'Matching couple bracelets crafted with intention — wear your bond wherever you go.',
    products: ['bracelet', 'bracelet'],
    originalPrice: 1299,
    comboPrice: 1099,
    image: '/combo-promise.jpg'
  },
  {
    id: 'sweetheart-collection',
    name: 'Sweetheart Collection',
    tagline: 'The complete gesture',
    description: 'Ring and bracelet set designed to complement — a complete expression of affection.',
    products: ['ring', 'bracelet'],
    originalPrice: 1399,
    comboPrice: 1199,
    image: '/combo-sweetheart.jpg',
    badge: 'Editor\'s Pick'
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
  animate: { transition: { staggerChildren: 0.1 } }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addOnSelected, setAddOnSelected] = useState(false);

  // Fetch products under ₹1500
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: {
          limit: 12,
          maxPrice: MAX_PRICE,
          sort: '-createdAt',
          ...(selectedCategory && { category: selectedCategory })
        }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <main className="bg-background min-h-screen">
      {/* ================================================================
          SECTION 1: Editorial Valentine Hero
          ================================================================ */}
      <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/val banner.png"
            alt="Valentine's Special Collection - ORA Jewellery"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Elegant Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full min-h-[85vh] lg:min-h-[90vh] flex items-center">
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
                  <span className="w-12 h-px bg-accent" />
                  <span className="text-sm tracking-[0.3em] uppercase text-accent font-medium">
                    Valentine&apos;s Special
                  </span>
                </motion.div>

                {/* Main Headline — Emotional, Editorial */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.05] text-text-primary mb-8"
                >
                  Gift the Glow
                  <br />
                  <span className="italic text-accent">She Deserves</span>
                </motion.h1>

                {/* Subheading — Soft, Inviting */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-10 max-w-lg"
                >
                  Curated pieces under ₹1500 — thoughtfully designed for 
                  moments that matter. Because love doesn&apos;t need a grand gesture, 
                  just the right one.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link 
                    href="#valentine-picks"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover hover:scale-[1.02]"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Shop Valentine Picks</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="#gift-combos"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-text-primary/20 text-text-primary font-medium rounded-full transition-all duration-300 hover:border-accent hover:bg-accent/5"
                  >
                    <Gift className="w-5 h-5" />
                    <span>Explore Combos</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
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
          SECTION 2: Gift by Category
          ================================================================ */}
      <section className="section-luxury bg-background-white" id="gift-by-category">
        <div className="container-luxury">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-accent">Find the Perfect Gift</span>
            <h2 className="heading-section mt-3 text-text-primary">Gift by Category</h2>
            <p className="text-text-secondary mt-4 max-w-xl mx-auto">
              Every love story is unique. Find the piece that speaks to yours.
            </p>
          </motion.div>

          {/* Category Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {CATEGORIES.map((category) => (
              <motion.div
                key={category.id}
                variants={fadeInUp}
                className="group relative"
              >
                <Link href={`/collections?category=${category.id}`}>
                  <div className="relative aspect-[3/4] rounded-luxury overflow-hidden bg-background">
                    {/* Category Image */}
                    <Image
                      src={category.image}
                      alt={category.label}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-text-primary/80 via-text-primary/20 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <span className="text-xs tracking-[0.2em] uppercase text-primary-light mb-2">
                        {category.tagline}
                      </span>
                      <h3 className="font-serif text-3xl text-white mb-2">
                        {category.label}
                      </h3>
                      <p className="text-white/70 text-sm mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center gap-2 text-primary transition-all duration-300 group-hover:gap-3">
                        <span className="text-sm font-medium">Shop Now</span>
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
          SECTION 3: Valentine Combos (Jewellery Only)
          ================================================================ */}
      <section className="section-luxury bg-background" id="gift-combos">
        <div className="container-luxury">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-accent">Curated with Love</span>
            <h2 className="heading-section mt-3 text-text-primary">Valentine Combos</h2>
            <p className="text-text-secondary mt-4 max-w-xl mx-auto">
              Thoughtfully paired pieces that tell a complete story — 
              designed to make gifting effortless.
            </p>
          </motion.div>

          {/* Combo Cards */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {VALENTINE_COMBOS.map((combo) => (
              <motion.div
                key={combo.id}
                variants={fadeInUp}
                className="group bg-background-white rounded-luxury overflow-hidden shadow-luxury transition-all duration-300 hover:shadow-luxury-hover"
              >
                {/* Combo Image */}
                <div className="relative aspect-[4/3] bg-background overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
                  
                  {/* Placeholder for combo imagery — shows product silhouettes */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      {combo.products.map((product, i) => (
                        <div 
                          key={i}
                          className="w-20 h-20 rounded-full bg-background-white/80 shadow-luxury flex items-center justify-center"
                        >
                          <Sparkles className="w-8 h-8 text-accent/60" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badge */}
                  {combo.badge && (
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium bg-accent/90 text-text-primary rounded-full">
                        <Star className="w-3 h-3" />
                        {combo.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Combo Details */}
                <div className="p-6">
                  <span className="text-xs tracking-[0.15em] uppercase text-accent">
                    {combo.tagline}
                  </span>
                  <h3 className="font-serif text-xl text-text-primary mt-2 mb-3">
                    {combo.name}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-6">
                    {combo.description}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="font-serif text-2xl text-text-primary">
                      ₹{combo.comboPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-text-muted line-through">
                      ₹{combo.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-success font-medium">
                      Save ₹{(combo.originalPrice - combo.comboPrice).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* CTA */}
                  <button className="w-full py-3 px-6 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury group-hover:scale-[1.02]">
                    Add Combo to Bag
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 4: Complete the Gift (Subtle Add-on)
          ================================================================ */}
      <section className="py-16 bg-background-white border-y border-border">
        <div className="container-luxury">
          <motion.div
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Add-on Image */}
            <div className="relative w-full lg:w-1/3 aspect-square max-w-sm">
              <div className="absolute inset-0 rounded-luxury overflow-hidden bg-gradient-to-br from-primary/10 to-accent/5 border border-border">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Placeholder for Stanley Cup image */}
                  <div className="text-center">
                    <div className="w-32 h-40 mx-auto bg-gradient-to-b from-accent/20 to-accent/5 rounded-lg mb-4 flex items-center justify-center">
                      <Package className="w-16 h-16 text-accent/40" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Optional Tag */}
              <div className="absolute -top-3 -right-3 px-4 py-2 bg-background-white rounded-full shadow-luxury border border-border">
                <span className="text-xs tracking-[0.1em] uppercase text-accent font-medium">Optional Add-on</span>
              </div>
            </div>

            {/* Add-on Content */}
            <div className="flex-1 text-center lg:text-left">
              <span className="text-sm tracking-[0.2em] uppercase text-text-muted">Complete the Gift</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-text-primary mt-3 mb-4">
                Pair with a Keepsake
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
                Make your gift extra special. Add a premium Stanley tumbler — 
                perfect for her morning coffee ritual. A thoughtful touch that 
                shows you care about the little moments.
              </p>

              {/* Add-on Option */}
              <div 
                className={`inline-flex items-center gap-4 p-4 rounded-luxury border-2 transition-all duration-300 cursor-pointer ${
                  addOnSelected 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setAddOnSelected(!addOnSelected)}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  addOnSelected 
                    ? 'border-accent bg-accent' 
                    : 'border-text-muted'
                }`}>
                  {addOnSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">Stanley Quencher 40oz</p>
                  <p className="text-sm text-text-muted">Soft Pink Edition</p>
                </div>
                <span className="font-serif text-lg text-text-primary ml-4">+ ₹499</span>
              </div>

              <p className="text-xs text-text-muted mt-4">
                * Add-on will be included with your jewellery order
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 5: Valentine Picks Grid (₹1500 max)
          ================================================================ */}
      <section className="section-luxury bg-background" id="valentine-picks">
        <div className="container-luxury">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-accent">Under ₹1500</span>
            <h2 className="heading-section mt-3 text-text-primary">Valentine Picks</h2>
            <p className="text-text-secondary mt-4 max-w-xl mx-auto">
              Handpicked pieces that prove thoughtfulness doesn&apos;t have a price tag.
            </p>
          </motion.div>

          {/* Category Filter Pills */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mb-12"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-primary text-text-primary shadow-luxury'
                  : 'bg-background-white text-text-secondary border border-border hover:border-primary'
              }`}
            >
              All Pieces
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-text-primary shadow-luxury'
                    : 'bg-background-white text-text-secondary border border-border hover:border-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-border rounded-luxury mb-4" />
                  <div className="h-4 bg-border rounded w-3/4 mb-2" />
                  <div className="h-4 bg-border rounded w-1/2" />
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
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCardProduction product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 text-primary/50 mx-auto mb-4" />
              <p className="text-text-secondary">
                No products found. Please try a different category.
              </p>
            </div>
          )}

          {/* View All CTA */}
          {products.length > 0 && (
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link 
                href="/collections"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-text-primary/20 text-text-primary font-medium rounded-full transition-all duration-300 hover:border-primary hover:bg-primary/5 group"
              >
                <span>View All Collections</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ================================================================
          SECTION 6: Gift Assurance Strip (Minimal)
          ================================================================ */}
      <section className="py-12 bg-background-white border-t border-border">
        <div className="container-luxury">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Free Shipping */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Truck className="w-5 h-5 text-accent" />
              </div>
              <p className="font-medium text-text-primary text-sm">Free Shipping</p>
              <p className="text-xs text-text-muted mt-1">On orders ₹999+</p>
            </div>

            {/* Gift Wrapped */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Gift className="w-5 h-5 text-accent" />
              </div>
              <p className="font-medium text-text-primary text-sm">Gift Wrapped</p>
              <p className="text-xs text-text-muted mt-1">Complimentary packaging</p>
            </div>

            {/* Easy Returns */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <RefreshCw className="w-5 h-5 text-accent" />
              </div>
              <p className="font-medium text-text-primary text-sm">Easy Returns</p>
              <p className="text-xs text-text-muted mt-1">7-day return policy</p>
            </div>

            {/* Secure Checkout */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <p className="font-medium text-text-primary text-sm">Secure Checkout</p>
              <p className="text-xs text-text-muted mt-1">100% protected</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA SECTION
          ================================================================ */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/10">
        <div className="container-luxury">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Heart className="w-10 h-10 text-accent mx-auto mb-6" />
            <h2 className="font-serif text-3xl sm:text-4xl text-text-primary mb-4">
              Ready to Make Her Day?
            </h2>
            <p className="text-text-secondary leading-relaxed mb-8">
              Every piece comes gift-wrapped with love. 
              Order by February 10th for Valentine&apos;s Day delivery.
            </p>
            <Link 
              href="/collections"
              className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-text-primary font-medium rounded-full transition-all duration-300 hover:bg-primary-dark hover:shadow-luxury-hover hover:scale-[1.02]"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
