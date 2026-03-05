'use client';

/**
 * CuratedProducts — Admin-Controlled Product Showcase
 * 
 * Purpose: Display hand-picked featured products
 * UX: Product grid with full product cards (add to cart, wishlist, etc.)
 * Admin Control: Products selected via collection OR metaobject product list
 * Mobile: 2 columns, Desktop: 4 columns
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
  category?: string;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

interface CuratedProductsProps {
  heading?: string;
  subheading?: string;
  collectionSlug?: string; // Fetch from collection
  productIds?: string[]; // Or specific product IDs
  limit?: number;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function CuratedProducts({
  heading = 'Curated for You',
  subheading = "Our team's handpicked favorites — timeless pieces you'll adore.",
  collectionSlug = 'featured', // Default collection
  productIds,
  limit = 8,
  ctaLabel = 'View All',
  ctaHref = '/collections/featured',
}: CuratedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (productIds && productIds.length > 0) {
        // Fetch specific products by IDs
        const response = await api.get('/products', {
          params: {
            ids: productIds.join(','),
            limit,
          },
        });
        setProducts(response.data.products || []);
      } else if (collectionSlug) {
        // Fetch from collection
        const response = await api.get('/products', {
          params: {
            collection: collectionSlug,
            limit,
            sort: '-createdAt',
          },
        });
        setProducts(response.data.products || []);
      } else {
        // Fallback: fetch newest products
        const response = await api.get('/products', {
          params: {
            limit,
            sort: '-createdAt',
          },
        });
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch curated products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [collectionSlug, productIds, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section className="py-12 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            {heading}
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-2xl mx-auto">
            {subheading}
          </p>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-4 md:gap-6 lg:gap-8">
            {[...Array(limit)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-white/50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-4 md:gap-6 lg:gap-8"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <ProductCardProduction product={product} />
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-10 md:mt-14"
            >
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] font-medium rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-400 text-lg">No products available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
