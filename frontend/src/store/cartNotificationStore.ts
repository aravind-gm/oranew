import { create } from 'zustand';

interface CartNotification {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
}

interface CartNotificationState {
  notification: CartNotification | null;
  showNotification: (notification: CartNotification) => void;
  hideNotification: () => void;
}

/**
 * Global cart notification store
 * Manages the add-to-cart popup visibility and content
 */
export const useCartNotificationStore = create<CartNotificationState>((set) => ({
  notification: null,

  showNotification: (notification: CartNotification) => {
    set({ notification });
  },

  hideNotification: () => {
    set({ notification: null });
  },
}));
