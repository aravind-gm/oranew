'use client';

/**
 * LuxuryProductGrid — Complete product grid with filter sidebar + sort + pagination
 * 
 * Features:
 *   - Desktop: Left sidebar filter + right grid (4 columns)
 *   - Tablet: 3 columns with top filter bar
 *   - Mobile: 2 columns with bottom sheet filter
 *   - Promo banner injection between rows
 *   - URL param sync
 *   - Load more / infinite scroll
 *   - Skeleton loaders
 *   - Active mood filter integration
 */

import { PromoBannersConfig, MoodItem } from '@/store/shopAllCmsStore';
import api from '@/lib/api';
import { ChevronDown, Loader2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import LuxuryProductCard from './LuxuryProductCard';
import LuxuryPromoBanner from './LuxuryPromoBanner';
import {
  DesktopFilterSidebar,
  MobileFilterDrawer,
  ActiveFiltersBar,
  FilterState,
  SORT_OPTIONS,
  PRICE_RANGES,
} from './LuxuryFilterSidebar';

// ============================================================================
// Types
// ============================================================================

interface CollectionProduct {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  material?: string;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ============================================================================
// URL Helpers
// ============================================================================

function parseUrlToFilters(searchParams: URLSearchParams, defaultSort: string): FilterState {
  const maxPrice = searchParams.get('maxPrice');
  const minPrice = searchParams.get('minPrice');
  let priceRange = searchParams.get('priceRange') || '';

  if (!priceRange && (maxPrice || minPrice)) {
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : 999999;
    const match = PRICE_RANGES.find((r) => {
      if (!r.value) return false;
      const [rMin, rMax] = r.value.split('-').map(Number);
      return rMin === min && rMax === max;
    });
    if (match) priceRange = match.value;
    else if (max < 999999) priceRange = `0-${max}`;
    else if (min > 0) priceRange = `${min}-999999`;
  }

  return {
    category: searchParams.get('category') || '',
    priceRange,
    material: searchParams.get('material') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || defaultSort,
    mood: searchParams.get('mood') || '',
  };
}

function filtersToUrl(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.priceRange) {
    params.set('priceRange', filters.priceRange);
    const [min, max] = filters.priceRange.split('-');
    if (min && parseInt(min) > 0) params.set('minPrice', min);
    if (max && parseInt(max) < 999999) params.set('maxPrice', max);
  }
  if (filters.material) params.set('material', filters.material);
  if (filters.availability) params.set('availability', filters.availability);
  if (filters.sort && filters.sort !== 'popularity') params.set('sort', filters.sort);
  if (filters.mood) params.set('mood', filters.mood);
  const str = params.toString();
  return str ? `?${str}` : '';
}

// ============================================================================
// Skeleton Loaders
// ============================================================================

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-xl mb-3.5" />
      <div className="space-y-2.5 px-0.5">
        <div className="h-3 bg-neutral-100 rounded-full w-[85%]" />
        <div className="h-2.5 bg-neutral-100 rounded-full w-[50%]" />
        <div className="h-3.5 bg-neutral-100 rounded-full w-[40%]" />
      </div>
    </div>
  );
}

function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EF] rounded-full flex items-center justify-center mb-6 shadow-inner">
        <span className="text-4xl">💎</span>
      </div>
      <p 
        className="font-serif text-2xl text-[#1A1A1A] mb-2 font-light"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        No pieces found
      </p>
      <p className="text-sm text-neutral-400 max-w-xs mb-8 leading-relaxed">
        Try adjusting your filters or explore our complete collection to find your perfect piece.
      </p>
      <Link
        href="/collections"
        className="px-10 py-3.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-white bg-[#1A1A1A] hover:bg-[#D4AF37] rounded-full transition-all duration-300 hover:shadow-lg"
      >
        View All Jewellery
      </Link>
    </div>
  );
}

// ============================================================================
// MAIN: LuxuryProductGrid
// ============================================================================

interface LuxuryProductGridProps {
  defaultSort?: string;
  productsPerPage?: number;
  loadMoreStyle?: 'button' | 'infinite';
  promoBanners?: PromoBannersConfig;
  activeMood?: MoodItem | null;
  onClearMood?: () => void;
}

