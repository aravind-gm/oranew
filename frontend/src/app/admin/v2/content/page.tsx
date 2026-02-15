'use client';

/**
 * ORA Admin Panel - Content & Banners Page
 * =========================================
 * 
 * Manage homepage banners, hero sliders,
 * announcements, and promotional content
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Card, Badge, Input, Select, Spinner, Alert } from '../components/ui';
import {
  Plus,
  Image,
  Layout,
  Megaphone,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  GripVertical,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Settings,
  Layers,
  ImagePlus,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Banner {
  id: string;
  title: string;
  type: 'hero' | 'promotional' | 'category' | 'announcement';
  imageDesktop?: string;
  imageMobile?: string;
  linkUrl?: string;
  linkText?: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'sale' | 'shipping' | 'custom';
  bgColor: string;
  textColor: string;
  linkUrl?: string;
  linkText?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

// ============================================
// BANNER CARD COMPONENT
// ============================================

const BannerCard = ({
  banner,
  onEdit,
  onToggle,
  onDelete,
  onDuplicate,
}: {
  banner: Banner;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const typeConfig = {
    hero: { label: 'Hero', color: 'primary' },
    promotional: { label: 'Promotional', color: 'gold' },
    category: { label: 'Category', color: 'secondary' },
    announcement: { label: 'Announcement', color: 'success' },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="border border-[var(--admin-border)] rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="relative aspect-[21/9] bg-[var(--admin-bg-secondary)]">
        {banner.imageDesktop ? (
          <img
            src={banner.imageDesktop}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image size={48} className="text-[var(--admin-text-muted)]" />
          </div>
        )}
        
        {/* Status overlay */}
        {!banner.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" size="sm">
              <EyeOff size={12} className="mr-1" />
              Hidden
            </Badge>
          </div>
        )}

        {/* Position badge */}
        <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-1">
          <span className="text-xs font-medium text-white">
            #{banner.position}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={typeConfig[banner.type]?.color as any} size="sm">
            {typeConfig[banner.type]?.label}
          </Badge>
        </div>

        {/* Drag handle */}
        <button className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-lg cursor-grab active:cursor-grabbing">
          <GripVertical size={16} className="text-white" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-[var(--admin-text-primary)] line-clamp-1">{banner.title}</h3>
        </div>
        
        {(banner.startDate || banner.endDate) && (
          <div className="flex items-center gap-1 text-xs text-[var(--admin-text-muted)] mb-3">
            <Calendar size={12} />
            {banner.startDate && formatDate(banner.startDate)}
            {banner.startDate && banner.endDate && ' - '}
            {banner.endDate && formatDate(banner.endDate)}
          </div>
        )}

        {/* Device indicators */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1 text-xs ${banner.imageDesktop ? 'text-[var(--admin-success-600)]' : 'text-[var(--admin-text-muted)]'}`}>
            <Monitor size={14} />
            Desktop
          </div>
          <div className={`flex items-center gap-1 text-xs ${banner.imageMobile ? 'text-[var(--admin-success-600)]' : 'text-[var(--admin-text-muted)]'}`}>
            <Smartphone size={14} />
            Mobile
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit} className="flex-1">
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={banner.isActive ? 'text-[var(--admin-success-600)]' : ''}
          >
            {banner.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            <Copy size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-[var(--admin-error-600)]">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ANNOUNCEMENT BAR PREVIEW
// ============================================

const AnnouncementPreview = ({
  announcement,
  onEdit,
  onToggle,
}: {
  announcement: Announcement;
  onEdit: () => void;
  onToggle: () => void;
}) => {
  return (
    <div className="border border-[var(--admin-border)] rounded-lg overflow-hidden">
      {/* Preview */}
      <div
        className="p-3 text-center text-sm"
        style={{ backgroundColor: announcement.bgColor, color: announcement.textColor }}
      >
        {announcement.message}
        {announcement.linkText && (
          <a href="#" className="ml-2 underline font-medium">
            {announcement.linkText}
          </a>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-3 bg-[var(--admin-bg-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={announcement.isActive ? 'success' : 'secondary'} size="sm">
            {announcement.isActive ? 'Active' : 'Hidden'}
          </Badge>
          <span className="text-xs text-[var(--admin-text-muted)]">
            {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {announcement.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CONTENT PAGE
// ============================================

export default function ContentPage() {
  const router = useRouter();
  
  // State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'banners' | 'announcements'>('banners');
  const [bannerTypeFilter, setBannerTypeFilter] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // TODO: API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setBanners([
          {
            id: '1',
            title: 'Summer Collection 2024',
            type: 'hero',
            imageDesktop: '/api/placeholder/1920/600',
            imageMobile: '/api/placeholder/640/800',
            linkUrl: '/collections/summer-2024',
            linkText: 'Shop Now',
            position: 1,
            isActive: true,
            startDate: '2024-06-01',
            endDate: '2024-06-30',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Wedding Season Special',
            type: 'hero',
            imageDesktop: '/api/placeholder/1920/600',
            linkUrl: '/collections/wedding',
            linkText: 'Explore',
            position: 2,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Gold Earrings Sale',
            type: 'promotional',
            imageDesktop: '/api/placeholder/800/400',
            imageMobile: '/api/placeholder/640/400',
            linkUrl: '/collections/gold-earrings',
            position: 1,
            isActive: true,
            startDate: '2024-06-15',
            endDate: '2024-06-20',
            createdAt: new Date().toISOString(),
          },
          {
            id: '4',
            title: 'Rings Category Banner',
            type: 'category',
            imageDesktop: '/api/placeholder/600/400',
            linkUrl: '/collections/rings',
            position: 1,
            isActive: false,
            createdAt: new Date().toISOString(),
          },
        ]);

        setAnnouncements([
          {
            id: '1',
            message: '🎉 Free shipping on orders above ₹999!',
            type: 'shipping',
            bgColor: '#2D3748',
            textColor: '#FFFFFF',
            isActive: true,
          },
          {
            id: '2',
            message: 'Summer Sale: Up to 30% off on selected items',
            type: 'sale',
            bgColor: '#D4A574',
            textColor: '#FFFFFF',
            linkUrl: '/sale',
            linkText: 'Shop Now',
            isActive: false,
            startDate: '2024-06-01',
            endDate: '2024-06-30',
          },
        ]);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter banners
  const filteredBanners = banners.filter((banner) => {
    if (bannerTypeFilter !== 'all' && banner.type !== bannerTypeFilter) return false;
    return true;
  });

  // Group banners by type
  const heroBanners = filteredBanners.filter(b => b.type === 'hero');
  const promotionalBanners = filteredBanners.filter(b => b.type === 'promotional');
  const categoryBanners = filteredBanners.filter(b => b.type === 'category');

  // Handlers
  const handleToggleBanner = (bannerId: string) => {
    setBanners(banners.map(b =>
      b.id === bannerId ? { ...b, isActive: !b.isActive } : b
    ));
  };

  const handleToggleAnnouncement = (announcementId: string) => {
    setAnnouncements(announcements.map(a =>
      a.id === announcementId ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const tabs = [
    { id: 'banners', label: 'Banners & Sliders', icon: Layout },
    { id: 'announcements', label: 'Announcement Bar', icon: Megaphone },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Content & Banners"
          description="Manage your store's visual content and promotions"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Content' },
          ]}
          actions={
            <Button
              leftIcon={<Plus size={18} />}
              onClick={() => router.push(`/admin/v2/content/${activeTab === 'banners' ? 'banners' : 'announcements'}/new`)}
            >
              {activeTab === 'banners' ? 'Add Banner' : 'Add Announcement'}
            </Button>
          }
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--admin-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--admin-primary-500)] text-[var(--admin-primary-600)]'
                  : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Banners Tab */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/v2/content/banners/new?type=hero">
                <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                      <Layers size={20} className="text-[var(--admin-primary-600)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--admin-text-primary)]">Hero Slider</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{heroBanners.length} slides</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/v2/content/banners/new?type=promotional">
                <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--admin-gold-100)] rounded-xl flex items-center justify-center">
                      <ImagePlus size={20} className="text-[var(--admin-gold-600)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--admin-text-primary)]">Promotional</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{promotionalBanners.length} banners</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/v2/content/banners/new?type=category">
                <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--admin-success-100)] rounded-xl flex items-center justify-center">
                      <Layout size={20} className="text-[var(--admin-success-600)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--admin-text-primary)]">Category</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{categoryBanners.length} banners</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/v2/content/preview">
                <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--admin-bg-tertiary)] rounded-xl flex items-center justify-center">
                      <Eye size={20} className="text-[var(--admin-text-muted)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--admin-text-primary)]">Preview</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">Live preview</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Filter */}
            <Card padding="sm">
              <div className="flex items-center gap-4">
                <Select
                  value={bannerTypeFilter}
                  onChange={(e) => setBannerTypeFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'hero', label: 'Hero Slider' },
                    { value: 'promotional', label: 'Promotional' },
                    { value: 'category', label: 'Category' },
                  ]}
                />
                <p className="text-sm text-[var(--admin-text-muted)]">
                  {filteredBanners.length} banner{filteredBanners.length !== 1 ? 's' : ''}
                </p>
              </div>
            </Card>

            {/* Hero Banners */}
            {(bannerTypeFilter === 'all' || bannerTypeFilter === 'hero') && heroBanners.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--admin-text-primary)]">Hero Slider</h3>
                  <Link
                    href="/admin/v2/content/banners/new?type=hero"
                    className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)]"
                  >
                    Add Slide
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {heroBanners.map((banner) => (
                    <BannerCard
                      key={banner.id}
                      banner={banner}
                      onEdit={() => router.push(`/admin/v2/content/banners/${banner.id}`)}
                      onToggle={() => handleToggleBanner(banner.id)}
                      onDelete={() => {}}
                      onDuplicate={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Promotional Banners */}
            {(bannerTypeFilter === 'all' || bannerTypeFilter === 'promotional') && promotionalBanners.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--admin-text-primary)]">Promotional Banners</h3>
                  <Link
                    href="/admin/v2/content/banners/new?type=promotional"
                    className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)]"
                  >
                    Add Banner
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promotionalBanners.map((banner) => (
                    <BannerCard
                      key={banner.id}
                      banner={banner}
                      onEdit={() => router.push(`/admin/v2/content/banners/${banner.id}`)}
                      onToggle={() => handleToggleBanner(banner.id)}
                      onDelete={() => {}}
                      onDuplicate={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category Banners */}
            {(bannerTypeFilter === 'all' || bannerTypeFilter === 'category') && categoryBanners.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--admin-text-primary)]">Category Banners</h3>
                  <Link
                    href="/admin/v2/content/banners/new?type=category"
                    className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)]"
                  >
                    Add Banner
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryBanners.map((banner) => (
                    <BannerCard
                      key={banner.id}
                      banner={banner}
                      onEdit={() => router.push(`/admin/v2/content/banners/${banner.id}`)}
                      onToggle={() => handleToggleBanner(banner.id)}
                      onDelete={() => {}}
                      onDuplicate={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredBanners.length === 0 && (
              <Card>
                <div className="text-center py-12">
                  <Image size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--admin-text-primary)] mb-2">No banners found</h3>
                  <p className="text-sm text-[var(--admin-text-muted)] mb-4">
                    Create your first banner to enhance your store's visual appeal
                  </p>
                  <Button onClick={() => router.push('/admin/v2/content/banners/new')}>
                    Create Banner
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Info */}
            <Alert variant="info">
              The announcement bar appears at the top of your store. Only one announcement can be active at a time.
            </Alert>

            {/* Announcements List */}
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementPreview
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={() => router.push(`/admin/v2/content/announcements/${announcement.id}`)}
                  onToggle={() => handleToggleAnnouncement(announcement.id)}
                />
              ))}
            </div>

            {/* Add New */}
            <Button
              variant="secondary"
              leftIcon={<Plus size={18} />}
              onClick={() => router.push('/admin/v2/content/announcements/new')}
              className="w-full border-dashed"
            >
              Add New Announcement
            </Button>

            {/* Templates */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Quick Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { message: 'Free shipping on orders above ₹999!', type: 'shipping', bg: '#2D3748' },
                  { message: 'Summer Sale: Up to 30% off!', type: 'sale', bg: '#D4A574' },
                  { message: 'New arrivals are here!', type: 'info', bg: '#E8B4B8' },
                  { message: 'Limited time offer - Shop now!', type: 'custom', bg: '#9F7AEA' },
                ].map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // TODO: Create from template
                    }}
                    className="p-3 rounded-lg text-left text-white text-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: template.bg }}
                  >
                    {template.message}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
