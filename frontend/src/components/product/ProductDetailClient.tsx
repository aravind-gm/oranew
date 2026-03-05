'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — PRODUCT DETAIL PAGE (REDESIGNED)
 * ============================================================================
 *
 * ABOVE-THE-FOLD (conversion-optimised):
 *  ✓ Category label (small uppercase)
 *  ✓ Product name (large serif)
 *  ✓ Rating + scarcity text
 *  ✓ Price hierarchy (final, MRP, savings, early-launch badge)
 *  ✓ Dynamic delivery estimate (current+7 to current+9)
 *  ✓ Trust mini-strip (horizontal)
 *  ✓ COD badge with tooltip
 *  ✓ ADD TO CART (primary) + BUY NOW (secondary)
 *  ✓ Sticky mobile CTA with dual buttons
 *
 * BELOW-THE-FOLD (AOV + engagement):
 *  ✓ Free shipping / gift threshold bar
 *  ✓ Frequently Bought Together (1-2 items, checkbox add)
 *  ✓ Complete The Look (4-item grid, lazy loaded)
 *  ✓ Design Details / Craftsmanship / Styling Notes
 *  ✓ Product Specs
 *  ✓ Reviews
 *  ✓ Recently Viewed
 */

import ProductGallery from '@/components/product/ProductGallery';
import ProductSpecs from '@/components/product/ProductSpecs';
import RecentlyViewedProducts from '@/components/product/RecentlyViewedProducts';
import RelatedProducts from '@/components/product/RelatedProducts';
import ReviewSection from '@/components/product/ReviewSection';
import FrequentlyBoughtTogether from '@/components/product/FrequentlyBoughtTogether';
import CompleteTheLook from '@/components/product/CompleteTheLook';
import FreeShippingThreshold from '@/components/product/FreeShippingThreshold';
import { CODBadge } from '@/components/checkout/CODBadge';
import api from '@/lib/api';
import { trackAddToCart, trackAddToWishlist, trackViewItem } from '@/lib/analytics';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useWishlistStore } from '@/store/wishlistStore';
import {
  Check,
  Heart,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  Truck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPercent: number;
  finalPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  material: string;
  weight: string;
  dimensions: string;
  careInstructions: string;
  averageRating: number;
  reviewCount: number;
  soldThisWeek?: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImage[];
}

// ============================================================================
// HELPERS
// ============================================================================

/** Returns "Mon, 1 Mar" format */
function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Delivery estimate: current + 7 to current + 9 days */
function getDeliveryEstimate(): { from: string; to: string } {
  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() + 7);
  const toDate = new Date(now);
  toDate.setDate(now.getDate() + 9);
  return { from: formatDeliveryDate(fromDate), to: formatDeliveryDate(toDate) };
}