export default function LuxuryProductGrid({
  defaultSort = 'popularity',
  productsPerPage = 24,
  loadMoreStyle = 'button',
  promoBanners,
  activeMood,
  onClearMood,
}: LuxuryProductGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>(() => parseUrlToFilters(searchParams, defaultSort));
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: productsPerPage, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [filters.category, filters.priceRange, filters.material, filters.availability, filters.mood].filter(Boolean).length;

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Apply mood filter
  useEffect(() => {
    if (activeMood) {
      setFilters((prev) => ({ ...prev, mood: activeMood.title }));
      
      // Parse mood filter/link to apply actual filter params
      if (activeMood.type === 'filter' || activeMood.filterOrLink.includes('?')) {
        try {
          const url = new URL(activeMood.filterOrLink, 'http://localhost');
          const moodParams = url.searchParams;
          
          const newFilters: Partial<FilterState> = { mood: activeMood.title };
          if (moodParams.get('category')) newFilters.category = moodParams.get('category')!;
          if (moodParams.get('maxPrice')) newFilters.priceRange = `0-${moodParams.get('maxPrice')}`;
          if (moodParams.get('availability')) newFilters.availability = moodParams.get('availability')!;
          
          setFilters((prev) => ({ ...prev, ...newFilters }));
        } catch {
          // Link-based mood, no filter parsing needed
        }
      }
    }
  }, [activeMood]);

  // Fetch products
  const fetchProducts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        let sortBy = 'createdAt';
        if (filters.sort === 'newest') sortBy = 'createdAt';
        else if (filters.sort === 'price_asc') sortBy = 'finalPrice';
        else if (filters.sort === 'price_desc') sortBy = '-finalPrice';
        else if (filters.sort === 'name_asc') sortBy = 'name';
        else if (filters.sort === 'popularity') sortBy = 'popularity';
        else if (filters.sort === 'rating') sortBy = '-averageRating';

        const params: Record<string, unknown> = {
          page,
          limit: productsPerPage,
          sortBy,
          status: 'active',
        };

        if (filters.category) params.category = filters.category;
        if (filters.material) params.material = filters.material;
        if (filters.priceRange) {
          const [minStr, maxStr] = filters.priceRange.split('-');
          if (minStr) params.minPrice = Number(minStr);
          if (maxStr && Number(maxStr) < 999999) params.maxPrice = Number(maxStr);
        }
        if (filters.availability === 'new') params.isNew = true;
        if (filters.availability === 'bestseller') params.isBestseller = true;
        if (filters.availability === 'in-stock') params.inStock = true;

        const response = await api.get('/products', { params });
        const newProducts = response.data.data || [];
        const newPagination = response.data.pagination || { page: 1, limit: productsPerPage, total: 0, pages: 0 };

        if (append) setProducts((prev) => [...prev, ...newProducts]);
        else setProducts(newProducts);
        setPagination(newPagination);
      } catch {
        if (!append) setProducts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, productsPerPage]
  );

  // Fetch on filter change
  useEffect(() => {
    fetchProducts(1, false);
    const newUrl = `/collections${filtersToUrl(filters)}`;
    router.replace(newUrl, { scroll: false });
  }, [fetchProducts, filters, router]);

  // Sync URL → filters
  useEffect(() => {
    const urlFilters = parseUrlToFilters(searchParams, defaultSort);
    setFilters((prev) => {
      const changed = Object.keys(urlFilters).some(
        (key) => urlFilters[key as keyof FilterState] !== prev[key as keyof FilterState]
      );
      return changed ? urlFilters : prev;
    });
  }, [searchParams, defaultSort]);

  // Infinite scroll
  useEffect(() => {
    if (loadMoreStyle !== 'infinite') return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && pagination.page < pagination.pages) {
          fetchProducts(pagination.page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMoreStyle, loadingMore, pagination, fetchProducts]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ category: '', priceRange: '', material: '', availability: '', sort: defaultSort, mood: '' });
    onClearMood?.();
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchProducts(pagination.page + 1, true);
    }
  };

  // Build grid items with promo banner injection
  const buildGridItems = () => {
    if (!products.length) return [];

    const items: Array<{ type: 'product'; product: CollectionProduct } | { type: 'promo'; banner: any }> = [];
    const activeBanners = promoBanners?.enabled ? promoBanners.banners.filter((b) => b.enabled) : [];
    const insertEvery = promoBanners?.insertAfterEvery || 8;
    let bannerIndex = 0;

    products.forEach((product, i) => {
      items.push({ type: 'product', product });
      if (activeBanners.length > 0 && (i + 1) % insertEvery === 0 && bannerIndex < activeBanners.length) {
        items.push({ type: 'promo', banner: activeBanners[bannerIndex] });
        bannerIndex++;
      }
    });

    return items;
  };

  const gridItems = buildGridItems();

  const filterSidebarProps = {
    filters,
    categories,
    onFilterChange: handleFilterChange,
    onReset: handleReset,
    totalProducts: pagination.total,
    loading,
  };

  return (
    <div id="products-section" className="scroll-mt-20">
      {/* ================================================================
          STICKY HEADER BAR — Count + Sort + Mobile Filter
          ================================================================ */}
      <div className="w-full border-b border-neutral-100 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Filter toggle (mobile) + Product count */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex items-center gap-2 text-sm text-neutral-700 font-medium lg:hidden min-h-[44px]"
              >
                <SlidersHorizontal size={15} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-[#D4AF37] text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="text-[13px] text-neutral-400 tabular-nums whitespace-nowrap font-medium">
                {loading ? '—' : (
                  <>
                    <span className="text-neutral-700">{pagination.total.toLocaleString('en-IN')}</span>
                    {' '}Product{pagination.total !== 1 ? 's' : ''}
                  </>
                )}
              </span>
            </div>

            {/* Right: Sort dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={13} className="text-neutral-400 hidden sm:block" />
              <label htmlFor="grid-sort-v2" className="text-[12px] text-neutral-400 whitespace-nowrap hidden sm:block tracking-wide">
                Sort by:
              </label>
              <div className="relative">
                <select
                  id="grid-sort-v2"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none bg-transparent text-[13px] font-semibold text-neutral-800 pr-5 cursor-pointer focus:outline-none min-h-0"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          MAIN LAYOUT (Filter Sidebar + Product Grid) — FULL WIDTH OPTIMIZED
          ================================================================ */}
      <div className="w-full px-6">
        <div className="flex gap-8 pt-8 lg:pt-10">
          {/* Desktop Sidebar */}
          <DesktopFilterSidebar {...filterSidebarProps} />

          {/* Product Grid Area */}
          <main className="flex-1 min-w-0 pb-16 lg:pb-24 pr-6" ref={gridRef}>
            {/* Active filter pills */}
            <ActiveFiltersBar
              filters={filters}
              categories={categories}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />

            {/* Grid */}
            {loading ? (
              <GridSkeleton count={productsPerPage > 12 ? 12 : productsPerPage} />
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                  {gridItems.map((item, index) =>
                    item.type === 'product' ? (
                      <LuxuryProductCard
                        key={item.product.id}
                        product={item.product}
                        index={index}
                        priority={index < 4}
                      />
                    ) : (
                      <LuxuryPromoBanner key={`promo-${item.banner.id}`} banner={item.banner} />
                    )
                  )}
                </div>

                {/* Load More / Infinite Scroll */}
                {pagination.page < pagination.pages && (
                  <div ref={loadMoreRef} className="mt-14 flex justify-center">
                    {loadMoreStyle === 'button' ? (
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="group inline-flex items-center gap-2.5 px-12 py-4 text-[11px] tracking-[0.2em] uppercase font-semibold border border-neutral-200 text-neutral-600 hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-full transition-all duration-500 disabled:opacity-50 min-h-[52px] hover:shadow-lg"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More Pieces
                            <span className="text-neutral-300 group-hover:text-[#D4AF37]/50 transition-colors">
                              ({(pagination.total - products.length).toLocaleString('en-IN')} remaining)
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      loadingMore && (
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
                          <span className="text-sm">Discovering more pieces...</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* All loaded */}
                {pagination.page >= pagination.pages && products.length > 0 && (
                  <div className="mt-14 text-center">
                    <div className="w-12 h-[1px] bg-[#D4AF37]/30 mx-auto mb-4" />
                    <p className="text-[13px] text-neutral-400 italic font-light">
                      You&apos;ve explored all {pagination.total.toLocaleString('en-IN')} pieces ✨
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        {...filterSidebarProps}
      />
    </div>
  );
}
