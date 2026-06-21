'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Shield, Sliders } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Settings</h1>
        <p className="text-neutral-400 mt-1">Configure global application variables, draw schedules, and admin configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: General Profile Form Mockup */}
        <div className="lg:col-span-2 bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Sweepstakes Rules
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Active Scoring Range
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  disabled
                  value="Min: 1"
                  className="w-full bg-neutral-950/55 border border-white/10 rounded-xl py-3 px-4 text-neutral-400 cursor-not-allowed focus:outline-none"
                />
                <input
                  type="text"
                  disabled
                  value="Max: 45"
                  className="w-full bg-neutral-950/55 border border-white/10 rounded-xl py-3 px-4 text-neutral-400 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Scores Per Day Limit
              </label>
              <input
                type="text"
                disabled
                value="1 score entry per player per calendar date"
                className="w-full bg-neutral-950/55 border border-white/10 rounded-xl py-3 px-4 text-neutral-400 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              disabled
              className="bg-emerald-600/50 cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl text-sm"
            >
              Modify System Rules
            </button>
          </div>
        </div>

        {/* Right Side: Account Metadata card */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Admin Account
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Authorized Role</p>
              <div className="mt-1.5 px-3 py-1.5 bg-[#170529] border border-purple-500/20 text-purple-400 text-xs font-bold rounded-lg w-fit uppercase tracking-wider">
                {user?.role || 'admin'}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Account ID</p>
              <p className="text-xs font-mono text-neutral-400 mt-1 break-all bg-neutral-950 p-2 border border-white/5 rounded-lg">
                {user?.id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
