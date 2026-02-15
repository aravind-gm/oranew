'use client';

/**
 * ORA Admin Panel - Static Pages Management
 * ==========================================
 * 
 * Manage static content pages like About Us, Terms, Privacy Policy, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, Badge, Spinner, Alert, Input } from '../../components/ui';
import {
  Plus,
  FileText,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Calendar,
  ExternalLink,
  Copy,
  Link,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PAGE CARD COMPONENT
// ============================================

const PageCard = ({
  page,
  onToggle,
  onDelete,
  onEdit,
  onDuplicate,
}: {
  page: StaticPage;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) => {
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle();
    setToggling(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`/${page.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get content preview (strip HTML and truncate)
  const getContentPreview = () => {
    const stripped = page.content.replace(/<[^>]*>/g, '');
    return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped;
  };

  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-[var(--admin-bg-secondary)] flex items-center justify-center flex-shrink-0">
          <FileText size={24} className="text-[var(--admin-text-muted)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--admin-text-primary)] truncate">
              {page.title}
            </h3>
            <Badge variant={page.isPublished ? 'success' : 'secondary'} size="sm">
              {page.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-1 text-sm text-[var(--admin-accent)] hover:underline"
            >
              <Link size={12} />
              /{page.slug}
              {copied && <span className="text-green-600 text-xs">(Copied!)</span>}
            </button>
          </div>

          <p className="text-sm text-[var(--admin-text-muted)] line-clamp-2 mb-2">
            {getContentPreview() || 'No content yet'}
          </p>

          <div className="flex items-center gap-4 text-xs text-[var(--admin-text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Created: {new Date(page.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Updated: {new Date(page.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/${page.slug}`, '_blank')}
            title="View Page"
          >
            <ExternalLink size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate">
            <Copy size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
            title={page.isPublished ? 'Unpublish' : 'Publish'}
          >
            {toggling ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : page.isPublished ? (
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
            title="Delete"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// CREATE PAGE MODAL
// ============================================

const CreatePageModal = ({
  open,
  onClose,
  onCreated,
  duplicateFrom,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  duplicateFrom?: StaticPage | null;
}) => {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when duplicating
  useEffect(() => {
    if (duplicateFrom) {
      setForm({
        title: `${duplicateFrom.title} (Copy)`,
        slug: `${duplicateFrom.slug}-copy`,
        content: duplicateFrom.content,
        metaTitle: duplicateFrom.metaTitle || '',
        metaDescription: duplicateFrom.metaDescription || '',
        isPublished: false, // Always start as draft
      });
    } else {
      setForm({
        title: '',
        slug: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        isPublished: false,
      });
    }
  }, [duplicateFrom, open]);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setForm({
      ...form,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-'),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      setError('Title and slug are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.post('/pages', form);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--admin-border)] sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-[var(--admin-text-primary)]">
            {duplicateFrom ? 'Duplicate Page' : 'Create New Page'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
              Page Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="About Us"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-[var(--admin-bg-secondary)] border border-r-0 border-[var(--admin-border)] rounded-l-lg text-sm text-[var(--admin-text-muted)]">
                /
              </span>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="about-us"
                className="rounded-l-none"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
              Content
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 bg-[var(--admin-bg-primary)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text-primary)] focus:ring-2 focus:ring-[var(--admin-accent)] focus:border-transparent font-mono text-sm"
              placeholder="<h1>About Us</h1>\n<p>Welcome to our store...</p>"
            />
            <p className="text-xs text-[var(--admin-text-muted)] mt-1">
              You can use HTML for rich content. Use the full editor after creating.
            </p>
          </div>

          {/* SEO */}
          <div className="border-t border-[var(--admin-border)] pt-4">
            <h4 className="text-sm font-medium text-[var(--admin-text-primary)] mb-3">
              SEO Settings
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                  Meta Title
                </label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="About Us | ORA Jewellery"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                  Meta Description
                </label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-[var(--admin-bg-primary)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text-primary)] focus:ring-2 focus:ring-[var(--admin-accent)] focus:border-transparent text-sm"
                  placeholder="Learn about ORA's mission to bring premium jewellery..."
                />
              </div>
            </div>
          </div>

          {/* Publish */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
            />
            <span className="text-sm text-[var(--admin-text-secondary)]">
              Publish immediately
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--admin-border)]">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={14} className="mr-2" />
                  Create Page
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaticPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [duplicatePage, setDuplicatePage] = useState<StaticPage | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/pages');
      setPages(response.data.pages || response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch pages:', err);
      setError(err.response?.data?.message || 'Failed to load pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/pages/${id}/toggle`);
      fetchPages();
    } catch (err) {
      console.error('Failed to toggle page:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page? This cannot be undone.')) return;

    try {
      await api.delete(`/pages/${id}`);
      fetchPages();
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  const handleDuplicate = (page: StaticPage) => {
    setDuplicatePage(page);
    setShowCreate(true);
  };

  // Filter pages
  const filteredPages = pages.filter((p) => {
    if (filter === 'published' && !p.isPublished) return false;
    if (filter === 'draft' && p.isPublished) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const publishedCount = pages.filter((p) => p.isPublished).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Static Pages"
          description="Manage your site's static content pages"
          actions={
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchPages} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button onClick={() => { setDuplicatePage(null); setShowCreate(true); }}>
                <Plus size={16} className="mr-2" />
                Create Page
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-semibold text-[var(--admin-text-primary)]">
              {pages.length}
            </div>
            <div className="text-sm text-[var(--admin-text-muted)]">Total Pages</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-green-600">{publishedCount}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Published</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-yellow-600">
              {pages.length - publishedCount}
            </div>
            <div className="text-sm text-[var(--admin-text-muted)]">Drafts</div>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Common Pages</h4>
              <div className="flex flex-wrap gap-2">
                {['about', 'terms', 'privacy', 'shipping', 'returns', 'contact', 'faq'].map((slug) => {
                  const exists = pages.some((p) => p.slug === slug);
                  return (
                    <button
                      key={slug}
                      onClick={() => {
                        if (exists) {
                          const page = pages.find((p) => p.slug === slug);
                          if (page) router.push(`/admin/v2/content/pages/${page.id}`);
                        } else {
                          setDuplicatePage(null);
                          setShowCreate(true);
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded ${
                        exists
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      /{slug} {exists ? '✓' : '(missing)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]"
            />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'published', 'draft'] as const).map((tab) => (
              <Button
                key={tab}
                variant={filter === tab ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="error">
            {error}
            <Button variant="ghost" size="sm" onClick={fetchPages} className="ml-2">
              Retry
            </Button>
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredPages.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center">
            <FileText size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--admin-text-primary)] mb-2">
              {searchQuery || filter !== 'all' ? 'No matching pages' : 'No static pages yet'}
            </h3>
            <p className="text-[var(--admin-text-muted)] mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create pages like About Us, Terms of Service, Privacy Policy, etc.'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Button onClick={() => { setDuplicatePage(null); setShowCreate(true); }}>
                <Plus size={16} className="mr-2" />
                Create Your First Page
              </Button>
            )}
          </Card>
        ) : (
          /* Pages List */
          <div className="space-y-3">
            {filteredPages
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onToggle={() => handleToggle(page.id)}
                  onDelete={() => handleDelete(page.id)}
                  onEdit={() => router.push(`/admin/v2/content/pages/${page.id}`)}
                  onDuplicate={() => handleDuplicate(page)}
                />
              ))}
          </div>
        )}

        {/* Create Modal */}
        <CreatePageModal
          open={showCreate}
          onClose={() => { setShowCreate(false); setDuplicatePage(null); }}
          onCreated={fetchPages}
          duplicateFrom={duplicatePage}
        />
      </div>
    </AdminLayout>
  );
}
