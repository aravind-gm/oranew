'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * ValentineCombos — Core AOV driver section
 * ORA Valentine's Special | Production-ready
 *
 * ▸ Lifestyle combo cards with hero images
 * ▸ Bestseller/Limited badges via CSS module
 * ▸ ComboQuickAdd: one-click add-to-bag with Zustand
 * ▸ Savings tag per product
 * ▸ Stagger animation on scroll
 * ▸ Loading skeleton + empty state
 * ═══════════════════════════════════════════════════════════════
 */

import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart, ShoppingBag, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useState } from 'react';
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

interface ValentineCombosProps {
  products: Product[];
  loading?: boolean;
  fallbackProducts?: Product[];
}

/* ─── Animation variants ─── */
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

/* ─── Sub-component: Quick Add ─── */
function ComboQuickAdd({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const showNotification = useCartNotificationStore((s) => s.showNotification);
  const [added, setAdded] = useState(false);

  const handleAdd = useCallback(() => {
    const primaryImg = product.images?.find((i) => i.isPrimary) || product.images?.[0];
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      image: normalizeImageUrl(primaryImg?.imageUrl),
      price: product.finalPrice || product.price,
      quantity: 1,
    });
    showNotification({
      productId: product.id,
      productName: product.name,
      productImage: normalizeImageUrl(primaryImg?.imageUrl),
      productPrice: product.finalPrice || product.price,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }, [product, addItem, showNotification]);

  return (
    <button
      onClick={handleAdd}
      disabled={added}
      aria-label={added ? `${product.name} added to bag` : `Add ${product.name} to bag`}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-medium transition-all duration-300 bg-[#1A1A1A] text-white hover:bg-[#333] active:scale-[0.97] disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
    >
      {added ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Added!
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
          Add to Bag
        </>
      )}
    </button>
  );
}

/* ─── Main Component ─── */
function ValentineCombos({
  products,
  loading = false,
  fallbackProducts = [],
}: ValentineCombosProps) {
  const displayProducts = products.length > 0 ? products : fallbackProducts;
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-16 sm:py-20 bg-neutral-50" id="combos" aria-label="Valentine Combos">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs tracking-[0.3em] uppercase text-rose-600 font-medium">
            Curated with Love
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mt-3 font-light">
            Valentine Combos
          </h2>
          <p className="text-neutral-500 mt-4 max-w-xl mx-auto text-base leading-relaxed">
            Thoughtfully paired sets that say it all.
          </p>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse" aria-hidden="true">
                <div className="aspect-[4/5] bg-neutral-200 rounded-2xl mb-4" />
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={prefersReducedMotion ? {} : staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {displayProducts.slice(0, 6).map((product) => {
              const primaryImg = product.images?.find((i) => i.isPrimary) || product.images?.[0];
              const imgUrl = normalizeImageUrl(primaryImg?.imageUrl);
              const savings =
                product.price > (product.finalPrice || product.price)
                  ? product.price - (product.finalPrice || product.price)
                  : 0;

              return (
                <motion.div key={product.id} variants={prefersReducedMotion ? {} : fadeInUp}>
                  <article className={styles.comboCard}>
                    <Link href={`/products/${product.slug}`}>
                      <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden rounded-t-[1.25rem]">
                        <Image
                          src={imgUrl}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          quality={80}
                        />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.isBestseller && (
                            <span className={`${styles.comboBadge} ${styles.comboBadgeBestseller}`}>
                              <Star className="w-3 h-3" aria-hidden="true" />
                              Best Value
                            </span>
                          )}
                          {product.isNew && (
                            <span className={`${styles.comboBadge} ${styles.comboBadgeLimited}`}>
                              Limited
                            </span>
                          )}
                          {!product.isBestseller && !product.isNew && (
                            <span className={`${styles.comboBadge} ${styles.comboBadgeGiftReady}`}>
                              Gift Ready
                            </span>
                          )}
                        </div>

                        {savings > 0 && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded-full">
                              Save ₹{savings.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/10 to-transparent" aria-hidden="true" />
                      </div>
                    </Link>

                    <div className="p-5">
                      <span className="text-[11px] tracking-[0.15em] uppercase text-rose-600">
                        Valentine Combo
                      </span>
                      <h3 className="font-serif text-lg text-neutral-900 mt-1 mb-1 line-clamp-1">
                        {product.name}
                      </h3>

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-xl font-semibold text-neutral-900">
                          ₹{(product.finalPrice || product.price).toLocaleString('en-IN')}
                        </span>
                        {product.price > (product.finalPrice || product.price) && (
                          <span className="text-sm text-neutral-400 line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <ComboQuickAdd product={product} />
                    </div>
                  </article>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 text-rose-300 mx-auto mb-4" aria-hidden="true" />
            <p className="text-neutral-500 font-serif text-lg italic">Combos coming soon...</p>
          </div>
        )}

        {/* CTA */}
        {displayProducts.length > 0 && (
          <motion.div
            className="text-center mt-12"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/collections/combos"
              className="inline-flex items-center gap-2 text-rose-700 font-medium hover:text-rose-800 transition-colors text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
            >
              Explore Combos
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default memo(ValentineCombos);
