'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Loader2, 
  Play, 
  CheckSquare, 
  AlertCircle, 
  CheckCircle,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Draw {
  id: string;
  draw_month: number;
  draw_year: number;
  draw_type: '5 Match' | '4 Match' | '3 Match';
  status: 'draft' | 'simulation' | 'published' | 'completed';
  winning_numbers: number[] | null;
  jackpot_amount: number;
  simulation_results: Record<string, any> | null;
  created_at: string;
}

const drawSchema = z.object({
  draw_month: z.number({ message: 'Month must be a number' })
    .int()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  draw_year: z.number({ message: 'Year must be a number' })
    .int()
    .min(2026, 'Year must be 2026 or later'),
  draw_type: z.enum(['5 Match', '4 Match', '3 Match'], { message: 'Invalid draw type' }),
  jackpot_amount: z.number({ message: 'Jackpot amount is required' })
    .min(0, 'Jackpot amount cannot be negative')
});

type DrawFormValues = z.infer<typeof drawSchema>;

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [entryCounts, setEntryCounts] = useState<{ [drawId: string]: number }>({});
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [simMode, setSimMode] = useState<'random' | 'weighted'>('random');
  const [manualWinningNumbers, setManualWinningNumbers] = useState<string>('');

  const supabase = createClient();

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DrawFormValues>({
    resolver: zodResolver(drawSchema),
    defaultValues: {
      draw_month: new Date().getMonth() + 1,
      draw_year: new Date().getFullYear(),
      draw_type: '5 Match',
      jackpot_amount: 1000
    }
  });

  const fetchDraws = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/draws');
      if (!res.ok) throw new Error('Failed to load draws');
      const data = await res.json();
      setDraws(data);

      // Fetch entry counts for each draft/simulation/published draw
      const counts: { [drawId: string]: number } = {};
      for (const draw of data) {
        const { count, error } = await supabase
          .from('draw_entries')
          .select('*', { count: 'exact', head: true })
          .eq('draw_id', draw.id);
        if (!error && count !== null) {
          counts[draw.id] = count;
        }
      }
      setEntryCounts(counts);

      // Refresh selected draw reference if open
      if (selectedDraw) {
        const refreshed = data.find((d: Draw) => d.id === selectedDraw.id);
        if (refreshed) {
          setSelectedDraw(refreshed);
        }
      }
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedDraw]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDraws();
    });
  }, [fetchDraws]);

  const onCreateDraw = async (values: DrawFormValues) => {
    setActionLoading('create');
    try {
      const res = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create draw');
      
      triggerToast('Draw scheduled successfully!', 'success');
      setShowCreateModal(false);
      reset();
      fetchDraws();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const onDeleteDraw = async (drawId: string) => {
    if (!confirm('Are you sure you want to delete this draw? This will wipe all player entries for it.')) return;
    
    setActionLoading(`delete-${drawId}`);
    try {
      const res = await fetch(`/api/draws/${drawId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete draw');

      triggerToast('Draw deleted successfully', 'success');
      if (selectedDraw?.id === drawId) {
        setSelectedDraw(null);
      }
      fetchDraws();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const runSimulation = async () => {
    if (!selectedDraw) return;
    setSimulating(true);
    try {
      const res = await fetch(`/api/draws/${selectedDraw.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: simMode })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      triggerToast('Simulation completed and preview stored!', 'success');
      setSelectedDraw(data);
      
      // Prefill manual winning numbers with simulated numbers for easy publishing
      if (data.simulation_results?.winning_numbers) {
        setManualWinningNumbers(data.simulation_results.winning_numbers.join(', '));
      }

      fetchDraws();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSimulating(false);
    }
  };

  const publishDraw = async () => {
    if (!selectedDraw) return;

    // Parse winning numbers from input
    const nums = manualWinningNumbers
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    if (nums.length !== 5) {
      triggerToast('Please provide exactly 5 numbers comma-separated (e.g. 5, 12, 23, 34, 45)', 'error');
      return;
    }

    const uniqueNums = new Set(nums);
    if (uniqueNums.size !== 5 || nums.some(n => n < 1 || n > 45)) {
      triggerToast('Numbers must be unique and between 1 and 45', 'error');
      return;
    }

    if (!confirm('Are you sure you want to PUBLISH this draw? This will freeze entries, write winner records, roll over jackpot pools, and mark it COMPLETED.')) return;

    setPublishing(true);
    try {
      const res = await fetch(`/api/draws/${selectedDraw.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winningNumbers: nums })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to publish draw');

      triggerToast('Draw published and final winners generated!', 'success');
      setSelectedDraw(data);
      fetchDraws();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setPublishing(false);
    }
  };

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast */}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Draw & Reward Engine</h1>
          <p className="text-neutral-400 text-sm mt-1">Schedule draws, run split-pool simulations, and commit completed sweepstakes.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Schedule Draw
        </button>
      </div>

      {/* Main Grid: Left is draws list, Right is detail/controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Draws List */}
        <div className="lg:col-span-6 bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 h-max">
          <h3 className="text-lg font-bold text-white mb-2">Scheduled Draw Batches</h3>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-neutral-500 text-xs">Loading draw records...</p>
            </div>
          ) : draws.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 border border-dashed border-white/5 rounded-2xl">
              <Ticket className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm">No draws scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {draws.map((draw) => {
                const isSelected = selectedDraw?.id === draw.id;
                const entries = entryCounts[draw.id] || 0;
                
                return (
                  <div
                    key={draw.id}
                    onClick={() => {
                      setSelectedDraw(draw);
                      if (draw.simulation_results?.winning_numbers) {
                        setManualWinningNumbers(draw.simulation_results.winning_numbers.join(', '));
                      } else if (draw.winning_numbers) {
                        setManualWinningNumbers(draw.winning_numbers.join(', '));
                      } else {
                        setManualWinningNumbers('');
                      }
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                        : 'bg-neutral-950/40 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {getMonthName(draw.draw_month)} {draw.draw_year}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          draw.status === 'completed'
                            ? 'bg-neutral-800 text-neutral-400 border border-white/5'
                            : draw.status === 'published'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                              : draw.status === 'simulation'
                                ? 'bg-purple-950 text-purple-400 border border-purple-500/20'
                                : 'bg-neutral-950 text-neutral-500 border border-white/5'
                        }`}>
                          {draw.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-neutral-400">
                        <span>Jackpot: <strong className="text-white">${draw.jackpot_amount}</strong></span>
                        <span>Entries: <strong className="text-white">{entries}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDraw(draw.id);
                        }}
                        disabled={actionLoading === `delete-${draw.id}`}
                        className="p-2 bg-neutral-950 hover:bg-red-950/20 border border-white/5 hover:border-red-900/30 text-neutral-500 hover:text-red-400 rounded-xl transition-all"
                      >
                        {actionLoading === `delete-${draw.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Draw Details & Controls */}
        <div className="lg:col-span-6 bg-neutral-900 border border-white/5 rounded-3xl p-6 h-max min-h-[400px]">
          {selectedDraw ? (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {getMonthName(selectedDraw.draw_month)} {selectedDraw.draw_year} Draw Panel
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">ID: {selectedDraw.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  selectedDraw.status === 'completed'
                    ? 'bg-neutral-800 text-neutral-400 border border-white/5'
                    : selectedDraw.status === 'published'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                      : 'bg-neutral-950 text-neutral-500 border border-white/5'
                }`}>
                  {selectedDraw.status}
                </span>
              </div>

              {/* Status Actions */}
              {selectedDraw.status !== 'completed' && (
                <div className="space-y-6">
                  {/* Simulation Controls */}
                  <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-emerald-400" />
                      Run Draw Simulation
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Compute match counts, estimate split-pool prize distributions, and generate temporary winning numbers. Does not modify final winners table.
                    </p>

                    <div className="flex items-center gap-3">
                      <select
                        value={simMode}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSimMode(e.target.value as 'random' | 'weighted')}
                        className="bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs focus:outline-none text-neutral-300 transition-colors flex-1"
                      >
                        <option value="random">Random Selection (1-45)</option>
                        <option value="weighted">Golf Score-Weighted Selection</option>
                      </select>
                      
                      <button
                        onClick={runSimulation}
                        disabled={simulating}
                        className="flex items-center gap-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-2 text-xs rounded-xl transition-all duration-300"
                      >
                        {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        Simulate
                      </button>
                    </div>
                  </div>

                  {/* Publishing Controls */}
                  <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      Publish Final Results
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Commit the final winning numbers. This immediately inserts payout winnings into the winners table and closes entries.
                    </p>

                    <div className="space-y-3">
                      <label className="text-xs text-neutral-400 block font-medium">
                        Winning Numbers (5 unique, comma-separated integers 1-45)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5, 12, 23, 34, 45"
                        value={manualWinningNumbers}
                        onChange={(e) => setManualWinningNumbers(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs focus:outline-none text-white transition-colors font-mono"
                      />
                      
                      <button
                        onClick={publishDraw}
                        disabled={publishing}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition-all duration-300"
                      >
                        {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
                        Commit & Publish Draw
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation/Completed Results Viewer */}
              {(selectedDraw.simulation_results || selectedDraw.winning_numbers) && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <h4 className="text-sm font-bold text-white">
                    {selectedDraw.status === 'completed' ? 'Final Payout Results' : 'Simulation Predictions'}
                  </h4>

                  {/* Winning numbers display */}
                  <div className="flex gap-2 items-center bg-neutral-950/50 border border-white/5 p-3.5 rounded-2xl">
                    <span className="text-xs text-neutral-400 font-medium mr-2">Numbers Drawn:</span>
                    {(selectedDraw.winning_numbers || selectedDraw.simulation_results?.winning_numbers)?.map((n: number, i: number) => (
                      <span key={i} className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-black text-sm flex items-center justify-center">
                        {n}
                      </span>
                    ))}
                  </div>

                  {/* Splits Summary */}
                  {selectedDraw.simulation_results && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-neutral-950/30 border border-white/5 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-neutral-500 block">5 Match Pool (40%)</span>
                        <strong className="text-sm text-white block mt-1">
                          ${selectedDraw.simulation_results.pools?.match5?.toLocaleString()}
                        </strong>
                        <span className="text-[10px] text-emerald-400 block mt-0.5">
                          {selectedDraw.simulation_results.winners_count?.match5 || 0} winners
                        </span>
                        <span className="text-[9px] text-neutral-400 block font-mono">
                          (${selectedDraw.simulation_results.prizes?.match5 || 0} ea)
                        </span>
                      </div>

                      <div className="bg-neutral-950/30 border border-white/5 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-neutral-500 block">4 Match Pool (35%)</span>
                        <strong className="text-sm text-white block mt-1">
                          ${selectedDraw.simulation_results.pools?.match4?.toLocaleString()}
                        </strong>
                        <span className="text-[10px] text-emerald-400 block mt-0.5">
                          {selectedDraw.simulation_results.winners_count?.match4 || 0} winners
                        </span>
                        <span className="text-[9px] text-neutral-400 block font-mono">
                          (${selectedDraw.simulation_results.prizes?.match4 || 0} ea)
                        </span>
                      </div>

                      <div className="bg-neutral-950/30 border border-white/5 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-neutral-500 block">3 Match Pool (25%)</span>
                        <strong className="text-sm text-white block mt-1">
                          ${selectedDraw.simulation_results.pools?.match3?.toLocaleString()}
                        </strong>
                        <span className="text-[10px] text-emerald-400 block mt-0.5">
                          {selectedDraw.simulation_results.winners_count?.match3 || 0} winners
                        </span>
                        <span className="text-[9px] text-neutral-400 block font-mono">
                          (${selectedDraw.simulation_results.prizes?.match3 || 0} ea)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Winners Detail List */}
                  {selectedDraw.simulation_results?.winners_list?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-neutral-400 font-semibold block">Winners Roster ({selectedDraw.simulation_results?.winners_list?.length || 0})</span>
                      <div className="max-h-48 overflow-y-auto bg-neutral-950/40 border border-white/5 rounded-2xl divide-y divide-white/5">
                        {(selectedDraw.simulation_results?.winners_list as Array<{ full_name: string; email: string; match_type: string; prize_amount: number }> | undefined)?.map((winner, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 text-xs">
                            <div>
                              <p className="font-bold text-white">{winner.full_name}</p>
                              <p className="text-[10px] text-neutral-500">{winner.email}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/20 text-emerald-400 rounded-md font-semibold font-mono inline-block mb-1">
                                {winner.match_type} Match
                              </span>
                              <p className="font-bold text-white font-mono">${winner.prize_amount.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center text-neutral-500">
              <Ticket className="w-12 h-12 text-neutral-700 mb-3" />
              <h3 className="font-bold text-base text-white">No Draw Selected</h3>
              <p className="text-sm max-w-xs mt-1">Select a scheduled draw from the list to manage simulations, parameters, and payouts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Draw Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative overflow-hidden animate-zoom-in">
            {/* Close Button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-white/5 rounded-lg text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Schedule Draw Period</h3>
            
            <form onSubmit={handleSubmit(onCreateDraw)} className="space-y-4">
              {/* Month */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold block mb-1.5">Draw Month (1-12)</label>
                <input
                  type="number"
                  {...register('draw_month', { valueAsNumber: true })}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-white transition-colors"
                />
                {errors.draw_month && <p className="text-red-400 text-xs mt-1">{errors.draw_month.message}</p>}
              </div>

              {/* Year */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold block mb-1.5">Draw Year</label>
                <input
                  type="number"
                  {...register('draw_year', { valueAsNumber: true })}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-white transition-colors"
                />
                {errors.draw_year && <p className="text-red-400 text-xs mt-1">{errors.draw_year.message}</p>}
              </div>

              {/* Draw Type */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold block mb-1.5">Draw Type / Match Rule</label>
                <select
                  {...register('draw_type')}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-neutral-300 transition-colors"
                >
                  <option value="5 Match">5 Match sweepstakes</option>
                  <option value="4 Match">4 Match sweepstakes</option>
                  <option value="3 Match">3 Match sweepstakes</option>
                </select>
                {errors.draw_type && <p className="text-red-400 text-xs mt-1">{errors.draw_type.message}</p>}
              </div>

              {/* Jackpot */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold block mb-1.5">Base Jackpot Amount ($)</label>
                <input
                  type="number"
                  {...register('jackpot_amount', { valueAsNumber: true })}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-white transition-colors"
                />
                {errors.jackpot_amount && <p className="text-red-400 text-xs mt-1">{errors.jackpot_amount.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={actionLoading === 'create'}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold py-3 rounded-xl text-sm transition-all duration-300 mt-2"
              >
                {actionLoading === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                Create Schedule Period
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
