'use client';

/**
 * Tumblers & Mugs — /collections/tumblers
 * 
 * Premium-quality insulated tumblers & mugs at the best prices.
 * Stanley-style quality, ORA-style pricing.
 * 
 * Features:
 *  - Emotional hero banner
 *  - USP strip (insulated, leak-proof, BPA-free)
 *  - Product grid with filters
 *  - Why ORA Tumblers section
 *  - Mobile-first responsive
 */

import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { trackAddToCart } from '@/lib/analytics';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Heart, Check, Loader2, ArrowRight, Droplets, Thermometer, Shield, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface TumblerProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  finalPrice: number;
  discountPercent: number;
  stockQuantity: number;
  images: ProductImage[];
  category: { id: string; name: string; slug: string };
  averageRating: number;
  reviewCount: number;
  material?: string;
}

// ============================================================================
// HERO SECTION
// ============================================================================

function TumblersHero() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.3em] uppercase text-cyan-400 mb-4 font-medium">
            New Category
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light leading-[1.1] mb-5">
            Premium Tumblers{' '}
            <span className="italic text-cyan-300">&amp; Mugs</span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
            Stanley-grade quality at prices that make sense. Insulated, leak-proof, 
            and designed to keep up with your day — from morning coffee to evening workouts.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#products"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-slate-900 font-medium rounded-full hover:bg-neutral-100 transition-all shadow-lg text-sm"
            >
              Shop Tumblers
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// USP STRIP
// ============================================================================

