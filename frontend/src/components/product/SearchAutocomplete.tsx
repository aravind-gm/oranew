'use client';

import api from '@/lib/api';
import { Clock, Search, TrendingUp, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  images: Array<{
    imageUrl: string;
    isPrimary: boolean;
  }>;
  category?: {
    name: string;
  };
}

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  showInNav?: boolean;
}

const RECENT_SEARCHES_KEY = 'ora-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchAutocomplete({
  placeholder = 'Search for jewellery...',
  className = '',
  onSearch,
  showInNav = false,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Popular/trending searches (could be fetched from API)
  const trendingSearches = [
    'Gold Necklace',
    'Diamond Ring',
    'Pearl Earrings',
    'Silver Bracelet',
    'Wedding Set',
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    try {
      const updated = [
        searchQuery,
        ...recentSearches.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);
      
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, [recentSearches]);

  // Debounced search
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: { search: searchQuery, limit: 6 },
      });
      setResults(response.data.data.products || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchProducts(value);
    }, 300);
  };

  // Handle search submit
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    saveRecentSearch(searchQuery);
    setShowDropdown(false);
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length || (query ? 0 : recentSearches.length + trendingSearches.length);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          router.push(`/products/${results[selectedIndex].slug}`);
          setShowDropdown(false);
        } else if (selectedIndex >= 0 && !query) {
          const allSuggestions = [...recentSearches, ...trendingSearches];
          handleSearch(allSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Remove single recent search
  const removeRecentSearch = (searchToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProductImage = (product: SearchResult) => {
    const primary = product.images.find((img) => img.isPrimary);
    return primary?.imageUrl || product.images[0]?.imageUrl || '/placeholder.png';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
          size={20} 
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
            showInNav ? 'bg-gray-100 border-transparent focus:bg-white' : 'bg-white'
          }`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
        >
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {/* Search Results */}
          {!loading && query && results.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <span className="text-xs font-medium text-gray-500 uppercase">Products</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((product, index) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      saveRecentSearch(query);
                      router.push(`/products/${product.slug}`);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left ${
                      selectedIndex === index ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      {product.category && (
                        <p className="text-xs text-gray-500">{product.category.name}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-amber-600">
                      ₹{product.finalPrice.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleSearch()}
                className="w-full p-3 bg-gray-50 text-center text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors border-t"
              >
                View all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center">
              <Search className="mx-auto mb-2 text-gray-300" size={32} />
              <p className="text-gray-600">No products found for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
            </div>
          )}

          {/* Recent & Trending (when no query) */}
          {!loading && !query && (
            <div className="max-h-[400px] overflow-y-auto">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                      <Clock size={14} />
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear all
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                        selectedIndex === index ? 'bg-amber-50' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-700">{search}</span>
                      <button
                        onClick={(e) => removeRecentSearch(search, e)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-t">
                  <span className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                    <TrendingUp size={14} />
                    Trending Searches
                  </span>
                </div>
                {trendingSearches.map((search, index) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedIndex === recentSearches.length + index ? 'bg-amber-50' : ''
                    }`}
                  >
                    <TrendingUp size={16} className="text-amber-500" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
