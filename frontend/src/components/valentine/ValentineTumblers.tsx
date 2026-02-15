'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * ValentineTumblers — Real product cards (NOT price tiers)
 * ORA Valentine's Special | Production-ready
 *
 * CRITICAL CHANGE: Tumblers are displayed as individual product
 * cards with images, names, prices, and badges — same level as
 * jewellery. No grouping by price tier.
 *
 * ▸ Horizontal carousel or 2×2 grid
 * ▸ Each card: image, name, price, lifestyle line, CTA
 * ▸ Badges: New, Limited Drop, Gift Pick
 * ▸ Coming soon = disabled CTA + soft label
 * ▸ Quick add-to-bag with Zustand
 * ═══════════════════════════════════════════════════════════════
 */

import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Eye, GlassWater, ShoppingBag, Sparkles } from 'lucide-react';
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

interface ValentineTumblersProps {
  products: Product[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

/* ─── Sub-component: Tumbler Quick Add ─── */
function TumblerQuickAdd({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const showNotification = useCartNotificationStore((s) => s.showNotification);
  const [added, setAdded] = useState(false);
  const isAvailable = (product.stockQuantity ?? 1) > 0;

  const handleAdd = useCallback(() => {
    if (!isAvailable) return;
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
  }, [product, isAvailable, addItem, showNotification]);

  if (!isAvailable) {
    return (
      <span className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm text-neutral-400 bg-neutral-100 cursor-not-allowed">
        Coming Soon
      </span>
    );
  }

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

/* ─── Badge helper ─── */
function getTumblerBadge(product: Product): { label: string; style: string } | null {
  if (product.isNew) return { label: 'New Drop', style: 'bg-rose-700/90 text-white' };
  if (product.isBestseller) return { label: 'Gift Pick', style: 'bg-amber-600/90 text-white' };
  return { label: 'Limited Drop', style: 'bg-neutral-800/80 text-white' };
}

/* ─── Main Component ─── */
function ValentineTumblers({
  products,
  loading = false,
  title = 'Valentine Tumblers',
  subtitle = 'Everyday reminders of love.',
}: ValentineTumblersProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 bg-white" id="tumblers" aria-label="Valentine Tumblers">
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
            Lifestyle Essentials
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mt-3 font-light">
            {title}
          </h2>
          <p className="text-neutral-400 mt-4 max-w-lg mx-auto text-base leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Product grid — real cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse" aria-hidden="true">
                <div className="aspect-square bg-neutral-100 rounded-2xl mb-4" />
                <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-neutral-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {products.slice(0, 8).map((product, idx) => {
              const primaryImg = product.images?.find((i) => i.isPrimary) || product.images?.[0];
              const imgUrl = normalizeImageUrl(primaryImg?.imageUrl);
              const badge = getTumblerBadge(product);
              const isAvailable = (product.stockQuantity ?? 1) > 0;

              return (
                <motion.article
                  key={product.id}
                  className={styles.tumblerCard}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <Link href={`/products/${product.slug}`} className="group block">
                    <div className={`relative aspect-square bg-neutral-50 overflow-hidden rounded-2xl ${!isAvailable ? 'opacity-70' : ''}`}>
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                        loading={idx < 2 ? 'eager' : 'lazy'}
                        quality={85}
                      />

                      {/* Badge */}
                      {badge && (
                        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase backdrop-blur-sm ${badge.style}`}>
                          <Sparkles className="w-3 h-3" aria-hidden="true" />
                          {badge.label}
                        </span>
                      )}

                      {/* Coming Soon overlay */}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] z-[1]">
                          <span className="font-serif text-sm text-neutral-500 italic">Coming Soon</span>
                        </div>
                      )}

                      {/* Hover view */}
                      {isAvailable && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-neutral-900 rounded-full text-xs font-medium shadow-md translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            View Tumbler
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Meta */}
                  <div className="pt-4 px-1">
                    <h3 className="font-serif text-base text-neutral-900 leading-tight line-clamp-1 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mb-3 line-clamp-1">
                      {product.description || 'A daily reminder of love.'}
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-semibold text-neutral-900">
                        ₹{(product.finalPrice || product.price).toLocaleString('en-IN')}
                      </span>
                      {product.price > (product.finalPrice || product.price) && (
                        <span className="text-sm text-neutral-400 line-through">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <TumblerQuickAdd product={product} />
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <GlassWater className="w-10 h-10 text-rose-300 mx-auto mb-4" aria-hidden="true" />
            <p className="text-neutral-400 font-serif text-lg italic">Tumblers launching soon...</p>
          </div>
        )}

        {/* CTA */}
        {products.length > 0 && (
          <motion.div
            className="text-center mt-14"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/valentine-drinkware"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-all duration-300 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <GlassWater className="w-4 h-4" aria-hidden="true" />
              Explore All Tumblers
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default memo(ValentineTumblers);
