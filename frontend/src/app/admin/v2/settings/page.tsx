'use client';

/**
 * ORA Admin Panel - Settings Page
 * ================================
 * 
 * Store settings, payment configuration,
 * shipping rules, taxes, and user management
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Card, Input, Select, Textarea, Checkbox, Badge, Spinner, Alert } from '../components/ui';
import {
  Store,
  CreditCard,
  Truck,
  Receipt,
  Users,
  Shield,
  Bell,
  Mail,
  Globe,
  Palette,
  Key,
  Lock,
  ChevronRight,
  Save,
  Settings as SettingsIcon,
  Smartphone,
  Share2,
  FileText,
  HelpCircle,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

// ============================================
// SETTINGS PAGE
// ============================================

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('store');

  const sections: SettingsSection[] = [
    {
      id: 'store',
      title: 'Store Details',
      description: 'Business name, address, contact info',
      icon: Store,
      href: '/admin/v2/settings/store',
    },
    {
      id: 'payments',
      title: 'Payments',
      description: 'Payment gateways and methods',
      icon: CreditCard,
      href: '/admin/v2/settings/payments',
    },
    {
      id: 'shipping',
      title: 'Shipping',
      description: 'Shipping zones and rates',
      icon: Truck,
      href: '/admin/v2/settings/shipping',
    },
    {
      id: 'taxes',
      title: 'Taxes',
      description: 'Tax rates and GST settings',
      icon: Receipt,
      href: '/admin/v2/settings/taxes',
    },
    {
      id: 'users',
      title: 'Users & Permissions',
      description: 'Staff accounts and roles',
      icon: Users,
      href: '/admin/v2/settings/users',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Email and SMS settings',
      icon: Bell,
      href: '/admin/v2/settings/notifications',
    },
    {
      id: 'seo',
      title: 'SEO & Social',
      description: 'Meta tags and social sharing',
      icon: Globe,
      href: '/admin/v2/settings/seo',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Theme and branding',
      icon: Palette,
      href: '/admin/v2/settings/appearance',
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Password and 2FA settings',
      icon: Shield,
      href: '/admin/v2/settings/security',
    },
    {
      id: 'api',
      title: 'API & Integrations',
      description: 'API keys and third-party apps',
      icon: Key,
      href: '/admin/v2/settings/api',
      badge: 'Developer',
    },
    {
      id: 'legal',
      title: 'Legal Pages',
      description: 'Privacy, terms, refund policies',
      icon: FileText,
      href: '/admin/v2/settings/legal',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Settings"
          description="Manage your store configuration"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Settings' },
          ]}
        />

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Link key={section.id} href={section.href}>
              <Card className="hover:border-[#d4af37] cursor-pointer transition-all hover:shadow-md h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#fde8b3] rounded-xl flex items-center justify-center flex-shrink-0">
                    <section.icon size={24} className="text-[#b8962e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#111827]">{section.title}</h3>
                      {section.badge && (
                        <Badge variant="secondary" size="sm">{section.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#9ca3af] mt-1">{section.description}</p>
                  </div>
                  <ChevronRight size={20} className="text-[#9ca3af] flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <h3 className="font-semibold text-[#111827] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="secondary" leftIcon={<Truck size={18} />} className="justify-start">
              Add Shipping Zone
            </Button>
            <Button variant="secondary" leftIcon={<Users size={18} />} className="justify-start">
              Invite Staff
            </Button>
            <Button variant="secondary" leftIcon={<Key size={18} />} className="justify-start">
              Generate API Key
            </Button>
            <Button variant="secondary" leftIcon={<HelpCircle size={18} />} className="justify-start">
              Get Help
            </Button>
          </div>
        </Card>

        {/* Account Info */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#fde8b3] rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-[#b8962e]">A</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#111827]">Admin Account</h3>
                <p className="text-sm text-[#9ca3af]">admin@orajewellery.com</p>
              </div>
            </div>
            <Button variant="secondary" leftIcon={<Lock size={18} />}>
              Change Password
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
