'use client';

import { useAuthStore } from '@/store/authStore';
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface AccountLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const navItems = [
  { href: '/account', label: 'Dashboard', icon: User },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/settings', label: 'Settings', icon: Settings },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/products', label: 'Shop', icon: ShoppingBag },
];

export default function AccountLayout({ children, title, description }: AccountLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/account') {
      return pathname === '/account';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/30 via-background-white to-accent/10 py-12">
        <div className="container-luxury">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary">
            {title}
          </h1>
          {description && (
            <p className="text-text-muted mt-2">{description}</p>
          )}
        </div>
      </div>

      <div className="container-luxury py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="bg-background-white rounded-2xl shadow-luxury p-6 sticky top-32">
              <h2 className="font-serif font-semibold text-text-primary mb-4">Quick Links</h2>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 p-3 rounded-xl transition ${
                        active
                          ? 'bg-primary/10 text-accent font-medium'
                          : 'hover:bg-primary/5 text-text-primary'
                      }`}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-border">
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="flex items-center gap-2 w-full p-3 text-error rounded-xl hover:bg-error/10 transition"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
