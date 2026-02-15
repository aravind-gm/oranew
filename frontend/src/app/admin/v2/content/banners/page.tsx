'use client';

/**
 * ORA Admin Panel - Banners Management
 * =====================================
 * 
 * List all banners with create/edit/delete capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, Badge, Spinner, Alert } from '../../components/ui';
import {
  Plus,
  Image,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  GripVertical,
  Calendar,
  ExternalLink,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface Banner {
  id: string;
  page: string;
  title: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BANNER CARD COMPONENT
// ============================================

const BannerCard = ({
  banner,
  onToggle,
  onDelete,
  onDuplicate,
}: {
  banner: Banner;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle();
    setToggling(false);
  };

  const positionConfig: Record<string, { label: string; color: string }> = {
    hero: { label: 'Hero', color: 'primary' },
    promotional: { label: 'Promotional', color: 'gold' },
    category: { label: 'Category', color: 'secondary' },
    announcement: { label: 'Announcement', color: 'success' },
    sidebar: { label: 'Sidebar', color: 'info' },
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="border border-[var(--admin-border)] rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="relative aspect-[21/9] bg-[var(--admin-bg-secondary)]">
        {banner.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt={banner.title || 'Banner'}
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
            #{banner.sortOrder}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={positionConfig[banner.position]?.color as any || 'secondary'} size="sm">
            {positionConfig[banner.position]?.label || banner.position}
          </Badge>
        </div>

        {/* Device indicators */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <div className={`p-1.5 rounded ${banner.imageUrl ? 'bg-green-500/80' : 'bg-gray-500/80'}`}>
            <Monitor size={14} className="text-white" />
          </div>
          <div className={`p-1.5 rounded ${banner.mobileImageUrl ? 'bg-green-500/80' : 'bg-gray-500/80'}`}>
            <Smartphone size={14} className="text-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-[var(--admin-text-primary)] line-clamp-1">
            {banner.title || `Banner on ${banner.page}`}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--admin-text-muted)] mb-3">
          <span className="capitalize">{banner.page}</span>
          {banner.startDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(banner.startDate)}
            </span>
          )}
          {banner.ctaLink && (
            <span className="flex items-center gap-1">
              <ExternalLink size={12} />
              Has CTA
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-[var(--admin-border)] pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/v2/content/banners/${banner.id}`)}
          >
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling ? (
              <RefreshCw size={14} className="mr-1 animate-spin" />
            ) : banner.isActive ? (
              <EyeOff size={14} className="mr-1" />
            ) : (
              <Eye size={14} className="mr-1" />
            )}
            {banner.isActive ? 'Hide' : 'Show'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
          >
            <Copy size={14} className="mr-1" />
            Clone
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/r2/banners');
      setBanners(response.data.banners || response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch banners:', err);
      setError(err.response?.data?.message || 'Failed to load banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleToggle = async (bannerId: string) => {
    try {
      await api.patch(`/r2/banners/${bannerId}/toggle`);
      fetchBanners();
    } catch (err) {
      console.error('Failed to toggle banner:', err);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      await api.delete(`/r2/banners/${bannerId}`);
      fetchBanners();
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  const handleDuplicate = async (banner: Banner) => {
    try {
      await api.post('/r2/banners/duplicate', { bannerId: banner.id });
      fetchBanners();
    } catch (err) {
      console.error('Failed to duplicate banner:', err);
    }
  };

  const filteredBanners = banners.filter(banner => {
    if (filter === 'all') return true;
    if (filter === 'active') return banner.isActive;
    if (filter === 'hidden') return !banner.isActive;
    return banner.position === filter;
  });

  const stats = {
    total: banners.length,
    active: banners.filter(b => b.isActive).length,
    hero: banners.filter(b => b.position === 'hero').length,
    promotional: banners.filter(b => b.position === 'promotional').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Banners"
          description="Manage homepage banners, promotional images, and hero sections"
          actions={
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchBanners} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button onClick={() => router.push('/admin/v2/content/banners/new')}>
                <Plus size={16} className="mr-2" />
                Add Banner
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-semibold text-[var(--admin-text-primary)]">{stats.total}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Total Banners</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-green-600">{stats.active}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Active</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-blue-600">{stats.hero}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Hero Banners</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-amber-600">{stats.promotional}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Promotional</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--admin-bg-secondary)] rounded-lg p-1">
            {['all', 'active', 'hidden', 'hero', 'promotional'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  filter === f
                    ? 'bg-white text-[var(--admin-text-primary)] shadow-sm'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="error">
            {error}
            <Button variant="ghost" size="sm" onClick={fetchBanners} className="ml-2">
              Retry
            </Button>
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredBanners.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center">
            <Image size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--admin-text-primary)] mb-2">
              No banners found
            </h3>
            <p className="text-[var(--admin-text-muted)] mb-6">
              {filter !== 'all' 
                ? `No ${filter} banners. Try a different filter or create one.`
                : 'Get started by creating your first banner.'
              }
            </p>
            <Button onClick={() => router.push('/admin/v2/content/banners/new')}>
              <Plus size={16} className="mr-2" />
              Create Banner
            </Button>
          </Card>
        ) : (
          /* Banners Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onToggle={() => handleToggle(banner.id)}
                onDelete={() => handleDelete(banner.id)}
                onDuplicate={() => handleDuplicate(banner)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
