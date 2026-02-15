'use client';

/**
 * ShopAllProductGrid — Enhanced product grid with:
 *   - Filter rail (desktop left / mobile drawer)
 *   - URL param sync (refresh-safe, shareable)
 *   - Promo banner injection between rows
 *   - Load More button (or infinite scroll)
 *   - Skeleton loaders
 *   - No blank images (fallback logic)
 *   - Lazy loading
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import PromoBannerInsert from '@/components/shopall/PromoBannerInsert';
import { PromoBannersConfig } from '@/store/shopAllCmsStore';
import api from '@/lib/api';
import { ChevronDown, ChevronUp, Loader2, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
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

interface FilterState {
  category: string;
  priceRange: string;
  material: string;
  availability: string;
  sort: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'A – Z' },
];

const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '0-500', label: 'Under ₹500' },
  { value: '0-1099', label: 'Under ₹1,099' },
  { value: '0-2099', label: 'Under ₹2,099' },
  { value: '500-1000', label: '₹500 – ₹1,000' },
  { value: '1000-2000', label: '₹1,000 – ₹2,000' },
  { value: '2000-3000', label: '₹2,000 – ₹3,000' },
  { value: '3000-999999', label: 'Above ₹3,000' },
];

const MATERIALS = [
  { value: '', label: 'All Materials' },
  { value: 'gold', label: 'Gold' },
  { value: 'rose-gold', label: 'Rose Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'white-gold', label: 'White Gold' },
  { value: 'platinum', label: 'Platinum' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'new', label: 'New Arrivals' },
  { value: 'bestseller', label: 'Bestsellers' },
];

// ============================================================================
// HELPER: Parse URL params → filter state
// ============================================================================

function parseUrlToFilters(searchParams: URLSearchParams, defaultSort: string): FilterState {
  const maxPrice = searchParams.get('maxPrice');
  const minPrice = searchParams.get('minPrice');
  let priceRange = searchParams.get('priceRange') || '';

  // Convert URL price params to priceRange format
  if (!priceRange && (maxPrice || minPrice)) {
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : 999999;
    // Find matching range
    const match = PRICE_RANGES.find((r) => {
      if (!r.value) return false;
      const [rMin, rMax] = r.value.split('-').map(Number);
      return rMin === min && rMax === max;
    });
    if (match) {
      priceRange = match.value;
    } else if (max < 999999) {
      priceRange = `0-${max}`;
    } else if (min > 0) {
      priceRange = `${min}-999999`;
    }
  }

  return {
    category: searchParams.get('category') || '',
    priceRange,
    material: searchParams.get('material') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || defaultSort,
  };
}

// ============================================================================
// HELPER: Filter state → URL params
// ============================================================================

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
  const str = params.toString();
  return str ? `?${str}` : '';
}

// ============================================================================
// FILTER SECTION (collapsible)
// ============================================================================

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 py-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-neutral-900 tracking-wide">{title}</span>
        {isOpen ? (
          <ChevronUp size={16} className="text-neutral-400 group-hover:text-neutral-700 transition-colors" />
        ) : (
          <ChevronDown size={16} className="text-neutral-400 group-hover:text-neutral-700 transition-colors" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// FILTER OPTION
// ============================================================================

function FilterOption({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full px-0 py-1.5 text-left text-sm transition-colors duration-150
        ${isActive ? 'text-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-800'}
      `}
    >
      <span className="flex items-center gap-2">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full transition-all duration-150
            ${isActive ? 'bg-[#9B2C46]' : 'bg-transparent border border-neutral-300'}`}
        />
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// ACTIVE FILTER PILL
// ============================================================================

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9B2C46] bg-[#FFF0F5] rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-[#7A2238] transition-colors" aria-label={`Remove ${label}`}>
        <X size={12} />
      </button>
    </span>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-neutral-100 rounded-xl mb-3" />
      <div className="h-3 bg-neutral-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-neutral-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-neutral-100 rounded w-1/3" />
    </div>
  );
}

function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-[#FFF0F5] rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">💎</span>
      </div>
      <p className="font-serif text-xl text-neutral-900 mb-2">No products found</p>
      <p className="text-sm text-neutral-500 max-w-xs mb-8 leading-relaxed">
        Try adjusting your filters or explore our full collection.
      </p>
      <Link
        href="/collections"
        className="px-8 py-3 text-xs font-medium tracking-[0.15em] uppercase text-white bg-[#1A1A1A] hover:bg-neutral-800 rounded-full transition-colors"
      >
        Reset Filters
      </Link>
    </div>
  );
}

// ============================================================================
// MAIN: ShopAllProductGrid
// ============================================================================

interface ShopAllProductGridProps {
  defaultSort?: string;
  productsPerPage?: number;
  loadMoreStyle?: 'button' | 'infinite';
  promoBanners?: PromoBannersConfig;
}

export default function ShopAllProductGrid({
  defaultSort = 'popularity',
  productsPerPage = 24,
  loadMoreStyle = 'button',
  promoBanners,
}: ShopAllProductGridProps) {
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

  const activeFilterCount = [filters.category, filters.priceRange, filters.material, filters.availability].filter(Boolean).length;

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

  // Fetch products
  const fetchProducts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        let sortBy = 'createdAt';
        if (filters.sort === 'newest') sortBy = 'createdAt';
        else if (filters.sort === 'price_asc') sortBy = 'finalPrice';
        else if (filters.sort === 'price_desc') sortBy = '-finalPrice';
        else if (filters.sort === 'name_asc') sortBy = 'name';
        else if (filters.sort === 'popularity') sortBy = 'popularity';

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

        if (append) {
          setProducts((prev) => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
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

  // Fetch when filters change
  useEffect(() => {
    fetchProducts(1, false);
    // Update URL
    const newUrl = `/collections${filtersToUrl(filters)}`;
    router.replace(newUrl, { scroll: false });
  }, [fetchProducts, filters, router]);

  // Sync URL params to filters on URL change (e.g., from homepage "Gift by Heart")
  useEffect(() => {
    const urlFilters = parseUrlToFilters(searchParams, defaultSort);
    setFilters((prev) => {
      const changed = Object.keys(urlFilters).some(
        (key) => urlFilters[key as keyof FilterState] !== prev[key as keyof FilterState]
      );
      return changed ? urlFilters : prev;
    });
  }, [searchParams, defaultSort]);

  // Infinite scroll observer
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

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMoreStyle, loadingMore, pagination, fetchProducts]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ category: '', priceRange: '', material: '', availability: '', sort: defaultSort });
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchProducts(pagination.page + 1, true);
    }
  };

  // Build product grid with promo banner insertions
  const buildGridItems = () => {
    if (!products.length) return [];

    const items: Array<{ type: 'product'; product: CollectionProduct } | { type: 'promo'; banner: any }> = [];
    const activeBanners = promoBanners?.enabled ? promoBanners.banners.filter((b) => b.enabled) : [];
    const insertEvery = promoBanners?.insertAfterEvery || 8;
    let bannerIndex = 0;

    products.forEach((product, i) => {
      items.push({ type: 'product', product });

      // Insert promo banner after every N products
      if (activeBanners.length > 0 && (i + 1) % insertEvery === 0 && bannerIndex < activeBanners.length) {
        items.push({ type: 'promo', banner: activeBanners[bannerIndex] });
        bannerIndex++;
      }
    });

    return items;
  };

  const gridItems = buildGridItems();

  return (
    <div id="products" className="scroll-mt-20">
      {/* ================================================================
          HEADER BAR — Count + Sort + Mobile Filter Button
          ================================================================ */}
      <div className="w-full border-b border-neutral-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Filter button (mobile) + Count */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex items-center gap-2 text-sm text-neutral-700 font-medium lg:hidden min-h-[44px]"
              >
                <SlidersHorizontal size={16} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-[10px] font-semibold bg-[#9B2C46] text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="text-sm text-neutral-400 tabular-nums whitespace-nowrap">
                {loading ? '—' : `${pagination.total} Product${pagination.total !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Right: Sort */}
            <div className="flex items-center gap-2">
              <label htmlFor="grid-sort" className="text-sm text-neutral-500 whitespace-nowrap hidden sm:block">
                Sort:
              </label>
              <div className="relative">
                <select
                  id="grid-sort"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none bg-transparent text-sm font-medium text-neutral-900 pr-5 cursor-pointer focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          MAIN LAYOUT (Filter Rail + Grid)
          ================================================================ */}
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex gap-8 lg:gap-12 pt-8 lg:pt-10">
          {/* ===== DESKTOP FILTER RAIL ===== */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-20 pb-16 max-h-[calc(100vh-5rem)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <h2 className="text-sm font-medium text-neutral-900 tracking-wide uppercase">Filter</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <FilterSection title="Category">
                  <FilterOption label="All" isActive={!filters.category} onClick={() => handleFilterChange('category', '')} />
                  {categories.map((cat) => (
                    <FilterOption
                      key={cat.id}
                      label={cat.name}
                      isActive={filters.category === cat.id}
                      onClick={() => handleFilterChange('category', cat.id)}
                    />
                  ))}
                </FilterSection>
              )}

              {/* Price */}
              <FilterSection title="Price">
                {PRICE_RANGES.map((range) => (
                  <FilterOption
                    key={range.value}
                    label={range.label}
                    isActive={filters.priceRange === range.value}
                    onClick={() => handleFilterChange('priceRange', range.value)}
                  />
                ))}
              </FilterSection>

              {/* Material */}
              <FilterSection title="Material">
                {MATERIALS.map((mat) => (
                  <FilterOption
                    key={mat.value}
                    label={mat.label}
                    isActive={filters.material === mat.value}
                    onClick={() => handleFilterChange('material', mat.value)}
                  />
                ))}
              </FilterSection>

              {/* Availability */}
              <FilterSection title="Availability">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <FilterOption
                    key={opt.value}
                    label={opt.label}
                    isActive={filters.availability === opt.value}
                    onClick={() => handleFilterChange('availability', opt.value)}
                  />
                ))}
              </FilterSection>
            </div>
          </aside>

          {/* ===== PRODUCT GRID ===== */}
          <main className="flex-1 min-w-0 pb-16 lg:pb-24" ref={gridRef}>
            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {filters.category && (
                  <ActivePill
                    label={categories.find((c) => c.id === filters.category)?.name || filters.category}
                    onRemove={() => handleFilterChange('category', '')}
                  />
                )}
                {filters.priceRange && (
                  <ActivePill
                    label={PRICE_RANGES.find((p) => p.value === filters.priceRange)?.label || filters.priceRange}
                    onRemove={() => handleFilterChange('priceRange', '')}
                  />
                )}
                {filters.material && (
                  <ActivePill
                    label={MATERIALS.find((m) => m.value === filters.material)?.label || filters.material}
                    onRemove={() => handleFilterChange('material', '')}
                  />
                )}
                {filters.availability && (
                  <ActivePill
                    label={AVAILABILITY_OPTIONS.find((a) => a.value === filters.availability)?.label || filters.availability}
                    onRemove={() => handleFilterChange('availability', '')}
                  />
                )}
                <button
                  onClick={handleReset}
                  className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 ml-1 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product grid */}
            {loading ? (
              <GridSkeleton count={productsPerPage > 12 ? 12 : productsPerPage} />
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10">
                  {gridItems.map((item, index) =>
                    item.type === 'product' ? (
                      <ProductCardProduction
                        key={item.product.id}
                        product={item.product}
                        variant="default"
                        showQuickAdd
                        showBadges
                      />
                    ) : (
                      <PromoBannerInsert key={`promo-${item.banner.id}`} banner={item.banner} />
                    )
                  )}
                </div>

                {/* Load More / Infinite Scroll */}
                {pagination.page < pagination.pages && (
                  <div ref={loadMoreRef} className="mt-12 flex justify-center">
                    {loadMoreStyle === 'button' ? (
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 px-10 py-3.5 text-xs tracking-[0.15em] uppercase font-medium border border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 rounded-full transition-all duration-300 disabled:opacity-50 min-h-[48px]"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More Products
                            <span className="text-neutral-400">
                              ({pagination.total - products.length} remaining)
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      loadingMore && (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm">Loading more...</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* All loaded message */}
                {pagination.page >= pagination.pages && products.length > 0 && (
                  <div className="mt-12 text-center">
                    <p className="text-sm text-neutral-400 italic">
                      You&apos;ve viewed all {pagination.total} products ✨
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ================================================================
          MOBILE FILTER BOTTOM SHEET
          ================================================================ */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFilterOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[90vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-neutral-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h2 className="text-base font-medium text-neutral-900">Filter &amp; Sort</h2>
                <button onClick={() => setMobileFilterOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-neutral-100" aria-label="Close">
                  <X size={20} className="text-neutral-600" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-2">
                <FilterSection title="Sort By">
                  {SORT_OPTIONS.map((opt) => (
                    <FilterOption key={opt.value} label={opt.label} isActive={filters.sort === opt.value} onClick={() => handleFilterChange('sort', opt.value)} />
                  ))}
                </FilterSection>

                {categories.length > 0 && (
                  <FilterSection title="Category">
                    <FilterOption label="All" isActive={!filters.category} onClick={() => handleFilterChange('category', '')} />
                    {categories.map((cat) => (
                      <FilterOption key={cat.id} label={cat.name} isActive={filters.category === cat.id} onClick={() => handleFilterChange('category', cat.id)} />
                    ))}
                  </FilterSection>
                )}

                <FilterSection title="Price">
                  {PRICE_RANGES.map((range) => (
                    <FilterOption key={range.value} label={range.label} isActive={filters.priceRange === range.value} onClick={() => handleFilterChange('priceRange', range.value)} />
                  ))}
                </FilterSection>

                <FilterSection title="Material">
                  {MATERIALS.map((mat) => (
                    <FilterOption key={mat.value} label={mat.label} isActive={filters.material === mat.value} onClick={() => handleFilterChange('material', mat.value)} />
                  ))}
                </FilterSection>

                <FilterSection title="Availability">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <FilterOption key={opt.value} label={opt.label} isActive={filters.availability === opt.value} onClick={() => handleFilterChange('availability', opt.value)} />
                  ))}
                </FilterSection>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 px-6 py-5 border-t border-neutral-200 bg-white safe-area-bottom">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3.5 text-sm font-medium text-neutral-700 border border-neutral-300 hover:bg-neutral-50 rounded-full transition-colors min-h-[48px]"
                >
                  Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-3.5 text-sm font-medium text-white bg-[#1A1A1A] hover:bg-neutral-800 rounded-full transition-colors min-h-[48px]"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
