'use client';

/**
 * ORA Admin Panel - Audit Log Viewer
 * ====================================
 * 
 * View all admin actions: product changes, config updates,
 * campaign toggles, order status changes, etc.
 */

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, CardTitle, Select, Badge, Spinner, Alert } from '../../components/ui';
import { ArrowLeft, RefreshCw, Shield, Clock, User, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-[#dcfce7] text-[#166534]',
  UPDATE: 'bg-[#dbeafe] text-[#1e40af]',
  DELETE: 'bg-[#fef2f2] text-[#991b1b]',
  ARCHIVE: 'bg-[#f3f4f6] text-[#374151]',
  RESTORE: 'bg-[#fef3c7] text-[#92400e]',
  BULK_ACTION: 'bg-[#ede9fe] text-[#5b21b6]',
  CONFIG_CHANGE: 'bg-[#fce7f3] text-[#9d174d]',
  LOGIN: 'bg-[#e0f2fe] text-[#075985]',
  TOGGLE: 'bg-[#fff7ed] text-[#9a3412]',
};

const ENTITY_ICONS: Record<string, string> = {
  PRODUCT: '📦',
  ORDER: '🛒',
  CAMPAIGN: '📣',
  SHIPPING: '🚚',
  TAX: '🧾',
  CONTENT: '📄',
  USER: '👤',
  CATEGORY: '📁',
  COUPON: '🎟️',
  SETTINGS: '⚙️',
};

export default function AuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter]);

  const fetchLogs = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 50 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await api.get('/admin/audit-log', { params });
      setLogs(res.data.data.logs);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Audit Log"
          description="Track all admin panel actions"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Settings', href: '/admin/v2/settings' },
            { label: 'Audit Log' },
          ]}
          actions={
            <>
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => router.push('/admin/v2/settings')}
              >
                Back
              </Button>
              <Button
                variant="secondary"
                leftIcon={<RefreshCw size={18} />}
                onClick={() => fetchLogs(pagination.page)}
              >
                Refresh
              </Button>
            </>
          }
        />

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-sm text-[#4b5563]">
              <Filter size={16} />
              <span>Filter by:</span>
            </div>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={[
                { value: '', label: 'All Actions' },
                { value: 'CREATE', label: 'Create' },
                { value: 'UPDATE', label: 'Update' },
                { value: 'DELETE', label: 'Delete' },
                { value: 'ARCHIVE', label: 'Archive' },
                { value: 'RESTORE', label: 'Restore' },
                { value: 'BULK_ACTION', label: 'Bulk Action' },
                { value: 'CONFIG_CHANGE', label: 'Config Change' },
                { value: 'TOGGLE', label: 'Toggle' },
              ]}
            />
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              options={[
                { value: '', label: 'All Entities' },
                { value: 'PRODUCT', label: 'Product' },
                { value: 'ORDER', label: 'Order' },
                { value: 'CAMPAIGN', label: 'Campaign' },
                { value: 'SHIPPING', label: 'Shipping' },
                { value: 'TAX', label: 'Tax' },
                { value: 'CONTENT', label: 'Content' },
                { value: 'USER', label: 'User' },
              ]}
            />
            <div className="ml-auto text-sm text-[#9ca3af]">
              {pagination.total} total entries
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Log Entries */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <Shield size={20} className="text-[#d4af37]" />
            Activity Log
          </CardTitle>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto text-[#9ca3af] mb-3" />
              <p className="text-sm text-[#9ca3af]">No audit log entries found</p>
              <p className="text-xs text-[#9ca3af] mt-1">Actions will appear here as admins use the panel</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-[#f3f4f6]">
              {logs.map((log) => (
                <div key={log.id} className="py-3 px-2 hover:bg-[#f9fafb] transition-colors rounded">
                  <div className="flex items-start gap-3">
                    {/* Entity Icon */}
                    <div className="w-8 h-8 rounded-full bg-[#f6f7f9] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">{ENTITY_ICONS[log.entityType] || '📋'}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-[#f3f4f6] text-[#374151]'}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-[#111827]">{log.entityType}</span>
                        {log.entityId && (
                          <code className="text-xs bg-[#f3f4f6] px-1.5 py-0.5 rounded text-[#6b7280] font-mono">
                            {log.entityId.substring(0, 8)}…
                          </code>
                        )}
                      </div>

                      {/* Details */}
                      {log.details && (
                        <div className="mt-1 text-xs text-[#6b7280]">
                          {Object.entries(log.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <span className="text-[#9ca3af]">{key}:</span>{' '}
                              <span className="text-[#4b5563]">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* User & Time */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#9ca3af]">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {log.user.fullName || log.user.email}
                        </span>
                        <span className="flex items-center gap-1" title={formatFullDate(log.createdAt)}>
                          <Clock size={12} />
                          {formatDate(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span className="text-[#d1d5db]">{log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#f3f4f6]">
              <p className="text-sm text-[#9ca3af]">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft size={16} />}
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight size={16} />}
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
