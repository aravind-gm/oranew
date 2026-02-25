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
  ChevronRight,
  Heart,
  Leaf,
  Lock,
  Minus,
  Package,
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
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < full
                ? 'text-amber-400'
                : i === full && half
                ? 'text-amber-300'
                : 'text-neutral-200'
            }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-xs text-neutral-500">
        {rating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
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
        const fetchedProduct = response.data.data;
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
          <h1 className="text-2xl font-serif text-neutral-900 mb-4">Product not found</h1>
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
      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto">
            <Link href="/products" className="hover:text-neutral-800 whitespace-nowrap transition-colors">
              Products
            </Link>
            <ChevronRight size={12} className="text-neutral-300 flex-shrink-0" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-neutral-800 whitespace-nowrap transition-colors"
            >
              {product.category.name}
            </Link>
            <ChevronRight size={12} className="text-neutral-300 flex-shrink-0 hidden sm:block" />
            <span className="text-neutral-700 truncate hidden sm:block max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pb-36 sm:pb-12">
        {/* ====== ABOVE THE FOLD — Gallery + Product Info ====== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16">
          {/* Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-5">
            {/* Category Label */}
            <span className="text-[11px] sm:text-xs font-medium text-neutral-400 uppercase tracking-[0.15em]">
              {product.category.name}
            </span>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-[#1A1A1A] leading-tight">
              {product.name}
            </h1>

            {/* Rating + Scarcity */}
            <div className="flex flex-wrap items-center gap-3">
              <StarRating rating={product.averageRating} count={product.reviewCount} />

              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                  Currently Unavailable
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Only {product.stockQuantity} left in stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-full">
                  Limited First Drop
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-neutral-600 text-base leading-relaxed">{product.shortDescription}</p>
            )}

            {/* ===== PRICE HIERARCHY ===== */}
            <div className="bg-neutral-50/80 rounded-xl p-4 border border-neutral-100">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-serif font-medium text-[#1A1A1A]">
                  ₹{Number(product.finalPrice).toLocaleString()}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-neutral-400 line-through">
                      MRP ₹{Number(product.price).toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      You save ₹{savings.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs text-neutral-500 mt-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Early launch price · Inclusive of all taxes
                </p>
              )}
              {!hasDiscount && (
                <p className="text-xs text-neutral-500 mt-1.5">Inclusive of all taxes</p>
              )}
            </div>

            {/* ===== DELIVERY ESTIMATE ===== */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-neutral-800">
                    Get it between{' '}
                    <span className="font-semibold">{delivery.from}</span>
                    {' – '}
                    <span className="font-semibold">{delivery.to}</span>
                  </p>
                  <p className="text-xs text-neutral-500">Free delivery across India</p>
                </div>
              </div>
            )}

            {/* ===== TRUST MINI-STRIP ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
              {[
                { icon: Truck, label: 'Free Delivery' },
                { icon: RotateCcw, label: '7-Day Returns' },
                { icon: Lock, label: 'Secure Checkout' },
                { icon: Leaf, label: 'Skin Safe Material' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Icon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* ===== COD BADGE ===== */}
            <div className="flex items-center gap-3">
              <CODBadge enabled={codAvailable && !isOutOfStock} />
              {codAvailable && !isOutOfStock && (
                <span className="text-[11px] text-neutral-400">Pay at your doorstep · Orders up to ₹5,000</span>
              )}
            </div>

            {/* ===== DESKTOP QUANTITY + CTAs ===== */}
            <div className="hidden sm:block space-y-3 pt-2">
              {/* Quantity + Wishlist row */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-neutral-200 rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="p-3 hover:bg-neutral-50 disabled:opacity-40 transition-colors min-w-[44px]"
                  >
                    <Minus size={16} className="text-neutral-600" />
                  </button>
                  <span className="px-5 py-2 font-medium text-neutral-900 border-l border-r border-neutral-200 min-w-[56px] text-center text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={isOutOfStock || quantity >= maxQuantity}
                    className="p-3 hover:bg-neutral-50 disabled:opacity-40 transition-colors min-w-[44px]"
                  >
                    <Plus size={16} className="text-neutral-600" />
                  </button>
                </div>

                <button
                  onClick={handleWishlistToggle}
                  className="p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  type="button"
                  aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart
                    size={20}
                    className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-400'}
                  />
                </button>
              </div>

              {/* ADD TO CART — Primary */}
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full py-4 rounded-lg font-medium bg-neutral-200 text-neutral-400 cursor-not-allowed flex items-center justify-center gap-2"
                  type="button"
                >
                  <ShoppingCart size={18} />
                  Out of Stock
                </button>
              ) : (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className={`w-full py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-[15px] ${
                      addedToCart
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#1A1A1A] text-white hover:bg-[#2a2a2a] active:scale-[0.99]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    type="button"
                  >
                    {addedToCart ? (
                      <>
                        <Check size={18} />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                      </>
                    )}
                  </button>

                  {/* BUY NOW — Secondary */}
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-3.5 rounded-lg font-medium text-[15px] border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-[0.99]"
                    type="button"
                  >
                    Buy Now
                  </button>
                </>
              )}

              {/* View Cart link */}
              {addedToCart && (
                <Link
                  href="/cart"
                  className="block w-full py-2 text-center text-sm text-neutral-600 hover:text-neutral-900 hover:underline transition-colors"
                >
                  View Cart →
                </Link>
              )}

              {/* Return policy micro-copy */}
              {!isOutOfStock && (
                <p className="text-center text-[11px] text-neutral-400 mt-1">
                  Easy 7-day return policy from delivery date
                </p>
              )}
            </div>

            {/* Free Shipping Threshold (only visible if cart has items) */}
            <FreeShippingThreshold />

            {/* ===== DELIVERY & RETURNS BOX ===== */}
            <div className="bg-neutral-50/80 rounded-xl p-4 space-y-2.5 border border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2">
                Delivery & Returns
              </h3>
              <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                <Truck size={14} className="text-neutral-400 flex-shrink-0" />
                <span>Free delivery across India</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                <RotateCcw size={14} className="text-neutral-400 flex-shrink-0" />
                <span>7-day return window from delivery</span>
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
                  <span className="text-neutral-300">SKU:</span> {`ORA-${product.id.slice(0, 8).toUpperCase()}`}
                </p>
                <p>
                  <span className="text-neutral-300">Category:</span> {product.category.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== BELOW THE FOLD — AOV + Content ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16">
          <div className="lg:col-span-2 space-y-2">
            {/* Frequently Bought Together */}
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

            {/* Complete The Look */}
            <CompleteTheLook categoryId={product.category.id} currentProductId={product.id} />

            {/* Design Details */}
            {product.description && (
              <section className="py-8 sm:py-10 border-t border-neutral-100">
                <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-3 sm:mb-4">
                  Design Details
                </h2>
                <p className="text-neutral-600 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                  {product.description}
                </p>
              </section>
            )}

            {/* Craftsmanship */}
            <section className="py-8 sm:py-10 border-t border-neutral-100">
              <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-3 sm:mb-4">
                Craftsmanship
              </h2>
              <ul className="space-y-2 text-sm sm:text-base text-neutral-600">
                {[
                  'Premium finish with attention to detail',
                  'Skin-friendly, hypoallergenic materials',
                  'Lightweight, comfortable design',
                  'Designed for everyday wear',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            {/* Styling Notes */}
            <section className="py-8 sm:py-10 border-t border-neutral-100">
              <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-3 sm:mb-4">
                Styling Notes
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Pair with minimal gold accents for a polished daytime look, or layer with delicate chains for
                evening refinement. This piece transitions effortlessly from work to occasion wear.
              </p>
            </section>

            {/* Product Specs */}
            <ProductSpecs
              specs={{
                material: product.material,
                weight: product.weight,
                dimensions: product.dimensions,
                careInstructions: product.careInstructions,
              }}
            />

            {/* Reviews */}
            <ReviewSection
              productId={product.id}
              productName={product.name}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          </div>

          {/* Sidebar - hidden on mobile */}
          <div className="hidden lg:block">
            {/* Sticky mini product card for desktop */}
            <div className="sticky top-24 space-y-6">
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
                <p className="text-xs uppercase tracking-wider text-neutral-400 mb-2">Quick Summary</p>
                <h3 className="font-serif text-lg text-neutral-900 mb-1">{product.name}</h3>
                <p className="text-xl font-serif font-medium text-[#1A1A1A] mb-3">
                  ₹{Number(product.finalPrice).toLocaleString()}
                </p>
                {!isOutOfStock && (
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                    type="button"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        <div className="mt-12 sm:mt-16 border-t pt-8 sm:pt-12">
          <RelatedProducts
            categoryId={product.category.id}
            currentProductId={product.id}
            limit={4}
          />
        </div>

        {/* Recently Viewed */}
        <div className="mt-12 sm:mt-16 border-t pt-8 sm:pt-12">
          <RecentlyViewedProducts excludeProductId={product.id} layout="horizontal" />
        </div>
      </div>

      {/* ====== MOBILE STICKY CTA BAR ====== */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Low-stock nudge */}
        {isLowStock && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-md px-3 py-1.5 mb-2 border border-amber-200">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0 animate-pulse" />
            Only {product.stockQuantity} left — order soon!
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Price */}
          <div className="min-w-0 mr-1">
            <p className="text-lg font-serif font-medium text-[#1A1A1A] leading-tight">
              ₹{Number(product.finalPrice).toLocaleString()}
            </p>
            {hasDiscount && (
              <p className="text-[10px] text-neutral-400 line-through leading-tight">
                ₹{Number(product.price).toLocaleString()}
              </p>
            )}
          </div>

          {/* Quantity (compact) */}
          <div className="flex items-center border border-neutral-200 rounded-lg bg-white">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock}
              className="p-2 hover:bg-neutral-50 disabled:opacity-40"
            >
              <Minus size={14} className="text-neutral-600" />
            </button>
            <span className="px-2 py-1 font-medium text-neutral-900 text-xs min-w-[24px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={isOutOfStock || quantity >= maxQuantity}
              className="p-2 hover:bg-neutral-50 disabled:opacity-40"
            >
              <Plus size={14} className="text-neutral-600" />
            </button>
          </div>

          {/* CTA Buttons */}
          {isOutOfStock ? (
            <button
              disabled
              className="flex-1 py-3 rounded-lg font-medium bg-neutral-200 text-neutral-400 cursor-not-allowed text-sm"
              type="button"
            >
              Out of Stock
            </button>
          ) : (
            <>
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${
                  addedToCart
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#1A1A1A] text-white'
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
                    Cart
                  </>
                )}
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="py-3 px-4 rounded-lg font-medium text-sm border-2 border-[#1A1A1A] text-[#1A1A1A] transition-all"
                type="button"
              >
                Buy
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
