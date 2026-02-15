'use client';

/**
 * LuxuryFilterSidebar — Premium collapsible filter panel
 * 
 * Desktop: Left sidebar with elegant collapsible sections
 * Mobile: Slide-over drawer from bottom
 * 
 * Features:
 *   - Category, Price (slider + presets), Material, Occasion, Availability, Rating, Discount
 *   - URL sync for shareable filtered views
 *   - Active filter pills
 *   - Clear all / individual clear
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface FilterState {
  category: string;
  priceRange: string;
  material: string;
  availability: string;
  sort: string;
  mood: string;
}

interface Category {
  id: string;
  name: string;
}

interface LuxuryFilterSidebarProps {
  filters: FilterState;
  categories: Category[];
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  totalProducts: number;
  loading: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A – Z' },
  { value: 'rating', label: 'Highest Rated' },
];

export const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '0-500', label: 'Under ₹500' },
  { value: '0-999', label: 'Under ₹999' },
  { value: '0-1499', label: 'Under ₹1,499' },
  { value: '500-1000', label: '₹500 – ₹1,000' },
  { value: '1000-2000', label: '₹1,000 – ₹2,000' },
  { value: '2000-3000', label: '₹2,000 – ₹3,000' },
  { value: '3000-999999', label: '₹3,000+' },
];

export const MATERIALS = [
  { value: '', label: 'All Materials' },
  { value: 'gold', label: 'Gold' },
  { value: 'rose-gold', label: 'Rose Gold' },
  { value: 'silver', label: 'Sterling Silver' },
  { value: 'white-gold', label: 'White Gold' },
  { value: 'platinum', label: 'Platinum' },
];

export const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All Products' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'new', label: 'New Arrivals' },
  { value: 'bestseller', label: 'Bestsellers' },
];

// ============================================================================
// Collapsible Filter Section
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
    <div className="border-b border-neutral-100 py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group min-h-0"
        aria-expanded={isOpen}
      >
        <span 
          className="text-[11px] font-semibold text-neutral-800 tracking-[0.15em] uppercase"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-neutral-400 group-hover:text-neutral-700 transition-colors"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Filter Option Item
// ============================================================================

function FilterOption({
  label,
  isActive,
  onClick,
  count,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-between w-full px-2 py-2 text-left text-[13px] rounded-lg transition-all duration-200 min-h-0
        ${isActive 
          ? 'text-[#1A1A1A] font-medium bg-[#FFF7FA]' 
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
        }
      `}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full transition-all duration-200 border ${
            isActive 
              ? 'border-[#D4AF37] bg-[#D4AF37]' 
              : 'border-neutral-300'
          }`}
        >
          {isActive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          )}
        </span>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-neutral-400 tabular-nums">{count}</span>
      )}
    </button>
  );
}

// ============================================================================
// Active Filter Pill
// ============================================================================

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#9B2C46] bg-[#FFF0F5] rounded-full border border-[#F8D8E4] whitespace-nowrap"
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:text-[#7A2238] transition-colors ml-0.5 min-h-0"
        aria-label={`Remove ${label}`}
      >
        <X size={11} />
      </button>
    </motion.span>
  );
}

// ============================================================================
// Desktop Filter Sidebar
// ============================================================================

export function DesktopFilterSidebar({ 
  filters, 
  categories, 
  onFilterChange, 
  onReset 
}: LuxuryFilterSidebarProps) {
  const activeFilterCount = [
    filters.category, 
    filters.priceRange, 
    filters.material, 
    filters.availability,
    filters.mood,
  ].filter(Boolean).length;

  return (
    <aside className="hidden lg:block w-[240px] flex-shrink-0">
      <div className="sticky top-[72px] pb-16 max-h-[calc(100vh-5rem)] overflow-y-auto pr-4" style={{ scrollbarWidth: 'thin' }}>
        {/* Filter Header */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#D4AF37]" />
            <h2 
              className="text-[11px] font-semibold text-neutral-900 tracking-[0.2em] uppercase"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Refine
            </h2>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-[#9B2C46] transition-colors min-h-0"
            >
              <RotateCcw size={10} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <FilterSection title="Category">
            <FilterOption 
              label="All" 
              isActive={!filters.category} 
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

        {/* Price */}
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

        {/* Material */}
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

        {/* Availability */}
        <FilterSection title="Availability" defaultOpen={false}>
          {AVAILABILITY_OPTIONS.map((opt) => (
            <FilterOption
              key={opt.value}
              label={opt.label}
              isActive={filters.availability === opt.value}
              onClick={() => onFilterChange('availability', opt.value)}
            />
          ))}
        </FilterSection>
      </div>
    </aside>
  );
}

