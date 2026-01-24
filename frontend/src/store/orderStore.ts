import api from '@/lib/api';
import { create } from 'zustand';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
}

interface Address {
  id: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
}

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  subtotal: number;
  gstAmount?: number;
  shippingCharge?: number;
  discount?: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelReason?: string;
  items: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  payments?: Payment[];
}

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchOrders: () => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  requestReturn: (orderId: string, reason: string, description: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  ...initialState,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        set({ 
          orders: response.data.data || response.data.orders || [],
          loading: false 
        });
      } else {
        set({ error: 'Failed to fetch orders', loading: false });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch orders';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/orders/${orderId}`);
      if (response.data.success) {
        set({ 
          currentOrder: response.data.data || response.data.order,
          loading: false 
        });
      } else {
        set({ error: 'Order not found', loading: false });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch order';
      set({ error: errorMsg, loading: false, currentOrder: null });
      throw error;
    }
  },

  cancelOrder: async (orderId: string, reason: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      if (response.data.success) {
        const updatedOrder = response.data.data || response.data.order;
        
        // Update orders list
        set(state => ({
          orders: state.orders.map(order => 
            order.id === orderId ? { ...order, ...updatedOrder } : order
          ),
          currentOrder: state.currentOrder?.id === orderId 
            ? { ...state.currentOrder, ...updatedOrder }
            : state.currentOrder,
          loading: false
        }));
      } else {
        set({ error: 'Failed to cancel order', loading: false });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to cancel order';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  requestReturn: async (orderId: string, reason: string, description: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/orders/${orderId}/return`, { 
        reason, 
        description 
      });
      
      if (response.data.success) {
        // Refresh the order to get updated status
        await get().fetchOrderById(orderId);
        set({ loading: false });
      } else {
        set({ error: 'Failed to request return', loading: false });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to request return';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
