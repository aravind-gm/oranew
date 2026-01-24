'use client';

/**
 * Collections Page — ORA Jewellery (Modern Editorial)
 * 
 * Modern, editorial luxury collection browsing:
 * - Full-width layout (no containers)
 * - Floating filter dropdown (icon-based)
 * - Image-first product cards
 * - Modern, clean grid system
 * - Calm, editorial typography
 * 
 * Design Philosophy:
 * - Editorial magazine aesthetic
 * - Browsing-first experience
 * - Minimal UI, maximum content
 * - Premium micro-interactions
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import api from '@/lib/api';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Product {
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
// CONSTANTS
// ============================================================================

const CATEGORIES = [
  { id: 'necklaces', label: 'Necklaces' },
  { id: 'rings', label: 'Rings' },
  { id: 'bracelets', label: 'Bracelets' },
] as const;

const MAX_PRICE = 1500;
const DEFAULT_CATEGORY = 'necklaces';
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'finalPrice', label: 'Price: Low to High' },
  { value: '-finalPrice', label: 'Price: High to Low' },
];

// ============================================================================
// MODERN FILTER DROPDOWN COMPONENT
// ============================================================================

/**
 * Modern Filter Dropdown
 * Floating panel with price slider, category pills, and sort
 */
function FilterDropdown({
  isOpen,
  onClose,
  activeCategory,
  onCategoryChange,
  maxPrice,
  onPriceChange,
  sortBy,
  onSortChange,
  triggerRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  maxPrice: number;
  onPriceChange: (price: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const percentage = (maxPrice / MAX_PRICE) * 100;

  return (
    <div
      ref={dropdownRef}
      className="
        absolute right-0 top-full mt-3 w-80 
        rounded-2xl bg-white border border-neutral-200
        shadow-[0_20px_60px_rgba(0,0,0,0.08)]
        backdrop-blur-xl z-50
        animate-in fade-in slide-in-from-top-2 duration-200
      "
      role="region"
      aria-label="Collection filters"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground tracking-[0.1em] uppercase">
            Filters
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
            aria-label="Close filters"
          >
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* CATEGORY PILLS */}
        <div className="space-y-3">
          <label className="text-xs text-text-muted tracking-[0.12em] uppercase font-semibold block">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`
                  px-4 py-2 text-xs font-medium tracking-[0.08em] uppercase
                  rounded-full transition-all duration-200
                  ${activeCategory === cat.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background border border-neutral-200 text-neutral-600 hover:border-secondary hover:text-foreground'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* PRICE SLIDER */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="price-slider" className="text-xs text-text-muted tracking-[0.12em] uppercase font-semibold">
              Price
            </label>
            <span className="text-sm font-medium text-accent tabular-nums">
              ₹{maxPrice.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Slider Track */}
          <div className="relative">
            <div className="absolute w-full h-1 bg-border/30 rounded-full top-1/2 -translate-y-1/2" />
            <div
              className="absolute h-1 bg-gradient-to-r from-accent to-accent/80 rounded-full top-1/2 -translate-y-1/2 transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
            <input
              id="price-slider"
              type="range"
              min={0}
              max={MAX_PRICE}
              value={maxPrice}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              className="
                relative w-full h-2 bg-transparent cursor-pointer appearance-none
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-accent
                [&::-webkit-slider-thumb]:border-3
                [&::-webkit-slider-thumb]:border-background-white
                [&::-webkit-slider-thumb]:shadow-luxury
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:duration-200
                [&::-webkit-slider-thumb]:hover:scale-125
                [&::-webkit-slider-thumb]:hover:shadow-luxury-hover
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-accent
                [&::-moz-range-thumb]:border-3
                [&::-moz-range-thumb]:border-background-white
                [&::-moz-range-thumb]:shadow-luxury
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:transition-all
                [&::-moz-range-thumb]:duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
              "
            />
          </div>

          {/* Price Range */}
          <div className="flex justify-between text-xs text-text-muted">
            <span>₹0</span>
            <span className="font-medium">MAX ₹{MAX_PRICE.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* SORT DROPDOWN */}
        <div className="space-y-3 border-t border-border/30 pt-6">
          <label htmlFor="sort-select" className="text-xs text-text-muted tracking-[0.12em] uppercase font-semibold block">
            Sort By
          </label>
          <div className="relative">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="
                w-full px-4 py-2.5 text-sm text-text-primary bg-background-white
                border border-border/40 rounded-lg
                appearance-none cursor-pointer
                transition-all duration-200
                hover:border-accent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
              "
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* CLEAR FILTERS */}
        <button
          onClick={() => {
            onCategoryChange(DEFAULT_CATEGORY);
            onPriceChange(MAX_PRICE);
            onSortChange('createdAt');
          }}
          className="
            w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase
            text-text-muted hover:text-text-primary
            transition-colors duration-200
            border-t border-border/30 pt-6
          "
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 * Luxury-styled loading placeholder
 */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <p className="text-2xl font-serif text-text-primary mb-2">
        No pieces found
      </p>
      <p className="text-sm text-text-secondary max-w-xs mb-8 leading-relaxed">
        We couldn&apos;t find jewellery matching your selection. Try adjusting the price or category.
      </p>
      <button
        onClick={onReset}
        className="
          px-6 py-2.5 text-xs font-medium tracking-[0.1em] uppercase
          border border-text-primary text-text-primary
          rounded-full hover:bg-text-primary hover:text-background-white
          transition-all duration-300
        "
      >
        View All Pieces
      </button>
    </div>
  );
}

/**
 * Loading Skeleton
 * Luxury-styled loading placeholder
 */
/**
 * Loading Skeleton
 * Modern grid loading state
 */
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-square bg-background rounded-xl" />
          <div className="h-3 bg-background rounded w-3/4" />
          <div className="h-3 bg-background rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CollectionsPage() {
  const searchParams = useSearchParams();
  
  // State
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CATEGORY);
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 16,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Parse URL params on mount
  useEffect(() => {
    const urlMaxPrice = searchParams.get('maxPrice');
    const urlCategory = searchParams.get('category');
    const urlMaterial = searchParams.get('material');

    if (urlMaxPrice) {
      setMaxPrice(parseInt(urlMaxPrice));
    }
    if (urlCategory) {
      setActiveCategory(urlCategory);
    }
    // Note: material param could be used for additional filtering if needed
  }, [searchParams]);

  // Fetch products
  const fetchProducts = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        category: activeCategory,
        maxPrice,
        sortBy,
      };

      const response = await api.get('/products', { params });
      setProducts(response.data.data.products || []);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, maxPrice, sortBy]);

  // Fetch on filter change
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle reset
  const handleReset = () => {
    setActiveCategory(DEFAULT_CATEGORY);
    setMaxPrice(MAX_PRICE);
    setSortBy('createdAt');
    setFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ================================================================
          HEADER & TITLE
          ================================================================ */}
      <header className="w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-10 sm:pb-12 lg:pb-16 border-b border-border/40">
        <div className="max-w-screen-2xl mx-auto">
          {/* Page Title - Editorial Style */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-text-primary mb-3 leading-tight">
              Collections
            </h1>
            <p className="text-sm sm:text-base text-text-secondary tracking-wide">
              Everyday luxury under ₹1,500
            </p>
          </div>
        </div>
      </header>

      {/* ================================================================
          FILTER BAR - MODERN FLOATING BUTTON
          ================================================================ */}
      <div className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Results Count */}
          <div className="flex items-center">
            <p className="text-xs sm:text-sm text-text-muted tracking-[0.1em] uppercase font-medium">
              {loading ? '...' : `${pagination?.total || 0} piece${pagination?.total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Filter Button - Icon + Label */}
          <button
            ref={filterButtonRef}
            onClick={() => setFilterOpen(!filterOpen)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5
              rounded-full border transition-all duration-300
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              ${filterOpen
                ? 'bg-primary border-primary text-text-primary shadow-luxury'
                : 'border-border/40 text-text-secondary hover:border-accent hover:text-text-primary'
              }
            `}
          >
            <SlidersHorizontal size={18} />
            <span className="text-xs font-medium tracking-[0.08em] uppercase hidden sm:inline">
              Filter
            </span>
          </button>

          {/* Filter Dropdown */}
          <FilterDropdown
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            maxPrice={maxPrice}
            onPriceChange={setMaxPrice}
            sortBy={sortBy}
            onSortChange={setSortBy}
            triggerRef={filterButtonRef}
          />
        </div>
      </div>

      {/* ================================================================
          PRODUCT GRID - FULL WIDTH, MODERN LAYOUT
          ================================================================ */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-screen-2xl mx-auto">
          {/* Grid Container */}
          {loading ? (
            <LoadingSkeleton />
          ) : products.length === 0 ? (
            <EmptyState onReset={handleReset} />
          ) : (
            <>
              {/* Product Grid - Responsive Columns */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-16 sm:mb-20">
                {products.map((product) => (
                  <ProductCardProduction
                    key={product.id}
                    product={product}
                    variant="default"
                    showQuickAdd={true}
                    showBadges={true}
                  />
                ))}
              </div>

              {/* PAGINATION - Minimal Bottom Controls */}
              {pagination.pages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="flex items-center justify-center gap-1 sm:gap-2"
                >
                  {/* Previous */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="
                      px-4 py-2 text-xs font-medium text-text-secondary
                      disabled:opacity-30 disabled:cursor-not-allowed
                      hover:text-text-primary transition-colors duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    "
                  >
                    ← Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {[...Array(pagination.pages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.pages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`
                              w-10 h-10 rounded-full text-xs font-medium
                              transition-all duration-200
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                              ${pageNum === pagination.page
                                ? 'bg-primary text-text-primary'
                                : 'text-text-muted hover:bg-primary/20 hover:text-text-primary'
                              }
                            `}
                          >
                            {pageNum}
                          </button>
                        );
                      }

                      if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                        return (
                          <span key={pageNum} className="text-text-muted px-1" aria-hidden="true">
                            …
                          </span>
                        );
                      }

                      return null;
                    })}
                  </div>

                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="
                      px-4 py-2 text-xs font-medium text-text-secondary
                      disabled:opacity-30 disabled:cursor-not-allowed
                      hover:text-text-primary transition-colors duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    "
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Spacing */}
      <div className="h-16 sm:h-20" />
    </div>
  );
}
