'use client';

import FeaturedGiftSection from '@/components/gifts/FeaturedGiftSection';
import GiftProductCard, { GiftProduct } from '@/components/gifts/GiftProductCard';
import GiftsHero from '@/components/gifts/GiftsHero';
import OccasionSelector from '@/components/gifts/OccasionSelector';
import PriceGiftCards from '@/components/gifts/PriceGiftCards';
import StickyMobileCTA from '@/components/gifts/StickyMobileCTA';
import { FinalCTASection, HowToPickGift, WhyGiftSection } from '@/components/gifts/SupportingSections';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface GiftsForHerCollectionClientProps {
  initialProducts: GiftProduct[];
  initialPage: number;
  initialTotalPages: number;
  initialOccasion: string | null;
  initialMaxPrice: number | null;
}

interface ListingProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  finalPrice: number;
  averageRating?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  stockQuantity?: number;
  primaryImage?: {
    imageUrl: string;
  } | null;
  discountPercent?: number;
}

function toGiftProduct(product: ListingProduct): GiftProduct {
  const primaryImage = product.primaryImage?.imageUrl || '/oralogo.png';
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.finalPrice || product.price || 0),
    originalPrice: Number(product.price || product.finalPrice || 0),
    images: [primaryImage],
    rating: Number(product.averageRating || product.rating || 0) || undefined,
    reviewCount: Number(product.reviewCount || 0),
    inStock: product.inStock !== false,
    stockCount: Number(product.stockQuantity || 0),
    giftWrapAvailable: true,
  };
}

export default function GiftsForHerCollectionClient({
  initialProducts,
  initialPage,
  initialTotalPages,
  initialOccasion,
  initialMaxPrice,
}: GiftsForHerCollectionClientProps) {
  const [products, setProducts] = useState<GiftProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [error, setError] = useState<string | null>(null);

  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(initialOccasion);
  const [maxPrice, setMaxPrice] = useState<number | null>(initialMaxPrice);
  const [page, setPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);

  const hasHydratedRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean> = {
        page,
        limit: 12,
        collection: 'gifts-for-her',
        view: 'listing',
      };

      if (selectedOccasion) params.occasion = selectedOccasion;
      if (maxPrice) params.maxPrice = maxPrice;

      const response = await api.get('/products', { params });
      const productList: ListingProduct[] = response.data?.data || [];
      const transformedProducts = productList.map(toGiftProduct);

      setProducts(transformedProducts);
      setTotalPages(response.data?.pagination?.pages || 1);
    } catch {
      setError('Unable to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [maxPrice, page, selectedOccasion]);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (initialProducts?.length) {
        setLoading(false);
        return;
      }
    }
    fetchProducts();
  }, [fetchProducts, initialProducts]);

  const handleOccasionChange = (occasion: string | null) => {
    setSelectedOccasion(occasion);
    setPage(1);
  };

  const handlePriceSelect = (price: number | null) => {
    setMaxPrice(price);
    setPage(1);
    setTimeout(() => {
      const grid = document.getElementById('shop-gifts');
      grid?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-white">
      <GiftsHero />
      <OccasionSelector onOccasionChange={handleOccasionChange} />
      <PriceGiftCards onPriceSelect={handlePriceSelect} />
      <FeaturedGiftSection />

      <section id="shop-gifts" className="py-12 md:py-16 bg-white scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif text-[#111111] mb-2">All Gift Ideas</h2>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-[#E91E63] animate-spin" />
            </div>
          )}

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

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-4 md:gap-6">
              {products.map((product) => (
                <GiftProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(id) => {
                    const selected = products.find((item) => item.id === id);
                    if (!selected) return;

                    useCartStore.getState().addItem({
                      id: `cart-${selected.id}`,
                      productId: selected.id,
                      name: selected.name,
                      image: selected.images[0] || '/oralogo.png',
                      price: selected.price,
                      quantity: 1,
                    });
                    toast.success('Added to bag!');
                  }}
                  onWishlistToggle={(id) => {
                    const selected = products.find((item) => item.id === id);
                    if (!selected) return;

                    const wishlistStore = useWishlistStore.getState();
                    if (wishlistStore.isInWishlist(selected.id)) {
                      wishlistStore.removeItem(selected.id);
                      toast.success('Removed from wishlist');
                      return;
                    }

                    wishlistStore.addItem({
                      id: `wish-${selected.id}`,
                      productId: selected.id,
                      slug: selected.slug,
                      name: selected.name,
                      image: selected.images[0] || '/oralogo.png',
                      price: selected.price,
                    });
                    toast.success('Added to wishlist!');
                  }}
                />
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#7A7A85] mb-4">No products found with these filters.</p>
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

          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[#ECECF2] rounded-full text-sm font-medium text-[#111111] hover:border-[#E91E63] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-sm text-[#7A7A85]">Page {page} of {totalPages}</span>

              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-[#ECECF2] rounded-full text-sm font-medium text-[#111111] hover:border-[#E91E63] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      <WhyGiftSection />
      <HowToPickGift />
      <FinalCTASection />
      <StickyMobileCTA />
    </main>
  );
}
