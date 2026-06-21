'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Target, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  Lock
} from 'lucide-react';

// Client-side score interface
interface Score {
  id: string;
  score: number;
  score_date: string;
  created_at: string;
}

// Zod Schema for score validation (resolves Type Resolver mismatch)
const scoreSchema = z.object({
  score: z.number({ message: 'Score is required' })
    .int('Score must be an integer')
    .min(1, 'Score must be at least 1')
    .max(45, 'Score cannot exceed 45'),
  score_date: z.string().min(1, 'Date is required')
});

type ScoreFormValues = z.infer<typeof scoreSchema>;

interface SubscriptionInfo {
  status: string;
  renewal_date: string;
}

export default function DashboardScoresPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Dialog States
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [deletingScore, setDeletingScore] = useState<Score | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form for Add Form
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<ScoreFormValues>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      score_date: new Date().toISOString().split('T')[0]
    }
  });

  // React Hook Form for Edit Modal Form
  const { 
    register: registerEdit, 
    handleSubmit: handleSubmitEdit, 
    reset: resetEdit,
    formState: { errors: editErrors } 
  } = useForm<ScoreFormValues>({
    resolver: zodResolver(scoreSchema)
  });

  // Utility to show toasts
  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  // Fetch all scores on mount
  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        setScores(data);
      } else {
        throw new Error('Failed to load scores');
      }
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Error fetching scores', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch subscription details
  const fetchSubscription = useCallback(async () => {
    setSubLoading(true);
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
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchScores();
      fetchSubscription();
    });
  }, [fetchScores, fetchSubscription]);

  // Set default values for edit form when editingScore changes
  useEffect(() => {
    if (editingScore) {
      resetEdit({
        score: editingScore.score,
        score_date: editingScore.score_date
      });
    }
  }, [editingScore, resetEdit]);

  // Submit new score handler
  const onAddScore = async (values: ScoreFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit score');
      }

      await fetchScores();
      reset({
        score: undefined,
        score_date: new Date().toISOString().split('T')[0]
      });
      triggerToast('Score logged successfully! History synchronized.', 'success');
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Error submitting score', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit edit score handler
  const onEditScoreSubmit = async (values: ScoreFormValues) => {
    if (!editingScore) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/scores/${editingScore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update score');
      }

      await fetchScores();
      setEditingScore(null);
      triggerToast('Score updated successfully.', 'success');
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Error updating score', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete score confirm handler
  const onDeleteScoreConfirm = async () => {
    if (!deletingScore) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/scores/${deletingScore.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete score');
      }

      await fetchScores();
      setDeletingScore(null);
      triggerToast('Score record deleted successfully.', 'success');
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Error deleting score', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isSubActive = sub && (sub.status === 'active' || (sub.status === 'cancelled' && new Date(sub.renewal_date) >= new Date()));

  return (
    <div className="space-y-8 relative pb-20">
      
      {/* Dynamic Floating Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 transform translate-y-0 animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-neutral-900 border-emerald-500/30 text-emerald-400' 
            : 'bg-neutral-900 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm font-semibold text-white">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="text-neutral-500 hover:text-white transition-colors ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Scores Manager</h1>
        <p className="text-neutral-400 mt-1">Log rounds, analyze history, and support active fundraising goals.</p>
      </div>

      {/* Split Layout Container */}
      <div className="relative">
        {/* Lock Overlay for Inactive Subscriptions */}
        {!subLoading && !isSubActive && (
          <div className="absolute inset-0 z-30 bg-neutral-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-8 rounded-3xl min-h-[400px]">
            <div className="p-4 bg-red-950/50 border border-red-500/30 text-red-400 rounded-full mb-4 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-xl text-white">Scores Log Locked</h3>
            <p className="text-sm text-neutral-400 mt-2 max-w-sm">
              An active premium subscription is required to submit rounds, edit logs, and view your detailed historical scores.
            </p>
            <Link
              href="/pricing"
              className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl text-sm shadow-lg shadow-emerald-950/80 transition-all active:scale-[0.98]"
            >
              Subscribe and Unlock
            </Link>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-300 ${!subLoading && !isSubActive ? 'blur-sm pointer-events-none select-none opacity-30' : ''}`}>
          
          {/* Left Column: Add Score Form */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 h-fit space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Log Golf Round
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Scores must be between 1 and 45. Max 5 scores total.</p>
            </div>

            <form onSubmit={handleSubmit(onAddScore)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Score (1–45)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Target className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    {...register('score', { valueAsNumber: true })}
                    className={`w-full bg-neutral-950/55 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 transition-all ${
                      errors.score ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {errors.score && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.score.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Round Date
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    {...register('score_date')}
                    className={`w-full bg-neutral-950/55 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 transition-all ${
                      errors.score_date ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {errors.score_date && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.score_date.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-xl text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Log Round
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Score History List */}
          <div className="lg:col-span-2 bg-neutral-900 border border-white/5 rounded-2xl p-6 h-fit space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Scores Log History
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Showing scores in reverse chronological order.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : scores.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                <Target className="w-12 h-12 text-neutral-600 mb-3" />
                <h3 className="text-sm font-bold text-neutral-300">No rounds logged yet</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-[240px] mx-auto">
                  Log your first score to start tracking your performance metrics.
                </p>
              </div>
            ) : (
              <div className="border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-neutral-950/50 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">Round Date</th>
                      <th className="py-4 px-6 text-center">Score (Gross)</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-neutral-200">
                    {scores.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-semibold text-white">
                            {new Date(item.score_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 font-bold px-3 py-1 rounded-lg min-w-10">
                            {item.score}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingScore(item)}
                              className="p-2 text-neutral-400 hover:text-white bg-neutral-950 border border-white/5 hover:border-emerald-500/30 rounded-lg transition-all"
                              title="Edit Round"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingScore(item)}
                              className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-950 border border-white/5 hover:border-red-900/30 rounded-lg transition-all"
                              title="Delete Round"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Score Modal */}
      {editingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-500" />
                Edit Golf Score
              </h3>
              <button 
                onClick={() => setEditingScore(null)} 
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onEditScoreSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Score (1–45)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Target className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    {...registerEdit('score', { valueAsNumber: true })}
                    className={`w-full bg-neutral-950/55 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 transition-all ${
                      editErrors.score ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {editErrors.score && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editErrors.score.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Round Date
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    {...registerEdit('score_date')}
                    className={`w-full bg-neutral-950/55 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 transition-all ${
                      editErrors.score_date ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {editErrors.score_date && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editErrors.score_date.message}
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingScore(null)}
                  className="bg-neutral-950 border border-white/5 hover:bg-neutral-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-950 border border-red-500/30 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete score?</h3>
            </div>

            <p className="text-sm text-neutral-400">
              Are you sure you want to delete this score logged for{' '}
              <strong className="text-white">
                {new Date(deletingScore.score_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC'
                })}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingScore(null)}
                className="bg-neutral-950 border border-white/5 hover:bg-neutral-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDeleteScoreConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Delete Score'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
