/**
 * Combo Store — Zustand store for Combos for Her page
 * 
 * Manages:
 *   - Combo products list with filtering & pagination
 *   - CMS config (hero, value strip, how it works, urgency, etc.)
 *   - Combo stats (total sold, etc.)
 *   - Active filter state
 */

import api from '@/lib/api';
import { create } from 'zustand';

// ============================================================
// Types
// ============================================================

export interface ComboProduct {
  id: string;
  title: string;
  slug: string;
  description?: string;
  comboPrice: number;
  originalTotal: number;
  savingsAmount: number;
  discountPercent: number;
  badge?: string;
  tag?: string;
  includes: string[];
  averageRating: number;
  reviewCount: number;
  stockQuantity: number;
  soldCount: number;
  isLimited: boolean;
  images: {
    primary: string;
    free: string;
    hover: string;
  };
  primaryProduct: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image?: string;
  };
  freeProduct: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image?: string;
  };
}

export interface CmsValueItem {
  id: string;
  icon: string;
  text: string;
  enabled: boolean;
}

export interface CmsStep {
  id: string;
  number: string;
  title: string;
  description: string;
}

export interface CmsTestimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  verified: boolean;
}

export interface CmsFilterCategory {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
}

export interface CombosCmsConfig {
  hero: {
    enabled: boolean;
    heading: string;
    subheading: string;
    ctaPrimary: string;
    ctaPrimaryLink: string;
    ctaSecondary: string;
    ctaSecondaryLink: string;
    backgroundImage: string;
    mobileBackgroundImage: string;
    enableCountdown: boolean;
    countdownEndDate: string;
    overlayOpacity: number;
  };
  valueStrip: {
    enabled: boolean;
    items: CmsValueItem[];
  };
  howItWorks: {
    enabled: boolean;
    heading: string;
    steps: CmsStep[];
  };
  urgencyBar: {
    enabled: boolean;
    soldThisWeek: number;
    leftAtPrice: number;
    customMessage: string;
  };
  filters: {
    enabled: boolean;
    categories: CmsFilterCategory[];
  };
  testimonials: {
    enabled: boolean;
    heading: string;
    items: CmsTestimonial[];
  };
  newsletter: {
    enabled: boolean;
    heading: string;
    subheading: string;
    placeholder: string;
    ctaText: string;
  };
}

export interface ComboStats {
  totalSold: number;
  totalCombos: number;
}

interface ComboState {
  // Data
  combos: ComboProduct[];
  cmsConfig: CombosCmsConfig | null;
  stats: ComboStats | null;

  // Loading states
  loading: boolean;
  cmsLoading: boolean;
  statsLoading: boolean;

  // Filter state
  activeFilter: string;
  activeSort: string;

  // Pagination
  page: number;
  totalPages: number;
  total: number;

  // Actions
  fetchCombos: (filter?: string, sort?: string, page?: number) => Promise<void>;
  fetchCmsConfig: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setActiveFilter: (filter: string) => void;
  setActiveSort: (sort: string) => void;
  setPage: (page: number) => void;
}

export const useComboStore = create<ComboState>()((set, get) => ({
  // Initial state
  combos: [],
  cmsConfig: null,
  stats: null,
  loading: false,
  cmsLoading: false,
  statsLoading: false,
  activeFilter: 'all',
  activeSort: 'sortOrder',
  page: 1,
  totalPages: 1,
  total: 0,

  fetchCombos: async (filter?: string, sort?: string, page?: number) => {
    set({ loading: true });
    try {
      const currentFilter = filter ?? get().activeFilter;
      const currentSort = sort ?? get().activeSort;
      const currentPage = page ?? get().page;

      const params: Record<string, string> = {
        page: String(currentPage),
        limit: '24',
      };

      if (currentFilter && currentFilter !== 'all') {
        params.filter = currentFilter;
      }
      if (currentSort) {
        params.sort = currentSort;
      }

      const response = await api.get('/combos', { params });
      const { data, pagination } = response.data;

      set({
        combos: data,
        page: pagination.page,
        totalPages: pagination.totalPages,
        total: pagination.total,
        activeFilter: currentFilter,
        activeSort: currentSort,
        loading: false,
      });
    } catch (error) {
      console.error('[ComboStore] Error fetching combos:', error);
      set({ loading: false });
    }
  },

  fetchCmsConfig: async () => {
    set({ cmsLoading: true });
    try {
      const response = await api.get('/combos/cms');
      set({ cmsConfig: response.data.data, cmsLoading: false });
    } catch (error) {
      console.error('[ComboStore] Error fetching CMS config:', error);
      set({ cmsLoading: false });
    }
  },

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const response = await api.get('/combos/stats');
      set({ stats: response.data.data, statsLoading: false });
    } catch (error) {
      console.error('[ComboStore] Error fetching stats:', error);
      set({ statsLoading: false });
    }
  },

  setActiveFilter: (filter: string) => {
    set({ activeFilter: filter, page: 1 });
    get().fetchCombos(filter);
  },

  setActiveSort: (sort: string) => {
    set({ activeSort: sort, page: 1 });
    get().fetchCombos(undefined, sort);
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchCombos(undefined, undefined, page);
  },
}));
