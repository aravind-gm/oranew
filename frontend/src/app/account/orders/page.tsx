'use client';

import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { orders, loading, error, fetchOrders } = useOrderStore();

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchOrders();
  }, [token, router, fetchOrders]);

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container-luxury">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-light text-text-primary mb-2">My Orders</h1>
            <p className="text-text-muted">View and manage your order history</p>
          </div>
          <Link 
            href="/account" 
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-background-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Account
          </Link>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="bg-background-white rounded-2xl shadow-luxury overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-text-muted">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-serif text-text-primary mb-2">No orders yet</h2>
              <p className="text-text-muted mb-6">Start shopping to see your orders here</p>
              <Link 
                href="/products" 
                className="btn-primary inline-flex items-center gap-2"
              >
                Continue Shopping
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-left p-5 text-sm font-medium text-text-muted">Order Number</th>
                    <th className="text-left p-5 text-sm font-medium text-text-muted">Date</th>
                    <th className="text-left p-5 text-sm font-medium text-text-muted">Amount</th>
                    <th className="text-left p-5 text-sm font-medium text-text-muted">Status</th>
                    <th className="text-left p-5 text-sm font-medium text-text-muted">Payment</th>
                    <th className="text-right p-5 text-sm font-medium text-text-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-background transition">
                      <td className="p-5">
                        <p className="font-mono text-sm font-medium text-text-primary">
                          {order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}
                        </p>
                      </td>
                      <td className="p-5 text-sm text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-5">
                        <p className="font-semibold text-text-primary">₹{Number(order.totalAmount).toFixed(2)}</p>
                      </td>
                      <td className="p-5">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            order.status === 'DELIVERED'
                              ? 'bg-success/10 text-success'
                              : order.status === 'SHIPPED'
                                ? 'bg-primary/20 text-primary'
                                : order.status === 'PROCESSING'
                                  ? 'bg-accent/20 text-accent'
                                  : order.status === 'PENDING'
                                    ? 'bg-yellow-500/10 text-yellow-600'
                                    : order.status === 'CANCELLED'
                                      ? 'bg-error/10 text-error'
                                      : order.status === 'RETURNED'
                                        ? 'bg-neutral-500/10 text-neutral-600'
                                        : 'bg-border text-text-muted'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-success/10 text-success'
                              : order.paymentStatus === 'PENDING'
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : order.paymentStatus === 'FAILED'
                                  ? 'bg-error/10 text-error'
                                  : 'bg-border text-text-muted'
                          }`}
                        >
                          {order.paymentStatus || 'N/A'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition text-sm font-medium"
                        >
                          View Details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
