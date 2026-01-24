import api from '@/lib/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stockQuantity?: number;
  isOutOfStock?: boolean;
}

interface SavedItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  savedAt: string;
}

interface StockInfo {
  productId: string;
  stockQuantity: number;
  isAvailable: boolean;
}

interface CartState {
  items: CartItem[];
  savedForLater: SavedItem[];
  stockValidating: boolean;
  stockErrors: string[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  totalPrice: number;
  getItemCount: () => number;
  // Save for later
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  removeSaved: (productId: string) => void;
  clearSaved: () => void;
  // Stock validation
  validateStock: () => Promise<StockInfo[]>;
  updateItemStock: (productId: string, stockQuantity: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalPrice: 0,
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId);
          let newItems;
          if (existingItem) {
            newItems = state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            newItems = [...state.items, item];
          }
          const totalPrice = newItems.reduce((total, i) => total + i.price * i.quantity, 0);
          return { items: newItems, totalPrice };
        }),
      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.productId !== productId);
          const totalPrice = newItems.reduce((total, item) => total + item.price * item.quantity, 0);
          return { items: newItems, totalPrice };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const newItems = state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          );
          const totalPrice = newItems.reduce((total, item) => total + item.price * item.quantity, 0);
          return { items: newItems, totalPrice };
        }),
      clearCart: () => set({ items: [], totalPrice: 0 }),
      getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },
      
      // Save for Later functionality
      savedForLater: [],
      saveForLater: (productId) =>
        set((state) => {
          const item = state.items.find((i) => i.productId === productId);
          if (!item) return state;
          
          const savedItem: SavedItem = {
            id: item.id,
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
            savedAt: new Date().toISOString(),
          };
          
          const newItems = state.items.filter((i) => i.productId !== productId);
          const totalPrice = newItems.reduce((total, i) => total + i.price * i.quantity, 0);
          
          return {
            items: newItems,
            totalPrice,
            savedForLater: [...state.savedForLater.filter(s => s.productId !== productId), savedItem],
          };
        }),
      moveToCart: (productId) =>
        set((state) => {
          const savedItem = state.savedForLater.find((s) => s.productId === productId);
          if (!savedItem) return state;
          
          const cartItem: CartItem = {
            id: savedItem.id,
            productId: savedItem.productId,
            name: savedItem.name,
            image: savedItem.image,
            price: savedItem.price,
            quantity: 1,
          };
          
          const existingItem = state.items.find((i) => i.productId === productId);
          let newItems;
          if (existingItem) {
            newItems = state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
            );
          } else {
            newItems = [...state.items, cartItem];
          }
          
          const totalPrice = newItems.reduce((total, i) => total + i.price * i.quantity, 0);
          
          return {
            items: newItems,
            totalPrice,
            savedForLater: state.savedForLater.filter((s) => s.productId !== productId),
          };
        }),
      removeSaved: (productId) =>
        set((state) => ({
          savedForLater: state.savedForLater.filter((s) => s.productId !== productId),
        })),
      clearSaved: () => set({ savedForLater: [] }),
      
      // Stock validation
      stockValidating: false,
      stockErrors: [],
      validateStock: async () => {
        const state = get();
        if (state.items.length === 0) return [];
        
        set({ stockValidating: true, stockErrors: [] });
        
        try {
          const productIds = state.items.map((i) => i.productId);
          const stockResults: StockInfo[] = [];
          const errors: string[] = [];
          
          // Fetch stock for each product
          for (const productId of productIds) {
            try {
              const response = await api.get(`/products/id/${productId}`);
              const product = response.data.data;
              const cartItem = state.items.find((i) => i.productId === productId);
              
              const stockInfo: StockInfo = {
                productId,
                stockQuantity: product.stockQuantity || 0,
                isAvailable: product.stockQuantity >= (cartItem?.quantity || 0),
              };
              
              stockResults.push(stockInfo);
              
              // Update cart item with stock info
              if (cartItem) {
                get().updateItemStock(productId, product.stockQuantity);
              }
              
              if (!stockInfo.isAvailable) {
                if (product.stockQuantity === 0) {
                  errors.push(`${product.name} is out of stock`);
                } else {
                  errors.push(`Only ${product.stockQuantity} ${product.name} available (you have ${cartItem?.quantity})`);
                }
              }
            } catch {
              // Product might be deleted
              errors.push(`Product not available`);
            }
          }
          
          set({ stockValidating: false, stockErrors: errors });
          return stockResults;
        } catch {
          set({ stockValidating: false });
          return [];
        }
      },
      updateItemStock: (productId, stockQuantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, stockQuantity, isOutOfStock: stockQuantity === 0 }
              : item
          ),
        })),
    }),
    {
      name: 'ora-cart',
      partialize: (state) => ({
        items: state.items,
        savedForLater: state.savedForLater,
        totalPrice: state.totalPrice,
      }),
    }
  )
);
