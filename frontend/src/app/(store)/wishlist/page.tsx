'use client';

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { Heart, Share2, ShoppingCart, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface WishlistItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  description?: string;
}

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
    const shareText = `Check out my wishlist:\n${items.map((item) => `- ${item.name} (₹${item.price.toLocaleString()})`).join('\n')}`;
    
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
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-background-white border-b border-border">
        <div className="container-luxury py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-text-muted hover:text-accent">Home</Link>
            <span className="text-text-muted">/</span>
            <span className="text-text-primary font-medium">Wishlist</span>
          </div>
        </div>
      </div>

      <div className="container-luxury py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary">My Wishlist</h1>
            <p className="text-text-muted mt-2">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
              {items.length > 0 && (
                <span className="ml-2">• Total value: <span className="font-semibold text-accent">₹{totalValue.toLocaleString()}</span></span>
              )}
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleShare}
                className="btn-outline px-4 py-2 flex items-center gap-2"
              >
                <Share2 size={18} />
                {copiedLink ? 'Copied!' : 'Share'}
              </button>
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="btn-outline px-4 py-2 flex items-center gap-2 text-error border-error hover:bg-error hover:text-white"
              >
                <Trash2 size={18} />
                Clear All
              </button>
              <Link href="/products" className="btn-outline hidden lg:inline-flex">
                Continue Shopping
              </Link>
            </div>
          )}
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Clear Wishlist?</h3>
                <button onClick={() => setShowClearConfirm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove all {items.length} items from your wishlist? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearWishlist();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                >
                  Clear Wishlist
                </button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-light text-text-primary mb-3">Your Wishlist is Empty</h2>
            <p className="text-text-muted mb-8">Save pieces you love by clicking the heart icon on any product</p>
            <Link href="/products" className="btn-primary inline-block">
              Explore Collection
            </Link>
          </div>
        ) : (
          <>
            {/* Add All to Cart Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="text-amber-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ready to checkout?</p>
                  <p className="text-sm text-gray-600">Add all items to your cart in one click</p>
                </div>
              </div>
              <button
                onClick={handleAddAllToCart}
                className="btn-primary px-6 py-3 flex items-center gap-2 whitespace-nowrap"
              >
                <ShoppingCart size={18} />
                Add All to Cart
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={item.id} className="group bg-background-white rounded-2xl shadow-luxury overflow-hidden hover:shadow-luxury-lg transition-all duration-300">
                  {/* Image */}
                  <div className="relative aspect-square bg-primary/5 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="absolute top-3 right-3 w-9 h-9 bg-background-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm group/btn"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-5 h-5 fill-red-500 text-red-500 group-hover/btn:fill-white group-hover/btn:text-white" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="font-serif font-semibold text-text-primary hover:text-accent transition line-clamp-1 text-lg">
                        {item.name}
                      </h3>
                    </Link>
                    {item.description && (
                      <p className="text-text-muted text-sm mt-2 line-clamp-2">{item.description}</p>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xl font-serif font-bold text-accent">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Move to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
