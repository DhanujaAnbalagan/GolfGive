'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ShieldAlert } from 'lucide-react';

export default function AdminOverviewPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Panel</h1>
        <p className="text-neutral-400 mt-1">Hello, {user?.full_name || 'Admin'}. Monitor platform metrics, users, and charity sweepstakes.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Players</p>
          <p className="text-4xl font-extrabold text-white mt-2">1</p>
          <p className="text-xs text-emerald-500 mt-2">Active now</p>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Scores Logged</p>
          <p className="text-4xl font-extrabold text-white mt-2">0</p>
          <p className="text-xs text-neutral-500 mt-2">Across all profiles</p>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Active Sweepstakes</p>
          <p className="text-4xl font-extrabold text-white mt-2">0</p>
          <p className="text-xs text-neutral-500 mt-2">Draw engine offline</p>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Funds Raised</p>
          <p className="text-4xl font-extrabold text-white mt-2">$0.00</p>
          <p className="text-xs text-neutral-500 mt-2">For charity campaigns</p>
        </div>
      </div>

      {/* Placeholder content card */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <ShieldAlert className="w-12 h-12 text-emerald-500/55 mb-4" />
        <h3 className="text-lg font-bold">Admin Console</h3>
        <p className="text-sm text-neutral-400 max-w-sm mt-2">
          This panel will house admin-only tables for managing users, editing profiles, launching sweepstakes, and designating charity distributions.
        </p>
      </div>
    </div>
  );
}
