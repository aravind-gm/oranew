'use client';

/**
 * ORA Admin Panel - Admin Layout
 * ==============================
 * 
 * Main layout with sidebar navigation
 * Shopify-inspired enterprise design
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  Image,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Search,
  LogOut,
  Store,
  Tag,
  Gift,
  Ticket,
  FileText,
  Sliders,
  Shield,
  CreditCard,
  Truck,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import '../design-system/admin-theme.css';

// ============================================
// TYPES
// ============================================

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: string | number;
  badgeColor?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  children?: NavSubItem[];
}

interface NavSubItem {
  id: string;
  label: string;
  href: string;
  badge?: string | number;
}

interface AdminLayoutContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarOpen: boolean; // Mobile
  setSidebarOpen: (open: boolean) => void;
}

// ============================================
// CONTEXT
// ============================================

const AdminLayoutContext = createContext<AdminLayoutContextType | null>(null);

export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error('useAdminLayout must be used within AdminLayout');
  }
  return context;
};

// ============================================
// NAVIGATION CONFIG
// ============================================

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/admin/v2',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    children: [
      { id: 'all-products', label: 'All Products', href: '/admin/v2/products' },
      { id: 'add-product', label: 'Add Product', href: '/admin/v2/products/new' },
      { id: 'categories', label: 'Categories', href: '/admin/v2/products/categories' },
      { id: 'inventory', label: 'Inventory', href: '/admin/v2/products/inventory' },
      { id: 'collections', label: 'Collections', href: '/admin/v2/products/collections' },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    badge: 'NEW',
    badgeColor: 'primary',
    children: [
      { id: 'all-orders', label: 'All Orders', href: '/admin/v2/orders' },
      { id: 'pending-orders', label: 'Pending', href: '/admin/v2/orders?status=pending' },
      { id: 'processing', label: 'Processing', href: '/admin/v2/orders?status=processing' },
      { id: 'shipped', label: 'Shipped', href: '/admin/v2/orders?status=shipped' },
      { id: 'returns', label: 'Returns & Refunds', href: '/admin/v2/orders/returns' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    children: [
      { id: 'all-customers', label: 'All Customers', href: '/admin/v2/customers' },
      { id: 'vip-customers', label: 'VIP Customers', href: '/admin/v2/customers?tag=vip' },
      { id: 'segments', label: 'Segments', href: '/admin/v2/customers/segments' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { id: 'campaigns', label: 'Campaigns', href: '/admin/v2/marketing/campaigns' },
      { id: 'discounts', label: 'Discounts', href: '/admin/v2/marketing/discounts' },
      { id: 'coupons', label: 'Coupons', href: '/admin/v2/marketing/coupons' },
      { id: 'email-campaigns', label: 'Email Campaigns', href: '/admin/v2/marketing/emails' },
      { id: 'abandoned-carts', label: 'Abandoned Carts', href: '/admin/v2/marketing/abandoned-carts' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: Image,
    children: [
      { id: 'banners', label: 'Banners', href: '/admin/v2/content/banners' },
      { id: 'hero-sliders', label: 'Hero Sliders', href: '/admin/v2/content/hero-sliders' },
      { id: 'announcements', label: 'Announcements', href: '/admin/v2/content/announcements' },
      { id: 'pages', label: 'Static Pages', href: '/admin/v2/content/pages' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      { id: 'overview', label: 'Overview', href: '/admin/v2/analytics' },
      { id: 'sales-reports', label: 'Sales Reports', href: '/admin/v2/analytics/sales' },
      { id: 'product-reports', label: 'Product Reports', href: '/admin/v2/analytics/products' },
      { id: 'customer-reports', label: 'Customer Reports', href: '/admin/v2/analytics/customers' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { id: 'store-settings', label: 'Store', href: '/admin/v2/settings/store' },
      { id: 'payment', label: 'Payments', href: '/admin/v2/settings/payments' },
      { id: 'shipping', label: 'Shipping', href: '/admin/v2/settings/shipping' },
      { id: 'taxes', label: 'Taxes', href: '/admin/v2/settings/taxes' },
      { id: 'users', label: 'Staff & Permissions', href: '/admin/v2/settings/users' },
    ],
  },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function Sidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['products', 'orders']);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/admin/v2') return pathname === '/admin/v2';
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavItem) => {
    if (item.href) return isActive(item.href);
    return item.children?.some(child => isActive(child.href));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-[#e5e7eb]
          transition-all duration-300 ease-in-out flex flex-col
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[#e5e7eb]">
          <Link href="/admin/v2" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#b8962e] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-[#111827]">ORA Admin</span>
                <span className="text-xs text-[#9ca3af]">Jewellery Store</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItems.includes(item.id);
              const parentActive = isParentActive(item);

              return (
                <li key={item.id}>
                  {item.href ? (
                    // Direct link item
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                        ${parentActive 
                          ? 'bg-[#f7f1d6] text-[#b8962e] font-medium' 
                          : 'text-[#374151] hover:bg-[#f6f7f9] hover:text-[#111827]'
                        }
                      `}
                    >
                      <Icon size={20} className={parentActive ? 'text-[#b8962e]' : ''} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="admin-badge" style={{ 
                              backgroundColor: `var(--admin-${item.badgeColor || 'primary'}-500)`,
                              color: 'white'
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  ) : (
                    // Expandable item
                    <>
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                          ${parentActive 
                            ? 'bg-[#f7f1d6] text-[#b8962e] font-medium' 
                            : 'text-[#374151] hover:bg-[#f6f7f9] hover:text-[#111827]'
                          }
                        `}
                      >
                        <Icon size={20} className={parentActive ? 'text-[#b8962e]' : ''} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left font-medium">{item.label}</span>
                            {item.badge && (
                              <span className="admin-badge mr-2" style={{ 
                                backgroundColor: `var(--admin-${item.badgeColor || 'primary'}-500)`,
                                color: 'white'
                              }}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </>
                        )}
                      </button>

                      {/* Submenu */}
                      {!collapsed && isExpanded && item.children && (
                        <ul className="mt-1 ml-5 pl-4 border-l border-[#e5e7eb] space-y-1">
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={child.href}
                                className={`
                                  block px-3 py-2 rounded-lg text-sm transition-all
                                  ${isActive(child.href)
                                    ? 'bg-[#f7f1d6] text-[#b8962e] font-medium'
                                    : 'text-[#6b7280] hover:bg-[#f6f7f9] hover:text-[#111827]'
                                  }
                                `}
                              >
                                {child.label}
                                {child.badge && (
                                  <span className="ml-2 admin-badge admin-badge-primary text-xs">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e7eb]">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#6b7280] hover:bg-[#f6f7f9] hover:text-[#111827] transition-all"
          >
            <Store size={20} />
            {!collapsed && <span className="text-sm">View Store</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}

// ============================================
// HEADER COMPONENT
// ============================================

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onMobileMenuOpen: () => void;
}

function Header({ sidebarCollapsed, onToggleSidebar, onMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16 bg-white border-b border-[#e5e7eb] shadow-sm
        transition-all duration-300
        ${sidebarCollapsed ? 'left-16' : 'left-64'}
        lg:left-64
      `}
      style={{ left: sidebarCollapsed ? '64px' : '260px' }}
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 rounded-lg hover:bg-[#f6f7f9] transition-colors"
          >
            <Menu size={20} className="text-[#111827]" />
          </button>

          {/* Collapse Button (Desktop) */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-lg hover:bg-[#f6f7f9] transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} className="text-[#111827]" />
            ) : (
              <ChevronLeft size={20} className="text-[#111827]" />
            )}
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-[#f6f7f9] border border-[#e5e7eb] rounded-lg px-3 py-2 w-80">
            <Search size={18} className="text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="bg-transparent border-none outline-none text-sm flex-1 text-[#111827] placeholder:text-[#9ca3af]"
            />
            <kbd className="hidden lg:inline-flex px-2 py-0.5 text-xs text-[#4b5563] bg-white rounded border border-[#e5e7eb]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Help */}
          <button className="p-2 rounded-lg hover:bg-[#f6f7f9] transition-colors">
            <HelpCircle size={20} className="text-[#4b5563]" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-[#f6f7f9] transition-colors relative"
            >
              <Bell size={20} className="text-[#4b5563]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#dc2626] rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#e5e7eb] py-2">
                <div className="px-4 py-2 border-b border-[#e5e7eb]">
                  <h3 className="font-semibold text-[#111827]">Notifications</h3>
                </div>
                <div className="py-4 px-4 text-center text-sm text-[#9ca3af]">
                  No new notifications
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 pl-3 rounded-lg hover:bg-[#f6f7f9] transition-colors"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-[#111827]">
                  {user?.fullName || 'Admin'}
                </p>
                <p className="text-xs text-[#9ca3af]">Administrator</p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#b8962e] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0) || 'A'}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e5e7eb] py-2">
                <div className="px-4 py-3 border-b border-[#e5e7eb]">
                  <p className="font-medium text-[#111827]">{user?.fullName}</p>
                  <p className="text-sm text-[#9ca3af]">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/admin/v2/settings/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#4b5563] hover:bg-[#f6f7f9]"
                  >
                    <Settings size={16} />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#dc2626] hover:bg-[#fef2f2]"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================
// MAIN ADMIN LAYOUT
// ============================================

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, user, isHydrated } = useAuthStore();
  const router = useRouter();

  // Auth check
  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      router.push('/admin/login');
    }
  }, [isHydrated, token, user, router]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const contextValue: AdminLayoutContextType = {
    sidebarCollapsed,
    toggleSidebar,
    sidebarOpen,
    setSidebarOpen,
  };

  // Don't render until auth is verified
  if (!isHydrated || !token || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#fde8b3] border-t-[#d4af37] rounded-full animate-spin" />
          <p className="text-[#9ca3af]">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayoutContext.Provider value={contextValue}>
      <div className="admin-panel" data-admin-theme="light">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onMobileMenuOpen={() => setSidebarOpen(true)}
        />

        {/* Main Content */}
        <main
          className={`
            pt-16 min-h-screen transition-all duration-300 bg-[#f6f7f9]
            ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}
          `}
          style={{ paddingLeft: sidebarCollapsed ? undefined : '260px' }}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </AdminLayoutContext.Provider>
  );
}
