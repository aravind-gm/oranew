'use client';

/**
 * Gifts for Her — /collections/gifts-for-her
 * 
 * COMPLETE REBUILD: Emotion-driven premium gifting experience
 * Features: Hero, Occasion Selector, Price Cards, Featured Gifts, Enhanced Product Grid
 */

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import GiftsHero from '@/components/gifts/GiftsHero';
import OccasionSelector from '@/components/gifts/OccasionSelector';
import PriceGiftCards from '@/components/gifts/PriceGiftCards';
import FeaturedGiftSection from '@/components/gifts/FeaturedGiftSection';
import GiftProductCard, { GiftProduct } from '@/components/gifts/GiftProductCard';
import { 
  WhyGiftSection, 
  HowToPickGift,
  FinalCTASection 
} from '@/components/gifts/SupportingSections';
import StickyMobileCTA from '@/components/gifts/StickyMobileCTA';
import { Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';

interface ProductResponse {
  data?: any[];
  products?: any[];
  pagination?: {
    total?: number;
    pages?: number;
  };
  total?: number;
  page?: number;
  pages?: number;
}

export default function GiftsForHerPage() {
  const [products, setProducts] = useState<GiftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: 12,
        collection: 'gifts-for-her', // Filter by gifts-for-her collection
      };

      // Add occasion filter
      if (selectedOccasion) {
        params.occasion = selectedOccasion;
      }

      // Add price filter
      if (maxPrice) {
        params.maxPrice = maxPrice;
      }

      const response = await api.get<ProductResponse>('/products', { params });
      
      // Handle API response format: { data: [...], pagination: {...} }
      const productList = response.data.data || response.data.products || [];
      
      const transformedProducts: GiftProduct[] = productList.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.finalPrice || p.price,
        originalPrice: p.price,
        images: p.images?.map((img: any) => img.url || img.image_url) || [],
        rating: p.averageRating || 4.5,
        reviewCount: p.reviewCount || 0,
        inStock: p.inStock !== false,
        stockCount: p.stockCount,
        isNew: p.isNew || false,
        isBestseller: p.isBestseller || false,
        giftWrapAvailable: true, // Default true for gifts collection
        trendingTag: p.trending ? 'Trending Now' : undefined,
      }));

      setProducts(transformedProducts);
      setTotalPages(response.data.pagination?.pages || response.data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Unable to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedOccasion, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOccasionChange = (occasion: string | null) => {
    setSelectedOccasion(occasion);
    setPage(1);
  };

  const handlePriceSelect = (price: number | null) => {
    setMaxPrice(price);
    setPage(1);
    
    // Smooth scroll to product grid
    setTimeout(() => {
      const grid = document.getElementById('shop-gifts');
      grid?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* 1. Hero Section */}
      <GiftsHero />

      {/* 2. Occasion Selector */}
      <OccasionSelector onOccasionChange={handleOccasionChange} />

      {/* 3. Price Gift Cards */}
      <PriceGiftCards onPriceSelect={handlePriceSelect} />

      {/* 4. Featured Gifts Section */}
      <FeaturedGiftSection />

      {/* 5. Main Product Grid */}
      <section id="shop-gifts" className="py-12 md:py-16 bg-white scroll-mt-20">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif text-[#111111] mb-2">
              All Gift Ideas
            </h2>
            {selectedOccasion && (
              <p className="text-sm text-[#7A7A85]">
                Filtered by: <span className="font-medium text-[#E91E63] capitalize">{selectedOccasion}</span>
              </p>
            )}
            {maxPrice && (
              <p className="text-sm text-[#7A7A85]">
                Budget: <span className="font-medium text-[#E91E63]">Under ₹{maxPrice.toLocaleString()}</span>
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-[#E91E63] animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <p className="text-[#7A7A85] mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-6 py-2 bg-[#E91E63] text-white rounded-full hover:bg-[#C2185B] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <GiftProductCard 
                  key={product.id} 
                  product={product}
                  onAddToCart={(id) => {
                    const p = products.find(pr => pr.id === id);
                    if (p) {
                      useCartStore.getState().addItem({
                        id: `cart-${p.id}`,
                        productId: p.id,
                        name: p.name,
                        image: p.images[0] || '',
                        price: p.price,
                        quantity: 1,
                      });
                      toast.success('Added to bag!');
                    }
                  }}
                  onWishlistToggle={(id) => {
                    const p = products.find(pr => pr.id === id);
                    if (p) {
                      const store = useWishlistStore.getState();
                      if (store.isInWishlist(p.id)) {
                        store.removeItem(p.id);
                        toast.success('Removed from wishlist');
                      } else {
                        store.addItem({
                          id: `wish-${p.id}`,
                          productId: p.id,
                          slug: p.slug,
                          name: p.name,
                          image: p.images[0] || '',
                          price: p.price,
                        });
                        toast.success('Added to wishlist!');
                      }
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#7A7A85] mb-4">
                No products found with these filters.
              </p>
              <button
                onClick={() => {
                  setSelectedOccasion(null);
                  setMaxPrice(null);
                  setPage(1);
                }}
                className="px-6 py-2 bg-[#E91E63] text-white rounded-full hover:bg-[#C2185B] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[#ECECF2] rounded-full text-sm font-medium text-[#111111] hover:border-[#E91E63] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-[#7A7A85]">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-[#ECECF2] rounded-full text-sm font-medium text-[#111111] hover:border-[#E91E63] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 6. Why Gift Jewellery */}
      <WhyGiftSection />

      {/* 7. How To Pick Gift */}
      <HowToPickGift />

      {/* 9. Final CTA */}
      <FinalCTASection />

      {/* 10. Sticky Mobile CTA */}
      <StickyMobileCTA />
    </main>
  );
}
