'use client';

/**
 * Complete The Look — AOV Booster Grid
 * ======================================
 * Shows 4 related items from the same category in a grid layout.
 * Lazy-loaded, visually minimal, encourages browsing.
 */

import api from '@/lib/api';
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products', {
          params: { category: categoryId, limit: 8 },
        });
        const filtered = (response.data.data.products as CTLProduct[])
          .filter((p) => p.id !== currentProductId)
          .slice(0, 4);

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

  return (
    <section className="py-8 sm:py-10 border-t border-neutral-100">
      <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-2">
        Complete The Look
      </h2>
      <p className="text-sm text-neutral-500 mb-6">Pair with these pieces for a curated ensemble</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group block"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-50 mb-3 relative">
              <Image
                src={getImage(product)}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {product.discountPercent > 0 && (
                <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  -{Math.round(product.discountPercent)}%
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-serif text-neutral-800">
                ₹{Number(product.finalPrice).toLocaleString()}
              </span>
              {product.discountPercent > 0 && (
                <span className="text-xs text-neutral-400 line-through">
                  ₹{Number(product.price).toLocaleString()}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
