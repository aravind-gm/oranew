'use client';

/**
 * ORA Admin Panel - Hero Sliders Management
 * ==========================================
 * 
 * Manage homepage hero carousel/sliders
 * These are specifically for the main hero section
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Layers,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface HeroSlide {
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
}

// ============================================
// SLIDE ROW COMPONENT
// ============================================

const SlideRow = ({
  slide,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  slide: HeroSlide;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle();
    setToggling(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 border border-[var(--admin-border)] rounded-xl bg-white hover:shadow-sm transition-shadow">
      {/* Drag Handle & Position */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className={`p-1 rounded ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <MoveUp size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--admin-bg-secondary)] flex items-center justify-center text-sm font-medium">
          {slide.sortOrder}
        </div>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className={`p-1 rounded ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <MoveDown size={16} />
        </button>
      </div>

      {/* Preview */}
      <div className="relative w-40 aspect-video bg-[var(--admin-bg-secondary)] rounded-lg overflow-hidden flex-shrink-0">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={slide.title || 'Hero Slide'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image size={24} className="text-[var(--admin-text-muted)]" />
          </div>
        )}
        {!slide.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <EyeOff size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-[var(--admin-text-primary)] truncate">
            {slide.title || `Slide #${slide.sortOrder}`}
          </h3>
          <Badge variant={slide.isActive ? 'success' : 'secondary'} size="sm">
            {slide.isActive ? 'Active' : 'Hidden'}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-[var(--admin-text-muted)]">
          <span className="flex items-center gap-1">
            <Monitor size={14} />
            {slide.imageUrl ? 'Desktop ✓' : 'No desktop'}
          </span>
          <span className="flex items-center gap-1">
            <Smartphone size={14} />
            {slide.mobileImageUrl ? 'Mobile ✓' : 'No mobile'}
          </span>
          {slide.ctaLink && (
            <span className="flex items-center gap-1">
              <ExternalLink size={14} />
              {slide.ctaText || 'CTA'}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/v2/content/banners/${slide.id}?type=hero`)}
        >
          <Edit size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={toggling}
        >
          {toggling ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : slide.isActive ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )}
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
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function HeroSlidersPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/r2/banners?position=hero');
      const allBanners = response.data.banners || response.data || [];
      // Filter for hero position only
      setSlides(allBanners.filter((b: HeroSlide) => b.position === 'hero'));
    } catch (err: any) {
      console.error('Failed to fetch hero slides:', err);
      setError(err.response?.data?.message || 'Failed to load hero slides');
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleToggle = async (slideId: string) => {
    try {
      await api.patch(`/r2/banners/${slideId}/toggle`);
      fetchSlides();
    } catch (err) {
      console.error('Failed to toggle slide:', err);
    }
  };

  const handleDelete = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this hero slide?')) return;
    
    try {
      await api.delete(`/r2/banners/${slideId}`);
      fetchSlides();
    } catch (err) {
      console.error('Failed to delete slide:', err);
    }
  };

  const handleMove = async (slideId: string, direction: 'up' | 'down') => {
    try {
      await api.patch(`/r2/banners/${slideId}/reorder`, { direction });
      fetchSlides();
    } catch (err) {
      console.error('Failed to reorder slide:', err);
    }
  };

  const activeCount = slides.filter(s => s.isActive).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Hero Sliders"
          description="Manage the main hero carousel on your homepage"
          actions={
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchSlides} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button onClick={() => router.push('/admin/v2/content/banners/new?type=hero')}>
                <Plus size={16} className="mr-2" />
                Add Slide
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-semibold text-[var(--admin-text-primary)]">{slides.length}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Total Slides</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-green-600">{activeCount}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Active</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-gray-500">{slides.length - activeCount}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Hidden</div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Layers className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Hero Carousel</h4>
              <p className="text-sm text-blue-700">
                These slides appear in the main hero section of your homepage. 
                Drag to reorder, or use the arrows. Recommended image size: 1920×800px for desktop, 750×1000px for mobile.
              </p>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="error">
            {error}
            <Button variant="ghost" size="sm" onClick={fetchSlides} className="ml-2">
              Retry
            </Button>
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : slides.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center">
            <Layers size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--admin-text-primary)] mb-2">
              No hero slides yet
            </h3>
            <p className="text-[var(--admin-text-muted)] mb-6">
              Create your first hero slide to showcase on your homepage.
            </p>
            <Button onClick={() => router.push('/admin/v2/content/banners/new?type=hero')}>
              <Plus size={16} className="mr-2" />
              Create Hero Slide
            </Button>
          </Card>
        ) : (
          /* Slides List */
          <div className="space-y-3">
            {slides
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((slide, index) => (
                <SlideRow
                  key={slide.id}
                  slide={slide}
                  onToggle={() => handleToggle(slide.id)}
                  onDelete={() => handleDelete(slide.id)}
                  onMoveUp={() => handleMove(slide.id, 'up')}
                  onMoveDown={() => handleMove(slide.id, 'down')}
                  isFirst={index === 0}
                  isLast={index === slides.length - 1}
                />
              ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
