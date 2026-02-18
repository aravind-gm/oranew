'use client';

import api from '@/lib/api';
import { create } from 'zustand';

// ============================================
// TYPES
// ============================================

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  lowStockCount: number;
  monthRevenue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  trackingNumber?: string;
  courierName?: string;
  user: {
    fullName: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product?: {
      name: string;
      images?: Array<{ imageUrl: string; isPrimary: boolean }>;
    };
  }>;
  shippingAddress?: {
    fullName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
  }>;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  finalPrice: number;
  discountPercent: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  deletedAt: string | null;
  category?: {
    id: string;
    name: string;
  };
  images?: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  createdAt: string;
}

interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  isVerified: boolean;
  orders: Array<{ id: string; totalAmount: number; status: string }>;
  totalOrders: number;
  totalSpent: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface OrderStatusReport {
  orderStats: Record<string, { count: number; revenue: number }>;
  totalOrders: number;
  totalRevenue: number;
}

interface RevenueReport {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  chartData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

interface PaymentReport {
  payments: Array<{
    id: string;
    orderId: string;
    amount: number;
    method: string;
    status: string;
    transactionId?: string;
    order?: {
      orderNumber: string;
      user?: { fullName: string; email: string };
    };
  }>;
  stats: Record<string, { count: number; amount: number }>;
  pagination: PaginationInfo;
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

  // Customers
  customers: AdminCustomer[];
  customersLoading: boolean;
  customersPagination: PaginationInfo;

  // Low Stock Products
  lowStockProducts: AdminProduct[];
  lowStockLoading: boolean;

  // Reports / Analytics
  orderStatusReport: OrderStatusReport | null;
  orderStatusReportLoading: boolean;
  revenueReport: RevenueReport | null;
  revenueReportLoading: boolean;
  paymentReport: PaymentReport | null;
  paymentReportLoading: boolean;

  // Error
  error: string | null;

  // Actions
  fetchDashboardStats: () => Promise<void>;
  fetchOrders: (page?: number, status?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, trackingNumber?: string) => Promise<boolean>;
  fetchProducts: (page?: number, params?: Record<string, string>) => Promise<void>;
  fetchLowStockProducts: () => Promise<void>;
  fetchCustomers: (page?: number, search?: string) => Promise<void>;
  fetchOrderStatusReport: () => Promise<void>;
  fetchRevenueReport: (period?: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchPaymentReport: (page?: number, status?: string) => Promise<void>;
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
  customers: [],
  customersLoading: false,
  customersPagination: DEFAULT_PAGINATION,
  lowStockProducts: [],
  lowStockLoading: false,
  orderStatusReport: null,
  orderStatusReportLoading: false,
  revenueReport: null,
  revenueReportLoading: false,
  paymentReport: null,
  paymentReportLoading: false,
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
      if (status && status !== 'all') params.status = status.toUpperCase();

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

  fetchProducts: async (page = 1, params = {}) => {
    try {
      set({ productsLoading: true, error: null });
      const response = await api.get('/admin/products', {
        params: { page, limit: 20, ...params },
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

  fetchCustomers: async (page = 1, search) => {
    try {
      set({ customersLoading: true, error: null });
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;

      const response = await api.get('/admin/customers', { params });
      const { customers, pagination } = response.data.data;

      set({
        customers,
        customersPagination: pagination,
        customersLoading: false,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch customers',
        customersLoading: false,
      });
    }
  },

  fetchOrderStatusReport: async () => {
    try {
      set({ orderStatusReportLoading: true, error: null });
      const response = await api.get('/admin/reports/orders');
      set({
        orderStatusReport: response.data.data,
        orderStatusReportLoading: false,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch order status report',
        orderStatusReportLoading: false,
      });
    }
  },

  fetchRevenueReport: async (period = 'daily', startDate, endDate) => {
    try {
      set({ revenueReportLoading: true, error: null });
      const params: Record<string, string> = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/admin/reports/revenue', { params });
      set({
        revenueReport: response.data.data,
        revenueReportLoading: false,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch revenue report',
        revenueReportLoading: false,
      });
    }
  },

  fetchPaymentReport: async (page = 1, status) => {
    try {
      set({ paymentReportLoading: true, error: null });
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status && status !== 'ALL') params.status = status;

      const response = await api.get('/admin/reports/payments', { params });
      set({
        paymentReport: response.data.data,
        paymentReportLoading: false,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch payment report',
        paymentReportLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
