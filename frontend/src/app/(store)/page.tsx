'use client';

/**
 * Premium ORA Jewellery Homepage
 * GIVA-style design: Dense, luxury, image-heavy, conversion-focused
 * 
 * Features:
 * - Large hero banner with lifestyle imagery
 * - Secondary promotional banners grid
 * - Featured collections section
 * - Valentine special section  
 * - Best sellers section
 * - High visual density with minimal text
 * - Mobile-first responsive design
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Heart, Star, Truck, Shield, RefreshCw } from 'lucide-react';
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

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FEATURED_COLLECTIONS = [
  {
    id: 1,
    title: 'Necklaces',
    subtitle: 'Close to the heart',
    image: '/necklace.png',
    href: '/collections?category=necklace'
  },
  {
    id: 2,
    title: 'Rings',
    subtitle: 'Timeless elegance',
    image: '/rings.png',
    href: '/collections?category=rings'
  },
  {
    id: 3,
    title: 'Bracelets',
    subtitle: 'Wrapped in grace',
    image: '/bracelet.png',
    href: '/collections?category=bracelets'
  }
];

const PROMOTIONAL_BANNERS = [
  {
    id: 1,
    title: 'Valentine Gifts',
    subtitle: 'Express Your Love',
    image: '/val banner.png',
    href: '/valentine-drinkware',
    className: 'bg-gradient-to-br from-[#FFD6E5] to-[#FFF7FA]'
  },
  {
    id: 2,
    title: 'Combos for Her',
    subtitle: 'Perfect Gift Sets',
    image: '/rings.png',
    href: '/collections?type=combo',
    className: 'bg-gradient-to-br from-[#FFE4EC] to-[#FFF0F5]'
  },
  {
    id: 3,
    title: 'Bestsellers',
    subtitle: 'Customer Favorites',
    image: '/necklace.png',
    href: '/collections?sort=-sales',
    className: 'bg-gradient-to-br from-[#FFF7FA] to-[#FFD6E5]'
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
  animate: { transition: { staggerChildren: 0.1 } }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  }, []);

  // Fetch featured products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: {
          limit: 8,
          sort: '-createdAt'
        }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  return (
    <main className="bg-white min-h-screen overflow-x-hidden">
      {/* ================================================================
          SECTION 1: HERO BANNER - Large lifestyle image
          ================================================================ */}
      <section className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/val banner.png"
            alt="ORA Jewellery - Premium Collection"
            fill
            className="object-cover object-center"
            priority
            quality={95}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light mb-4 lg:mb-6">
              Own. Radiate. <span className="italic">Adorn.</span>
            </h1>
            <p className="text-lg md:text-xl mb-6 lg:mb-8 opacity-90">
              Discover our exquisite collection of premium jewellery
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/collections"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#9B2C46] text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/valentine-drinkware"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-black transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span>Valentine Special</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 2: SECONDARY PROMOTIONAL BANNERS - 3 Grid  
          ================================================================ */}
      <section className="py-8 lg:py-16 bg-[#FFF7FA]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {PROMOTIONAL_BANNERS.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-2xl ${banner.className} p-8 group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
              >
                <Link href={banner.href} className="block absolute inset-0 z-0" />
                
                {/* Background image */}
                <div className="absolute inset-0 opacity-15 z-0">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-2xl lg:text-3xl font-serif font-medium text-[#1A1A1A] mb-2">
                    {banner.title}
                  </h3>
                  <p className="text-[#1A1A1A]/70 mb-6 text-lg">{banner.subtitle}</p>
                  <div className="inline-flex items-center gap-2 text-[#9B2C46] font-medium group-hover:gap-3 transition-all relative z-20">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 3: CATEGORIES - Dynamic from API
          ================================================================ */}
      <section className="py-8 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 lg:mb-12"
          >
            <h2 className="text-2xl lg:text-4xl font-serif font-light text-[#1A1A1A] mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
              Browse our premium jewellery collections
            </p>
          </motion.div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {categories.slice(0, 3).map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl bg-[#FFF7FA] hover:shadow-lg transition-all duration-300"
                >
                  <Link href={`/collections?category=${category.slug}`}>
                    <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-[#FFE4EC] to-[#FFF7FA] flex items-center justify-center">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-[#9B2C46] opacity-20">
                          <Heart className="w-32 h-32" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-serif font-medium text-[#1A1A1A] mb-2">
                        {category.name}
                      </h3>
                      <p className="text-[#1A1A1A]/70 mb-4 text-sm">
                        {category.description || `Explore ${category.name.toLowerCase()}`}
                      </p>
                      {category.productCount && (
                        <p className="text-xs text-[#1A1A1A]/50 mb-4">
                          {category.productCount} products
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[#9B2C46] font-medium group-hover:gap-3 transition-all">
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {FEATURED_COLLECTIONS.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl bg-[#FFF7FA] hover:shadow-lg transition-all duration-300"
                >
                  <Link href={collection.href}>
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={collection.image}
                        alt={collection.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-serif font-medium text-[#1A1A1A] mb-2">
                        {collection.title}
                      </h3>
                      <p className="text-[#1A1A1A]/70 mb-4">{collection.subtitle}</p>
                      <div className="flex items-center gap-2 text-[#9B2C46] font-medium group-hover:gap-3 transition-all">
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          SECTION 4B: COLLECTION SPOTLIGHT - LARGE IMAGE SHOWCASE
          ================================================================ */}
      <section className="py-8 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 lg:mb-12"
          >
            <h2 className="text-2xl lg:text-4xl font-serif font-light text-[#1A1A1A] mb-4">
              Collection Highlights
            </h2>
            <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
              Explore our curated selections with premium styling
            </p>
          </motion.div>

          {/* Featured Collection Banners - Large Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left - Large featured banner */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative overflow-hidden rounded-2xl bg-[#FFF7FA] cursor-pointer h-[400px] lg:h-full"
            >
              <Link href="/collections?category=necklace" className="block absolute inset-0 z-10" />
              <Image
                src="/necklace.png"
                alt="Necklace Collection"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 z-5" />
              <div className="absolute inset-0 flex items-end justify-start p-8 z-20">
                <div>
                  <h3 className="text-3xl lg:text-4xl font-serif font-light text-white mb-2">
                    Necklace Collection
                  </h3>
                  <p className="text-white/90 mb-4">Premium designs for every occasion</p>
                  <div className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all">
                    <span>Shop Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right - Two stacked smaller banners */}
            <div className="space-y-6">
              {/* Top banner */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-[#FFE4EC] cursor-pointer h-[190px]"
              >
                <Link href="/collections?category=rings" className="block absolute inset-0 z-10" />
                <Image
                  src="/rings.png"
                  alt="Rings Collection"
                  fill
                  className="object-cover opacity-20 transition-opacity duration-500 group-hover:opacity-30"
                />
                <div className="absolute inset-0 flex items-center justify-between p-6 z-5">
                  <div>
                    <h3 className="text-2xl font-serif font-medium text-[#1A1A1A] mb-1">
                      Rings
                    </h3>
                    <p className="text-[#1A1A1A]/70 text-sm">Timeless elegance</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#9B2C46] group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* Bottom banner */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group relative overflow-hidden rounded-2xl bg-[#FFD6E5] cursor-pointer h-[190px]"
              >
                <Link href="/collections?category=bracelets" className="block absolute inset-0 z-10" />
                <Image
                  src="/bracelet.png"
                  alt="Bracelets Collection"
                  fill
                  className="object-cover opacity-20 transition-opacity duration-500 group-hover:opacity-30"
                />
                <div className="absolute inset-0 flex items-center justify-between p-6 z-5">
                  <div>
                    <h3 className="text-2xl font-serif font-medium text-[#1A1A1A] mb-1">
                      Bracelets
                    </h3>
                    <p className="text-[#1A1A1A]/70 text-sm">Wrapped in grace</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#9B2C46] group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 5: VALENTINE SPECIAL SECTION  
          ================================================================ */}
      <section className="py-8 lg:py-16 bg-gradient-to-r from-[#FFD6E5] to-[#FFE4EC]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <h2 className="text-3xl lg:text-5xl font-serif font-light text-[#1A1A1A] mb-6">
                Valentine&apos;s
                <br />
                <span className="italic text-[#9B2C46]">Special Collection</span>
              </h2>
              <p className="text-lg text-[#1A1A1A]/80 mb-8 max-w-lg">
                Express your love with our specially curated Valentine collection. 
                Perfect pieces to celebrate your special moments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/valentine-drinkware"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#9B2C46] text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>Shop Valentine</span>
                </Link>
                <Link 
                  href="/gift-guide"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#9B2C46] text-[#9B2C46] font-medium rounded-lg hover:bg-[#9B2C46] hover:text-white transition-colors"
                >
                  <Gift className="w-5 h-5" />
                  <span>Gift Guide</span>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="/val banner.png"
                  alt="Valentine Special Collection"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 6: BEST SELLERS GRID
          ================================================================ */}
      <section className="py-8 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 lg:mb-12"
          >
            <h2 className="text-2xl lg:text-4xl font-serif font-light text-[#1A1A1A] mb-4">
              Best Sellers
            </h2>
            <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
              Discover our most loved pieces, chosen by our customers
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
            >
              {products.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={fadeInUp}
                  className="group"
                >
                  <ProductCardProduction product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-8 lg:mt-12"
          >
            <Link 
              href="/collections"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] font-medium rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              <span>View All Products</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 7: TRUST BADGES & FEATURES
          ================================================================ */}
      <section className="py-8 lg:py-16 bg-[#FFF7FA]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#FFE4EC] rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-[#9B2C46]" />
              </div>
              <h3 className="text-lg font-serif font-medium text-[#1A1A1A] mb-2">
                Free Shipping
              </h3>
              <p className="text-[#1A1A1A]/70">
                On all orders above ₹999
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#FFE4EC] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#9B2C46]" />
              </div>
              <h3 className="text-lg font-serif font-medium text-[#1A1A1A] mb-2">
                Quality Guarantee
              </h3>
              <p className="text-[#1A1A1A]/70">
                Premium materials and craftsmanship
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#FFE4EC] rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-[#9B2C46]" />
              </div>
              <h3 className="text-lg font-serif font-medium text-[#1A1A1A] mb-2">
                Easy Returns
              </h3>
              <p className="text-[#1A1A1A]/70">
                30-day hassle-free returns
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}/* Vercel rebuild trigger - Tue Feb  3 01:58:11 PM IST 2026 */
