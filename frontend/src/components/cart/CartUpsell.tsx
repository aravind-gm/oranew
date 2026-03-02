'use client';

/**
 * Cart Micro-Upsell — Single Product Suggestion
 * ================================================
 * Shows 1 related product below the order summary.
 * Subtle, non-aggressive — "You might also love" framing.
 * Quick-add CTA with confirmation state.
 */

import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { trackEvent } from '@/lib/analytics';
import { Plus, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface UpsellProduct {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  images: Array<{ imageUrl: string; isPrimary: boolean; altText: string }>;
}

export default function CartUpsell() {
  const [product, setProduct] = useState<UpsellProduct | null>(null);
  const [added, setAdded] = useState(false);
  const { items, addItem } = useCartStore();

  useEffect(() => {
    const fetchUpsell = async () => {
      try {
        // Fetch trending/best products, exclude what's already in cart
        const res = await api.get('/products', {
          params: { limit: 10, sortBy: 'popularity' },
        });
        const allProducts = (res.data.data.products || []) as UpsellProduct[];
        const cartIds = new Set(items.map((i) => i.productId));

        const candidate = allProducts.find(
          (p) => !cartIds.has(p.id) && Number(p.finalPrice) > 0
        );

        if (candidate) {
          candidate.finalPrice = Number(candidate.finalPrice) || 0;
          candidate.price = Number(candidate.price) || 0;
          candidate.discountPercent = Number(candidate.discountPercent) || 0;
          setProduct(candidate);
        }
      } catch {
        /* non-critical */
      }
    };

    if (items.length > 0) fetchUpsell();
  }, [items]);

  if (!product) return null;

  const imgUrl =
    product.images?.find((i) => i.isPrimary)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    '/oralogo.png';

  const handleAdd = () => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.finalPrice,
      image: imgUrl,
      quantity: 1,
    });
    setAdded(true);

    try {
      trackEvent('cart_upsell_add', {
        product_id: product.id,
        product_name: product.name,
        price: product.finalPrice,
      });
    } catch { /* non-critical */ }

    setTimeout(() => setAdded(true), 2000); // Keep "Added" state
  };

  return (
    <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-pink-50/80 to-rose-50/50 border border-pink-100">
      <p className="text-[11px] uppercase tracking-[0.15em] text-pink-500 font-semibold mb-3">
        You might also love
      </p>

      <div className="flex gap-3 items-center">
        {/* Thumbnail */}
        <Link
          href={`/products/${product.slug}`}
          className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white"
        >
          <Image
            src={imgUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.slug}`}>
            <p className="text-sm font-medium text-gray-900 truncate hover:text-pink-600 transition-colors">
              {product.name}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-semibold text-gray-800">
              ₹{product.finalPrice.toLocaleString('en-IN')}
            </span>
            {product.discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Quick Add */}
        <button
          onClick={handleAdd}
          disabled={added}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            added
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-90'
          }`}
          aria-label={added ? 'Added to cart' : 'Add to cart'}
        >
          {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
