'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * FeaturedPicks — Editorial hero product grid
 * ORA Valentine's Special | Production-ready
 *
 * ▸ 4–6 hero product cards in editorial 2×3 grid
 * ▸ Mix: necklaces, earrings, tumbler
 * ▸ Large imagery with soft zoom hover
 * ▸ Minimal UI — name, price, badge only
 * ▸ Badges: Best Seller, Limited, Valentine Pick
 * ▸ Quick "View Product" on hover
 * ▸ Uses ProductCardProduction for consistent behavior
 * ═══════════════════════════════════════════════════════════════
 */

import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Eye, Sparkles, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import styles from './valentine.module.css';

/* ─── Types ─── */
interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary?: boolean;
  altText?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent?: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  material?: string;
  category?: string;
  images: ProductImage[];
  stockQuantity?: number;
  description?: string;
}

interface FeaturedPicksProps {
  products: Product[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

/* ─── Badge helper ─── */
function getBadge(product: Product): { label: string; style: string; icon: React.ReactNode } | null {
  if (product.isBestseller) return {
    label: 'Best Seller',
    style: 'bg-rose-700/90 text-white',
    icon: <Star className="w-3 h-3" aria-hidden="true" />,
  };
  if (product.isNew) return {
    label: 'Limited',
    style: 'bg-amber-600/90 text-white',
    icon: <Sparkles className="w-3 h-3" aria-hidden="true" />,
  };
  return {
    label: 'Valentine Pick',
    style: 'bg-rose-100 text-rose-700',
    icon: null,
  };
}

/* ─── Component ─── */
function FeaturedPicks({
  products,
  loading = false,
  title = 'Valentine Picks',
  subtitle = 'Our editors\u2019 selection — pieces that say it all.',
}: FeaturedPicksProps) {
  const prefersReducedMotion = useReducedMotion();
  const displayProducts = products.slice(0, 6);

  return (
    <section className="py-20 sm:py-28 bg-white" id="featured" aria-label="Featured Valentine Picks">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs tracking-[0.3em] uppercase text-rose-600 font-medium">
            Editor&apos;s Choice
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mt-3 font-light">
            {title}
          </h2>
          <p className="text-neutral-400 mt-4 max-w-lg mx-auto text-base leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse" aria-hidden="true">
                <div className="aspect-[3/4] bg-neutral-100 rounded-2xl mb-4" />
                <div className="h-4 bg-neutral-100 rounded w-2/3 mb-2" />
                <div className="h-4 bg-neutral-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {displayProducts.map((product, idx) => {
              const primaryImg = product.images?.find((i) => i.isPrimary) || product.images?.[0];
              const imgUrl = normalizeImageUrl(primaryImg?.imageUrl);
              const badge = getBadge(product);

              return (
                <motion.article
                  key={product.id}
                  className={styles.editorialCard}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                >
                  <Link href={`/products/${product.slug}`} className="group block">
                    {/* Image */}
                    <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden rounded-2xl mb-4">
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        loading={idx < 2 ? 'eager' : 'lazy'}
                        quality={85}
                      />

                      {/* Badge */}
                      {badge && (
                        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wide uppercase backdrop-blur-sm ${badge.style}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm text-neutral-900 rounded-full text-xs font-medium shadow-lg transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          View Product
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="px-1">
                      <h3 className="font-serif text-base sm:text-lg text-neutral-900 leading-tight line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-lg font-semibold text-neutral-900">
                          ₹{(product.finalPrice || product.price).toLocaleString('en-IN')}
                        </span>
                        {product.price > (product.finalPrice || product.price) && (
                          <span className="text-sm text-neutral-400 line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        ) : null}

        {/* CTA */}
        {displayProducts.length > 0 && (
          <motion.div
            className="text-center mt-14"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/collections/valentine"
              className="inline-flex items-center gap-2 text-rose-700 hover:text-rose-800 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
            >
              View All Valentine Picks
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default memo(FeaturedPicks);
