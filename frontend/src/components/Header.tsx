'use client';

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useSyncExternalStore, useCallback } from 'react';

// Subscribe function for useSyncExternalStore to detect client-side hydration
const emptySubscribe = () => () => {};

export default function Header() {
  const router = useRouter();
  const { token, user, logout, isHydrated } = useAuthStore();
  const { items } = useCartStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // Refs for click-outside detection
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Use useSyncExternalStore to safely handle hydration
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Ensure component is mounted and auth store is hydrated
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setIsAccountDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Click outside handler for dropdowns
  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Handle account dropdown
    if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
      setIsAccountDropdownOpen(false);
    }
  }, []);

  // Add click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAccountDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

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
        setIsAccountDropdownOpen(false); // Close dropdown on scroll
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Prevent hydration mismatch by using consistent values during SSR
  // Wait for both client-side mount AND auth store hydration
  const isLoggedIn = mounted && isHydrated && token && user;
  const isAdmin = mounted && isHydrated && user?.role === 'ADMIN';
  const cartCount = mounted && isHydrated ? items.length : 0;

  const menuItems = [
    { label: 'Shop All', href: '/collections' },
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Combos for Her', href: '/collections/combos' },
    { label: 'Gifts for Her', href: '/collections/gifts' },
    { label: 'Valentine Gifts', href: '/valentine-drinkware' },
    { label: 'Tumblers', href: '/tumblers' },
    { label: 'Offers', href: '/offers' }
  ];

  return (
    <header 
      className={`sticky top-0 z-[1000] w-full transform transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ willChange: 'transform' }}
    >
      {/* Announcement Bar */}
      <div className="bg-[#FFD6E5] text-center py-2 px-4">
        <p className="text-xs text-[#1A1A1A] font-medium">
          Valentine&apos;s Sale is Live — FLAT 20% OFF
        </p>
      </div>

      {/* Main Header */}
      <div className="bg-[#FFF7FA] border-b border-[#FFE4EC] px-4 lg:px-6 relative overflow-visible">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 lg:h-20 relative overflow-visible">
          {/* Logo - Brand Dominant */}
          <Link href="/" className="flex-shrink-0 group">
            <Image
              src="/oralogo.png"
              alt="ORA Jewellery"
              width={220}
              height={80}
              className="h-10 lg:h-12 w-auto object-contain transition-opacity group-hover:opacity-90"
              style={{ width: 'clamp(150px, 16vw, 220px)' }}
              priority
            />
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="search"
                placeholder="Search pendants, rings, gifts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-4 pr-12 border border-[#FFE4EC] rounded-lg bg-white text-[#1A1A1A] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9B2C46] focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#9B2C46] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-3 lg:gap-5 overflow-visible">
            {/* Mobile Search */}
            <Link
              href="/search"
              className="md:hidden text-[#1A1A1A] hover:text-[#9B2C46] transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="text-[#1A1A1A] hover:text-[#9B2C46] transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="text-[#1A1A1A] hover:text-[#9B2C46] transition-colors p-2 relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#9B2C46] text-white rounded-full text-xs flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu - Fixed Dropdown */}
            {isLoggedIn ? (
              <div className="relative" ref={accountDropdownRef}>
                <button 
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#9B2C46] transition-colors p-2"
                  aria-expanded={isAccountDropdownOpen}
                  aria-haspopup="true"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* Account Dropdown - Fixed positioning */}
                {isAccountDropdownOpen && (
                  <>
                    {/* Invisible overlay to catch clicks */}
                    <div 
                      className="fixed inset-0 z-[9998]" 
                      onClick={() => setIsAccountDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div 
                      className="absolute right-0 top-full mt-2 w-56 z-[9999] origin-top-right animate-in fade-in-0 zoom-in-95 duration-200"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="bg-white rounded-xl shadow-2xl border border-[#FFE4EC] py-2 overflow-hidden">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-[#FFE4EC]">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{user?.fullName || 'User'}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-1">
                          <Link 
                            href="/account" 
                            onClick={() => setIsAccountDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FFF5F8] transition-colors"
                            role="menuitem"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Account
                          </Link>
                          <Link 
                            href="/account/orders" 
                            onClick={() => setIsAccountDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FFF5F8] transition-colors"
                            role="menuitem"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Orders
                          </Link>
                          <Link 
                            href="/wishlist" 
                            onClick={() => setIsAccountDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FFF5F8] transition-colors"
                            role="menuitem"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Wishlist
                          </Link>
                          {isAdmin && (
                            <Link 
                              href="/admin" 
                              onClick={() => setIsAccountDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-[#9B2C46] hover:bg-[#FFF5F8] transition-colors font-medium"
                              role="menuitem"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Admin Panel
                            </Link>
                          )}
                        </div>
                        
                        {/* Sign Out */}
                        <div className="border-t border-[#FFE4EC] pt-1">
                          <button 
                            onClick={handleLogout} 
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            role="menuitem"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/auth/login" className="bg-[#9B2C46] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#7d2338] transition-all shadow-sm hover:shadow-md">
                  Login / Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Login Button (show when logged out) */}
            {!isLoggedIn && (
              <Link
                href="/auth/login"
                className="md:hidden text-[#1A1A1A] hover:text-[#9B2C46] transition-colors p-2"
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
              className="md:hidden text-[#1A1A1A] hover:text-[#9B2C46] transition-colors p-2"
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

      {/* Menu Bar - GIVA Style */}
      <nav className="bg-[#FFE4EC] border-b border-[#FFD6E5]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center h-12 space-x-8">
            {menuItems.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="text-[#1A1A1A] hover:text-[#9B2C46] text-sm font-medium transition-colors hover:underline decoration-2 underline-offset-4"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu - Horizontal Scroll */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto py-3 space-x-6 scrollbar-hide">
              {menuItems.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className="text-[#1A1A1A] hover:text-[#9B2C46] text-sm font-medium whitespace-nowrap transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Full screen slide-in */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-[1000] transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Slide-in Panel */}
          <div 
            ref={mobileMenuRef}
            className="md:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-[1001] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#FFE4EC]">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Image
                  src="/oralogo.png"
                  alt="ORA"
                  width={100}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#FFF5F8] transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Info (if logged in) */}
            {isLoggedIn && (
              <div className="p-4 bg-gradient-to-r from-[#FFF5F8] to-[#FFEBF0] border-b border-[#FFE4EC]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#9B2C46] text-white flex items-center justify-center font-semibold text-lg">
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A1A] truncate">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Search */}
            <div className="p-4 border-b border-[#FFE4EC]">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  placeholder="Search pendants, rings, gifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 border-2 border-[#FFE4EC] rounded-full bg-white text-[#1A1A1A] placeholder-gray-400 text-sm focus:outline-none focus:border-[#9B2C46] transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9B2C46]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Navigation Links */}
            <nav className="py-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop</p>
              {menuItems.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 text-[#1A1A1A] hover:bg-[#FFF5F8] transition-colors"
                >
                  <span className="font-medium">{item.label}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </nav>

            {/* Account Section */}
            <div className="border-t border-[#FFE4EC] py-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
              
              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-[#1A1A1A] hover:bg-[#FFF5F8] transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">My Account</span>
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-[#1A1A1A] hover:bg-[#FFF5F8] transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-medium">My Orders</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-[#1A1A1A] hover:bg-[#FFF5F8] transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium">Wishlist</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-[#9B2C46] hover:bg-[#FFF5F8] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-semibold">Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="px-4 py-4">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full py-3.5 px-4 bg-[#9B2C46] text-white rounded-full text-center font-semibold hover:bg-[#7d2338] transition-all shadow-sm"
                  >
                    Login / Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
