'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  'user.login': 'bg-blue-500/20 text-blue-300',
  'user.register': 'bg-green-500/20 text-green-300',
  'score.create': 'bg-emerald-500/20 text-emerald-300',
  'score.delete': 'bg-red-500/20 text-red-300',
  'draw.publish': 'bg-purple-500/20 text-purple-300',
  'draw.simulate': 'bg-yellow-500/20 text-yellow-300',
  'winner.verify': 'bg-teal-500/20 text-teal-300',
  'winner.pay': 'bg-indigo-500/20 text-indigo-300',
  'subscription.create': 'bg-cyan-500/20 text-cyan-300',
  'subscription.cancel': 'bg-orange-500/20 text-orange-300',
  default: 'bg-neutral-700/40 text-neutral-300',
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] || ACTION_COLORS.default;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PAGE_SIZE = 20;

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        ...(actionFilter && { action: actionFilter }),
      });

      const res = await fetch(`/api/audit?${params}`);
      const json = await res.json();

      if (res.ok) {
        setLogs(json.logs || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchLogs();
    });
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredLogs = search
    ? logs.filter((log) =>
        log.action.includes(search.toLowerCase()) ||
        log.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-violet-400" />
            Audit Logs
          </h1>
          <p className="text-neutral-400 mt-1 text-sm">
            Full trail of all platform actions. Read-only.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 border border-white/10 hover:bg-neutral-700 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Total count */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl px-6 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <span className="text-sm text-neutral-400">
          <span className="text-white font-bold">{total.toLocaleString()}</span> total audit events recorded
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by action, user or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            className="pl-10 pr-8 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="user.login">user.login</option>
            <option value="user.register">user.register</option>
            <option value="score.create">score.create</option>
            <option value="score.delete">score.delete</option>
            <option value="draw.create">draw.create</option>
            <option value="draw.simulate">draw.simulate</option>
            <option value="draw.publish">draw.publish</option>
            <option value="winner.verify">winner.verify</option>
            <option value="winner.pay">winner.pay</option>
            <option value="subscription.create">subscription.create</option>
            <option value="subscription.cancel">subscription.cancel</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {log.actor_email ?? <span className="text-neutral-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-neutral-400">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-neutral-600 text-xs ml-1">#{log.entity_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 font-mono text-xs">
                      {log.ip_address ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-neutral-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg bg-neutral-800 border border-white/10 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg bg-neutral-800 border border-white/10 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
