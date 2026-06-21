'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { 
  Trophy, 
  Ticket, 
  Calendar, 
  Coins, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';

interface Draw {
  id: string;
  draw_month: number;
  draw_year: number;
  draw_type: string;
  status: 'draft' | 'simulation' | 'published' | 'completed';
  winning_numbers: number[] | null;
  jackpot_amount: number;
  simulation_results: Record<string, unknown> | null;
  created_at: string;
}

interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  entry_numbers: number[];
  created_at: string;
}

export default function PlayerDrawsPage() {
  const { user } = useAuthStore();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [userEntry, setUserEntry] = useState<DrawEntry | null>(null);
  const [rollover, setRollover] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<{ status: string; renewal_date: string } | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  
  // Selection state
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [withdrawingEntry, setWithdrawingEntry] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const supabase = createClient();

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch draws from API
      const res = await fetch('/api/draws');
      if (!res.ok) throw new Error('Failed to fetch draws');
      const drawsData = await res.json();
      setDraws(drawsData);

      // Active draw is a published draw (open for entries)
      const active = drawsData.find((d: Draw) => d.status === 'published') || null;
      setActiveDraw(active);

      if (active && user) {
        // Fetch user's entry for active draw
        const { data: entry } = await supabase
          .from('draw_entries')
          .select('*')
          .eq('draw_id', active.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setUserEntry(entry);
        if (entry) {
          setSelectedNumbers(entry.entry_numbers || []);
        } else {
          setSelectedNumbers([]);
        }
      }
    } catch (err: unknown) {
      console.error('Error loading draws data:', err);
      triggerToast(err instanceof Error ? err.message : 'Error loading page data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const loadSubscription = useCallback(async () => {
    setSubLoading(true);
    try {
      const res = await fetch('/api/subscriptions');
      if (res.ok) {
        const subData = await res.json();
        setSub(subData);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  const loadRollover = useCallback(async () => {
    try {
      // Get all completed draws sorted chronologically
      const { data: completedDraws } = await supabase
        .from('draws')
        .select('id, jackpot_amount')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (!completedDraws) return;

      let currentRollover = 0;
      for (const draw of completedDraws) {
        const { count } = await supabase
          .from('winners')
          .select('*', { count: 'exact', head: true })
          .eq('draw_id', draw.id)
          .eq('match_type', 5);

        const draw5MatchPool = (draw.jackpot_amount * 0.40) + currentRollover;

        if (count && count > 0) {
          currentRollover = 0;
        } else {
          currentRollover = draw5MatchPool;
        }
      }
      setRollover(Number(currentRollover.toFixed(2)));
    } catch (err) {
      console.error('Error getting rollover:', err);
    }
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadSubscription();
      loadData();
      loadRollover();
    });
  }, [loadSubscription, loadData, loadRollover]);

  const handleNumberClick = (num: number) => {
    if (userEntry) return; // Cannot edit once submitted (must withdraw first)

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= 5) {
        triggerToast('You can only select up to 5 numbers', 'error');
        return;
      }
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const submitEntry = async () => {
    if (!activeDraw) return;
    if (selectedNumbers.length !== 5) {
      triggerToast('Please select exactly 5 numbers', 'error');
      return;
    }

    setSubmittingEntry(true);
    try {
      const res = await fetch(`/api/draws/${activeDraw.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_numbers: selectedNumbers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit entry');

      setUserEntry(data);
      triggerToast('Draw entry submitted successfully!', 'success');
      loadData();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmittingEntry(false);
    }
  };

  const withdrawEntry = async () => {
    if (!activeDraw) return;

    setWithdrawingEntry(true);
    try {
      const res = await fetch(`/api/draws/${activeDraw.id}/entries`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw entry');

      setUserEntry(null);
      setSelectedNumbers([]);
      triggerToast('Entry withdrawn successfully', 'success');
      loadData();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setWithdrawingEntry(false);
    }
  };

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
  };

  const isSubActive = sub && (sub.status === 'active' || (sub.status === 'cancelled' && new Date(sub.renewal_date) >= new Date()));

  if (loading || subLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-neutral-400 text-sm">Loading draws dashboard...</p>
      </div>
    );
  }

  // Active Membership Guard
  if (!isSubActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Monthly Draws</h1>
          <p className="text-neutral-400 mt-1">Participate in monthly sweepstakes and support charity causes.</p>
        </div>

        <div className="relative overflow-hidden bg-neutral-900 border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center max-w-2xl mx-auto mt-12">
          {/* Background overlay glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full"></div>
          
          <div className="relative p-4 bg-emerald-950/50 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-6">
            <Lock className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">
            Active Subscription Required
          </h2>
          <p className="text-neutral-400 text-sm max-w-sm mb-8 leading-relaxed">
            Only active GolfGive subscribers can enter monthly draws and qualify for jackpot rewards. Join our premium plans to gain access.
          </p>

          <Link
            href="/dashboard/subscription"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-6 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25"
          >
            Upgrade to Premium
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20' 
            : 'bg-red-950/90 border-red-500/30 text-red-400 shadow-red-950/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Monthly Draws</h1>
          <p className="text-neutral-400 mt-1">Submit your lucky numbers and win cash prize pools.</p>
        </div>
        
        {activeDraw && (
          <div className="flex items-center gap-2 bg-neutral-900 border border-white/5 rounded-2xl px-4 py-2.5 self-start">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-white">
              {getMonthName(activeDraw.draw_month)} {activeDraw.draw_year} Draw
            </span>
          </div>
        )}
      </div>

      {/* Active Draw Panel */}
      {activeDraw ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Draw Info & Hero Banner */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/60 to-neutral-900 border border-emerald-500/10 rounded-3xl p-8 flex flex-col justify-between h-full min-h-[300px]">
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/10 blur-3xl rounded-full"></div>
              
              <div className="space-y-4 relative">
                <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider rounded-full">
                  Open for Entries
                </span>
                
                <h3 className="text-neutral-400 font-medium text-sm">Active Jackpot Pool</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight text-white">
                    ${(activeDraw.jackpot_amount + rollover).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                {rollover > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/10 px-3 py-1.5 rounded-lg w-max">
                    <Coins className="w-3.5 h-3.5" />
                    Includes ${rollover.toLocaleString()} Jackpot Rollover!
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-white/5 text-xs text-neutral-400 space-y-2 relative">
                <div className="flex justify-between">
                  <span>Draw Category:</span>
                  <span className="font-semibold text-white">{activeDraw.draw_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entry Fee:</span>
                  <span className="font-semibold text-emerald-400">Included in Membership</span>
                </div>
                <div className="flex justify-between">
                  <span>Selection Format:</span>
                  <span className="font-semibold text-white">5 unique numbers (1 - 45)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Number Selector / Entry Status */}
          <div className="lg:col-span-7 bg-neutral-900 border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Your Selection</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {userEntry ? 'Your entry is locked and registered.' : 'Select 5 unique numbers from 1 to 45.'}
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((index) => {
                  const num = selectedNumbers[index];
                  return (
                    <div 
                      key={index} 
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        num 
                          ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400' 
                          : 'bg-neutral-950 border-white/5 text-neutral-600'
                      }`}
                    >
                      {num || ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-9 gap-2">
              {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                const isSelected = selectedNumbers.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    disabled={!!userEntry}
                    className={`h-10 rounded-xl border text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? 'bg-emerald-500 border-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/10' 
                        : userEntry
                          ? 'bg-neutral-950 border-white/5 text-neutral-600 cursor-not-allowed'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/5 flex gap-4">
              {userEntry ? (
                <button
                  onClick={withdrawEntry}
                  disabled={withdrawingEntry}
                  className="flex-1 flex items-center justify-center gap-2 bg-neutral-950 hover:bg-red-950/20 border border-white/5 hover:border-red-900/30 text-neutral-400 hover:text-red-400 font-bold py-3.5 rounded-xl transition-all duration-300"
                >
                  {withdrawingEntry ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Withdraw Entry
                </button>
              ) : (
                <button
                  onClick={submitEntry}
                  disabled={submittingEntry || selectedNumbers.length !== 5}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold py-3.5 rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {submittingEntry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                  Submit Entry
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <Trophy className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">No Active Draw</h3>
          <p className="text-neutral-400 text-sm mt-2 leading-relaxed">
            There are currently no active draws open for entries. Please check back later when administrators launch the next monthly draw schedule.
          </p>
        </div>
      )}

      {/* Past Draws History */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Past Draws History</h3>
        
        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-neutral-400 font-semibold text-xs bg-neutral-950/30">
                  <th className="px-6 py-4">Draw Date</th>
                  <th className="px-6 py-4">Draw Type</th>
                  <th className="px-6 py-4">Jackpot Pool</th>
                  <th className="px-6 py-4">Winning Numbers</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {draws.filter(d => d.status === 'completed' || d.status === 'published').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-neutral-500">
                      No draw history available yet.
                    </td>
                  </tr>
                ) : (
                  draws
                    .filter(d => d.status === 'completed' || d.status === 'published')
                    .map((draw) => (
                      <tr key={draw.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                          {getMonthName(draw.draw_month)} {draw.draw_year}
                        </td>
                        <td className="px-6 py-4 text-neutral-300">
                          {draw.draw_type}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-300">
                          ${draw.jackpot_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {draw.winning_numbers ? (
                            <div className="flex gap-1">
                              {draw.winning_numbers.map((n, i) => (
                                <span key={i} className="w-6 h-6 rounded-md bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                                  {n}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                            draw.status === 'completed' 
                              ? 'bg-neutral-800 border border-white/5 text-neutral-400' 
                              : 'bg-emerald-950/50 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {draw.status === 'completed' ? 'Completed' : 'Open'}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
