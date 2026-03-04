'use client';

/**
 * NewArrivals — Smaller Product Grid (4-6 items)
 *
 * Not full catalogue. Limited selection.
 * Uses LuxuryProductCard.
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

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNewArrivals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: { limit: 4, sort: '-createdAt' },
      });
      const data = response.data.data || response.data.products || [];
      setProducts(data);
    } catch (error) {
      console.error('NewArrivals: fetch failed', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewArrivals();
  }, [fetchNewArrivals]);

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
            Just Dropped
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-xl mx-auto">
            Fresh designs you&apos;ll want to wear every day.
          </p>
        </motion.div>

        {/* Product Grid — 4 items max */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/5] bg-neutral-100 rounded-xl animate-pulse" />
                <div className="h-4 bg-neutral-100 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-neutral-100 rounded w-1/2 animate-pulse" />
              </div>
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
            {products.slice(0, 4).map((product) => (
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
                <LuxuryProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-10 md:mt-14"
        >
          <Link
            href="/collections?sort=-createdAt"
            className="group inline-flex items-center gap-2.5 text-[#1A1A1A] font-medium hover:text-secondary-600 transition-colors duration-300"
          >
            <span>See All New Arrivals</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
