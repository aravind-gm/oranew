'use client';

import api from '@/lib/api';
import { Filter, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import PriceRangeSlider from './PriceRangeSlider';
import SearchAutocomplete from './SearchAutocomplete';

interface FilterValue {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  sortBy?: string;
  search?: string;
}

interface FilterProps {
  onFilterChange: (filters: FilterValue) => void;
  isMobile?: boolean;
  onClose?: () => void;
  initialFilters?: FilterValue;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  image?: string;
}

export default function ProductFilters({
  onFilterChange,
  isMobile = false,
  onClose,
  initialFilters,
}: FilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<FilterValue>({
    minPrice: 0,
    maxPrice: 100000,
    category: '',
    sortBy: 'createdAt',
    search: '',
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice && filters.minPrice > 0) count++;
    if (filters.maxPrice && filters.maxPrice < 100000) count++;
    if (filters.search) count++;
    if (filters.sortBy && filters.sortBy !== 'createdAt') count++;
    setActiveFilterCount(count);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FilterValue>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      minPrice: 0,
      maxPrice: 100000,
      category: '',
      sortBy: 'createdAt',
      search: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const handleSearch = (query: string) => {
    handleFilterChange({ search: query });
  };

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'finalPrice', label: 'Price: Low to High' },
    { value: '-finalPrice', label: 'Price: High to Low' },
    { value: '-averageRating', label: 'Highest Rated' },
    { value: '-reviewCount', label: 'Most Reviewed' },
    { value: 'name', label: 'Name: A-Z' },
  ];

  const filterContent = (
    <div className="space-y-6">
      {/* Header with Filter Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-amber-500" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Products
        </label>
        <SearchAutocomplete
          placeholder="Search..."
          onSearch={handleSearch}
          className="w-full"
        />
        {filters.search && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Searching:</span>
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
              {filters.search}
              <button
                onClick={() => handleFilterChange({ search: '' })}
                className="hover:bg-amber-200 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Categories with Badges */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Categories
        </label>
        <div className="space-y-1">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* All Categories Option */}
              <button
                onClick={() => handleFilterChange({ category: '' })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  !filters.category
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">All Categories</span>
                {!filters.category && (
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </button>

              {/* Category List */}
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleFilterChange({ category: category.slug })}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    filters.category === category.slug
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium">{category.name}</span>
                  {category.productCount !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        filters.category === category.slug
                          ? 'bg-white/20'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {category.productCount}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Price Range
        </label>
        <PriceRangeSlider
          min={0}
          max={100000}
          minValue={filters.minPrice || 0}
          maxValue={filters.maxPrice || 100000}
          step={1000}
          onChange={(min, max) => handleFilterChange({ minPrice: min, maxPrice: max })}
        />
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <div className="relative">
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white text-gray-700"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">
              <Filter size={14} className="inline mr-1" />
              Active Filters
            </span>
            <button
              onClick={handleClearFilters}
              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Reset All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center gap-1 bg-white text-amber-700 text-xs px-2 py-1 rounded-full border border-amber-200">
                {categories.find((c) => c.slug === filters.category)?.name}
                <button
                  onClick={() => handleFilterChange({ category: '' })}
                  className="hover:bg-amber-100 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(filters.minPrice || 0) > 0 && (
              <span className="inline-flex items-center gap-1 bg-white text-amber-700 text-xs px-2 py-1 rounded-full border border-amber-200">
                Min: ₹{filters.minPrice?.toLocaleString()}
                <button
                  onClick={() => handleFilterChange({ minPrice: 0 })}
                  className="hover:bg-amber-100 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(filters.maxPrice || 100000) < 100000 && (
              <span className="inline-flex items-center gap-1 bg-white text-amber-700 text-xs px-2 py-1 rounded-full border border-amber-200">
                Max: ₹{filters.maxPrice?.toLocaleString()}
                <button
                  onClick={() => handleFilterChange({ maxPrice: 100000 })}
                  className="hover:bg-amber-100 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Clear All Button */}
      <button
        onClick={handleClearFilters}
        className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={16} />
        Clear All Filters
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/50 z-40">
        <div className="absolute left-0 top-0 bottom-0 bg-white w-[85%] max-w-sm shadow-2xl overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-amber-500" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">{filterContent}</div>
          
          {/* Apply Button for Mobile */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {filterContent}
    </div>
  );
}
