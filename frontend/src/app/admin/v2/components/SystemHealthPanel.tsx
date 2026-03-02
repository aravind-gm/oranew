'use client';

/**
 * System Health Panel — Phase 10.5
 * =================================
 * Admin dashboard widget showing real-time system diagnostics:
 *  - Service uptime
 *  - Database status
 *  - Redis status + memory
 *  - BullMQ queue stats
 *  - Node.js memory usage
 *  - Auto-refresh every 30 seconds
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Database,
  Server,
  HardDrive,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  AlertTriangle,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: { seconds: number; formatted: string };
  database: { connected: boolean; checkedAt: string };
  redis: { connected: boolean; usedMemory?: string; peakMemory?: string; keys?: number };
  queue: { available: boolean; waiting?: number; active?: number; completed?: number; failed?: number; delayed?: number };
  memory: { rss: string; heapUsed: string; heapTotal: string; external: string };
  cpu: { user: string; system: string };
  environment: { nodeVersion: string; nodeEnv: string; platform: string; pid: number };
}

// ============================================
// STATUS DOT
// ============================================

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        ok ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
      }`}
    />
  );
}

// ============================================
// MINI STAT
// ============================================

function MiniStat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface Props {
  className?: string;
}

export default function SystemHealthPanel({ className = '' }: Props) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const token = localStorage.getItem('ora_token') || localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/admin/system/health`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setHealth(json.data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30s auto-refresh
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // ============================================
  // RENDER
  // ============================================

  if (loading && !health) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-pink-600" />
          <h3 className="font-semibold text-gray-900 text-sm">System Health</h3>
        </div>
        <button
          onClick={fetchHealth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && !health ? (
        <div className="p-5 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Could not fetch system health</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      ) : health ? (
        <div className="p-5 space-y-4">
          {/* Service Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <StatusDot ok={health.database.connected} />
                <span className="text-xs text-gray-600">DB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot ok={health.redis.connected} />
                <span className="text-xs text-gray-600">Redis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot ok={health.queue.available} />
                <span className="text-xs text-gray-600">Queue</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                health.database.connected && health.redis.connected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {health.database.connected && health.redis.connected ? 'All Systems Go' : 'Degraded'}
            </span>
          </div>

          {/* Uptime */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{health.uptime.formatted}</p>
              <p className="text-[10px] text-gray-500">Uptime • PID {health.environment.pid}</p>
            </div>
          </div>

          {/* Memory + Redis */}
          <div className="grid grid-cols-2 gap-3">
            {/* Node Memory */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Server className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Node.js</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{health.memory.heapUsed}</p>
              <p className="text-[10px] text-gray-400">of {health.memory.heapTotal} heap</p>
            </div>

            {/* Redis Memory */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Redis</span>
              </div>
              {health.redis.connected ? (
                <>
                  <p className="text-sm font-bold text-gray-900">{health.redis.usedMemory}</p>
                  <p className="text-[10px] text-gray-400">{health.redis.keys} keys</p>
                </>
              ) : (
                <p className="text-xs text-gray-400">Not connected</p>
              )}
            </div>
          </div>

          {/* Queue Stats */}
          {health.queue.available && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-3">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Job Queue</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <MiniStat label="Active" value={health.queue.active ?? 0} />
                <MiniStat label="Waiting" value={health.queue.waiting ?? 0} />
                <MiniStat label="Done" value={health.queue.completed ?? 0} />
                <MiniStat
                  label="Failed"
                  value={health.queue.failed ?? 0}
                />
              </div>
              {(health.queue.delayed ?? 0) > 0 && (
                <p className="text-[10px] text-amber-600 mt-2 text-center">
                  {health.queue.delayed} delayed jobs
                </p>
              )}
            </div>
          )}

          {/* Environment footer */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
            <span>{health.environment.nodeVersion} • {health.environment.nodeEnv}</span>
            {lastUpdated && (
              <span>
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
