'use client';

/**
 * FeaturedPicks — Editorial Product Showcase
 * 
 * Purpose: Show best products early in the scroll journey.
 * UX: 4-6 large editorial-style cards with minimal UI,
 *      hover reveals "View Product" overlay, badge system.
 * Motion: Staggered fade-in, soft scale on hover.
 * Mobile: 2-column grid, swipeable if needed.
 * Performance: Lazy-loaded images, skeleton states.
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

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
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

interface FeaturedPicksProps {
  heading?: string;
  subheading?: string;
  limit?: number;
}

export default function FeaturedPicks({
  heading = 'Curated for You',
  subheading = 'Handpicked pieces our customers adore',
  limit = 8,
}: FeaturedPicksProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: { limit, sort: '-createdAt' },
      });
      // Handle response format: backend returns { data: [...], pagination: {...} }
      const productData = response.data.data || response.data.products || [];
      setProducts(productData);
    } catch (error) {
      console.error('FeaturedPicks: Failed to fetch products', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section className="py-12 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            {heading}
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-xl mx-auto">
            {subheading}
          </p>
        </motion.div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
          >
            {products.slice(0, limit).map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                }}
              >
                <ProductCardProduction product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-10 md:mt-14"
        >
          <Link
            href="/collections"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-medium rounded-full hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
