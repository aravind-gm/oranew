'use client';

/**
 * OffersPageContent — /collections/offers
 * 
 * Full campaign-style redesign with:
 * - OffersHero (dark, urgency-driven, countdown)
 * - OfferTypeSelector (clickable filter cards)
 * - OfferGrid (dynamic, only isOnOffer products)
 * - OfferProductCard (countdown, savings, grab deal)
 * 
 * ORA Design System — #0F0F14, #FFFFFF, #E91E63, #C6A85B, #F6E9EE
 */

import api from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import OffersHero from './OffersHero';
import OfferTypeSelector, { OfferType } from './OfferTypeSelector';
import OfferProductCard from './OfferProductCard';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface OfferProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  material?: string;
  shortDescription?: string;
  stockQuantity?: number;
  images: Array<{
    id?: string;
    imageUrl: string;
    isPrimary?: boolean;
    altText?: string;
  }>;
  isOnOffer?: boolean;
  offerType?: 'PERCENT' | 'BOGO' | 'FIXED';
  offerValue?: number;
  offerExpiry?: string;
  showCountdown?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface CampaignInfo {
  isActive: boolean;
  expiryDate?: string;
}

export default function OffersPageContent() {
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 16,
    total: 0,
    pages: 0,
  });
  const [selectedOfferType, setSelectedOfferType] = useState<OfferType>('');
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignInfo>({ isActive: true });
  const [sort, setSort] = useState('popularity');

  // Fetch campaign info
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await api.get('/offers/campaign');
        if (res.data?.data) {
          setCampaign({
            isActive: res.data.data.isActive,
            expiryDate: res.data.data.offerExpiry || res.data.data.endDate,
          });
        }
      } catch {
        // Campaign endpoint may not exist yet, use defaults
      }
    };
    fetchCampaign();
  }, []);

  const fetchProducts = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);

        let sortBy = 'createdAt';
        if (sort === 'newest') sortBy = 'createdAt';
        else if (sort === 'price_asc') sortBy = 'finalPrice';
        else if (sort === 'price_desc') sortBy = '-finalPrice';
        else if (sort === 'popularity') sortBy = 'popularity';

        const params: Record<string, unknown> = {
          page,
          limit: 16,
          sortBy,
          hasDiscount: true, // Only products with discounts
          isOnOffer: true,
        };

        // Filter by selection type
        if (selectedOfferType === 'UNDER1499') {
          params.maxPrice = 1499;
        } else if (selectedOfferType === 'UNDER2499') {
          params.maxPrice = 2499;
        } else if (selectedOfferType === 'GIFTS') {
          params.category = 'gifts';
        } else if (selectedOfferType === 'ESSENTIALS') {
          params.tags = 'everyday,essential';
        }

        const response = await api.get('/products', { params });
        const data = response.data.data || [];
        const paginationData = response.data.pagination || {
          page: 1,
          limit: 16,
          total: 0,
          pages: 0,
        };

        setProducts(data);
        setPagination(paginationData);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedOfferType, sort]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* 1. Hero */}
      <OffersHero />

      {/* 2. Offer Type Selector */}
      <OfferTypeSelector selected={selectedOfferType} onChange={setSelectedOfferType} />

      {/* Sort bar */}
      <div className="border-b" style={{ borderColor: '#ECECF2' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm" style={{ color: '#7A7A85' }}>
              {loading ? '...' : `${pagination.total} deal${pagination.total !== 1 ? 's' : ''} found`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#7A7A85' }}>Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm font-medium bg-transparent appearance-none pr-5 focus:outline-none cursor-pointer"
                style={{ color: '#111111' }}
              >
                <option value="popularity">Popular</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Product Grid */}
      <div id="offer-products" className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin" style={{ color: '#E91E63' }} />
            <p className="mt-4 text-sm" style={{ color: '#7A7A85' }}>
              Loading offers...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#F6E9EE' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#E91E63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-serif text-xl mb-2" style={{ color: '#111111' }}>
              No offers right now
            </h3>
            <p className="text-sm max-w-xs mb-6" style={{ color: '#7A7A85' }}>
              Check back soon for special pricing on selected designs.
            </p>
            <Link
              href="/collections"
              className="px-6 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-white rounded-md transition-all hover:shadow-lg"
              style={{ backgroundColor: '#E91E63' }}
            >
              Explore All Products
            </Link>
          </div>
        ) : (
          <>
            {/* 4-column Desktop, 2-column Tablet, 1-column Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
              {products.map((product) => (
                <OfferProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <nav aria-label="Pagination" className="mt-12 lg:mt-16 flex items-center justify-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#E91E63] transition-colors min-h-[44px]"
                  style={{ color: '#7A7A85' }}
                >
                  ← Prev
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(pagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isNear =
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1);

                    if (isNear) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10 h-10 text-sm font-medium transition-colors rounded-md"
                          style={{
                            backgroundColor: pageNum === pagination.page ? '#E91E63' : 'transparent',
                            color: pageNum === pagination.page ? '#FFFFFF' : '#7A7A85',
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                      return <span key={pageNum} className="px-1" style={{ color: '#7A7A85' }}>…</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#E91E63] transition-colors min-h-[44px]"
                  style={{ color: '#7A7A85' }}
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Trust / Payment Badges */}
      <div className="border-t py-6" style={{ borderColor: '#ECECF2' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 1l2.39 4.84 5.34.78-3.86 3.77.91 5.32L10 13.27l-4.78 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z" stroke="#C6A85B" strokeWidth="1.2" fill="none"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: '#7A7A85' }}>Genuine Products</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M1 10a9 9 0 1118 0 9 9 0 01-18 0z" stroke="#C6A85B" strokeWidth="1.2"/>
                <path d="M7 10l2 2 4-4" stroke="#C6A85B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: '#7A7A85' }}>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16 7H4l-2 9h16l-2-9zM7 7V5a3 3 0 016 0v2" stroke="#C6A85B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: '#7A7A85' }}>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 3h14v10H3V3zM7 13v4M13 13v4M1 17h18" stroke="#C6A85B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: '#7A7A85' }}>Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
