'use client';

/**
 * Complete The Look — Premium AOV Booster
 * =========================================
 * Shows max 3 curated items from the same category.
 * Each card has a quick "Add to Cart" CTA for frictionless purchase.
 * Clean luxury styling, no urgency copy.
 */

import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { trackEvent } from '@/lib/analytics';
import { ShoppingBag, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CTLProduct {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  images: Array<{ imageUrl: string; isPrimary: boolean; altText: string }>;
}

interface CompleteTheLookProps {
  categoryId: string;
  currentProductId: string;
}

export default function CompleteTheLook({ categoryId, currentProductId }: CompleteTheLookProps) {
  const [products, setProducts] = useState<CTLProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products', {
          params: { category: categoryId, limit: 8 },
        });
        const filtered = (response.data.data.products as CTLProduct[])
          .filter((p) => p.id !== currentProductId)
          .slice(0, 3);

        // Normalize Decimal fields
        filtered.forEach((p) => {
          p.finalPrice = Number(p.finalPrice) || 0;
          p.price = Number(p.price) || 0;
          p.discountPercent = Number(p.discountPercent) || 0;
        });

        setProducts(filtered);
      } catch {
        // Non-critical — fail silently
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchProducts();
  }, [categoryId, currentProductId]);

  if (loading || products.length < 2) return null;

  const getImage = (product: CTLProduct) =>
    product.images?.find((i) => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || '/oralogo.png';

  const handleQuickAdd = (product: CTLProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.finalPrice,
      image: getImage(product),
      quantity: 1,
    });
    setAddedIds((prev) => new Set(prev).add(product.id));

    // Analytics
    try {
      trackEvent('complete_the_look_add', {
        product_id: product.id,
        product_name: product.name,
        price: product.finalPrice,
        source: 'complete_the_look',
      });
    } catch {
      /* non-critical */
    }

    // Reset checkmark after 2s
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  return (
    <section className="py-10 sm:py-14 border-t border-neutral-100">
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-pink-500 font-medium mb-1.5">
            Styled For You
          </p>
          <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A]">
            Complete The Look
          </h2>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {products.map((product) => {
          const isAdded = addedIds.has(product.id);
          return (
            <div key={product.id} className="group">
              {/* Image */}
              <Link
                href={`/products/${product.slug}`}
                className="block aspect-[3/4] rounded-xl overflow-hidden bg-neutral-50 mb-3 relative"
              >
                <Image
                  src={getImage(product)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {product.discountPercent > 0 && (
                  <div className="absolute top-2.5 left-2.5 bg-pink-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                    -{Math.round(product.discountPercent)}%
                  </div>
                )}
              </Link>

              {/* Info */}
              <Link href={`/products/${product.slug}`}>
                <h3 className="text-sm font-medium text-neutral-900 truncate group-hover:text-pink-600 transition-colors">
                  {product.name}
                </h3>
              </Link>

              <div className="flex items-center gap-2 mt-1 mb-3">
                <span className="text-sm font-semibold text-neutral-800">
                  ₹{product.finalPrice.toLocaleString('en-IN')}
                </span>
                {product.discountPercent > 0 && (
                  <span className="text-xs text-neutral-400 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Quick Add CTA */}
              <button
                onClick={() => handleQuickAdd(product)}
                disabled={isAdded}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isAdded
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-[0.97]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
