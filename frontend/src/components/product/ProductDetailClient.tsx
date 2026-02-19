'use client';

import ProductGallery from '@/components/product/ProductGallery';
import ProductSpecs from '@/components/product/ProductSpecs';
import RecentlyViewedProducts from '@/components/product/RecentlyViewedProducts';
import RelatedProducts from '@/components/product/RelatedProducts';
import ReviewSection from '@/components/product/ReviewSection';
import api from '@/lib/api';
import { trackAddToCart, trackAddToWishlist, trackViewItem } from '@/lib/analytics';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { Check, ChevronRight, Heart, Lock, Minus, Plus, ShoppingCart, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlistItems } = useWishlistStore();
  const { addToRecentlyViewed } = useProductStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${slug}`);
        const fetchedProduct = response.data.data;
        setProduct(fetchedProduct);
        
        // Add to recently viewed
        if (fetchedProduct) {
          const primaryImage = fetchedProduct.images?.find((img: ProductImage) => img.isPrimary) || fetchedProduct.images?.[0];
          addToRecentlyViewed({
            productId: fetchedProduct.id,
            slug: fetchedProduct.slug,
            name: fetchedProduct.name,
            image: primaryImage?.imageUrl || '',
            price: fetchedProduct.finalPrice,
          });

          // Analytics: track product view
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

    if (slug) {
      fetchProduct();
    }
  }, [slug, addToRecentlyViewed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="h-96 bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link href="/products" className="text-blue-600 hover:underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);
  const isOutOfStock = product.stockQuantity === 0;
  const threshold = product.lowStockThreshold ?? 5;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= threshold;
  const maxQuantity = Math.min(product.stockQuantity, 10);

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
      addToCart({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.finalPrice,
        image: primaryImage?.imageUrl || '/oralogo.png',
        quantity,
        stockQuantity: product.stockQuantity,
      });

      // Analytics: track add to cart
      trackAddToCart({
        id: product.id,
        name: product.name,
        price: product.finalPrice,
        quantity,
        category: product.category?.name,
      });

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch {
      // Error handled silently
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = () => {
    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
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

      // Analytics: track add to wishlist
      trackAddToWishlist({
        id: product.id,
        name: product.name,
        price: product.finalPrice,
        category: product.category?.name,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <Link href="/products" className="hover:text-blue-600 whitespace-nowrap">
              Products
            </Link>
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-blue-600 whitespace-nowrap">
              {product.category.name}
            </Link>
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0 hidden sm:block" />
            <span className="text-gray-900 font-medium truncate hidden sm:block max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pb-28 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16">
          {/* Product Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Category Label */}
            <div>
              <span className="text-xs sm:text-sm font-medium text-neutral-500 uppercase tracking-wider">
                {product.category.name}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-[#1A1A1A] mb-2 sm:mb-3">{product.name}</h1>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-gray-600 text-lg">{product.shortDescription}</p>
            )}

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-serif font-medium text-[#1A1A1A]">
                  ₹{Number(product.finalPrice).toFixed(0)}
                </span>
                {product.discountPercent > 0 && (
                  <span className="text-base sm:text-lg text-neutral-400 line-through">
                    ₹{Number(product.price).toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            {/* Trust Row — Minimal */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-neutral-600 border-y border-neutral-100 py-4">
              <span>Free Delivery</span>
              <span>·</span>
              <span>5-Day Returns</span>
              <span>·</span>
              <span>Secure Checkout</span>
            </div>

            {/* Stock Status */}
            <div className="space-y-2">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 text-neutral-600 rounded-lg font-medium text-sm">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full" />
                  Currently Unavailable
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-medium text-sm animate-pulse">
                  <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                  Only {product.stockQuantity} left in stock — order soon!
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium text-sm">
                  <Check size={16} />
                  In Stock
                </div>
              )}

              {/* Delivery Estimate */}
              {!isOutOfStock && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Truck size={16} className="text-neutral-400" />
                  <span>Estimated delivery: <strong className="text-neutral-800">3–5 business days</strong></span>
                </div>
              )}
            </div>

            {/* Desktop Quantity & Add to Cart */}
            <div className="hidden sm:block space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 min-w-[44px]"
                  >
                    <Minus size={18} className="text-gray-600" />
                  </button>
                  <span className="px-6 py-2 font-medium text-gray-900 border-l border-r border-gray-300 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={isOutOfStock || quantity >= maxQuantity}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 min-w-[44px]"
                  >
                    <Plus size={18} className="text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleWishlistToggle}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                  type="button"
                >
                  <Heart
                    size={20}
                    className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                </button>
              </div>

              {/* Add to Cart / Out of Stock Button */}
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full py-4 px-4 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed min-h-[52px] flex items-center justify-center gap-2"
                  type="button"
                >
                  <ShoppingCart size={20} />
                  <span>Out of Stock</span>
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className={`w-full py-4 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    addedToCart 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                  } disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]`}
                  type="button"
                >
                  {addedToCart ? (
                    <>
                      <Check size={20} />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>
              )}

              {/* Return Policy Short Summary */}
              {!isOutOfStock && (
                <p className="text-center text-xs text-gray-500 mt-1">
                  Easy 5-day return policy from delivery date.
                </p>
              )}

              {addedToCart && (
                <Link 
                  href="/cart" 
                  className="block w-full py-2 text-center text-[#1A1A1A] font-medium hover:underline"
                >
                  View Cart →
                </Link>
              )}
            </div>

            {/* Delivery & Returns */}
            <div className="bg-neutral-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 border border-neutral-100">
              <h3 className="text-sm font-medium text-[#1A1A1A] mb-2">Delivery & Returns</h3>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <Truck size={16} className="text-neutral-500 flex-shrink-0" />
                <span className="text-neutral-600">Free delivery across India</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <Check size={16} className="text-neutral-500 flex-shrink-0" />
                <span className="text-neutral-600">5-day return window from delivery</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <Lock size={16} className="text-neutral-500 flex-shrink-0" />
                <span className="text-neutral-600">Secure checkout with Razorpay</span>
              </div>
            </div>

            {/* SKU & Category */}
            <div className="border-t border-neutral-100 pt-4 sm:pt-6">
              <div className="text-xs sm:text-sm text-neutral-500 space-y-1">
                <p>
                  <span className="text-neutral-400">SKU:</span> {`ORA-${product.id.slice(0, 8).toUpperCase()}`}
                </p>
                <p>
                  <span className="text-neutral-400">Category:</span> {product.category.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16">
          <div className="lg:col-span-2 space-y-8 sm:space-y-12">
            {product.description && (
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-3 sm:mb-4">Design Details</h2>
                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Craftsmanship */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-3 sm:mb-4">Craftsmanship</h2>
              <ul className="space-y-2 text-sm sm:text-base text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
                  Premium finish with attention to detail
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
                  Skin-friendly materials
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
                  Lightweight, comfortable design
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
                  Designed for everyday wear
                </li>
              </ul>
            </div>

            {/* Styling Notes */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A] mb-3 sm:mb-4">Styling Notes</h2>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Pair with minimal gold accents for a polished daytime look, or layer with delicate chains for evening refinement. This piece transitions effortlessly from work to occasion wear.
              </p>
            </div>

            <ProductSpecs
              specs={{
                material: product.material,
                weight: product.weight,
                dimensions: product.dimensions,
                careInstructions: product.careInstructions,
              }}
            />

            <ReviewSection
              productId={product.id}
              productName={product.name}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          </div>

          <div>
            <RelatedProducts
              categoryId={product.category.id}
              currentProductId={product.id}
              limit={3}
            />
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="mt-12 sm:mt-16 border-t pt-8 sm:pt-12">
          <RecentlyViewedProducts 
            excludeProductId={product.id} 
            layout="horizontal"
          />
        </div>
      </div>

      {/* Mobile Sticky CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {/* Low-stock nudge above the sticky bar */}
        {isLowStock && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-1.5 mb-2 border border-amber-200">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
            Only {product.stockQuantity} left — order soon!
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
              <p className="text-lg font-serif font-medium text-[#1A1A1A] truncate">
              ₹{Number(product.finalPrice).toFixed(0)}
            </p>
            {product.discountPercent > 0 && (
              <p className="text-xs text-neutral-500">
                <span className="line-through">₹{Number(product.price).toFixed(0)}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock}
              className="p-2 hover:bg-gray-100 disabled:opacity-50"
            >
              <Minus size={16} className="text-gray-600" />
            </button>
            <span className="px-3 py-1 font-medium text-gray-900 text-sm">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={isOutOfStock || quantity >= maxQuantity}
              className="p-2 hover:bg-gray-100 disabled:opacity-50"
            >
              <Plus size={16} className="text-gray-600" />
            </button>
          </div>
          
          {isOutOfStock ? (
            <button
              disabled
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              type="button"
            >
              <ShoppingCart size={16} />
              <span>Out of Stock</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                addedToCart 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#1A1A1A] text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
            >
              {addedToCart ? (
                <>
                  <Check size={16} />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={16} />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