/** Render ★ stars */
function StarRating({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null;
  const r = Number(rating) || 0;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            style={{
              color:
                i < full
                  ? '#C6A85B'
                  : i === full && half
                  ? '#C6A85B'
                  : '#E5E7EB',
              opacity: i === full && half ? 0.6 : 1,
            }}
            className="text-sm"
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
        {r.toFixed(1)}
      </span>
      <span className="text-xs" style={{ color: '#7A7A85' }}>
        ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

// ============================================================================
// COD LIMIT
// ============================================================================

const COD_MAX_AMOUNT = 5000;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const router = useRouter();
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlistItems } = useWishlistStore();
  const { addToRecentlyViewed } = useProductStore();

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${slug}`);
        const raw = response.data.data;
        // Prisma serialises Decimal fields as strings — normalise to numbers
        const fetchedProduct = raw ? {
          ...raw,
          price:         Number(raw.price)         || 0,
          finalPrice:    Number(raw.finalPrice)     || 0,
          averageRating: Number(raw.averageRating)  || 0,
          reviewCount:   Number(raw.reviewCount)    || 0,
          stockQuantity: Number(raw.stockQuantity)  ?? 0,
          discountPercent: Number(raw.discountPercent) || 0,
          soldThisWeek:  raw.soldThisWeek != null ? Number(raw.soldThisWeek) : undefined,
        } : raw;
        setProduct(fetchedProduct);

        if (fetchedProduct) {
          const primaryImage =
            fetchedProduct.images?.find((img: ProductImage) => img.isPrimary) || fetchedProduct.images?.[0];
          addToRecentlyViewed({
            productId: fetchedProduct.id,
            slug: fetchedProduct.slug,
            name: fetchedProduct.name,
            image: primaryImage?.imageUrl || '',
            price: fetchedProduct.finalPrice,
          });

          trackViewItem({
            id: fetchedProduct.id,
            name: fetchedProduct.name,
            price: fetchedProduct.finalPrice,
            category: fetchedProduct.category?.name,
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug, addToRecentlyViewed]);

  // Derived state
  const delivery = useMemo(() => getDeliveryEstimate(), []);

  // ============================================================================
  // LOADING SKELETON
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery skeleton */}
            <div className="aspect-square bg-neutral-100 rounded-2xl skeleton-shimmer" />
            {/* Info skeleton */}
            <div className="space-y-4 py-4">
              <div className="h-4 w-24 bg-neutral-100 rounded skeleton-shimmer" />
              <div className="h-8 w-3/4 bg-neutral-100 rounded skeleton-shimmer" />
              <div className="h-4 w-32 bg-neutral-100 rounded skeleton-shimmer" />
              <div className="h-10 w-40 bg-neutral-100 rounded skeleton-shimmer mt-4" />
              <div className="h-px bg-neutral-100 my-4" />
              <div className="h-4 w-full bg-neutral-100 rounded skeleton-shimmer" />
              <div className="h-4 w-2/3 bg-neutral-100 rounded skeleton-shimmer" />
              <div className="h-12 w-full bg-neutral-100 rounded-lg skeleton-shimmer mt-6" />
              <div className="h-12 w-full bg-neutral-100 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // NOT FOUND
  // ============================================================================

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-sans font-semibold text-neutral-900 mb-4">Product not found</h1>
          <Link href="/products" className="text-neutral-600 hover:text-neutral-900 underline text-sm">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================================
  // DERIVED VALUES
  // ============================================================================

  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);
  const isOutOfStock = product.stockQuantity === 0;
  const threshold = product.lowStockThreshold ?? 5;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= threshold;
  const maxQuantity = Math.min(product.stockQuantity, 10);
  const savings = Number(product.price) - Number(product.finalPrice);
  const hasDiscount = product.discountPercent > 0 && savings > 0;
  const codAvailable = Number(product.finalPrice) * quantity <= COD_MAX_AMOUNT;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const getPrimaryImage = () =>
    product.images.find((img) => img.isPrimary) || product.images[0];

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      const primaryImage = getPrimaryImage();
      addToCart({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.finalPrice,
        image: primaryImage?.imageUrl || '/oralogo.png',
        quantity,
        stockQuantity: product.stockQuantity,
      });

      trackAddToCart({
        id: product.id,
        name: product.name,
        price: product.finalPrice,
        quantity,
        category: product.category?.name,
      });

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    const primaryImage = getPrimaryImage();
    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.finalPrice,
      image: primaryImage?.imageUrl || '/oralogo.png',
      quantity,
      stockQuantity: product.stockQuantity,
    });
    router.push('/checkout');
  };

  const handleWishlistToggle = () => {
    const primaryImage = getPrimaryImage();
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

      trackAddToWishlist({
        id: product.id,
        name: product.name,
        price: product.finalPrice,
        category: product.category?.name,
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Breadcrumb ═══ */}
      <nav className="border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1.5 text-xs font-sans text-neutral-400 overflow-x-auto scrollbar-hide">
            <Link href="/" className="hover:text-neutral-700 whitespace-nowrap transition-colors">Home</Link>
            <span className="text-neutral-300 flex-shrink-0">/</span>
            <Link href="/products" className="hover:text-neutral-700 whitespace-nowrap transition-colors">Shop</Link>
            <span className="text-neutral-300 flex-shrink-0">/</span>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-neutral-700 whitespace-nowrap transition-colors"
            >
              {product.category.name}
            </Link>
            <span className="text-neutral-300 flex-shrink-0">/</span>
            <span className="text-neutral-600 truncate max-w-[160px] sm:max-w-[220px]">{product.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-36 sm:pb-12">
        {/* ════════════════════════════════════════════
            ABOVE THE FOLD — Gallery + Product Info
            ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mb-12 sm:mb-16">
          {/* Gallery (sticky on desktop) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* ═══ Product Info Column ═══ */}
          <div className="space-y-5">

            {/* Category label */}
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
              {product.category.name}
            </p>

            {/* Product name */}
            <h1 className="text-xl sm:text-2xl font-medium text-neutral-800 leading-snug -mt-2">
              {product.name}
            </h1>

            {/* Rating inline */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 -mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-amber-500 text-sm">★</span>
                  <span className="text-sm font-semibold text-neutral-700">{Number(product.averageRating || 0).toFixed(1)}</span>
                </div>
                <span className="text-neutral-300 text-xs">|</span>
                <span className="text-xs text-neutral-500">{product.reviewCount} Reviews</span>
              </div>
            )}

            {/* Price block — hero */}
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-sans font-bold text-neutral-900 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  ₹{Number(product.finalPrice).toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-sm sm:text-base font-sans text-neutral-400 line-through" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ₹{Number(product.price).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">MRP incl. of all taxes</p>
            </div>

            {/* Material callout */}
            {product.material && (
              <p className="text-sm font-semibold text-neutral-700">
                Made With {product.material}
              </p>
            )}

            {/* ═══ Discount / Coupon banner ═══ */}
            {hasDiscount && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs font-semibold text-green-700">
                  SAVE {product.discountPercent}% OFF
                </span>
                <span className="text-xs text-green-600">
                  · You save ₹{savings.toLocaleString()}
                </span>
              </div>
            )}

            {/* ═══ Stock / Scarcity ═══ */}
            <div className="flex flex-wrap items-center gap-2">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                  Currently Unavailable
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Only {product.stockQuantity} left in stock
                </span>
              ) : null}

              {(product.soldThisWeek ?? 0) > 3 && (
                <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-full">
                  <Zap className="w-3 h-3 text-amber-500" />
                  {product.soldThisWeek} sold this week
                </span>
              )}
            </div>

            {/* ═══ Delivery Estimate ═══ */}
            {!isOutOfStock && (
              <div className="bg-blue-50/60 border border-blue-100/60 rounded-xl px-4 py-3 flex items-start gap-3">
                <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-800">
                    Get it by{' '}
                    <span className="font-semibold">{delivery.from}</span>
                    {' – '}
                    <span className="font-semibold">{delivery.to}</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">Free delivery across India</p>
                </div>
              </div>
            )}

            {/* ═══ Trust Badges (GIVA-style 2×2 grid with icons) ═══ */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L11.25 17.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  label: 'Easy 5-Day Return',
                },
                {
                  icon: (
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  ),
                  label: 'Premium Quality',
                },
                {
                  icon: (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                  label: 'Secure Checkout',
                },
                {
                  icon: (
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  ),
                  label: 'Skin Safe Material',
                },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-neutral-50 rounded-lg px-3 py-2.5">
                  {icon}
                  <span className="text-xs font-medium text-neutral-700">{label}</span>
                </div>
              ))}
            </div>

            {/* ═══ COD Badge ═══ */}
            <div className="flex items-center gap-3">
              <CODBadge enabled={codAvailable && !isOutOfStock} />
              {codAvailable && !isOutOfStock && (
                <span className="text-[11px] text-neutral-400">Cash on Delivery · Orders up to ₹5,000</span>
              )}
            </div>

            {/* ═══ DESKTOP QUANTITY + CTAs ═══ */}
            <div className="hidden sm:block space-y-3 pt-2">
              {/* Wishlist + Share row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWishlistToggle}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm ${
                    isInWishlist
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
                  }`}
                  type="button"
                >
                  <Heart
                    size={16}
                    className={isInWishlist ? 'fill-red-500 text-red-500' : ''}
                  />
                  {isInWishlist ? 'Wishlisted' : 'Wishlist'}
                </button>

                {/* Quantity selector */}
                <div className="flex items-center border border-neutral-200 rounded-lg bg-white ml-auto">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="p-2.5 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                  >
                    <Minus size={14} className="text-neutral-600" />
                  </button>
                  <span className="px-4 py-2 font-medium text-neutral-900 border-l border-r border-neutral-200 min-w-[48px] text-center text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={isOutOfStock || quantity >= maxQuantity}
                    className="p-2.5 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} className="text-neutral-600" />
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full py-4 rounded-xl font-semibold bg-neutral-200 text-neutral-400 cursor-not-allowed flex items-center justify-center gap-2"
                  type="button"
                >
                  <ShoppingCart size={18} />
                  Out of Stock
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Buy Now — Outlined Pink */}
                  <button
                    onClick={handleBuyNow}
                    className="py-4 rounded-xl font-semibold text-[15px] border-2 border-primary-500 text-primary-500
                               hover:bg-primary-50 transition-all active:scale-[0.98]"
                    type="button"
                  >
                    Buy Now
                  </button>

                  {/* Add to Cart — Solid Pink */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-[15px] active:scale-[0.98] ${
                      addedToCart
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    type="button"
                  >
                    {addedToCart ? (
                      <>
                        <Check size={18} />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        {isAddingToCart ? 'Adding...' : 'Add To Cart'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* View Cart link */}
              {addedToCart && (
                <Link
                  href="/cart"
                  className="block w-full py-2 text-center text-sm text-primary-500 hover:text-primary-600 hover:underline transition-colors"
                >
                  View Cart →
                </Link>
              )}
            </div>

            {/* Free Shipping Threshold */}
            <FreeShippingThreshold />

            {/* ═══ Delivery & Returns Box ═══ */}
            <div className="rounded-xl border border-neutral-100 p-4 space-y-2.5">
              <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2">
                Delivery & Returns
              </h3>
              <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                <Truck size={14} className="text-neutral-400 flex-shrink-0" />
                <span>Free delivery across India</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                <RotateCcw size={14} className="text-neutral-400 flex-shrink-0" />
                <span>Easy 5-day returns from delivery date</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                <Lock size={14} className="text-neutral-400 flex-shrink-0" />
                <span>Secure checkout with Razorpay & COD</span>
              </div>
            </div>

            {/* SKU & Category */}
            <div className="border-t border-neutral-100 pt-4">
              <div className="text-xs text-neutral-400 space-y-1">
                <p>
                  <span className="text-neutral-300">SKU:</span> {product.sku || `ORA-${product.id.slice(0, 8).toUpperCase()}`}
                </p>
                <p>
                  <span className="text-neutral-300">Category:</span> {product.category.name}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-50 text-[10px] text-neutral-300 space-y-0.5">
                <p>Sold by <span className="text-neutral-400">Ora Global</span></p>
                <p>GSTIN: 33AAJFO89031ZA</p>
                <p>All prices are inclusive of GST</p>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            BELOW THE FOLD — Content + AOV
            ════════════════════════════════════════════ */}

        {/* ═══ Product Description ═══ */}
        {product.description && (
          <section className="py-8 sm:py-10 border-t border-neutral-100">
            <div className="max-w-3xl">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1">Product Description</h2>
              {product.shortDescription && (
                <p className="text-sm font-medium text-neutral-700 mb-4 italic">
                  {product.shortDescription}
                </p>
              )}
              <div className="text-sm sm:text-base text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          </section>
        )}

        {/* ═══ Pair It Up To Complete The Look ═══ */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              Pair It Up To Complete The Look
            </h2>
            <p className="text-sm text-neutral-400 mt-1">Frequently bought together — save more when you bundle</p>
          </div>
          <FrequentlyBoughtTogether
            categoryId={product.category.id}
            currentProductId={product.id}
            currentProduct={{
              id: product.id,
              name: product.name,
              finalPrice: product.finalPrice,
              images: product.images,
            }}
          />
        </section>

        {/* Complete The Look */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              You May Also Like
            </h2>
            <p className="text-sm text-neutral-400 mt-1">Handpicked pieces from the same collection</p>
          </div>
          <CompleteTheLook categoryId={product.category.id} currentProductId={product.id} />
        </section>

        {/* ═══ Craftsmanship ═══ */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">
            Craftsmanship
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '✦', text: 'Premium finish with attention to detail' },
              { icon: '♡', text: 'Skin-friendly, hypoallergenic materials' },
              { icon: '◇', text: 'Lightweight, comfortable design' },
              { icon: '❋', text: 'Designed for everyday wear' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-neutral-50 rounded-lg px-4 py-3">
                <span className="text-primary-400 text-sm">{icon}</span>
                <span className="text-sm text-neutral-600">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Styling Notes */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-3">
            Styling Notes
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-3xl">
            Pair with minimal gold accents for a polished daytime look, or layer with delicate chains for
            evening refinement. This piece transitions effortlessly from work to occasion wear.
          </p>
        </section>

        {/* Product Specs */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <ProductSpecs
            specs={{
              material: product.material,
              weight: product.weight,
              dimensions: product.dimensions,
              careInstructions: product.careInstructions,
            }}
          />
        </section>

        {/* Reviews */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <ReviewSection
            productId={product.id}
            productName={product.name}
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
          />
        </section>

        {/* You May Also Like */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              More From {product.category.name}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">Explore similar styles you&apos;ll love</p>
          </div>
          <RelatedProducts
            categoryId={product.category.id}
            currentProductId={product.id}
            limit={4}
          />
        </section>

        {/* Recently Viewed */}
        <section className="py-8 sm:py-10 border-t border-neutral-100">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              Recently Viewed
            </h2>
            <p className="text-sm text-neutral-400 mt-1">Pick up where you left off</p>
          </div>
          <RecentlyViewedProducts excludeProductId={product.id} layout="horizontal" />
        </section>
      </div>

      {/* ════════════════════════════════════════════
          MOBILE STICKY CTA BAR
          ════════════════════════════════════════════ */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-50 safe-area-bottom shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        {/* Low-stock nudge */}
        {isLowStock && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-4 py-1.5 border-b border-amber-100">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0 animate-pulse" />
            Only {product.stockQuantity} left — order soon!
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Price */}
          <div className="min-w-0 flex-shrink-0">
            <p className="text-lg font-semibold text-neutral-900 leading-tight">
              ₹{Number(product.finalPrice).toLocaleString()}
            </p>
            {hasDiscount && (
              <p className="text-[10px] text-neutral-400 line-through leading-tight">
                ₹{Number(product.price).toLocaleString()}
              </p>
            )}
          </div>

          {/* CTA Buttons */}
          {isOutOfStock ? (
            <button
              disabled
              className="flex-1 py-3 rounded-xl font-semibold bg-neutral-200 text-neutral-400 cursor-not-allowed text-sm"
              type="button"
            >
              Out of Stock
            </button>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-2">
              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="py-3 rounded-xl font-semibold text-sm border-2 border-primary-500 text-primary-500 transition-all active:scale-[0.97]"
                type="button"
              >
                Buy Now
              </button>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm active:scale-[0.97] ${
                  addedToCart
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-500 text-white'
                } disabled:opacity-50`}
                type="button"
              >
                {addedToCart ? (
                  <>
                    <Check size={14} />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
