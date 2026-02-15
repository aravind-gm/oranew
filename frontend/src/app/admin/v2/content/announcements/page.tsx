'use client';

/**
 * ORA Admin Panel - Announcements Management
 * ==========================================
 * 
 * Manage site-wide announcements (announcement bars, popups, etc.)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, Badge, Spinner, Alert, Input } from '../../components/ui';
import {
  Plus,
  Megaphone,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  RefreshCw,
  Bell,
  Calendar,
  X,
  Search,
  Clock,
  ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface Announcement {
  id: string;
  message: string;
  type: 'bar' | 'popup' | 'toast';
  backgroundColor: string | null;
  textColor: string | null;
  link: string | null;
  linkText: string | null;
  isActive: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ANNOUNCEMENT CARD COMPONENT
// ============================================

const AnnouncementCard = ({
  announcement,
  onToggle,
  onDelete,
  onEdit,
}: {
  announcement: Announcement;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) => {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle();
    setToggling(false);
  };

  const getTypeIcon = () => {
    switch (announcement.type) {
      case 'bar':
        return <Megaphone size={16} />;
      case 'popup':
        return <Bell size={16} />;
      case 'toast':
        return <Clock size={16} />;
      default:
        return <Megaphone size={16} />;
    }
  };

  const getTypeLabel = () => {
    switch (announcement.type) {
      case 'bar':
        return 'Announcement Bar';
      case 'popup':
        return 'Popup';
      case 'toast':
        return 'Toast';
      default:
        return announcement.type;
    }
  };

  // Check if announcement is scheduled for future
  const isScheduled = announcement.startDate && new Date(announcement.startDate) > new Date();
  
  // Check if announcement has expired
  const isExpired = announcement.endDate && new Date(announcement.endDate) < new Date();

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Preview Bar */}
        <div
          className="w-full max-w-xs p-3 rounded-lg text-sm"
          style={{
            backgroundColor: announcement.backgroundColor || '#1a1a1a',
            color: announcement.textColor || '#ffffff',
          }}
        >
          <p className="truncate">{announcement.message}</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[var(--admin-text-muted)]">
              {getTypeIcon()}
              <span className="text-sm">{getTypeLabel()}</span>
            </div>
            <Badge variant={announcement.isActive ? 'success' : 'secondary'} size="sm">
              {announcement.isActive ? 'Active' : 'Hidden'}
            </Badge>
            {isScheduled && (
              <Badge variant="warning" size="sm">Scheduled</Badge>
            )}
            {isExpired && (
              <Badge variant="error" size="sm">Expired</Badge>
            )}
          </div>
          
          <p className="text-sm text-[var(--admin-text-secondary)] mb-2 line-clamp-2">
            {announcement.message}
          </p>

          <div className="flex items-center gap-4 text-xs text-[var(--admin-text-muted)]">
            {announcement.link && (
              <span className="flex items-center gap-1">
                <ExternalLink size={12} />
                {announcement.linkText || 'Link'}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(announcement.createdAt).toLocaleDateString()}
            </span>
            <span>Priority: {announcement.priority}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
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
            ) : announcement.isActive ? (
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
    </Card>
  );
};

// ============================================
// NEW ANNOUNCEMENT MODAL
// ============================================

const CreateAnnouncementModal = ({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [form, setForm] = useState({
    message: '',
    type: 'bar' as 'bar' | 'popup' | 'toast',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    link: '',
    linkText: '',
    priority: 1,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setError('Message is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.post('/announcements', form);
      onCreated();
      onClose();
      setForm({
        message: '',
        type: 'bar',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        link: '',
        linkText: '',
        priority: 1,
        isActive: true,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[var(--admin-border)]">
          <h3 className="text-lg font-semibold text-[var(--admin-text-primary)]">
            Create Announcement
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
              Message *
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-[var(--admin-bg-primary)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text-primary)] focus:ring-2 focus:ring-[var(--admin-accent)] focus:border-transparent"
              placeholder="Your announcement message..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full px-3 py-2 bg-[var(--admin-bg-primary)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text-primary)] focus:ring-2 focus:ring-[var(--admin-accent)] focus:border-transparent"
            >
              <option value="bar">Announcement Bar</option>
              <option value="popup">Popup</option>
              <option value="toast">Toast Notification</option>
            </select>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.backgroundColor}
                  onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={form.backgroundColor}
                  onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Text Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={form.textColor}
                  onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
              Preview
            </label>
            <div
              className="w-full p-3 rounded-lg text-center text-sm"
              style={{
                backgroundColor: form.backgroundColor,
                color: form.textColor,
              }}
            >
              {form.message || 'Your announcement preview'}
            </div>
          </div>

          {/* Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Link URL (optional)
              </label>
              <Input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Link Text
              </label>
              <Input
                value={form.linkText}
                onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                placeholder="Shop Now"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
              Priority (1 = highest)
            </label>
            <Input
              type="number"
              min="1"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
            />
          </div>

          {/* Active */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
            />
            <span className="text-sm text-[var(--admin-text-secondary)]">
              Active immediately
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
                  Create Announcement
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

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/announcements');
      setAnnouncements(response.data.announcements || response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch announcements:', err);
      setError(err.response?.data?.message || 'Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/toggle`);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to toggle announcement:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((a) => {
    // Status filter
    if (filter === 'active' && !a.isActive) return false;
    if (filter === 'hidden' && a.isActive) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return a.message.toLowerCase().includes(query);
    }
    
    return true;
  });

  const activeCount = announcements.filter((a) => a.isActive).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Announcements"
          description="Manage site-wide announcements, bars, and popups"
          actions={
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={fetchAnnouncements} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-2" />
                Create Announcement
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-semibold text-[var(--admin-text-primary)]">
              {announcements.length}
            </div>
            <div className="text-sm text-[var(--admin-text-muted)]">Total Announcements</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-green-600">{activeCount}</div>
            <div className="text-sm text-[var(--admin-text-muted)]">Active</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-semibold text-gray-500">
              {announcements.length - activeCount}
            </div>
            <div className="text-sm text-[var(--admin-text-muted)]">Hidden</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]"
            />
            <Input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'hidden'] as const).map((tab) => (
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
            <Button variant="ghost" size="sm" onClick={fetchAnnouncements} className="ml-2">
              Retry
            </Button>
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center">
            <Megaphone size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--admin-text-primary)] mb-2">
              {searchQuery || filter !== 'all'
                ? 'No matching announcements'
                : 'No announcements yet'}
            </h3>
            <p className="text-[var(--admin-text-muted)] mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first announcement to inform your customers.'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-2" />
                Create Announcement
              </Button>
            )}
          </Card>
        ) : (
          /* List */
          <div className="space-y-3">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onToggle={() => handleToggle(announcement.id)}
                onDelete={() => handleDelete(announcement.id)}
                onEdit={() => router.push(`/admin/v2/content/announcements/${announcement.id}`)}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        <CreateAnnouncementModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={fetchAnnouncements}
        />
      </div>
    </AdminLayout>
  );
}
