'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchOrders();
  }, [token, router]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED':
        return 'bg-success/10 text-success';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-accent/20 text-accent';
      case 'SHIPPED':
        return 'bg-primary/30 text-text-primary';
      case 'CANCELLED':
        return 'bg-error/10 text-error';
      default:
        return 'bg-border text-text-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/30 via-background-white to-accent/10 py-12">
        <div className="container-luxury">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-text-muted mt-2">Manage your account and view your orders</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 border border-error/30 text-error rounded-xl hover:bg-error/10 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container-luxury py-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-background-white rounded-2xl p-5 shadow-luxury">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">Account</p>
            <p className="font-serif font-semibold text-text-primary truncate">{user.email}</p>
          </div>
          <div className="bg-background-white rounded-2xl p-5 shadow-luxury">
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">Total Orders</p>
            <p className="text-2xl font-serif font-bold text-accent">{orders.length}</p>
          </div>
          <div className="bg-background-white rounded-2xl p-5 shadow-luxury">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">Completed</p>
            <p className="text-2xl font-serif font-bold text-success">
              {orders.filter(o => o.status === 'PAID' || o.status === 'DELIVERED').length}
            </p>
          </div>
          <div className="bg-background-white rounded-2xl p-5 shadow-luxury">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">Member Since</p>
            <p className="font-serif font-semibold text-text-primary">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="bg-background-white rounded-2xl shadow-luxury p-6 sticky top-32">
              <h2 className="font-serif font-semibold text-text-primary mb-4">Quick Links</h2>
              <nav className="space-y-1">
                <Link
                  href="/account"
                  className="flex items-center gap-3 p-3 bg-primary/10 text-accent rounded-xl font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  My Orders
                </Link>
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Addresses
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Wishlist
                </Link>
                <Link
                  href="/products"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Shop
                </Link>
              </nav>

              <div className="mt-6 pt-6 border-t border-border md:hidden">
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="flex items-center gap-2 w-full p-3 text-error rounded-xl hover:bg-error/10 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Recent Orders */}
          <div className="md:col-span-3">
            <div className="bg-background-white rounded-2xl shadow-luxury p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-semibold text-text-primary">Recent Orders</h2>
                {orders.length > 0 && (
                  <Link href="/account/orders" className="text-sm text-accent hover:underline">
                    View All
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-text-muted">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-text-muted mb-4">No orders yet</p>
                  <Link href="/products" className="btn-primary">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-accent/30 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-text-primary mb-1">
                          #{order.id.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-text-muted">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-serif font-bold text-accent">
                          ₹{order.totalAmount.toLocaleString()}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="p-2 hover:bg-primary/10 rounded-lg transition"
                      >
                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
