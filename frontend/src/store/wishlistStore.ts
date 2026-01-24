import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  description?: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId);
          if (exists) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      isInWishlist: (productId) => {
        const state = get();
        return state.items.some((item) => item.productId === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'ora-wishlist',
    }
  )
);
