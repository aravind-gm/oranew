'use client';

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

// Subscribe function for useSyncExternalStore to detect client-side hydration
const emptySubscribe = () => () => {};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuthStore();
  const { items } = useCartStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // Hide menu bar on admin v2 pages
  const isAdminPage = pathname?.startsWith('/admin/v2');
  
  // Use useSyncExternalStore to safely handle hydration
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle scroll behavior - hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only trigger hide/show for scrolls larger than threshold
      if (Math.abs(currentScrollY - lastScrollY) < 5) {
        return;
      }

      // Scrolling down - hide header
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } 
      // Scrolling up - show header
      else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Prevent hydration mismatch by using consistent values during SSR
  // User data comes from /api/auth/me, not from localStorage
  const isLoggedIn = mounted && !loading && !!user;
  const isAdmin = mounted && !loading && user?.role === 'ADMIN';
  const cartCount = mounted ? items.length : 0;

  const menuItems = [
    { label: 'Shop All', href: '/collections' },
    { label: 'Combos for Her', href: '/collections/combos' },
    { label: 'Gifts for Her', href: '/collections/gifts-for-her' },
    { label: 'Tumblers', href: '/collections/tumblers' },
    { label: 'About', href: '/about-ora' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header 
      className="sticky top-0 z-[1000] w-full bg-white"
      style={{
        willChange: 'transform',
        transition: 'transform 0.3s ease-in-out',
        transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)'
      }}
    >
      {/* Main Header */}
      <div className="bg-white border-b border-neutral-100 px-4 lg:px-6 relative">
        <div className="max-w-7xl mx-auto flex items-center h-16 lg:h-[72px] gap-4 lg:gap-8">

          {/* Logo — left, fixed width */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/oralogo.png"
              alt="ORA Jewellery"
              width={819}
              height={345}
              className="block object-contain"
              style={{ width: '130px', height: 'auto' }}
              priority
            />
          </Link>

          {/* Search Bar — center, expands to fill space */}
          <div className="hidden md:flex flex-1">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="search"
                placeholder="Search jewellery, tumblers & more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-5 pr-12 border border-neutral-200 rounded-full bg-neutral-50 text-neutral-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-oraAccent transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Mobile Search */}
            <Link
              href="/search"
              className="md:hidden text-neutral-900 hover:text-oraAccent transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="text-neutral-900 hover:text-oraAccent transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="text-neutral-900 hover:text-oraAccent transition-colors p-2 relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-oraAccent text-white rounded-full text-xs flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-neutral-900 hover:text-oraAccent transition-colors p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {/* TODO: REMOVE BEFORE PRODUCTION - Admin badge */}
                  {process.env.NODE_ENV !== 'production' && user?.role === 'admin' && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">ADMIN</span>
                  )}
                </button>
                <div className="hidden group-hover:block absolute right-0 top-full pt-2 z-[9999] origin-top-right">
                  <div className="bg-white rounded-lg shadow-2xl border border-neutral-200 py-2 min-w-[160px] w-max">
                    <Link href="/account" className="block px-4 py-2.5 text-sm text-neutral-900 hover:bg-oraLight/40 transition-colors whitespace-nowrap">My Account</Link>
                    <Link href="/account/orders" className="block px-4 py-2.5 text-sm text-neutral-900 hover:bg-oraLight/40 transition-colors whitespace-nowrap">Orders</Link>
                    {isAdmin && <Link href="/admin/v2" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-oraLight/40 transition-colors whitespace-nowrap">Admin</Link>}
                    <div className="border-t border-neutral-100 my-1" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap">Sign Out</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/auth/login" className="bg-oraAccent text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors">
                  Login / Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Login Button (show when logged out) */}
            {!isLoggedIn && (
              <Link
                href="/auth/login"
                className="md:hidden text-neutral-900 hover:text-oraAccent transition-colors p-2"
                title="Login"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-neutral-900 hover:text-oraAccent transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Bar - Pink Luxury (hidden on admin v2 pages, desktop only) */}
      {!isAdminPage && (
      <nav className="bg-oraLight border-b border-oraPink/30 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Desktop Menu */}
          <div className="flex items-center h-12 space-x-8">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={`relative text-sm font-medium transition-colors px-3 py-2 rounded-md hover:bg-oraLight/60 ${
                  isActive ? 'text-oraAccent font-semibold' : 'text-neutral-900 hover:text-oraAccent'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-oraAccent"></span>
                )}
              </Link>
            );})}
          </div>
        </div>
      </nav>
      )}

      {/* Accent line — pink/coral gradient (desktop only) */}
      {!isAdminPage && (
        <div className="h-[3px] w-full bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300 hidden md:block" />
      )}

      {/* Mobile Menu Overlay - Full-screen slide-down */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/30 z-[998]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-[999] max-h-[85vh] overflow-y-auto shadow-2xl" style={{ animation: 'slideDown 0.25s ease-out' }}>
            {/* Header with close button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Image
                  src="/oralogo.png"
                  alt="ORA"
                  width={819}
                  height={345}
                  className="block object-contain"
                  style={{ width: '100px', height: 'auto' }}
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-neutral-50">
              <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative">
                <input
                  type="search"
                  placeholder="Search jewellery, tumblers & more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 border border-neutral-200 rounded-full bg-neutral-50 text-neutral-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Navigation Links */}
            <div className="px-3 py-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors ${
                      isActive 
                        ? 'bg-oraLight text-oraAccent' 
                        : 'text-neutral-800 active:bg-neutral-50'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-oraAccent" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-neutral-100" />

            {/* Auth Section */}
            <div className="px-3 py-3 pb-6">
              {isLoggedIn ? (
                <>
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-neutral-800 active:bg-neutral-50 transition-colors">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    My Account
                  </Link>
                  <Link href="/account/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-neutral-800 active:bg-neutral-50 transition-colors">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    Orders
                  </Link>
                  {isAdmin && (
                    <Link href="/admin/v2" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-neutral-600 active:bg-neutral-50 transition-colors">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Admin Panel
                    </Link>
                  )}
                  <button 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-[15px] font-medium text-red-500 active:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/login" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex items-center justify-center gap-2 mx-2 py-3.5 bg-oraAccent text-white rounded-xl text-[15px] font-semibold active:opacity-90 transition-all"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Slide-down animation */}
      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
