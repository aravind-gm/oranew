'use client';

/**
 * Daily Profit Dashboard — Admin Widget
 * ========================================
 * Shows revenue, orders, profit today with ad spend input,
 * CPA calculation, and break-even indicator.
 * Plus AOV tracking metrics from the backend.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Target,
  ArrowUpRight,
  Calculator,
  Layers,
  Users,
} from 'lucide-react';

interface AOVData {
  aovToday: number;
  aov7Days: number;
  aov30Days: number;
  aovTrend: number;
  bundleAttachmentRate: number;
  avgItemsPerOrder: number;
  highValueOrderRate: number;
  revenuePerCustomer: number;
}

interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  totalRevenue: number;
  monthRevenue: number;
}

interface ProfitDashboardProps {
  stats: DashboardData | null;
  loading?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ora-backend.onrender.com/api';

export default function ProfitDashboard({ stats, loading }: ProfitDashboardProps) {
  const [adSpend, setAdSpend] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ora_daily_ad_spend') || '0';
    }
    return '0';
  });
  const [aov, setAov] = useState<AOVData | null>(null);
  const [aovLoading, setAovLoading] = useState(true);

  // Fetch AOV analytics
  useEffect(() => {
    const fetchAOV = async () => {
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('authToken')
          : null;
        const res = await fetch(`${API_URL}/admin/analytics/aov`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          setAov(json.data);
        }
      } catch {
        /* non-critical */
      } finally {
        setAovLoading(false);
      }
    };
    fetchAOV();
  }, []);

  const handleAdSpendChange = useCallback((value: string) => {
    setAdSpend(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ora_daily_ad_spend', value);
    }
  }, []);

  const todayRev = Number(stats?.todayRevenue || 0);
  const todayOrders = Number(stats?.todayOrders || 0);
  const adSpendNum = Number(adSpend) || 0;
  const profit = todayRev - adSpendNum;
  const cpa = todayOrders > 0 ? Math.round(adSpendNum / todayOrders) : 0;
  const roas = adSpendNum > 0 ? (todayRev / adSpendNum).toFixed(1) : '∞';
  const isBreakEven = profit >= 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-100 rounded-lg" />
            <div className="h-20 bg-gray-100 rounded-lg" />
            <div className="h-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Daily Profit Card */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-[#d4af37]" />
            <h3 className="font-semibold text-[#111827]">Daily Profit</h3>
          </div>
          <span className="text-xs text-[#9ca3af]">Today</span>
        </div>

        {/* Revenue / Orders / Profit */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-[#f0fdf4] rounded-lg p-3">
            <p className="text-xs text-[#16a34a] font-medium mb-1">Revenue</p>
            <p className="text-lg font-bold text-[#111827]">{fmt(todayRev)}</p>
          </div>
          <div className="bg-[#eff6ff] rounded-lg p-3">
            <p className="text-xs text-[#3b82f6] font-medium mb-1">Orders</p>
            <p className="text-lg font-bold text-[#111827]">{todayOrders}</p>
          </div>
          <div className={`rounded-lg p-3 ${isBreakEven ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'}`}>
            <p className={`text-xs font-medium mb-1 ${isBreakEven ? 'text-[#16a34a]' : 'text-[#ef4444]'}`}>
              Profit
            </p>
            <p className={`text-lg font-bold ${isBreakEven ? 'text-[#16a34a]' : 'text-[#ef4444]'}`}>
              {fmt(profit)}
            </p>
          </div>
        </div>

        {/* Ad Spend Input */}
        <div className="flex items-center gap-3 p-3 bg-[#f6f7f9] rounded-lg mb-4">
          <Target size={16} className="text-[#9ca3af] flex-shrink-0" />
          <label className="text-sm text-[#4b5563] whitespace-nowrap">Ad Spend:</label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9ca3af]">₹</span>
            <input
              type="number"
              value={adSpend}
              onChange={(e) => handleAdSpendChange(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#d4af37] bg-white"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* CPA / ROAS / Break-even */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg border border-[#e5e7eb]">
            <p className="text-[11px] uppercase tracking-wider text-[#9ca3af] mb-1">CPA</p>
            <p className="text-sm font-bold text-[#111827]">{fmt(cpa)}</p>
          </div>
          <div className="text-center p-2 rounded-lg border border-[#e5e7eb]">
            <p className="text-[11px] uppercase tracking-wider text-[#9ca3af] mb-1">ROAS</p>
            <p className="text-sm font-bold text-[#111827]">{roas}x</p>
          </div>
          <div className={`text-center p-2 rounded-lg border ${isBreakEven ? 'border-[#16a34a] bg-[#f0fdf4]' : 'border-[#ef4444] bg-[#fef2f2]'}`}>
            <p className="text-[11px] uppercase tracking-wider text-[#9ca3af] mb-1">Status</p>
            <p className={`text-sm font-bold ${isBreakEven ? 'text-[#16a34a]' : 'text-[#ef4444]'}`}>
              {isBreakEven ? '✓ Profit' : '✕ Loss'}
            </p>
          </div>
        </div>
      </div>

      {/* AOV Tracking Card */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#d4af37]" />
            <h3 className="font-semibold text-[#111827]">AOV Metrics</h3>
          </div>
          {aov && (
            <div className={`flex items-center gap-1 text-xs font-medium ${aov.aovTrend >= 0 ? 'text-[#16a34a]' : 'text-[#ef4444]'}`}>
              {aov.aovTrend >= 0 ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
              {Math.abs(aov.aovTrend)}% 7d
            </div>
          )}
        </div>

        {aovLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-gray-100 rounded-lg" />
              <div className="h-16 bg-gray-100 rounded-lg" />
              <div className="h-16 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ) : aov ? (
          <div className="space-y-4">
            {/* AOV Today / 7d / 30d */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#fffbf0] rounded-lg p-3">
                <p className="text-xs text-[#b8962e] font-medium mb-1">Today</p>
                <p className="text-lg font-bold text-[#111827]">{fmt(aov.aovToday)}</p>
              </div>
              <div className="bg-[#fffbf0] rounded-lg p-3">
                <p className="text-xs text-[#b8962e] font-medium mb-1">7 Days</p>
                <p className="text-lg font-bold text-[#111827]">{fmt(aov.aov7Days)}</p>
              </div>
              <div className="bg-[#fffbf0] rounded-lg p-3">
                <p className="text-xs text-[#b8962e] font-medium mb-1">30 Days</p>
                <p className="text-lg font-bold text-[#111827]">{fmt(aov.aov30Days)}</p>
              </div>
            </div>

            {/* Detailed metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-[#f6f7f9] rounded-lg">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-[#d4af37]" />
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af]">Bundle Rate</p>
                  <p className="text-sm font-bold text-[#111827]">{aov.bundleAttachmentRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#f6f7f9] rounded-lg">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <ShoppingCart size={16} className="text-[#3b82f6]" />
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af]">Items/Order</p>
                  <p className="text-sm font-bold text-[#111827]">{aov.avgItemsPerOrder}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#f6f7f9] rounded-lg">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <IndianRupee size={16} className="text-[#16a34a]" />
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af]">High-Value %</p>
                  <p className="text-sm font-bold text-[#111827]">{aov.highValueOrderRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#f6f7f9] rounded-lg">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-[#8b5cf6]" />
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af]">Rev/Customer</p>
                  <p className="text-sm font-bold text-[#111827]">{fmt(aov.revenuePerCustomer)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#9ca3af] text-center py-4">No AOV data available</p>
        )}
      </div>
    </div>
  );
}
