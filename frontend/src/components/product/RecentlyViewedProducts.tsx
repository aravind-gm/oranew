'use client';

import { useProductStore } from '@/store/productStore';
import { Clock, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface RecentlyViewedProductsProps {
  title?: string;
  limit?: number;
  excludeProductId?: string;
  layout?: 'horizontal' | 'vertical';
  showClearButton?: boolean;
}

export default function RecentlyViewedProducts({
  title = 'Recently Viewed',
  limit = 6,
  excludeProductId,
  layout = 'horizontal',
  showClearButton = true,
}: RecentlyViewedProductsProps) {
  const { recentlyViewed, clearRecentlyViewed } = useProductStore();

  // Filter out current product and limit results
  const products = recentlyViewed
    .filter((p) => p.productId !== excludeProductId)
    .slice(0, limit);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Clock size={20} className="text-secondary-500" />
          {title}
        </h3>
        {showClearButton && (
          <button
            onClick={clearRecentlyViewed}
            className="text-sm text-neutral-400 hover:text-neutral-600 flex items-center gap-1 transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Products Grid/List */}
      {layout === 'horizontal' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {products.map((product) => (
            <Link
              key={product.productId}
              href={`/products/${product.slug}`}
              className="flex-shrink-0 w-40 group"
            >
              <div className="aspect-square bg-neutral-100 rounded-xl overflow-hidden mb-3">
                <Image
                  src={product.image || '/placeholder.png'}
                  alt={product.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                {product.name}
              </p>
              <p className="text-sm font-semibold text-amber-600 mt-1">
                ₹{product.price.toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Link
              key={product.productId}
              href={`/products/${product.slug}`}
              className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors group"
            >
              <div className="w-16 h-16 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={product.image || '/placeholder.png'}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                  {product.name}
                </p>
                <p className="text-sm font-semibold text-amber-600 mt-0.5">
                  ₹{product.price.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
