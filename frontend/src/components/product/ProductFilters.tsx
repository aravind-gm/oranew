'use client';

import api from '@/lib/api';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductFilters({
  onFilterChange,
  isMobile = false,
  onClose,
}: FilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<FilterValue>({
    minPrice: 0,
    maxPrice: 100000,
    category: '',
    sortBy: 'createdAt',
    search: '',
  });
  const [loading, setLoading] = useState(true);

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

  const sortOptions = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'finalPrice', label: 'Price: Low to High' },
    { value: '-finalPrice', label: 'Price: High to Low' },
    { value: '-averageRating', label: 'Rating' },
  ];

  const filterContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
        <div className="space-y-2">
          {loading ? (
            <p className="text-gray-600 text-sm">Loading categories...</p>
          ) : (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={!filters.category}
                  onChange={(e) => handleFilterChange({ category: e.target.value })}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-gray-700">All Categories</span>
              </label>
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={category.slug}
                    checked={filters.category === category.slug}
                    onChange={(e) => handleFilterChange({ category: e.target.value })}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Min Price: ₹{filters.minPrice}</label>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.minPrice || 0}
              onChange={(e) => handleFilterChange({ minPrice: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Max Price: ₹{filters.maxPrice}</label>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.maxPrice || 100000}
              onChange={(e) => handleFilterChange({ maxPrice: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
        <select
          value={filters.sortBy || 'createdAt'}
          onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={handleClearFilters}
        className="w-full py-2 px-4 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/50 z-40">
        <div className="absolute left-0 top-0 bottom-0 bg-white w-80 shadow-lg overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Filters</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">{filterContent}</div>
        </div>
      </div>
    );
  }

  return <div className="bg-white rounded-lg border border-gray-200 p-4">{filterContent}</div>;
}
