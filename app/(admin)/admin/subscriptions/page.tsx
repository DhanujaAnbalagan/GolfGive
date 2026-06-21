'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Trash2, 
  Loader2, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  renewal_date: string;
  cancelled_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const res = await fetch(`/api/subscriptions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubs(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch subscription records');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSubscriptions();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchSubscriptions]);

  const handleDelete = async (subId: string) => {
    if (!confirm('Are you sure you want to delete this subscription? This will immediately remove their member status and access.')) {
      return;
    }

    try {
      setActionLoading(subId);
      setError('');
      setSuccess('');

      const res = await fetch(`/api/subscriptions/${subId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('Subscription successfully deleted.');
        setSubs(prev => prev.filter(sub => sub.id !== subId));
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to delete subscription');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting subscription');
    } finally {
      setActionLoading(null);
    }
  };

  // Compute metrics dynamically from the unfiltered list
  const activeSubs = subs.filter(sub => {
    const isPast = new Date(sub.renewal_date) < new Date();
    if (sub.status === 'active' && !isPast) return true;
    if (sub.status === 'cancelled' && !isPast) return true;
    return false;
  });

  const activeCount = activeSubs.length;
  const monthlyCount = activeSubs.filter(s => s.plan_type === 'monthly').length;
  const yearlyCount = activeSubs.filter(s => s.plan_type === 'yearly').length;

  // Estimated Monthly Recurring Revenue (MRR)
  const mrr = activeSubs.reduce((sum, s) => {
    if (s.plan_type === 'monthly') return sum + s.amount;
    return sum + (s.amount / 12);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Platform Billing & Subscriptions</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Monitor members, billing plans, and dynamic recurring revenue.
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-xl transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400 text-sm flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">Active Subscribers</span>
            <span className="text-2xl font-black text-white">{activeCount}</span>
          </div>
          <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">Monthly Plans</span>
            <span className="text-2xl font-black text-white">{monthlyCount}</span>
          </div>
          <div className="p-3 bg-blue-950 text-blue-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">Yearly Plans</span>
            <span className="text-2xl font-black text-white">{yearlyCount}</span>
          </div>
          <div className="p-3 bg-purple-950 text-purple-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">Est. MRR</span>
            <span className="text-2xl font-black text-emerald-400">${mrr.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-900/40 p-4 rounded-2xl border border-white/5">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none transition-colors"
            placeholder="Search by player or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dropdown status */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <Filter className="w-4 h-4 text-neutral-500 hidden md:block" />
          <select
            className="w-full md:w-44 bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-neutral-300 transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="cancelled">Cancelled Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/20 border border-white/5 rounded-3xl">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <span className="text-sm text-neutral-500">Querying platform billing records...</span>
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/20 border border-white/5 rounded-3xl">
          <CreditCard className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="font-bold text-lg">No Subscriptions Found</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Try adjusting your search criteria or status filter.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900/20 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-neutral-950/50 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Player</th>
                  <th className="py-4 px-6">Plan</th>
                  <th className="py-4 px-6">Billing Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Start Date</th>
                  <th className="py-4 px-6">Renewal Date</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-neutral-200">
                {subs.map((sub) => {
                  const isPast = new Date(sub.renewal_date) < new Date();
                  const isCurrentlyActive = sub.status === 'active' && !isPast;
                  const isCancelledButActive = sub.status === 'cancelled' && !isPast;
                  const isExpired = sub.status === 'expired' || (sub.status === 'active' && isPast) || (sub.status === 'cancelled' && isPast);

                  return (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-white leading-tight">
                            {sub.profiles?.full_name || 'Deleted Account'}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {sub.profiles?.email || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="capitalize font-medium">{sub.plan_type}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-emerald-400">${sub.amount.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-6">
                        {isCurrentlyActive && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                            Active
                          </span>
                        )}
                        {isCancelledButActive && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md" title="Active until renewal date">
                            Pending Expiry
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-neutral-400 text-xs">
                        {new Date(sub.start_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-4 px-6 text-neutral-400 text-xs">
                        {new Date(sub.renewal_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDelete(sub.id)}
                          disabled={actionLoading === sub.id}
                          className="p-2 bg-neutral-950 hover:bg-red-950/20 border border-white/5 hover:border-red-900/30 text-neutral-500 hover:text-red-400 rounded-xl transition-all"
                          title="Delete Subscription"
                        >
                          {actionLoading === sub.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
