'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/* ────────────────────────────────────────────
   ORA — Luxury Account Dashboard
   own. radiate. adorn.
   ──────────────────────────────────────────── */

interface OrderStats {
  total: number;
  pending: number;
  delivered: number;
}

interface AccountDashboardProps {
  user: {
    id: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: string;
    createdAt?: string;
  };
}

/* ── Tiny decorative gold divider ── */
const GoldDivider = () => (
  <div className="flex items-center gap-3 my-1">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
    <svg width="12" height="12" viewBox="0 0 12 12" className="text-gold-400 opacity-60">
      <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="currentColor" />
    </svg>
    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
  </div>
);

export default function AccountDashboard({ user }: AccountDashboardProps) {
  const { logout } = useAuthStore();
  const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, pending: 0, delivered: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const displayName =
    user.fullName ||
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
    user.firstName ||
    user.email?.split('@')[0] ||
    'Customer';

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    fetchOrderStats();
  }, []);

  const fetchOrderStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/orders`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || data.data || [];
        setOrderStats({
          total: orders.length,
          pending: orders.filter((o: any) =>
            ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status),
          ).length,
          delivered: orders.filter((o: any) => o.status === 'DELIVERED').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  /* ── Navigation items ── */
  const navItems = [
    {
      href: '/account/orders',
      label: 'Orders',
      sub: 'Track, return, or buy again',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      sub: 'Your curated collection',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    {
      href: '/account/addresses',
      label: 'Addresses',
      sub: 'Manage delivery addresses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      href: '/account/profile',
      label: 'Profile',
      sub: 'Personal details & preferences',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      href: '/account/payments',
      label: 'Payments',
      sub: 'Saved cards & UPI',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
    },
    {
      href: '/account/coupons',
      label: 'Coupons & Offers',
      sub: 'Exclusive discounts for you',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
  ];

  /* ── Quick‑link items ── */
  const quickLinks = [
    {
      href: '/products',
      label: 'Continue Shopping',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
        </svg>
      ),
    },
    {
      href: '/cart',
      label: 'View Cart',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      ),
    },
    {
      href: '/track-order',
      label: 'Track Order',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
    {
      href: '/contact',
      label: 'Contact Concierge',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF2F5]/50 via-[#FDFBF7] to-[#F9F5EB]/30] relative">
      {/* ── Animated top gold accent line ── */}
      <div className="h-[3px] bg-gradient-to-r from-[#E75480]/60 via-[#C6A85B] to-[#E75480]/60" style={{ backgroundSize: '200% 100%', animation: 'goldShimmer 3s ease infinite' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* ════════════════════════════════════
            HERO · Welcome
            ════════════════════════════════════ */}
        <header className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            {/* Avatar + Greeting */}
            <div className="flex items-center gap-5 md:gap-6">
              {/* Monogram ring */}
              <div className="relative shrink-0">
                <div className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full border-[2px] border-[#E75480]/30 flex items-center justify-center bg-gradient-to-br from-[#FDECEF] to-[#FDF2F5] shadow-lg shadow-[#F6C1CF]/20">
                  <span className="font-serif text-2xl md:text-3xl font-semibold tracking-wide bg-gradient-to-br from-[#E75480] to-[#C6A85B] bg-clip-text text-transparent">
                    {initials}
                  </span>
                </div>
                {/* Animated dot indicator */}
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gradient-to-br from-[#E75480] to-[#C6A85B] ring-[2.5px] ring-white shadow-sm" style={{ animation: 'pulse-slow 2s infinite' }} />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400 font-medium mb-1">
                  Welcome back
                </p>
                <h1 className="font-serif text-3xl md:text-4xl font-semibold text-neutral-900 leading-tight">
                  {displayName}
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  {user.email}
                  <span className="mx-2 text-neutral-200">|</span>
                  Member since {memberSince}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/account/profile"
                className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-neutral-700
                           border border-neutral-200 rounded-full hover:border-gold-400 hover:text-gold-600 transition-all duration-300"
              >
                <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-neutral-500
                           rounded-full hover:text-red-500 hover:bg-red-50 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          <div className="mt-8">
            <GoldDivider />
          </div>
        </header>

        {/* ════════════════════════════════════
            STATS · Order summary ribbon
            ════════════════════════════════════ */}
        <section className="mb-12 md:mb-16">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {[
              { label: 'Total Orders', value: orderStats.total, href: '/account/orders', gradient: 'from-[#FDECEF] to-[#FDF2F5]', border: 'border-[#E75480]/10', color: 'text-[#E75480]', icon: '📦' },
              { label: 'In Progress', value: orderStats.pending, href: '/account/orders?status=pending', gradient: 'from-[#FDF2F5] to-[#F9F5EB]', border: 'border-[#C6A85B]/10', color: 'text-[#C6A85B]', icon: '🚚' },
              { label: 'Delivered', value: orderStats.delivered, href: '/account/orders?status=delivered', gradient: 'from-[#ecfdf5] to-[#d1fae5]', border: 'border-emerald-100', color: 'text-emerald-500', icon: '✅' },
            ].map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group text-center py-6 md:py-8 rounded-2xl bg-gradient-to-br ${stat.gradient} border ${stat.border} hover:shadow-lg hover:scale-[1.02] transition-all duration-300`}
              >
                <span className="text-xl md:text-2xl block mb-2">{stat.icon}</span>
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-medium mb-2">
                  {stat.label}
                </p>
                <p className={`font-serif text-3xl md:text-4xl font-semibold ${stat.color} transition-colors duration-300`}>
                  {loadingStats ? (
                    <span className="inline-block w-8 h-8 rounded bg-neutral-100 animate-pulse" />
                  ) : (
                    String(stat.value).padStart(2, '0')
                  )}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════
            MAIN GRID · Navigation + Sidebar
            ════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* ── Navigation list ── */}
          <div className="lg:col-span-7">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-gold-500 font-medium mb-6">
              Your Account
            </h2>

            <div className="border border-[#E75480]/[0.08] rounded-2xl overflow-hidden divide-y divide-[#F6C1CF]/20 bg-white shadow-sm">
              {navItems.map((item, idx) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-5 px-6 py-5 hover:bg-gradient-to-r hover:from-[#FDECEF]/50 hover:to-transparent transition-all duration-300"
                >
                  {/* Icon */}
                  <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${idx % 2 === 0 
                      ? 'bg-gradient-to-br from-[#FDECEF] to-[#FDF2F5] text-[#E75480] border border-[#E75480]/10 group-hover:shadow-md group-hover:shadow-[#E75480]/10' 
                      : 'bg-gradient-to-br from-[#F9F5EB] to-[#FDF2F5] text-[#C6A85B] border border-[#C6A85B]/10 group-hover:shadow-md group-hover:shadow-[#C6A85B]/10'
                    }`}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-neutral-800 group-hover:text-neutral-900 transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{item.sub}</p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-neutral-300 group-hover:text-gold-400 group-hover:translate-x-1 transition-all duration-300"
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-5 space-y-8">

            {/* Quick Links */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-primary-400 font-medium mb-5">
                Quick Links
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((ql) => (
                  <Link
                    key={ql.href}
                    href={ql.href}
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#E75480]/[0.08] bg-white
                               hover:border-[#E75480]/20 hover:bg-gradient-to-r hover:from-[#FDECEF]/50 hover:to-[#FDF2F5]/30 hover:shadow-sm transition-all duration-300"
                  >
                    <span className="text-primary-300 group-hover:text-primary-500 transition-colors duration-300">
                      {ql.icon}
                    </span>
                    <span className="text-sm text-neutral-600 group-hover:text-primary-600 transition-colors duration-300">
                      {ql.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Concierge card (dark luxury) ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] p-7 md:p-8 border border-[#C6A85B]/10 shadow-xl">
              {/* Decorative corner element */}
              <div className="absolute top-0 right-0 w-28 h-28 opacity-[0.04]">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <circle cx="80" cy="20" r="60" stroke="white" strokeWidth="0.5" />
                  <circle cx="80" cy="20" r="40" stroke="white" strokeWidth="0.5" />
                  <circle cx="80" cy="20" r="20" stroke="white" strokeWidth="0.5" />
                </svg>
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400 font-medium">
                    ORA Concierge
                  </p>
                </div>

                <h3 className="font-serif text-xl md:text-2xl font-semibold text-white mb-2 leading-snug">
                  Need Assistance?
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                  Our jewellery consultants are here to help you with sizing, care, or any queries.
                </p>

                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
                             bg-gold-400 text-neutral-900 hover:bg-gold-300 transition-colors duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  Visit Help Centre
                </Link>

                {/* Contact details */}
                <div className="mt-6 pt-5 border-t border-neutral-700/60 space-y-2.5">
                  <a href="tel:9842253984" className="flex items-center gap-2.5 text-neutral-400 hover:text-gold-400 transition-colors text-sm">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    9842253984
                  </a>
                  <a href="tel:9095007887" className="flex items-center gap-2.5 text-neutral-400 hover:text-gold-400 transition-colors text-sm">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    9095007887
                  </a>
                  <a href="tel:9342865987" className="flex items-center gap-2.5 text-neutral-400 hover:text-gold-400 transition-colors text-sm">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    9342865987
                  </a>
                  <a href="mailto:admin@orashop.in" className="flex items-center gap-2.5 text-neutral-400 hover:text-gold-400 transition-colors text-sm">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    admin@orashop.in
                  </a>
                </div>
              </div>
            </div>

            {/* ── Continue shopping CTA ── */}
            <Link
              href="/products"
              className="group flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-primary-200 bg-white
                         text-primary-500 hover:bg-primary-50 hover:border-primary-300 transition-all duration-300"
            >
              <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span className="text-sm font-medium tracking-wide">Explore New Arrivals</span>
            </Link>

          </aside>
        </div>

        {/* ── Footer divider ── */}
        <div className="mt-16">
          <GoldDivider />
          <p className="text-center text-[11px] uppercase tracking-[0.3em] text-neutral-300 mt-4 font-medium">
            own · radiate · adorn
          </p>
        </div>

      </div>
    </div>
  );
}
