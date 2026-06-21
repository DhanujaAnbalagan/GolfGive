'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Heart, 
  Settings, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  ChevronRight,
  HelpCircle,
  DollarSign
} from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  website_url: string | null;
}

interface UserSelection {
  id: string;
  charity_id: string;
  contribution_percentage: number;
  charity: Charity;
}

const percentageSchema = z.object({
  contribution_percentage: z.number({ message: 'Percentage is required' })
    .int('Percentage must be an integer')
    .min(10, 'Minimum contribution is 10%')
    .max(100, 'Maximum contribution is 100%')
});

type FormValues = z.infer<typeof percentageSchema>;

export default function PlayerCharityPage() {
  const [selection, setSelection] = useState<UserSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Live slider percentage value (synced with react-hook-form watched value)
  const [livePercentage, setLivePercentage] = useState(10);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(percentageSchema),
    defaultValues: {
      contribution_percentage: 10
    }
  });

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    let active = true;
    const fetchUserCharity = async () => {
      try {
        const res = await fetch('/api/user-charity');
        if (res.ok && active) {
          const data = await res.json();
          setSelection(data);
          if (data) {
            setValue('contribution_percentage', data.contribution_percentage);
            setLivePercentage(data.contribution_percentage);
          }
        }
      } catch (error) {
        console.error('Error loading selection:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchUserCharity();
    return () => {
      active = false;
    };
  }, [setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!selection) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/user-charity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contribution_percentage: values.contribution_percentage
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes');
      }

      setSelection({
        ...selection,
        contribution_percentage: data.contribution_percentage
      });
      triggerToast('Contribution settings saved!', 'success');
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Mock subscription donation calculation
  const monthlySubscription = 100; // Base $100
  const charityAmount = (monthlySubscription * livePercentage) / 100;

  return (
    <div className="space-y-8 relative pb-20">
      
      {/* Floating Toast Notification */}
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
        <h1 className="text-3xl font-extrabold tracking-tight">Charity Selection</h1>
        <p className="text-neutral-400 mt-1">Designate your round sweepstakes donations and configure contribution shares.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-neutral-400">Loading details...</p>
        </div>
      ) : !selection ? (
        /* Empty State */
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto min-h-[350px]">
          <div className="p-4 bg-emerald-950/50 border border-emerald-500/25 rounded-2xl w-fit text-emerald-400 mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">No Charity Selected</h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-xs leading-relaxed">
            You haven&apos;t linked a charity partner to your Player Profile yet. Select an organization to receive score-backed sweepstakes donations.
          </p>
          <Link 
            href="/charities"
            className="mt-8 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl text-sm shadow-md transition-all active:scale-[0.98] group"
          >
            Browse Partner Charities
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      ) : (
        /* Dynamic Select Screen */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns: Selected Charity Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <div className="aspect-[21/9] w-full relative bg-neutral-950 border-b border-white/5">
                  <Image 
                    src={selection.charity.image_url} 
                    alt={selection.charity.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="p-6 md:p-8 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit block">
                    Active Charity selection
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">{selection.charity.name}</h2>
                  <p className="text-neutral-400 text-sm leading-relaxed font-light font-sans">
                    {selection.charity.description}
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 border-t border-white/5 bg-neutral-950/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
                {selection.charity.website_url && (
                  <a 
                    href={selection.charity.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Official Website
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                
                <Link 
                  href="/charities"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-neutral-950 hover:bg-neutral-800 border border-white/5 text-neutral-300 font-semibold py-2.5 px-5 rounded-xl text-xs transition-colors"
                >
                  Change selected Charity
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Settings and Live Donation Preview */}
          <div className="space-y-6">
            
            {/* Setting Form Card */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                Contribution Percentage
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Share Ratio
                    </label>
                    <span className="text-sm font-bold text-emerald-400">
                      {livePercentage}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    {...register('contribution_percentage', { 
                      valueAsNumber: true,
                      onChange: (e) => setLivePercentage(Number(e.target.value))
                    })}
                    className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                  />
                  
                  {errors.contribution_percentage && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.contribution_percentage.message}
                    </p>
                  )}
                </div>

                {/* Live simulation Preview */}
                <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Live Preview Simulation
                  </p>
                  
                  <div className="space-y-1.5 text-xs text-neutral-400">
                    <div className="flex items-center justify-between">
                      <span>Monthly Subscription</span>
                      <span className="font-semibold text-white">$100.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Contribution Percentage</span>
                      <span className="font-semibold text-white">{livePercentage}%</span>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex items-center justify-between font-bold text-sm">
                      <span className="text-emerald-400 flex items-center">
                        <DollarSign className="w-4 h-4 -translate-y-0.5" />
                        Charity Receives
                      </span>
                      <span className="text-emerald-400">${charityAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
