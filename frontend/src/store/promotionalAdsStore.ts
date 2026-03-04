import { create } from 'zustand';

export interface PromotionalAd {
  id: string;
  type: 'seasonal' | 'bestseller' | 'combo' | 'stock-alert';
  productId?: string;
  productName: string;
  productImage: string;
  discount?: number;
  ctaText: string;
  badge?: string;
}

interface PromotionalAdsState {
  currentAdIndex: number;
  isVisible: boolean;
  closedThisSession: boolean;
  showCount: number;
  setCurrentAdIndex: (index: number) => void;
  setIsVisible: (visible: boolean) => void;
  setClosedThisSession: (closed: boolean) => void;
  incrementShowCount: () => void;
  shouldShowAds: () => boolean;
}

/**
 * Promotional Ads Store
 * Manages bottom-left ads rotation, visibility, and session tracking
 */
export const usePromotionalAdsStore = create<PromotionalAdsState>((set, get) => ({
  currentAdIndex: 0,
  isVisible: false,
  closedThisSession: false,
  showCount: 0,

  setCurrentAdIndex: (index: number) => {
    set({ currentAdIndex: index });
  },

  setIsVisible: (visible: boolean) => {
    set({ isVisible: visible });
  },

  setClosedThisSession: (closed: boolean) => {
    set({ closedThisSession: closed });
  },

  incrementShowCount: () => {
    set((state) => ({ showCount: state.showCount + 1 }));
  },

  shouldShowAds: () => {
    const state = get();
    // Don't show if user closed it or shown 3+ times
    return !state.closedThisSession && state.showCount < 3;
  },
}));
