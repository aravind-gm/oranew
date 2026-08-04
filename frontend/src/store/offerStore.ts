/**
 * Offer Store — "Buy Any Necklace, Get a Ring FREE"
 *
 * Replaces the legacy bogoStore.
 * Tracks eligible necklaces, eligible rings, and the cart's current
 * necklace / free-ring counts (derived from cartStore).
 */

import api from '@/lib/api';
import { create } from 'zustand';
import { useCartStore } from './cartStore';

export interface OfferProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  image: string | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
}

interface OfferState {
  necklaces: OfferProduct[];
  rings: OfferProduct[];
  isLoading: boolean;
  error: string | null;

  // Derived: how many necklaces are currently in the cart
  cartNecklaceCount: number;
  // Derived: how many free rings are currently in the cart
  claimedRingCount: number;

  fetchNecklaces: (search?: string) => Promise<void>;
  fetchRings: (search?: string) => Promise<void>;
  syncCartCounts: () => void;
}

export const useOfferStore = create<OfferState>()((set, _get) => ({
  necklaces: [],
  rings: [],
  isLoading: false,
  error: null,
  cartNecklaceCount: 0,
  claimedRingCount: 0,

  fetchNecklaces: async (search) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch ALL necklaces from the regular products API (every necklace qualifies)
      const params: Record<string, string> = { category: 'necklaces', limit: '60', isActive: 'true' };
      if (search) params.search = search;
      const res = await api.get('/products', { params });
      const raw: any[] = res.data?.data || res.data?.products || [];
      const mapped: OfferProduct[] = raw.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        finalPrice: Number(p.finalPrice ?? p.price),
        image: p.images?.[0]?.imageUrl || p.image || p.imageUrl || null,
        stockQuantity: p.stockQuantity ?? 0,
        averageRating: Number(p.averageRating ?? 0),
        reviewCount: p.reviewCount ?? 0,
      }));
      set({ necklaces: mapped, isLoading: false });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Failed to fetch necklaces', isLoading: false });
    }
  },

  fetchRings: async (search) => {
    set({ isLoading: true, error: null });
    try {
      let raw: any[] = [];
      try {
        const offerParams: Record<string, string> = {};
        if (search) offerParams.search = search;
        const res = await api.get('/offer/rings', { params: offerParams });
        raw = res.data?.data || [];
      } catch {
        // swallow — fall through to category fallback
      }
      // Always fallback to category query when offer endpoint returns nothing
      if (raw.length === 0) {
        const params: Record<string, string> = { category: 'rings', limit: '40', isActive: 'true' };
        if (search) params.search = search;
        const res = await api.get('/products', { params });
        raw = res.data?.data || res.data?.products || [];
      }
      const mapped: OfferProduct[] = raw.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        finalPrice: Number(p.finalPrice ?? p.price),
        image: p.images?.[0]?.imageUrl || p.image || p.imageUrl || null,
        stockQuantity: p.stockQuantity ?? 0,
        averageRating: Number(p.averageRating ?? 0),
        reviewCount: p.reviewCount ?? 0,
      }));
      set({ rings: mapped, isLoading: false });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || 'Failed to fetch rings', isLoading: false });
    }
  },

  syncCartCounts: () => {
    const cartItems = useCartStore.getState().items;
    // Necklaces = non-free-gift items (all necklaces qualify; we count items not marked as free gifts)
    // The campaign page tracks necklaces by category, but for count we use the necklaceIds set if available
    const necklaceIds = new Set(_get().necklaces.map((n) => n.id));
    const cartNecklaceCount = necklaceIds.size > 0
      ? cartItems.filter((i) => !i.isFreeGift && necklaceIds.has(i.productId)).reduce((s, i) => s + i.quantity, 0)
      : cartItems.filter((i) => !i.isFreeGift).reduce((s, i) => s + i.quantity, 0);
    const claimedRingCount = cartItems.filter((i) => i.isFreeGift).reduce((s, i) => s + i.quantity, 0);
    set({ cartNecklaceCount, claimedRingCount });
  },
}));

// Keep cart counts in sync whenever cartStore changes
useCartStore.subscribe(() => {
  useOfferStore.getState().syncCartCounts();
});
