'use client';

/**
 * Bestsellers — First Product Grid on Homepage
 *
 * Title: "Customer Favorites"
 * Subtext: "Our most gifted pieces."
 * Grid: Desktop 4 col, Tablet 2 col, Mobile 2 col
 * Max 8 products.
 * Uses LuxuryProductCard.
 * Skeleton loading.
 */

import LuxuryProductCard from '@/components/product/LuxuryProductCard';
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
  description?: string;
  images: Array<{
    id?: string;
    imageUrl: string;
    isPrimary?: boolean;
    altText?: string;
  }>;
}

export default function Bestsellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBestsellers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: { limit: 8, sort: '-createdAt' },
      });
      const data = response.data.data || response.data.products || [];
      setProducts(data);
    } catch (error) {
      console.error('Bestsellers: fetch failed', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBestsellers();
  }, [fetchBestsellers]);

  // Assign visual badges for psychology (first 3 get special badges)
  const getBadge = (index: number): 'bestseller' | 'most-gifted' | 'limited' | null => {
    if (index === 0) return 'bestseller';
    if (index === 2) return 'most-gifted';
    if (index === 5) return 'limited';
    return null;
  };

  const getLimitedStock = (index: number): number | null => {
    if (index === 5) return 5;
    if (index === 7) return 3;
    return null;
  };

  return (
    <section className="py-14 md:py-20 lg:py-24 bg-white">
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
            Featured Styles
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-xl mx-auto">
            Our most gifted pieces.
          </p>
        </motion.div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/5] bg-neutral-100 rounded-xl animate-pulse" />
                <div className="h-4 bg-neutral-100 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-neutral-100 rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-neutral-100 rounded w-1/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={{
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
          >
            {products.slice(0, 8).map((product, index) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: 'easeOut' },
                  },
                }}
              >
                <LuxuryProductCard
                  product={product}
                  badge={getBadge(index)}
                  limitedStock={getLimitedStock(index)}
                  priority={index < 4}
                />
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