// ============================================================================
// Mobile Filter Drawer
// ============================================================================

interface MobileFilterDrawerProps extends LuxuryFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  categories,
  onFilterChange,
  onReset,
  totalProducts,
  loading,
}: MobileFilterDrawerProps) {
  const activeFilterCount = [
    filters.category,
    filters.priceRange,
    filters.material,
    filters.availability,
    filters.mood,
  ].filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={16} className="text-[#D4AF37]" />
                <h2 
                  className="text-sm font-semibold text-neutral-900 tracking-wide"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Filter & Sort
                </h2>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-[#D4AF37] text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button 
                onClick={onClose} 
                className="p-2 -mr-2 rounded-full hover:bg-neutral-50 transition-colors min-h-0" 
                aria-label="Close"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {/* Sort */}
              <FilterSection title="Sort By">
                {SORT_OPTIONS.map((opt) => (
                  <FilterOption
                    key={opt.value}
                    label={opt.label}
                    isActive={filters.sort === opt.value}
                    onClick={() => onFilterChange('sort', opt.value)}
                  />
                ))}
              </FilterSection>

              {/* Category */}
              {categories.length > 0 && (
                <FilterSection title="Category">
                  <FilterOption
                    label="All"
                    isActive={!filters.category}
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

              {/* Price */}
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

              {/* Material */}
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

              {/* Availability */}
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
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-5 border-t border-neutral-100 bg-white">
              <button
                onClick={() => { onReset(); }}
                className="flex-1 py-3.5 text-sm font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 rounded-full transition-colors min-h-[48px]"
              >
                Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 text-sm font-medium text-white bg-[#1A1A1A] hover:bg-neutral-800 rounded-full transition-colors min-h-[48px]"
              >
                {loading ? 'Loading...' : `Show ${totalProducts} Results`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Active Filters Bar
// ============================================================================

interface ActiveFiltersBarProps {
  filters: FilterState;
  categories: Category[];
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
}

export function ActiveFiltersBar({ filters, categories, onFilterChange, onReset }: ActiveFiltersBarProps) {
  const activeCount = [
    filters.category,
    filters.priceRange,
    filters.material,
    filters.availability,
    filters.mood,
  ].filter(Boolean).length;

  if (activeCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 mb-6 flex-wrap"
    >
      <AnimatePresence mode="popLayout">
        {filters.category && (
          <ActivePill
            key="cat"
            label={categories.find((c) => c.id === filters.category)?.name || filters.category}
            onRemove={() => onFilterChange('category', '')}
          />
        )}
        {filters.priceRange && (
          <ActivePill
            key="price"
            label={PRICE_RANGES.find((p) => p.value === filters.priceRange)?.label || filters.priceRange}
            onRemove={() => onFilterChange('priceRange', '')}
          />
        )}
        {filters.material && (
          <ActivePill
            key="mat"
            label={MATERIALS.find((m) => m.value === filters.material)?.label || filters.material}
            onRemove={() => onFilterChange('material', '')}
          />
        )}
        {filters.availability && (
          <ActivePill
            key="avail"
            label={AVAILABILITY_OPTIONS.find((a) => a.value === filters.availability)?.label || filters.availability}
            onRemove={() => onFilterChange('availability', '')}
          />
        )}
        {filters.mood && (
          <ActivePill
            key="mood"
            label={`Mood: ${filters.mood}`}
            onRemove={() => onFilterChange('mood', '')}
          />
        )}
      </AnimatePresence>
      <button
        onClick={onReset}
        className="text-[11px] text-neutral-400 hover:text-[#9B2C46] underline underline-offset-2 ml-1 transition-colors min-h-0"
      >
        Clear all
      </button>
    </motion.div>
  );
}
