'use client';

/**
 * CollectionPageShell — ORA Jewellery
 * 
 * A shared, world-class collection page system used by all /collections/* routes.
 * Driven by route, metadata, and DB queries — no hardcoded data.
 * 
 * Features:
 *   - Clean page header (title + subtitle)
 *   - Optional configurable filter rail
 *   - Product grid (real products from API)
 *   - Proper empty state
 *   - Loading skeleton
 *   - Pagination
 *   - Mobile filter bottom sheet
 * 
 * Design rules:
 *   - White / warm off-white backgrounds ONLY
 *   - No pastel blocks
 *   - No low-contrast text
 *   - Typography hierarchy > background fills
 *   - Products first — visible in first viewport
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import api from '@/lib/api';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

export interface CollectionProduct {
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

export interface FilterConfig {
  showCategory?: boolean;
  showPrice?: boolean;
  showMaterial?: boolean;
  showAvailability?: boolean;
  showSort?: boolean;
}

export interface CollectionPageConfig {
  /** Page title shown as H1 */
  title: string;
  /** Subtitle shown below H1 */
  subtitle: string;
  /** API query parameters to fetch the right products */
  apiParams: Record<string, unknown>;
  /** Default sort for this collection */
  defaultSort?: string;
  /** Which filters to show */
  filters?: FilterConfig;
  /** Show badges on product cards */
  showBadges?: boolean;
  /** Show quick-add button */
  showQuickAdd?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Badge override — e.g. "New" badge only for new-arrivals */
  badgeOverride?: 'new-only' | 'discount-only' | 'none';
  /** Custom CTA label for product cards (e.g., "Add Combo") */
  ctaLabel?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'A – Z' },
  { value: 'popularity', label: 'Popular' },
];

