'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — PREMIUM WISHLIST PAGE
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * Inspired by GIVA's wishlist with tabs (My Wishlist / Recently Viewed)
 * Premium, engaging experience with quick add-to-cart functionality.
 * 
 * KEY FEATURES:
 * ✓ Grid layout (2 cols mobile, 4 cols desktop)
 * ✓ Premium product cards with hover effects
 * ✓ Quick add-to-cart from wishlist
 * ✓ Illustrated empty state with trending products
 * ✓ Share wishlist functionality
 * ✓ Bulk add all to cart
 */

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Trash2, X, ChevronRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface WishlistItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  description?: string;
}

interface TrendingProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

// ============================================================================
// EMPTY WISHLIST COMPONENT
// ============================================================================

function EmptyWishlist({ trendingProducts }: { trendingProducts: TrendingProduct[] }) {
  const { addItem } = useCartStore();
  const { showNotification } = useCartNotificationStore();
  const { addItem: addToWishlist } = useWishlistStore();

  const handleQuickAdd = (product: TrendingProduct) => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.finalPrice,
      image: product.images?.[0]?.imageUrl || '/oralogo.png',
      quantity: 1,
    });
    showNotification({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0]?.imageUrl || '/oralogo.png',
      productPrice: product.finalPrice,
      quantity: 1,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30">
      {/* Empty State */}
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Illustrated Heart */}
          <div className="relative w-48 h-48 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full" />
            <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center shadow-lg">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-20 h-20 text-pink-300" strokeWidth={1.5} />
              </motion.div>
            </div>
            {/* Floating Hearts */}
            <motion.div
              animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-2 right-4"
            >
              <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
            </motion.div>
            <motion.div
              animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute bottom-8 left-2"
            >
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            </motion.div>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl text-gray-900 mb-3">
            It feels so empty in here
          </h1>
          <p className="text-lg text-gray-500 mb-2">Make a wish!</p>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Save your favorite pieces by clicking the heart icon on any product. Build your collection of dreams!
          </p>
          
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>Start Shopping</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>

      {/* Trending Products Section */}
      {trendingProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-pink-600 mb-3">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Trending Now</span>
              </div>
              <h2 className="font-serif text-2xl lg:text-3xl text-gray-900">Popular Picks</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {trendingProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
                    {product.images?.[0]?.imageUrl ? (
                      <Image
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-pink-200" />
                      </div>
                    )}
                    
                    {/* Wishlist Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault();
                        addToWishlist({
                          id: crypto.randomUUID(),
                          productId: product.id,
                          slug: product.slug,
                          name: product.name,
                          image: product.images?.[0]?.imageUrl || '',
                          price: product.finalPrice,
                        });
                      }}
                      className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-pink-500 hover:text-white"
                    >
                      <Heart className="w-5 h-5" />
                    </motion.button>

                    {/* Discount Badge */}
                    {(product.discountPercent ?? 0) > 0 && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-pink-600 text-white rounded-full text-xs font-bold">
                        -{product.discountPercent}%
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-medium text-gray-900 hover:text-pink-600 transition-colors line-clamp-2 text-sm mb-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">₹{product.finalPrice.toLocaleString()}</span>
                        {product.price > product.finalPrice && (
                          <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickAdd(product)}
                      className="w-full py-2.5 bg-gray-900 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WISHLIST PRODUCT CARD COMPONENT
// ============================================================================

interface WishlistCardProps {
  item: WishlistItem;
  onMoveToCart: (item: WishlistItem) => void;
  onRemove: (productId: string) => void;
  index: number;
}

function WishlistCard({ item, onMoveToCart, onRemove, index }: WishlistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-pink-200" />
          </div>
        )}
        
        {/* Remove Button (Heart) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(item.productId)}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-red-500 transition-colors group/heart"
          title="Remove from wishlist"
        >
          <Heart className="w-5 h-5 fill-pink-500 text-pink-500 group-hover/heart:fill-white group-hover/heart:text-white transition-colors" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <Link href={`/products/${item.slug}`}>
          <h3 className="font-semibold text-gray-900 hover:text-pink-600 transition-colors line-clamp-2 text-sm sm:text-base mb-2">
            {item.name}
          </h3>
        </Link>
        
        {item.description && (
          <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mb-3">{item.description}</p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-lg sm:text-xl text-gray-900">
            ₹{item.price.toLocaleString()}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onMoveToCart(item)}
          className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <ShoppingBag className="w-4 h-4" />
          Move to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN WISHLIST PAGE COMPONENT
// ============================================================================

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { showNotification } = useCartNotificationStore();
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'wishlist' | 'recent'>('wishlist');

  // Fetch trending products for empty state
  const fetchTrendingProducts = useCallback(async () => {
    try {
      const response = await api.get('/products', {
        params: { limit: 8, sort: '-sales' }
      });
      setTrendingProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch trending products:', error);
    }
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      fetchTrendingProducts();
    }
  }, [items.length, fetchTrendingProducts]);

  const handleMoveToCart = (item: WishlistItem) => {
    addItem({
      id: crypto.randomUUID(),
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: 1,
    });
    removeItem(item.productId);
    
    showNotification({
      productId: item.productId,
      productName: item.name,
      productImage: item.image,
      productPrice: item.price,
      quantity: 1,
    });
  };

  const handleAddAllToCart = () => {
    items.forEach((item) => {
      addItem({
        id: crypto.randomUUID(),
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: 1,
      });
    });
    clearWishlist();
  };

  const handleShare = async () => {
    const shareText = `Check out my ORA Jewellery wishlist:\n${items.map((item) => `- ${item.name} (₹${item.price.toLocaleString()})`).join('\n')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My ORA Jewellery Wishlist',
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);

  // Empty State
  if (items.length === 0) {
    return <EmptyWishlist trendingProducts={trendingProducts} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Wishlist</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="font-serif text-3xl lg:text-4xl text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
              <span className="mx-2">•</span>
              <span className="font-semibold text-pink-600">₹{totalValue.toLocaleString()} total</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-full text-gray-700 font-medium hover:border-pink-300 hover:bg-pink-50 transition-all"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink ? 'Copied!' : 'Share'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-red-200 rounded-full text-red-600 font-medium hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddAllToCart}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Add All to Cart
            </motion.button>
          </div>
        </div>

        {/* Tabs - Like GIVA */}
        <div className="flex items-center gap-8 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === 'wishlist' 
                ? 'text-pink-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Wishlist
            {activeTab === 'wishlist' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === 'recent' 
                ? 'text-pink-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recently Viewed
            {activeTab === 'recent' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"
              />
            )}
          </button>
        </div>

        {/* Wishlist Grid */}
        {activeTab === 'wishlist' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence>
              {items.map((item, index) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  onMoveToCart={handleMoveToCart}
                  onRemove={removeItem}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Recently Viewed Tab (Placeholder) */}
        {activeTab === 'recent' && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recently viewed items</h3>
            <p className="text-gray-500 mb-6">Browse our collection to see your viewing history</p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Browse Collection
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Continue Shopping */}
        <div className="mt-10 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Clear Wishlist?</h3>
                <button 
                  onClick={() => setShowClearConfirm(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove all {items.length} items from your wishlist? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearWishlist();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
                >
                  Clear Wishlist
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
