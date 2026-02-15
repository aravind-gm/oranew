/**
 * Admin BOGO Store — Zustand state for BOGO Campaign Management
 *
 * Manages:
 *   - Campaign settings (active, discount type, tiers, categories)
 *   - Product BOGO eligibility (list, toggle, tier assignment)
 *   - Campaign statistics
 */

import api from '@/lib/api';
import { create } from 'zustand';

// ============================================================
// Types
// ============================================================

export interface BOGOCampaignSettings {
  id: string;
  name: string;
  isActive: boolean;
  discountType: 'FREE_CHEAPER' | 'PERCENT' | 'FIXED';
  discountValue: number;
  allowedTiers: number[];
  allowedCategories: string[];
  startDate: string | null;
  endDate: string | null;
  maxUsesPerUser: number;
  totalUsageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BOGOProductAdmin {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  image: string;
  hoverImage: string | null;
  isBOGOEligible: boolean;
  bogoCategory: string | null;
  bogoPriceTier: number | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
}

export interface BOGOStats {
  campaignActive: boolean;
  totalEligibleProducts: number;
  totalProducts: number;
  totalUsageCount: number;
  tierBreakdown: Record<number, number>;
  categoryBreakdown: Record<string, number>;
  discountType: string;
}

interface AdminBOGOState {
  // Campaign settings
  campaign: BOGOCampaignSettings | null;
  campaignLoading: boolean;

  // Products
  products: BOGOProductAdmin[];
  productsLoading: boolean;
  productsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Statistics
  stats: BOGOStats | null;
  statsLoading: boolean;

  // Filters
  searchQuery: string;
  filterTier: string;
  filterCategory: string;
  filterBogoOnly: boolean;

  // Error
  error: string | null;

  // Actions — Campaign
  fetchCampaign: () => Promise<void>;
  updateCampaign: (data: Partial<BOGOCampaignSettings>) => Promise<boolean>;
  toggleCampaign: (active: boolean) => Promise<boolean>;

  // Actions — Products
  fetchProducts: (page?: number) => Promise<void>;
  toggleProductBOGO: (
    productId: string,
    enabled: boolean,
    tier?: number,
    category?: string,
  ) => Promise<boolean>;
  updateProductBOGOFields: (
    productId: string,
    data: { bogoPriceTier?: number; bogoCategory?: string },
  ) => Promise<boolean>;

  // Actions — Stats
  fetchStats: () => Promise<void>;

  // Actions — Filters
  setSearchQuery: (q: string) => void;
  setFilterTier: (tier: string) => void;
  setFilterCategory: (cat: string) => void;
  setFilterBogoOnly: (only: boolean) => void;
}

// ============================================================
// Store
// ============================================================

export const useAdminBOGOStore = create<AdminBOGOState>()((set, get) => ({
  campaign: null,
  campaignLoading: false,
  products: [],
  productsLoading: false,
  productsPagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  stats: null,
  statsLoading: false,
  searchQuery: '',
  filterTier: '',
  filterCategory: '',
  filterBogoOnly: false,
  error: null,

  // --------------------------------------------------------
  // Campaign
  // --------------------------------------------------------
  fetchCampaign: async () => {
    set({ campaignLoading: true, error: null });
    try {
      const res = await api.get('/admin/bogo/campaign');
      set({ campaign: res.data.data, campaignLoading: false });
    } catch (err: any) {
      console.error('[AdminBOGO] fetchCampaign error:', err);
      set({
        campaignLoading: false,
        error: err?.response?.data?.message || 'Failed to fetch campaign',
      });
    }
  },

  updateCampaign: async (data) => {
    set({ error: null });
    try {
      const res = await api.put('/admin/bogo/campaign', data);
      set({ campaign: res.data.data });
      return true;
    } catch (err: any) {
      console.error('[AdminBOGO] updateCampaign error:', err);
      set({ error: err?.response?.data?.message || 'Failed to update campaign' });
      return false;
    }
  },

  toggleCampaign: async (active) => {
    return get().updateCampaign({ isActive: active });
  },

  // --------------------------------------------------------
  // Products
  // --------------------------------------------------------
  fetchProducts: async (page = 1) => {
    set({ productsLoading: true, error: null });
    try {
      const { searchQuery, filterTier, filterCategory, filterBogoOnly } = get();
      const params: Record<string, string> = { page: String(page), limit: '50' };
      if (searchQuery) params.search = searchQuery;
      if (filterTier) params.tier = filterTier;
      if (filterCategory) params.category = filterCategory;
      if (filterBogoOnly) params.bogoOnly = 'true';

      const res = await api.get('/admin/bogo/products', { params });
      set({
        products: res.data.data,
        productsPagination: res.data.pagination,
        productsLoading: false,
      });
    } catch (err: any) {
      console.error('[AdminBOGO] fetchProducts error:', err);
      set({
        productsLoading: false,
        error: err?.response?.data?.message || 'Failed to fetch products',
      });
    }
  },

  toggleProductBOGO: async (productId, enabled, tier, category) => {
    set({ error: null });
    try {
      const body: Record<string, any> = { isBOGOEligible: enabled };
      if (tier !== undefined) body.bogoPriceTier = tier;
      if (category !== undefined) body.bogoCategory = category;

      const res = await api.put(`/admin/bogo/products/${productId}`, body);

      // Update local state
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, ...res.data.data } : p,
        ),
      }));
      return true;
    } catch (err: any) {
      console.error('[AdminBOGO] toggleProductBOGO error:', err);
      set({ error: err?.response?.data?.message || 'Failed to update product' });
      return false;
    }
  },

  updateProductBOGOFields: async (productId, data) => {
    set({ error: null });
    try {
      const res = await api.put(`/admin/bogo/products/${productId}`, data);
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, ...res.data.data } : p,
        ),
      }));
      return true;
    } catch (err: any) {
      console.error('[AdminBOGO] updateProductBOGOFields error:', err);
      set({ error: err?.response?.data?.message || 'Failed to update product fields' });
      return false;
    }
  },

  // --------------------------------------------------------
  // Stats
  // --------------------------------------------------------
  fetchStats: async () => {
    set({ statsLoading: true, error: null });
    try {
      const res = await api.get('/admin/bogo/stats');
      set({ stats: res.data.data, statsLoading: false });
    } catch (err: any) {
      console.error('[AdminBOGO] fetchStats error:', err);
      set({
        statsLoading: false,
        error: err?.response?.data?.message || 'Failed to fetch stats',
      });
    }
  },

  // --------------------------------------------------------
  // Filters
  // --------------------------------------------------------
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterTier: (tier) => set({ filterTier: tier }),
  setFilterCategory: (cat) => set({ filterCategory: cat }),
  setFilterBogoOnly: (only) => set({ filterBogoOnly: only }),
}));
