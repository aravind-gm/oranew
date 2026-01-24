'use client';

import api from '@/lib/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  altText: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  averageRating?: number;
  reviewCount?: number;
  stockQuantity?: number;
  images: ProductImage[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface Filters {
  minPrice: number;
  maxPrice: number;
  category: string;
  sortBy: string;
  search: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface RecentlyViewed {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  viewedAt: string;
}

interface ProductStore {
  // Products
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;

  // Filters & Pagination
  filters: Filters;
  pagination: PaginationInfo;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;

  // Recently Viewed (persisted)
  recentlyViewed: RecentlyViewed[];

  // Search
  searchQuery: string;
  searchResults: Product[];
  searchLoading: boolean;

  // Actions
  fetchProducts: (page?: number, customFilters?: Partial<Filters>) => Promise<void>;
  fetchProductBySlug: (slug: string) => Promise<Product | null>;
  fetchCategories: () => Promise<void>;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  searchProducts: (query: string) => Promise<void>;
  addToRecentlyViewed: (product: {
    productId: string;
    slug: string;
    name: string;
    image: string;
    price: number;
  }) => void;
  clearRecentlyViewed: () => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: Filters = {
  minPrice: 0,
  maxPrice: 100000,
  category: '',
  sortBy: 'createdAt',
  search: '',
};

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 12,
  total: 0,
  pages: 0,
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      currentProduct: null,
      loading: false,
      error: null,
      filters: DEFAULT_FILTERS,
      pagination: DEFAULT_PAGINATION,
      categories: [],
      categoriesLoading: false,
      recentlyViewed: [],
      searchQuery: '',
      searchResults: [],
      searchLoading: false,

      fetchProducts: async (page = 1, customFilters) => {
        try {
          set({ loading: true, error: null });
          
          const currentFilters = { ...get().filters, ...customFilters };
          
          const params: Record<string, string | number> = {
            page,
            limit: get().pagination.limit,
          };
          
          if (currentFilters.category) params.category = currentFilters.category;
          if (currentFilters.minPrice > 0) params.minPrice = currentFilters.minPrice;
          if (currentFilters.maxPrice < 100000) params.maxPrice = currentFilters.maxPrice;
          if (currentFilters.sortBy) params.sortBy = currentFilters.sortBy;
          if (currentFilters.search) params.search = currentFilters.search;

          const response = await api.get('/products', { params });
          const { products, pagination } = response.data.data;

          set({
            products,
            pagination,
            filters: currentFilters,
            loading: false,
          });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          set({
            error: err.response?.data?.message || 'Failed to fetch products',
            loading: false,
          });
        }
      },

      fetchProductBySlug: async (slug: string) => {
        try {
          set({ loading: true, error: null });
          
          const response = await api.get(`/products/${slug}`);
          const product = response.data.data;

          set({ currentProduct: product, loading: false });

          // Add to recently viewed
          if (product && product.images?.length > 0) {
            const primaryImage = product.images.find((img: ProductImage) => img.isPrimary) || product.images[0];
            get().addToRecentlyViewed({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: primaryImage?.imageUrl || '',
              price: product.finalPrice,
            });
          }

          return product;
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          set({
            error: err.response?.data?.message || 'Failed to fetch product',
            loading: false,
            currentProduct: null,
          });
          return null;
        }
      },

      fetchCategories: async () => {
        try {
          set({ categoriesLoading: true });
          
          const response = await api.get('/categories');
          const categories = response.data.data || [];

          set({ categories, categoriesLoading: false });
        } catch {
          set({ categoriesLoading: false });
        }
      },

      setFilters: (newFilters: Partial<Filters>) => {
        const currentFilters = get().filters;
        set({ filters: { ...currentFilters, ...newFilters } });
      },

      resetFilters: () => {
        set({ filters: DEFAULT_FILTERS });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      searchProducts: async (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [], searchLoading: false });
          return;
        }

        try {
          set({ searchLoading: true, searchQuery: query });
          
          const response = await api.get('/products', {
            params: { search: query, limit: 20 },
          });
          
          set({
            searchResults: response.data.data.products || [],
            searchLoading: false,
          });
        } catch {
          set({ searchResults: [], searchLoading: false });
        }
      },

      addToRecentlyViewed: (product) => {
        const current = get().recentlyViewed;
        
        // Remove if already exists
        const filtered = current.filter((p) => p.productId !== product.productId);
        
        // Add to front with timestamp
        const newEntry: RecentlyViewed = {
          ...product,
          viewedAt: new Date().toISOString(),
        };
        
        // Keep only last 10
        const updated = [newEntry, ...filtered].slice(0, 10);
        
        set({ recentlyViewed: updated });
      },

      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'ora-product-store',
      partialize: (state) => ({
        recentlyViewed: state.recentlyViewed,
        filters: state.filters,
      }),
    }
  )
);
