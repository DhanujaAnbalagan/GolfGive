'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { User, Shield } from 'lucide-react';

export default function DashboardSettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-neutral-400 mt-1">Manage your player profile details and default preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: General Profile Form Mockup */}
        <div className="lg:col-span-2 bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={user?.full_name || ''}
                className="w-full bg-neutral-950/55 border border-white/10 rounded-xl py-3 px-4 text-neutral-400 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-neutral-950/55 border border-white/10 rounded-xl py-3 px-4 text-neutral-400 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              disabled
              className="bg-emerald-600/50 cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Right Side: Account Metadata card */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Security & Role
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Authorized Role</p>
              <div className="mt-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg w-fit uppercase tracking-wider">
                {user?.role || 'user'}
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