const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '0-500', label: 'Under ₹500' },
  { value: '500-1099', label: 'Under ₹1,099' },
  { value: '500-2099', label: 'Under ₹2,099' },
  { value: '500-3099', label: 'Under ₹3,099' },
  { value: '500-1000', label: '₹500 – ₹1,000' },
  { value: '1000-1500', label: '₹1,000 – ₹1,500' },
  { value: '1500-999999', label: 'Above ₹1,500' },
  { value: '3099-999999', label: 'Premium (Above ₹3,099)' },
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
        <span className="text-sm font-medium text-neutral-900 tracking-wide">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-neutral-400 group-hover:text-neutral-700 transition-colors" />
        ) : (
          <ChevronDown size={16} className="text-neutral-400 group-hover:text-neutral-700 transition-colors" />
        )}
      </button>
      {isOpen && (
        <div className="mt-4 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILTER OPTION (radio-style text button)
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
        flex items-center justify-between w-full px-0 py-1.5 text-left text-sm
        transition-colors duration-150
        ${isActive
          ? 'text-neutral-900 font-medium'
          : 'text-neutral-500 hover:text-neutral-800'
        }
      `}
    >
      <span className="flex items-center gap-2">
        <span
          className={`
            inline-block w-1.5 h-1.5 rounded-full transition-all duration-150
            ${isActive ? 'bg-neutral-900' : 'bg-transparent'}
          `}
        />
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// DESKTOP FILTER RAIL
// ============================================================================

function DesktopFilterRail({
  filters,
  onFilterChange,
  onReset,
  categories,
  activeFilterCount,
  config,
}: {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  categories: Array<{ id: string; name: string }>;
  activeFilterCount: number;
  config: FilterConfig;
}) {
  const showAny = config.showCategory || config.showPrice || config.showMaterial || config.showAvailability;
  if (!showAny) return null;

  return (
    <aside className="hidden lg:block w-[220px] flex-shrink-0">
      <div className="sticky top-20 pb-16 max-h-[calc(100vh-5rem)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-900 tracking-wide uppercase">
            Filter
          </h2>
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {config.showCategory && categories.length > 0 && (
          <FilterSection title="Category">
            <FilterOption
              label="All"
              isActive={filters.category === ''}
              onClick={() => onFilterChange('category', '')}
            />
            {categories.map((cat) => (
              <FilterOption
                key={cat.id}
                label={cat.name}
                isActive={filters.category === cat.id}
                onClick={() => onFilterChange('category', cat.id)}
              />
            ))}
          </FilterSection>
        )}

        {config.showPrice && (
          <FilterSection title="Price">
            {PRICE_RANGES.map((range) => (
              <FilterOption
                key={range.value}
                label={range.label}
                isActive={filters.priceRange === range.value}
                onClick={() => onFilterChange('priceRange', range.value)}
              />
            ))}
          </FilterSection>
        )}

        {config.showMaterial && (
          <FilterSection title="Material">
            {MATERIALS.map((mat) => (
              <FilterOption
                key={mat.value}
                label={mat.label}
                isActive={filters.material === mat.value}
                onClick={() => onFilterChange('material', mat.value)}
              />
            ))}
          </FilterSection>
        )}

        {config.showAvailability && (
          <FilterSection title="Availability">
            {AVAILABILITY_OPTIONS.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                isActive={filters.availability === opt.value}
                onClick={() => onFilterChange('availability', opt.value)}
              />
            ))}
          </FilterSection>
        )}
      </div>
    </aside>
  );
}

// ============================================================================
// MOBILE FILTER BOTTOM SHEET
// ============================================================================

function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  onApply,
  categories,
  activeFilterCount,
  config,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  onApply: () => void;
  categories: Array<{ id: string; name: string }>;
  activeFilterCount: number;
  config: FilterConfig;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-base font-medium text-neutral-900">Filter &amp; Sort</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-neutral-100 transition-colors" aria-label="Close filters">
            <X size={20} className="text-neutral-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {config.showSort !== false && (
            <FilterSection title="Sort By">
              {SORT_OPTIONS.map((opt) => (
                <FilterOption key={opt.value} label={opt.label} isActive={filters.sort === opt.value} onClick={() => onFilterChange('sort', opt.value)} />
              ))}
            </FilterSection>
          )}

          {config.showCategory && categories.length > 0 && (
            <FilterSection title="Category">
              <FilterOption label="All" isActive={filters.category === ''} onClick={() => onFilterChange('category', '')} />
              {categories.map((cat) => (
                <FilterOption key={cat.id} label={cat.name} isActive={filters.category === cat.id} onClick={() => onFilterChange('category', cat.id)} />
              ))}
            </FilterSection>
          )}

          {config.showPrice && (
            <FilterSection title="Price">
              {PRICE_RANGES.map((range) => (
                <FilterOption key={range.value} label={range.label} isActive={filters.priceRange === range.value} onClick={() => onFilterChange('priceRange', range.value)} />
              ))}
            </FilterSection>
          )}

          {config.showMaterial && (
            <FilterSection title="Material">
              {MATERIALS.map((mat) => (
                <FilterOption key={mat.value} label={mat.label} isActive={filters.material === mat.value} onClick={() => onFilterChange('material', mat.value)} />
              ))}
            </FilterSection>
          )}

          {config.showAvailability && (
            <FilterSection title="Availability">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <FilterOption key={opt.value} label={opt.label} isActive={filters.availability === opt.value} onClick={() => onFilterChange('availability', opt.value)} />
              ))}
            </FilterSection>
          )}
        </div>

        <div className="flex gap-3 px-6 py-5 border-t border-neutral-200 bg-white">
          <button
            onClick={onReset}
            className="flex-1 py-3.5 text-sm font-medium text-neutral-700 border border-neutral-300 hover:bg-neutral-50 transition-colors min-h-[48px]"
          >
            Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="flex-1 py-3.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors min-h-[48px]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-5 sm:gap-y-12">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-neutral-100 mb-3" />
          <div className="h-3 bg-neutral-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-neutral-100 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-xl font-serif text-neutral-900 mb-2">
        No products available right now.
      </p>
      <p className="text-sm text-neutral-500 max-w-xs mb-8 leading-relaxed">
        {message || 'Check back soon for new additions to this collection.'}
      </p>
      <Link
        href="/collections"
        className="px-8 py-3 text-xs font-medium tracking-[0.15em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
      >
        Explore our full collection →
      </Link>
    </div>
  );
}

// ============================================================================
// ACTIVE FILTER PILL
// ============================================================================

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100">
      {label}
      <button onClick={onRemove} className="hover:text-neutral-900 transition-colors" aria-label={`Remove ${label} filter`}>
        <X size={12} />
      </button>
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CollectionPageShell({ config }: { config: CollectionPageConfig }) {
  const searchParams = useSearchParams();
  
  const defaultFilters: FilterConfig = {
    showCategory: true,
    showPrice: true,
    showMaterial: true,
    showAvailability: true,
    showSort: true,
    ...config.filters,
  };

  // Initialize filters from URL params if available
  const getInitialFilters = (): FilterState => {
    const maxPrice = searchParams.get('maxPrice');
    const minPrice = searchParams.get('minPrice');
    let priceRange = '';
    
    // Convert URL price params to priceRange format
    if (maxPrice || minPrice) {
      if (maxPrice && parseInt(maxPrice) <= 500) {
        priceRange = '0-500';
      } else if (maxPrice && parseInt(maxPrice) <= 1000) {
        priceRange = '500-1000';
      } else if (maxPrice && parseInt(maxPrice) <= 1500) {
        priceRange = '1000-1500';
      } else if (maxPrice && parseInt(maxPrice) <= 2099) {
        priceRange = '500-2099';
      } else if (maxPrice && parseInt(maxPrice) <= 3099) {
        priceRange = '500-3099';
      } else if (minPrice && parseInt(minPrice) >= 1500) {
        priceRange = '1500-999999';
      } else if (minPrice && parseInt(minPrice) >= 3099) {
        priceRange = '3099-999999';
      }
    }
    
    return {
      category: searchParams.get('category') || '',
      priceRange,
      material: searchParams.get('material') || '',
      availability: '',
      sort: config.defaultSort || 'newest',
    };
  };

  const [filters, setFilters] = useState<FilterState>(getInitialFilters());
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 24, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [
    filters.category,
    filters.priceRange,
    filters.material,
    filters.availability,
  ].filter(Boolean).length;

  // Fetch categories on mount (only if showing category filter)
  useEffect(() => {
    if (!defaultFilters.showCategory) return;
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setAvailableCategories(response.data.data || []);
      } catch {
        setAvailableCategories([]);
      }
    };
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products
  const fetchProducts = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);

        // Map sort values to backend params
        let sortBy = 'createdAt';
        if (filters.sort === 'newest') sortBy = 'createdAt';
        else if (filters.sort === 'price_asc') sortBy = 'finalPrice';
        else if (filters.sort === 'price_desc') sortBy = '-finalPrice';
        else if (filters.sort === 'name_asc') sortBy = 'name';
        else if (filters.sort === 'popularity') sortBy = 'popularity';

        const params: Record<string, unknown> = {
          page,
          limit: pagination.limit,
          sortBy,
          ...config.apiParams,
        };

        // Layer user-chosen filters on top
        if (filters.category) params.category = filters.category;
        if (filters.material) params.material = filters.material;

        if (filters.priceRange) {
          const [minStr, maxStr] = filters.priceRange.split('-');
          if (minStr) params.minPrice = Number(minStr);
          if (maxStr) params.maxPrice = Number(maxStr);
        }

        if (filters.availability === 'new') params.isNew = true;
        if (filters.availability === 'bestseller') params.isBestseller = true;
        if (filters.availability === 'in-stock') params.inStock = true;

        const response = await api.get('/products', { params });
        setProducts(response.data.data || []);
        setPagination(response.data.pagination || { page: 1, limit: 24, total: 0, pages: 0 });
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit, config.apiParams]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      category: '',
      priceRange: '',
      material: '',
      availability: '',
      sort: config.defaultSort || 'newest',
    });
  };

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilterRail = defaultFilters.showCategory || defaultFilters.showPrice || defaultFilters.showMaterial || defaultFilters.showAvailability;

  return (
    <div className="min-h-screen bg-white">
      {/* ================================================================
          COLLECTION HEADER — clean, left-anchored, serif title
          ================================================================ */}
      <header className="w-full border-b border-neutral-200">
        <div className="w-full px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.5rem] font-light text-neutral-900 tracking-tight leading-tight">
                {config.title}
              </h1>
              <p className="mt-1.5 text-sm text-neutral-500 tracking-wide">
                {config.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-sm text-neutral-400 tabular-nums whitespace-nowrap">
                {loading ? '—' : `${pagination.total} Product${pagination.total !== 1 ? 's' : ''}`}
              </span>

              {defaultFilters.showSort !== false && (
                <div className="hidden lg:flex items-center gap-2">
                  <label htmlFor="desktop-sort" className="text-sm text-neutral-500 whitespace-nowrap">
                    Sort by:
                  </label>
                  <div className="relative">
                    <select
                      id="desktop-sort"
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          MOBILE FILTER BAR
          ================================================================ */}
      {hasFilterRail && (
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-5 sm:px-8 h-12">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-2 text-sm text-neutral-700 font-medium min-h-[44px]"
            >
              <SlidersHorizontal size={16} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 text-[10px] font-semibold bg-neutral-900 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {defaultFilters.showSort !== false && (
              <div className="relative flex items-center gap-1">
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none bg-transparent text-sm text-neutral-700 font-medium pr-5 cursor-pointer focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          MAIN CONTENT (Filter Rail + Product Grid)
          ================================================================ */}
      <div className="w-full px-6 sm:px-8 lg:px-10">
        <div className={`flex gap-8 lg:gap-12 pt-8 lg:pt-10 ${!hasFilterRail ? 'justify-center' : ''}`}>
          {/* DESKTOP FILTER RAIL */}
          {hasFilterRail && (
            <DesktopFilterRail
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              categories={availableCategories}
              activeFilterCount={activeFilterCount}
              config={defaultFilters}
            />
          )}

          {/* PRODUCT GRID */}
          <main className="flex-1 min-w-0 pb-16 lg:pb-24" ref={gridRef}>
            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="hidden lg:flex items-center gap-2 mb-6 flex-wrap">
                {filters.category && (
                  <ActivePill
                    label={availableCategories.find((c) => c.id === filters.category)?.name || filters.category}
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
              <LoadingSkeleton />
            ) : products.length === 0 ? (
              <EmptyState message={config.emptyMessage} />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:gap-x-6 lg:gap-y-12">
                  {products.map((product) => (
                    <ProductCardProduction
                      key={product.id}
                      product={product}
                      variant="default"
                      showQuickAdd={config.showQuickAdd !== false}
                      showBadges={config.showBadges !== false}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:text-neutral-900 transition-colors min-h-[44px]"
                    >
                      ← Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(pagination.pages)].map((_, i) => {
                        const pageNum = i + 1;
                        const isNearCurrent =
                          pageNum === 1 ||
                          pageNum === pagination.pages ||
                          (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1);

                        if (isNearCurrent) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 text-sm font-medium transition-colors ${
                                pageNum === pagination.page
                                  ? 'text-neutral-900 border-b-2 border-neutral-900'
                                  : 'text-neutral-400 hover:text-neutral-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }

                        if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                          return <span key={pageNum} className="px-1 text-neutral-300">…</span>;
                        }

                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 text-sm text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:text-neutral-900 transition-colors min-h-[44px]"
                    >
                      Next →
                    </button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTER SHEET */}
      {hasFilterRail && (
        <MobileFilterSheet
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onApply={() => fetchProducts(1)}
          categories={availableCategories}
          activeFilterCount={activeFilterCount}
          config={defaultFilters}
        />
      )}
    </div>
  );
}
