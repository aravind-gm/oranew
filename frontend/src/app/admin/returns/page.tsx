'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
    AlertTriangle,
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Package,
    RefreshCw,
    RotateCcw,
    X,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface ReturnItem {
  id: string;
  reason: string;
  description?: string;
  status: string;
  refundAmount?: number;
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
  resolvedAt?: string;
  restocked: boolean;
  order: {
    orderNumber: string;
    totalAmount: number;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
  user: {
    fullName: string;
    email: string;
    phone?: string;
  };
}

interface ReturnStats {
  pendingCount: number;
  stats: Record<string, { count: number; refundedAmount: number }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const RETURN_STATUSES = ['ALL', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'];

export default function AdminReturnsPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Action modal state
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'refund' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [restock, setRestock] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    fetchStats();
  }, [isHydrated, token, user, router]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/returns/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchReturns = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const response = await api.get('/admin/returns', { params });

      if (response.data.success) {
        setReturns(response.data.data.returns || []);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (token && user?.role === 'ADMIN') {
      fetchReturns();
    }
  }, [isHydrated, token, user, fetchReturns]);

  const handleAction = async () => {
    if (!selectedReturn || !actionType) return;

    if (!token || !isHydrated) {
      setError('Authentication not ready. Please refresh and try again.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      let status: string;
      const payload: {
        adminNotes: string;
        status?: string;
        refundAmount?: number;
        restock?: boolean;
      } = { adminNotes };

      switch (actionType) {
        case 'approve':
          status = 'APPROVED';
          break;
        case 'reject':
          status = 'REJECTED';
          break;
        case 'refund':
          status = 'REFUNDED';
          payload.refundAmount = parseFloat(refundAmount) || selectedReturn.order.totalAmount;
          payload.restock = restock;
          break;
        default:
          return;
      }

      payload.status = status;

      await api.put(`/admin/returns/${selectedReturn.id}/status`, payload);

      // Refresh data
      await Promise.all([fetchReturns(pagination?.page || 1), fetchStats()]);
      closeModal();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update return status');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (returnItem: ReturnItem, action: 'approve' | 'reject' | 'refund') => {
    setSelectedReturn(returnItem);
    setActionType(action);
    setAdminNotes('');
    setRefundAmount(returnItem.order.totalAmount.toString());
    setRestock(true);
    setError('');
  };

  const closeModal = () => {
    setSelectedReturn(null);
    setActionType(null);
    setAdminNotes('');
    setRefundAmount('');
    setError('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <Clock className="text-yellow-400" size={18} />;
      case 'APPROVED':
        return <CheckCircle className="text-blue-400" size={18} />;
      case 'REJECTED':
        return <XCircle className="text-red-400" size={18} />;
      case 'REFUNDED':
        return <Check className="text-green-400" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      REQUESTED: 'bg-yellow-900/50 text-yellow-300',
      APPROVED: 'bg-blue-900/50 text-blue-300',
      REJECTED: 'bg-red-900/50 text-red-300',
      REFUNDED: 'bg-green-900/50 text-green-300',
    };
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${styles[status] || 'bg-gray-700 text-gray-300'}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin" className="text-blue-400 hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="text-amber-500" />
            Returns Management
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <Clock size={20} />
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold">{stats.pendingCount}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <CheckCircle size={20} />
                <span className="text-sm">Approved</span>
              </div>
              <p className="text-2xl font-bold">{stats.stats?.APPROVED?.count || 0}</p>
            </div>
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <RefreshCw size={20} />
                <span className="text-sm">Refunded</span>
              </div>
              <p className="text-2xl font-bold">{stats.stats?.REFUNDED?.count || 0}</p>
            </div>
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <XCircle size={20} />
                <span className="text-sm">Rejected</span>
              </div>
              <p className="text-2xl font-bold">{stats.stats?.REJECTED?.count || 0}</p>
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {RETURN_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Returns List */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-400">Loading returns...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-4 text-gray-500" size={48} />
              <p className="text-gray-400">No return requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left p-4 font-medium">Order</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Reason</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((returnItem) => (
                    <tr key={returnItem.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${returnItem.order.orderNumber}`}
                          className="font-mono text-blue-400 hover:underline"
                        >
                          #{returnItem.order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{returnItem.user.fullName}</p>
                          <p className="text-sm text-gray-400">{returnItem.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{returnItem.reason}</p>
                        {returnItem.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {returnItem.description}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-semibold">
                        {formatCurrency(Number(returnItem.order.totalAmount))}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(returnItem.status)}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(returnItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {returnItem.status === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => openActionModal(returnItem, 'approve')}
                                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openActionModal(returnItem, 'reject')}
                                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {returnItem.status === 'APPROVED' && (
                            <button
                              onClick={() => openActionModal(returnItem, 'refund')}
                              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm transition"
                            >
                              Process Refund
                            </button>
                          )}
                          {(returnItem.status === 'REJECTED' || returnItem.status === 'REFUNDED') && (
                            <span className="text-gray-500 text-sm">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-gray-400 text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} returns
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchReturns(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <button
                onClick={() => fetchReturns(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedReturn && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${
                actionType === 'approve' ? 'bg-blue-900/30' :
                actionType === 'reject' ? 'bg-red-900/30' : 'bg-green-900/30'
              }`}>
                {actionType === 'approve' && <CheckCircle className="text-blue-400" size={24} />}
                {actionType === 'reject' && <XCircle className="text-red-400" size={24} />}
                {actionType === 'refund' && <RefreshCw className="text-green-400" size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {actionType === 'approve' && 'Approve Return'}
                  {actionType === 'reject' && 'Reject Return'}
                  {actionType === 'refund' && 'Process Refund'}
                </h3>
                <p className="text-sm text-gray-400">Order #{selectedReturn.order.orderNumber}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={18} />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {actionType === 'refund' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Refund Amount (₹)</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Original order: {formatCurrency(Number(selectedReturn.order.totalAmount))}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restock}
                      onChange={(e) => setRestock(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-amber-500"
                    />
                    <span>Restock inventory</span>
                  </label>
                </>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Admin Notes {actionType === 'reject' && '(Required)'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder={
                    actionType === 'reject' 
                      ? 'Reason for rejection...' 
                      : 'Optional notes...'
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading || (actionType === 'reject' && !adminNotes.trim())}
                className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                  actionType === 'approve' ? 'bg-blue-600 hover:bg-blue-700' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    {actionType === 'approve' && <><Check size={18} /> Approve</>}
                    {actionType === 'reject' && <><X size={18} /> Reject</>}
                    {actionType === 'refund' && <><RefreshCw size={18} /> Process Refund</>}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
