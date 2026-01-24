'use client';

import api from '@/lib/api';
import { create } from 'zustand';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  stockQuantity: number;
  isActive: boolean;
  category?: {
    name: string;
  };
  images?: Array<{
    imageUrl: string;
    isPrimary: boolean;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AdminStore {
  // Dashboard Stats
  stats: DashboardStats | null;
  statsLoading: boolean;

  // Orders
  orders: AdminOrder[];
  ordersLoading: boolean;
  ordersPagination: PaginationInfo;

  // Products
  products: AdminProduct[];
  productsLoading: boolean;
  productsPagination: PaginationInfo;

  // Low Stock Products
  lowStockProducts: AdminProduct[];
  lowStockLoading: boolean;

  // Error
  error: string | null;

  // Actions
  fetchDashboardStats: () => Promise<void>;
  fetchOrders: (page?: number, status?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, trackingNumber?: string) => Promise<boolean>;
  fetchProducts: (page?: number) => Promise<void>;
  fetchLowStockProducts: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  stats: null,
  statsLoading: false,
  orders: [],
  ordersLoading: false,
  ordersPagination: DEFAULT_PAGINATION,
  products: [],
  productsLoading: false,
  productsPagination: DEFAULT_PAGINATION,
  lowStockProducts: [],
  lowStockLoading: false,
  error: null,

  fetchDashboardStats: async () => {
    try {
      set({ statsLoading: true, error: null });
      const response = await api.get('/admin/dashboard/stats');
      set({ stats: response.data.data, statsLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch dashboard stats',
        statsLoading: false,
      });
    }
  },

  fetchOrders: async (page = 1, status) => {
    try {
      set({ ordersLoading: true, error: null });
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;

      const response = await api.get('/admin/orders', { params });
      const { orders, pagination } = response.data.data;

      set({
        orders,
        ordersPagination: pagination,
        ordersLoading: false,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch orders',
        ordersLoading: false,
      });
    }
  },

  updateOrderStatus: async (orderId, status, trackingNumber) => {
    try {
      set({ error: null });
      await api.put(`/admin/orders/${orderId}/status`, {
        status,
        trackingNumber,
      });

      // Update local state
      const orders = get().orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      );
      set({ orders });
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to update order status',
      });
      return false;
    }
  },

  fetchProducts: async (page = 1) => {
    try {
      set({ productsLoading: true, error: null });
      const response = await api.get('/products', {
        params: { page, limit: 20 },
      });
      const { products, pagination } = response.data.data;

      set({
        products,
        productsPagination: pagination,
        productsLoading: false,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch products',
        productsLoading: false,
      });
    }
  },

  fetchLowStockProducts: async () => {
    try {
      set({ lowStockLoading: true, error: null });
      const response = await api.get('/admin/inventory/low-stock');
      const products = response.data.data || [];
      set({ lowStockProducts: products, lowStockLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch low stock products',
        lowStockLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
