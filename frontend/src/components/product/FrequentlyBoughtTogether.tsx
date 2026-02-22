'use client';

/**
 * Frequently Bought Together — AOV Booster
 * ==========================================
 * Shows 1-2 complementary items from the same category.
 * Users can check/uncheck items and add all to cart in one click.
 */

import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { trackAddToCart } from '@/lib/analytics';
import { Check, Plus, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface FBTProduct {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  stockQuantity: number;
  images: Array<{ imageUrl: string; isPrimary: boolean; altText: string }>;
}

interface FrequentlyBoughtTogetherProps {
  categoryId: string;
  currentProductId: string;
  currentProduct: {
    id: string;
    name: string;
    finalPrice: number;
    images: Array<{ imageUrl: string; isPrimary: boolean }>;
  };
}

export default function FrequentlyBoughtTogether({
  categoryId,
  currentProductId,
  currentProduct,
}: FrequentlyBoughtTogetherProps) {
  const [companions, setCompanions] = useState<FBTProduct[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchCompanions = async () => {
      try {
        const response = await api.get('/products', {
          params: { category: categoryId, limit: 6 },
        });
        const filtered = (response.data.data.products as FBTProduct[])
          .filter((p) => p.id !== currentProductId && p.stockQuantity > 0)
          .slice(0, 2);

        setCompanions(filtered);
        // Pre-select all companions
        const sel: Record<string, boolean> = {};
        filtered.forEach((p) => (sel[p.id] = true));
        setSelected(sel);
      } catch {
        // Fail silently — non-critical section
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchCompanions();
  }, [categoryId, currentProductId]);

  if (loading || companions.length === 0) return null;

  const selectedCompanions = companions.filter((p) => selected[p.id]);
  const bundleTotal =
    currentProduct.finalPrice +
    selectedCompanions.reduce((sum, p) => sum + p.finalPrice, 0);

  const handleToggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddAll = () => {
    // Add current product
    const primaryImg = currentProduct.images?.find((i) => i.isPrimary) || currentProduct.images?.[0];
    addItem({
      id: `${currentProduct.id}-${Date.now()}`,
      productId: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.finalPrice,
      image: primaryImg?.imageUrl || '/oralogo.png',
      quantity: 1,
      stockQuantity: 999,
    });

    // Add selected companions
    selectedCompanions.forEach((p) => {
      const img = p.images?.find((i) => i.isPrimary) || p.images?.[0];
      addItem({
        id: `${p.id}-${Date.now()}`,
        productId: p.id,
        name: p.name,
        price: p.finalPrice,
        image: img?.imageUrl || '/oralogo.png',
        quantity: 1,
        stockQuantity: p.stockQuantity,
      });

      trackAddToCart({ id: p.id, name: p.name, price: p.finalPrice, quantity: 1 });
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const getImage = (product: { images: Array<{ imageUrl: string; isPrimary: boolean }> }) =>
    product.images?.find((i) => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || '/oralogo.png';

  return (
    <section className="py-8 sm:py-10">
      <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-6">
        Frequently Bought Together
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3">
        {/* Current Product (always included) */}
        <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl bg-white w-full sm:w-auto sm:flex-1">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0">
            <Image
              src={getImage(currentProduct)}
              alt={currentProduct.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{currentProduct.name}</p>
            <p className="text-sm font-serif text-neutral-700">₹{Number(currentProduct.finalPrice).toLocaleString()}</p>
          </div>
          <div className="w-5 h-5 rounded border border-neutral-300 bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5 text-neutral-400" />
          </div>
        </div>

        {/* Companions */}
        {companions.map((product) => (
          <div key={product.id} className="contents">
            <div className="hidden sm:flex items-center justify-center text-neutral-300">
              <Plus className="w-5 h-5" />
            </div>
            <button
              onClick={() => handleToggle(product.id)}
              className={`flex items-center gap-3 p-3 border rounded-xl w-full sm:w-auto sm:flex-1 transition-all text-left ${
                selected[product.id]
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-neutral-200 bg-white opacity-60'
              }`}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0">
                <Image
                  src={getImage(product)}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm font-medium text-neutral-900 truncate block hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {product.name}
                </Link>
                <p className="text-sm font-serif text-neutral-700">
                  ₹{Number(product.finalPrice).toLocaleString()}
                  {product.discountPercent > 0 && (
                    <span className="text-xs text-neutral-400 line-through ml-2">
                      ₹{Number(product.price).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected[product.id]
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-neutral-300 bg-white'
                }`}
              >
                {selected[product.id] && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Bundle Price + Add All CTA */}
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-4 justify-between bg-neutral-50 rounded-xl p-4 border border-neutral-100">
        <div>
          <p className="text-sm text-neutral-500">Bundle Total ({1 + selectedCompanions.length} items)</p>
          <p className="text-xl font-serif font-medium text-[#1A1A1A]">
            ₹{bundleTotal.toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleAddAll}
          disabled={added}
          className={`px-8 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Add All to Cart
            </>
          )}
        </button>
      </div>
    </section>
  );
}
