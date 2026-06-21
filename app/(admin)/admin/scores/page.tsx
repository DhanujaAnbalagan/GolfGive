'use client';

import React from 'react';
import { Users, Search } from 'lucide-react';

export default function AdminScoresPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Global Golf Scores</h1>
        <p className="text-neutral-400 mt-1">Review and manage scores submitted across all player accounts.</p>
      </div>

      {/* Search Filter Mockup */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by player name or email..."
            className="w-full bg-neutral-950/55 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            disabled
          />
        </div>
        <div className="text-xs text-neutral-500">
          Showing 0 scores
        </div>
      </div>

      {/* Table Placeholder */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/20 rounded-2xl w-fit text-emerald-400 mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold">No Records Found</h3>
        <p className="text-sm text-neutral-400 max-w-sm mt-2">
          Global scores submitted by players will compile into an administrative master list here, once active data is populated.
        </p>
      </div>
    </div>
  );
}
