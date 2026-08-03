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
  // Free-gift tracking — rings given as complimentary gifts
  isFreeGift?: boolean;
  // Legacy offer fields (kept for backwards compat)
  isOnOffer?: boolean;
  offerType?: string;
  offerValue?: number;
  offerExpiry?: string;
  offerPrice?: number;
}

interface OfferValidationResult {
  valid: boolean;
  adjustedItems: CartItem[];
  totalDiscount: number;
  messages: string[];
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
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
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
  // Offer validation
  validateOffers: () => Promise<OfferValidationResult>;
  getDiscountedTotal: () => number;
  offerMessages: string[];
  totalDiscount: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
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
          const unavailableProductIds: string[] = [];
          
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
            } catch (error: unknown) {
              const status =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof (error as { response?: { status?: number } }).response?.status === 'number'
                  ? (error as { response?: { status?: number } }).response?.status
                  : undefined;

              // Product was deleted/unpublished; remove it from cart automatically.
              if (status === 404) {
                unavailableProductIds.push(productId);
                errors.push('Some items in your cart are no longer available. Please review your cart.');
              } else {
                errors.push('Product not available');
              }
            }
          }

          if (unavailableProductIds.length > 0) {
            const nextItems = get().items.filter(
              (item) => !unavailableProductIds.includes(item.productId)
            );
            const nextTotalPrice = nextItems.reduce((total, item) => total + item.price * item.quantity, 0);
            set({ items: nextItems, totalPrice: nextTotalPrice });
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

      // Offer validation
      offerMessages: [],
      totalDiscount: 0,

      validateOffers: async () => {
        const state = get();
        if (state.items.length === 0) {
          return { valid: true, adjustedItems: [], totalDiscount: 0, messages: [], bogoApplied: false };
        }

        try {
          const response = await api.post('/offers/validate', {
            items: state.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          });

          const result = response.data;
          const messages: string[] = [];
          let totalDiscount = 0;
          let bogoApplied = false;

          const adjustedItems = state.items.map(item => {
            const validated = result.validatedItems?.find(
              (v: { productId: string }) => v.productId === item.productId
            );

            if (!validated) return item;

            // Check if offer has expired
            if (validated.offerExpired) {
              messages.push(`Offer on "${item.name}" has expired`);
              return { ...item, isOnOffer: false, offerPrice: undefined };
            }

            // Apply valid offer pricing
            if (validated.offerValid && validated.offerPrice !== undefined) {
              const discount = (item.price - validated.offerPrice) * item.quantity;
              totalDiscount += discount;

              if (validated.offerType === 'BOGO') {
                bogoApplied = true;
                messages.push(`BOGO applied: "${item.name}" — cheaper item free!`);
              }

              return {
                ...item,
                offerPrice: validated.offerPrice,
                isOnOffer: true,
                offerType: validated.offerType,
                bogoPartnerId: validated.bogoPartnerId,
              };
            }

            return item;
          });

          set({ offerMessages: messages, totalDiscount });

          return {
            valid: true,
            adjustedItems,
            totalDiscount,
            messages,
            bogoApplied,
          };
        } catch (err) {
          console.error('Offer validation failed:', err);
          return { valid: false, adjustedItems: state.items, totalDiscount: 0, messages: ['Failed to validate offers'], bogoApplied: false };
        }
      },

      getDiscountedTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const price = item.offerPrice ?? item.price;
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'ora-cart',
      onRehydrateStorage: () => {
        return (state) => {
          state?.setHasHydrated(true);
        };
      },
      partialize: (state) => ({
        items: state.items,
        savedForLater: state.savedForLater,
        totalPrice: state.totalPrice,
        totalDiscount: state.totalDiscount,
      }),
    }
  )
);
