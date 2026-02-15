/**
 * BOGO Store — Buy 1 Get 1 Free Selection Logic
 *
 * Manages:
 *   - Selected products (max 2)
 *   - Price tier filtering
 *   - Discount calculation
 *   - Eligible products from API
 */

import api from '@/lib/api';
import { create } from 'zustand';

export interface BOGOProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  image: string;
  hoverImage?: string;
  isBOGOEligible: boolean;
  bogoCategory: string;
  bogoPriceTier: number;
  bogoActive: boolean;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
}

interface BOGOState {
  // Data
  eligibleProducts: BOGOProduct[];
  selectedProducts: BOGOProduct[];
  selectedTier: number | null;
  selectedCategory: string;
  isLoading: boolean;

  // Campaign settings
  discountType: 'FREE_CHEAPER' | 'PERCENT' | 'FIXED';
  discountValue: number;
  campaignActive: boolean;

  // Actions
  fetchEligibleProducts: (tier?: number, category?: string) => Promise<void>;
  selectProduct: (product: BOGOProduct) => void;
  deselectProduct: (productId: string) => void;
  clearSelection: () => void;
  setSelectedTier: (tier: number | null) => void;
  setSelectedCategory: (category: string) => void;
  
  // Computed
  getCheaperProduct: () => BOGOProduct | null;
  getExpensiveProduct: () => BOGOProduct | null;
  calculateDiscount: () => number;
  getTotalPrice: () => number;
  getSavings: () => number;
  canAddToCart: () => boolean;
}

export const useBOGOStore = create<BOGOState>()((set, get) => ({
  eligibleProducts: [],
  selectedProducts: [],
  selectedTier: null,
  selectedCategory: 'all',
  isLoading: false,
  discountType: 'FREE_CHEAPER',
  discountValue: 0,
  campaignActive: true,

  fetchEligibleProducts: async (tier?: number, category?: string) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {
        bogoEligible: 'true',
      };
      if (tier) params.tier = String(tier);
      if (category && category !== 'all') params.category = category;

      const response = await api.get('/products/bogo-eligible', { params });
      set({ 
        eligibleProducts: response.data.data,
        isLoading: false,
      });
    } catch (error) {
      console.error('[BOGOStore] Error fetching eligible products:', error);
      set({ isLoading: false });
    }
  },

  selectProduct: (product: BOGOProduct) => {
    const { selectedProducts } = get();
    
    // Max 2 selections
    if (selectedProducts.length >= 2) return;
    
    // Don't select same product twice
    if (selectedProducts.find(p => p.id === product.id)) return;
    
    set({ selectedProducts: [...selectedProducts, product] });
  },

  deselectProduct: (productId: string) => {
    const { selectedProducts } = get();
    set({ 
      selectedProducts: selectedProducts.filter(p => p.id !== productId),
    });
  },

  clearSelection: () => {
    set({ selectedProducts: [] });
  },

  setSelectedTier: (tier: number | null) => {
    set({ selectedTier: tier, selectedProducts: [] });
    const { selectedCategory } = get();
    if (tier) {
      get().fetchEligibleProducts(tier, selectedCategory);
    } else {
      get().fetchEligibleProducts(undefined, selectedCategory);
    }
  },

  setSelectedCategory: (category: string) => {
    set({ selectedCategory: category, selectedProducts: [] });
    const { selectedTier } = get();
    if (selectedTier) {
      get().fetchEligibleProducts(selectedTier, category);
    } else {
      get().fetchEligibleProducts(undefined, category);
    }
  },

  getCheaperProduct: () => {
    const { selectedProducts } = get();
    if (selectedProducts.length !== 2) return null;
    return selectedProducts[0].finalPrice <= selectedProducts[1].finalPrice
      ? selectedProducts[0]
      : selectedProducts[1];
  },

  getExpensiveProduct: () => {
    const { selectedProducts } = get();
    if (selectedProducts.length !== 2) return null;
    return selectedProducts[0].finalPrice > selectedProducts[1].finalPrice
      ? selectedProducts[0]
      : selectedProducts[1];
  },

  calculateDiscount: () => {
    const { discountType, discountValue } = get();
    const cheaper = get().getCheaperProduct();
    if (!cheaper) return 0;

    if (discountType === 'FREE_CHEAPER') {
      return cheaper.finalPrice;
    } else if (discountType === 'PERCENT') {
      return cheaper.finalPrice * (discountValue / 100);
    } else if (discountType === 'FIXED') {
      return discountValue;
    }
    return 0;
  },

  getTotalPrice: () => {
    const { selectedProducts } = get();
    const subtotal = selectedProducts.reduce((sum, p) => sum + p.finalPrice, 0);
    const discount = get().calculateDiscount();
    return subtotal - discount;
  },

  getSavings: () => {
    return get().calculateDiscount();
  },

  canAddToCart: () => {
    const { selectedProducts, campaignActive } = get();
    return selectedProducts.length === 2 && campaignActive;
  },
}));

// Export the hook (both names for compatibility)
export const useBogoStore = useBOGOStore;
