'use client';

import api from '@/lib/api';
import { trackAddToCart } from '@/lib/analytics';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { ArrowRight, Check, Droplets, Heart, Leaf, Loader2, Shield, ShoppingCart, Thermometer } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface TumblerProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent: number;
  stockQuantity?: number;
  primaryImage?: {
    id: string;
    imageUrl: string;
    altText?: string | null;
    isPrimary?: boolean;
  } | null;
  primaryImageAlt?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  averageRating?: number;
  reviewCount?: number;
}

interface TumblersCollectionClientProps {
  initialProducts: TumblerProduct[];
}

const TUMBLERS_HERO_POSTER_URL = 'https://pub-631909e589a44206913f50fa8b711fc3.r2.dev/products/stanly.png';

function TumblersHero() {
  return (
    <section className="relative bg-slate-900 text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${TUMBLERS_HERO_POSTER_URL})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#f18ab4]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#f4b6cf]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.3em] uppercase text-[#f7c9dc] mb-4 font-medium">New Category</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light leading-[1.1] mb-5">
            Premium Tumblers <span className="italic text-[#ffd6e8]">&amp; Mugs</span>
          </h1>
          <p className="text-base sm:text-lg text-white/85 leading-relaxed mb-8 max-w-lg">
            Stanley-grade quality at prices that make sense. Insulated, leak-proof, and designed to keep up with your day.
          </p>
          <a
            href="#products"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#f18ab4] text-white font-medium rounded-full hover:bg-[#e06e9d] transition-all shadow-lg text-sm"
          >
            Shop Tumblers
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

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

function TumblerCard({ product }: { product: TumblerProduct }) {
  const { addItem: addToCart } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const [addedToCart, setAddedToCart] = useState(false);
  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);

  const hasDiscount = Number(product.discountPercent || 0) > 0;
  const savings = Number(product.price || 0) - Number(product.finalPrice || 0);

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: Number(product.finalPrice || 0),
      image: product.primaryImage?.imageUrl || '/oralogo.png',
      quantity: 1,
      stockQuantity: Number(product.stockQuantity || 0),
    });

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: Number(product.finalPrice || 0),
      quantity: 1,
      category: product.category?.name,
    });

    setAddedToCart(true);
    toast.success('Added to cart!');
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlistToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isInWishlist) {
      removeFromWishlist(product.id);
      return;
    }

    addToWishlist({
      id: product.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.finalPrice || 0),
      image: product.primaryImage?.imageUrl || '/oralogo.png',
    });
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg hover:border-neutral-200 transition-all duration-300"
    >
      <div className="relative aspect-square bg-neutral-50 overflow-hidden">
        {product.primaryImage?.imageUrl ? (
          <Image
            src={product.primaryImage.imageUrl}
            alt={product.primaryImageAlt || product.primaryImage.altText || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}

        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {Number(product.discountPercent)}% OFF
          </div>
        )}

        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all"
        >
          <Heart size={14} className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-400'} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/40 to-transparent">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
              addedToCart ? 'bg-emerald-500 text-white' : 'bg-white text-neutral-900 hover:bg-neutral-100'
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

      <div className="p-4">
        <h3 className="text-sm font-medium text-neutral-800 mb-1 line-clamp-2 leading-snug group-hover:text-primary-500 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-neutral-900">₹{Number(product.finalPrice || 0).toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="text-xs text-neutral-400 line-through">₹{Number(product.price || 0).toLocaleString()}</span>
              <span className="text-[11px] font-semibold text-green-600">Save ₹{savings.toLocaleString()}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function WhyOraTumblers() {
  return (
    <section className="bg-neutral-50 py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-4 font-medium">Why ORA?</p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-neutral-900 mb-6 leading-tight">
          Premium Quality, <span className="italic">Honest Pricing</span>
        </h2>
        <div className="w-12 h-[1px] bg-neutral-300 mx-auto mb-8" />
        <div className="space-y-5 max-w-2xl mx-auto">
          <p className="text-base text-neutral-500 leading-relaxed">
            We source the same 18/8 stainless steel and vacuum-insulation technology used by premium tumbler brands.
          </p>
          <p className="text-base text-neutral-500 leading-relaxed">
            Every tumbler is tested for 24-hour cold retention and 12-hour heat retention.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function TumblersCollectionClient({ initialProducts }: TumblersCollectionClientProps) {
  const [products, setProducts] = useState<TumblerProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const commonParams = {
        limit: 50,
        page: 1,
        isActive: true,
        view: 'listing',
      };

      const collected = new Map<string, TumblerProduct>();

      const mergeItems = (incoming: TumblerProduct[]) => {
        incoming.forEach((item) => {
          if (!collected.has(item.id)) collected.set(item.id, item);
        });
      };

      const requests = [{ category: 'tumblers' }, { category: 'tumbler' }, { isTumbler: true }];

      for (const params of requests) {
        const response = await api.get('/products', {
          params: {
            ...commonParams,
            ...params,
          },
        });

        const items: TumblerProduct[] = response.data?.data || [];
        mergeItems(items);
      }

      const filteredItems = Array.from(collected.values()).filter((product) => {
        const catName = product.category?.name?.toLowerCase() || '';
        const catSlug = product.category?.slug?.toLowerCase() || '';
        const productName = product.name?.toLowerCase() || '';

        return (
          catName.includes('tumbler') ||
          catName.includes('mug') ||
          catSlug.includes('tumbler') ||
          catSlug.includes('mug') ||
          productName.includes('tumbler') ||
          productName.includes('mug')
        );
      });

      setProducts(filteredItems);
    } catch {
      setError('Unable to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialProducts?.length) {
      fetchProducts();
    }
  }, [fetchProducts, initialProducts]);

  return (
    <div className="min-h-screen bg-white">
      <TumblersHero />
      <USPStrip />

      <section id="products" className="max-w-7xl mx-auto px-5 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-light text-neutral-900">All Tumblers &amp; Mugs</h2>
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
            <button onClick={fetchProducts} className="text-sm text-primary-500 hover:underline">
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🥤</div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">Coming Soon!</h3>
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
    </div>
  );
}
