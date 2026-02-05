'use client';

import { useAuth } from '@/context/AuthContext';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OrderStats {
  total: number;
  pending: number;
  delivered: number;
}

interface UserProfile {
  name: string;
  phone: string;
  memberSince: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const authStore = useAuthStore();
  const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, pending: 0, delivered: 0 });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [authCheckDone, setAuthCheckDone] = useState(false);

  useEffect(() => {
    console.log('[AccountPage] Auth state:', { isLoading, isAuthenticated, userEmail: user?.email });
    
    if (!isLoading) {
      setAuthCheckDone(true);
      
      // Delay the redirect check slightly to ensure auth state is fully propagated
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          console.log('[AccountPage] ❌ Not authenticated, redirecting to login');
          router.replace('/auth/login');
        } else {
          console.log('[AccountPage] ✅ Authenticated, user:', user?.email);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch order stats from API
      fetchOrderStats();
      // Set profile info
      const displayName = user.fullName || 
                          (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                          user.firstName ||
                          user.email?.split('@')[0] || 
                          'Customer';
      setProfile({
        name: displayName,
        phone: user.phone || 'Not added',
        memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      });
    }
  }, [isAuthenticated, user]);

  const fetchOrderStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ora_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || data.data || [];
        setOrderStats({
          total: orders.length,
          pending: orders.filter((o: any) => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
          delivered: orders.filter((o: any) => o.status === 'DELIVERED').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    logout();
    // CRITICAL: Also update AuthStore for Header to detect logout
    authStore.logout();
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Welcome Header */}
        <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl p-6 md:p-8 mb-6 md:mb-8 border border-rose-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl md:text-3xl font-serif font-bold shadow-lg">
                {(profile?.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
                  Hello, {profile?.name || 'there'}! 👋
                </h1>
                <p className="text-gray-600 text-sm md:text-base">{user.email}</p>
                <p className="text-gray-500 text-xs mt-1">Member since {profile?.memberSince}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/account/profile"
                className="px-4 py-2.5 rounded-xl border-2 border-rose-200 text-rose-600 font-medium 
                           hover:bg-rose-50 hover:border-rose-300 transition-all text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium 
                           hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Link href="/account/orders" className="block group">
            <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-lg p-5 md:p-6 border border-rose-100 hover:shadow-2xl hover:border-rose-200 transition-all group-hover:scale-[1.02] transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total Orders</p>
                  <p className="text-3xl md:text-4xl font-bold text-rose-600">
                    {loadingStats ? '...' : orderStats.total}
                  </p>
                </div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-rose-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/account/orders?status=pending" className="block group">
            <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-lg p-5 md:p-6 border border-amber-100 hover:shadow-2xl hover:border-amber-200 transition-all group-hover:scale-[1.02] transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">In Progress</p>
                  <p className="text-3xl md:text-4xl font-bold text-amber-600">
                    {loadingStats ? '...' : orderStats.pending}
                  </p>
                </div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/account/orders?status=delivered" className="block group">
            <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-lg p-5 md:p-6 border border-emerald-100 hover:shadow-2xl hover:border-emerald-200 transition-all group-hover:scale-[1.02] transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Delivered</p>
                  <p className="text-3xl md:text-4xl font-bold text-emerald-600">
                    {loadingStats ? '...' : orderStats.delivered}
                  </p>
                </div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Account Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Main Navigation */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-xl p-6 md:p-8 border border-rose-100">
              <h2 className="font-serif text-xl md:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">📱</span> My Account
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Orders */}
                <Link 
                  href="/account/orders"
                  className="p-5 md:p-6 rounded-2xl border-2 border-rose-100 hover:border-rose-300 hover:bg-rose-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">My Orders</p>
                      <p className="text-sm text-gray-500">Track, return, or buy again</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Wishlist */}
                <Link 
                  href="/wishlist"
                  className="p-5 md:p-6 rounded-2xl border-2 border-pink-100 hover:border-pink-300 hover:bg-pink-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Wishlist</p>
                      <p className="text-sm text-gray-500">Your saved items</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Addresses */}
                <Link 
                  href="/account/addresses"
                  className="p-5 md:p-6 rounded-2xl border-2 border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Addresses</p>
                      <p className="text-sm text-gray-500">Manage delivery addresses</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Profile Settings */}
                <Link 
                  href="/account/profile"
                  className="p-5 md:p-6 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Profile Settings</p>
                      <p className="text-sm text-gray-500">Name, email, phone</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Payment Methods */}
                <Link 
                  href="/account/payments"
                  className="p-5 md:p-6 rounded-2xl border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Payment Methods</p>
                      <p className="text-sm text-gray-500">Saved cards & UPI</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Coupons & Offers */}
                <Link 
                  href="/account/coupons"
                  className="p-5 md:p-6 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Coupons & Offers</p>
                      <p className="text-sm text-gray-500">Available discounts</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-xl p-6 border border-rose-100">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🔗</span> Quick Links
              </h3>
              <div className="space-y-2">
                <Link href="/products" className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors group">
                  <span className="text-lg">🛍️</span>
                  <span className="text-gray-700 group-hover:text-rose-600 transition-colors">Continue Shopping</span>
                </Link>
                <Link href="/cart" className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors group">
                  <span className="text-lg">🛒</span>
                  <span className="text-gray-700 group-hover:text-rose-600 transition-colors">View Cart</span>
                </Link>
                <Link href="/track-order" className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors group">
                  <span className="text-lg">📦</span>
                  <span className="text-gray-700 group-hover:text-rose-600 transition-colors">Track Order</span>
                </Link>
                <Link href="/contact" className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors group">
                  <span className="text-lg">💬</span>
                  <span className="text-gray-700 group-hover:text-rose-600 transition-colors">Contact Support</span>
                </Link>
              </div>
            </div>

            {/* Help Center */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl shadow-xl p-6 text-white">
              <h3 className="font-serif text-lg font-semibold mb-2">Need Help?</h3>
              <p className="text-rose-100 text-sm mb-4">Our support team is available 24/7 to assist you.</p>
              <Link 
                href="/help"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-sm font-medium backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Visit Help Center
              </Link>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-rose-100 text-xs">📞 Call: 1800-123-4567</p>
                <p className="text-rose-100 text-xs">✉️ Email: support@orajewellery.com</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
