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

// NOTE: Categories are NOW fetched dynamically from backend
// NO hardcoded category list
// Default collections page shows ALL products (no category filter)
const MAX_PRICE = 1500;
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
 * Floating panel with category pills and sort
 * Categories are now DYNAMIC (fetched from backend)
 */
function FilterDropdown({
  isOpen,
  onClose,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  triggerRef,
  categories = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  categories?: Array<{ id: string; name: string }>;
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

        {/* CATEGORY PILLS — Dynamic from Backend */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <label className="text-xs text-text-muted tracking-[0.12em] uppercase font-semibold block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {/* "ALL PRODUCTS" pill to clear category filter */}
              <button
                onClick={() => onCategoryChange('')}
                className={`
                  px-4 py-2 text-xs font-medium tracking-[0.08em] uppercase
                  rounded-full transition-all duration-200
                  ${activeCategory === ''
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background border border-neutral-200 text-neutral-600 hover:border-secondary hover:text-foreground'
                  }
                `}
              >
                All Products
              </button>
              
              {/* Category pills from backend */}
              {categories.map((cat) => (
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
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
            onCategoryChange('');  // Empty string = show ALL products
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
  // NOTE: activeCategory now starts as empty string (no default category)
  // Categories are fetched dynamically from backend
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);
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

  // Fetch categories from backend on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const cats = response.data.data || response.data.success ? response.data.data : [];
        setAvailableCategories(cats);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setAvailableCategories([]);
      }
    };
    
    fetchCategories();
  }, []);

  // Parse URL params on mount
  useEffect(() => {
    const urlCategory = searchParams.get('category');

    // Only set category if explicitly provided in URL
    if (urlCategory) {
      setActiveCategory(urlCategory);
    }
    // Otherwise activeCategory stays empty (show ALL products)
  }, [searchParams]);

  // Fetch products
  // CRITICAL: When activeCategory is empty, DO NOT send it to backend
  // Backend will return ALL products when category param is missing
  const fetchProducts = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: pagination.limit,
      };

      // Only add category to params if user has selected one
      // When category is empty, fetch ALL products
      if (activeCategory) {
        params.category = activeCategory;
      }

      const response = await api.get('/products', { params });
      setProducts(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, pagination.limit]);

  // Fetch on filter change
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle reset - clears ALL filters and shows products again
  const handleReset = () => {
    setActiveCategory('');  // Empty string = fetch ALL products
    setSortBy('createdAt');
    setFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ================================================================
          HEADER & TITLE - Mobile Optimized
          ================================================================ */}
      <header className="w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-20 pb-6 sm:pb-10 lg:pb-16 border-b border-border/40">
        <div className="max-w-screen-2xl mx-auto">
          {/* Page Title - Editorial Style */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light text-text-primary mb-2 sm:mb-3 leading-tight">
              Collections
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-text-secondary tracking-wide">
              Everyday luxury under ₹1,500
            </p>
          </div>
        </div>
      </header>

      {/* ================================================================
          FILTER BAR - Mobile Optimized
          ================================================================ */}
      <div className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between">
          {/* Results Count */}
          <div className="flex items-center">
            <p className="text-[10px] sm:text-xs md:text-sm text-text-muted tracking-[0.08em] sm:tracking-[0.1em] uppercase font-medium">
              {loading ? '...' : `${pagination?.total || 0} piece${pagination?.total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Filter Button - Larger touch target on mobile */}
          <button
            ref={filterButtonRef}
            onClick={() => setFilterOpen(!filterOpen)}
            className={`
              relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5
              rounded-full border transition-all duration-300
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              min-h-[44px]
              ${filterOpen
                ? 'bg-primary border-primary text-text-primary shadow-luxury'
                : 'border-border/40 text-text-secondary hover:border-accent hover:text-text-primary'
              }
            `}
          >
            <SlidersHorizontal size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.08em] uppercase">
              Filter
            </span>
          </button>

          {/* Filter Dropdown */}
          <FilterDropdown
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            triggerRef={filterButtonRef}
            categories={availableCategories}
          />
        </div>
      </div>

      {/* ================================================================
          PRODUCT GRID - Mobile Optimized
          ================================================================ */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-20">
        <div className="max-w-screen-2xl mx-auto">
          {/* Grid Container */}
          {loading ? (
            <LoadingSkeleton />
          ) : products.length === 0 ? (
            <EmptyState onReset={handleReset} />
          ) : (
            <>
              {/* Product Grid - Optimized gaps for mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-10 sm:mb-16 lg:mb-20">
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

              {/* PAGINATION - Mobile Optimized */}
              {pagination.pages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="flex items-center justify-center gap-1"
                >
                  {/* Previous */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="
                      px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-medium text-text-secondary
                      disabled:opacity-30 disabled:cursor-not-allowed
                      hover:text-text-primary transition-colors duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      min-h-[44px] flex items-center
                    "
                  >
                    <span className="hidden sm:inline">← Previous</span>
                    <span className="sm:hidden">←</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
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
                              w-9 h-9 sm:w-10 sm:h-10 rounded-full text-[10px] sm:text-xs font-medium
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
                      px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-medium text-text-secondary
                      disabled:opacity-30 disabled:cursor-not-allowed
                      hover:text-text-primary transition-colors duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      min-h-[44px] flex items-center
                    "
                  >
                    <span className="hidden sm:inline">Next →</span>
                    <span className="sm:hidden">→</span>
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Spacing - Account for potential mobile nav */}
      <div className="h-8 sm:h-16 lg:h-20" />
    </div>
  );
}