function USPStrip() {
  const usps = [
    { icon: Thermometer, label: 'Hot 12hrs / Cold 24hrs', desc: 'Double-wall insulation' },
    { icon: Droplets, label: '100% Leak-Proof', desc: 'Spill-free lid design' },
    { icon: Shield, label: 'BPA-Free', desc: 'Food-grade stainless steel' },
    { icon: Leaf, label: 'Eco-Friendly', desc: 'Reusable & sustainable' },
  ];

  return (
    <section className="bg-white border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {usps.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">{label}</p>
                <p className="text-xs text-neutral-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRODUCT CARD
// ============================================================================

function TumblerCard({ product }: { product: TumblerProduct }) {
  const { addItem: addToCart } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const [addedToCart, setAddedToCart] = useState(false);
  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.discountPercent > 0;
  const savings = Number(product.price) - Number(product.finalPrice);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.finalPrice,
      image: primaryImage?.imageUrl || '/oralogo.png',
      quantity: 1,
      stockQuantity: product.stockQuantity,
    });
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.finalPrice,
      quantity: 1,
      category: product.category?.name,
    });
    setAddedToCart(true);
    toast.success('Added to cart!');
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.finalPrice,
        image: primaryImage?.imageUrl || '/oralogo.png',
      });
    }
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg hover:border-neutral-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-neutral-50 overflow-hidden">
        {primaryImage?.imageUrl ? (
          <Image
            src={primaryImage.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {product.discountPercent}% OFF
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all"
        >
          <Heart
            size={14}
            className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-400'}
          />
        </button>

        {/* Quick Add overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/40 to-transparent">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
              addedToCart
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            {addedToCart ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check size={14} /> Added!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <ShoppingCart size={14} /> Quick Add
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-neutral-800 mb-1 line-clamp-2 leading-snug group-hover:text-primary-500 transition-colors">
          {product.name}
        </h3>
        {product.material && (
          <p className="text-[11px] text-neutral-400 mb-2">{product.material}</p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-neutral-900">
            ₹{Number(product.finalPrice).toLocaleString()}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-neutral-400 line-through">
                ₹{Number(product.price).toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-green-600">
                Save ₹{savings.toLocaleString()}
              </span>
            </>
          )}
        </div>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-amber-500 text-xs">★</span>
            <span className="text-xs text-neutral-500">
              {Number(product.averageRating).toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// WHY ORA TUMBLERS
// ============================================================================

function WhyOraTumblers() {
  return (
    <section className="bg-neutral-50 py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-4 font-medium">
          Why ORA?
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-neutral-900 mb-6 leading-tight">
          Premium Quality,{' '}
          <span className="italic">Honest Pricing</span>
        </h2>
        <div className="w-12 h-[1px] bg-neutral-300 mx-auto mb-8" />
        <div className="space-y-5 max-w-2xl mx-auto">
          <p className="text-base text-neutral-500 leading-relaxed">
            We source the same 18/8 stainless steel and vacuum-insulation technology 
            used by premium tumbler brands — then cut out the middlemen to give you 
            the best price, directly.
          </p>
          <p className="text-base text-neutral-500 leading-relaxed">
            Every tumbler is tested for 24-hour cold retention and 12-hour heat retention. 
            No gimmicks, just performance.
          </p>
        </div>
        
        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {[
            { stat: '18/8', label: 'Stainless Steel', desc: 'Food-grade, rust-proof' },
            { stat: '24hr', label: 'Cold Retention', desc: 'Ice stays ice, guaranteed' },
            { stat: '₹0', label: 'Hidden Fees', desc: 'What you see is what you pay' },
          ].map(({ stat, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl p-6 border border-neutral-100">
              <p className="text-2xl font-serif font-light text-neutral-900 mb-1">{stat}</p>
              <p className="text-sm font-semibold text-neutral-700">{label}</p>
              <p className="text-xs text-neutral-400 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function TumblersPage() {
  const [products, setProducts] = useState<TumblerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Try fetching by category slug 'tumblers' first
      const res = await api.get('/products', {
        params: {
          category: 'tumblers',
          limit: 50,
          page: 1,
          isActive: true,
        },
      });

      const data = res.data;
      let items: TumblerProduct[] = data?.data || data?.products || [];
      
      // Client-side filter: only show products that actually belong to tumblers/mugs category
      // This prevents jewelry products from appearing if the backend returns all products
      items = items.filter((p) => {
        const catName = p.category?.name?.toLowerCase() || '';
        const catSlug = p.category?.slug?.toLowerCase() || '';
        const productName = p.name?.toLowerCase() || '';
        return (
          catName.includes('tumbler') || catName.includes('mug') || catName.includes('drinkware') ||
          catSlug.includes('tumbler') || catSlug.includes('mug') ||
          productName.includes('tumbler') || productName.includes('mug')
        );
      });
      
      setProducts(items);
    } catch (err) {
      console.error('Error fetching tumblers:', err);
      // If category filter fails, try searching by name
      try {
        const res = await api.get('/products', {
          params: {
            search: 'tumbler mug',
            limit: 50,
            page: 1,
            isActive: true,
          },
        });
        const data = res.data;
        let items: TumblerProduct[] = data?.data || data?.products || [];
        // Client-side filter for search results too
        items = items.filter((p) => {
          const name = p.name?.toLowerCase() || '';
          const desc = p.description?.toLowerCase() || '';
          return name.includes('tumbler') || name.includes('mug') || desc.includes('tumbler') || desc.includes('mug');
        });
        setProducts(items);
      } catch {
        setError('Unable to load products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-white">
      <TumblersHero />
      <USPStrip />

      {/* Product Grid */}
      <section id="products" className="max-w-7xl mx-auto px-5 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-light text-neutral-900">
              All Tumblers &amp; Mugs
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="text-sm text-primary-500 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🥤</div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">
              Coming Soon!
            </h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
              Our premium tumbler collection is being curated. Sign up for our newsletter 
              to be the first to know when they drop.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Browse Jewellery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <TumblerCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <WhyOraTumblers />

      {/* Bottom CTA */}
      <section className="bg-white py-12 sm:py-16 text-center">
        <div className="max-w-2xl mx-auto px-5">
          <h2 className="text-xl sm:text-2xl font-serif font-light text-neutral-900 mb-4">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Browse our full collection of jewellery, combos, and gifts.
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Shop All Collections
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
