'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { 
  Trophy, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  Calendar, 
  Target, 
  Loader2,
  ChevronRight,
  Heart,
  DollarSign
} from 'lucide-react';

interface Score {
  id: string;
  score: number;
  score_date: string;
  created_at: string;
}

interface CharitySelection {
  contribution_percentage: number;
  charity: {
    name: string;
    description: string;
  };
}

interface Subscription {
  plan_type: string;
  amount: number;
  status: string;
  renewal_date: string;
}

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<CharitySelection | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(true);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores');
        if (res.ok) {
          const data = await res.json();
          setScores(data);
        }
      } catch (error) {
        console.error('Error fetching scores:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSelection = async () => {
      try {
        const res = await fetch('/api/user-charity');
        if (res.ok) {
          const data = await res.json();
          setSelection(data);
        }
      } catch (error) {
        console.error('Error fetching selection:', error);
      } finally {
        setSelectionLoading(false);
      }
    };

    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions');
        if (res.ok) {
          const data = await res.json();
          setSub(data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setSubLoading(false);
      }
    };

    fetchScores();
    fetchSelection();
    fetchSubscription();
  }, []);

  // Calculate analytics
  const scoreValues = scores.map((s) => s.score);
  const highestScore = scoreValues.length > 0 ? Math.max(...scoreValues) : null;
  const lowestScore = scoreValues.length > 0 ? Math.min(...scoreValues) : null;
  const averageScore = scoreValues.length > 0 
    ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(1)
    : null;

  const isSubActive = sub && (sub.status === 'active' || (sub.status === 'cancelled' && new Date(sub.renewal_date) >= new Date()));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {user?.full_name || 'Player'}!</h1>
        <p className="text-neutral-400 mt-1">Here is a quick look at your golf performance and activity.</p>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Lowest Score Widget (Golf Best) */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-1/2 right-4 -translate-y-1/2 text-neutral-800 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
            <Trophy className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Lowest Score</p>
          <p className="text-4xl font-extrabold text-white mt-2">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            ) : lowestScore !== null ? (
              lowestScore
            ) : (
              '--'
            )}
          </p>
          <p className="text-xs text-neutral-500 mt-2">Your best registered golf round</p>
        </div>

        {/* Highest Score Widget */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-1/2 right-4 -translate-y-1/2 text-neutral-800 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
            <TrendingUp className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Highest Score</p>
          <p className="text-4xl font-extrabold text-white mt-2">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            ) : highestScore !== null ? (
              highestScore
            ) : (
              '--'
            )}
          </p>
          <p className="text-xs text-neutral-500 mt-2">Your highest registered golf round</p>
        </div>

        {/* Average Score Widget */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-1/2 right-4 -translate-y-1/2 text-neutral-800 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
            <Activity className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Average Score</p>
          <p className="text-4xl font-extrabold text-white mt-2">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            ) : averageScore !== null ? (
              averageScore
            ) : (
              '--'
            )}
          </p>
          <p className="text-xs text-neutral-500 mt-2">Calculated dynamically across rounds</p>
        </div>

        {/* Subscription Plan Card */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Subscription Status</p>
            {subLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mt-3" />
            ) : sub ? (
              <div className="mt-2.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isSubActive ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="font-extrabold text-white capitalize text-lg">
                    {sub.plan_type} Plan
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {isSubActive 
                    ? `Billing: ${new Date(sub.renewal_date).toLocaleDateString(undefined, { dateStyle: 'short' })}`
                    : `Expired: ${new Date(sub.renewal_date).toLocaleDateString(undefined, { dateStyle: 'short' })}`
                  }
                </p>
              </div>
            ) : (
              <div className="mt-2.5">
                <p className="text-sm font-bold text-red-500/90 flex items-center gap-1">No Active Plan</p>
                <p className="text-xs text-neutral-500 mt-0.5">Subscribe to start tracking</p>
              </div>
            )}
          </div>
          <Link 
            href="/dashboard/subscription"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-4"
          >
            Manage Billing
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Latest Scores Card */}
        <div className="lg:col-span-2 bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6 relative overflow-hidden">
          {/* Lock Overlay if inactive */}
          {!subLoading && !isSubActive && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-6">
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 rounded-full mb-3">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Scores Locked</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                An active subscription is required to log scores, view history, and enter draws.
              </p>
              <Link
                href="/pricing"
                className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
              >
                Unlock with Premium
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Latest Scores
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">Summary of your last 5 golf score submissions.</p>
            </div>
            
            <Link 
              href="/dashboard/scores" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group"
            >
              Manage Scores
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[180px]">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : scores.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[180px]">
              <Target className="w-10 h-10 text-neutral-600 mb-3" />
              <h3 className="text-xs font-bold text-neutral-300">No rounds logged yet</h3>
              <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px] mx-auto">
                Log your first score to start tracking your performance metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.slice(0, 5).map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 bg-neutral-950 border border-white/5 rounded-xl hover:border-emerald-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-300">
                      {new Date(item.score_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-medium">Score:</span>
                    <span className="bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 text-sm font-bold px-2.5 py-0.5 rounded-lg">
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Column: Selected Charity Widget */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute -right-16 -bottom-16 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          {selectionLoading ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : !selection ? (
            <div className="space-y-4 flex flex-col h-full justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center justify-center bg-red-950 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Required
                </span>
                <h3 className="text-lg font-bold text-white">No Charity Selected</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  To enter weekly score-backed sweepstakes, you must link an active charity partner to your profile.
                </p>
              </div>

              <Link
                href="/charities"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] group"
              >
                Select a Charity
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col h-full justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1 bg-emerald-950 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md w-fit">
                  <Heart className="w-3 h-3 fill-current" />
                  Linked Charity
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white truncate">{selection.charity.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2 font-light">
                    {selection.charity.description}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Contribution Share</span>
                    <span className="font-bold text-white">{selection.contribution_percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center">
                      <DollarSign className="w-3.5 h-3.5" />
                      Est. Donation
                    </span>
                    <span className="font-bold text-emerald-400">
                      ${((100 * selection.contribution_percentage) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/charity"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 border border-white/5 text-neutral-300 font-semibold py-3 px-4 rounded-xl text-xs transition-colors group"
              >
                Manage Selection
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
