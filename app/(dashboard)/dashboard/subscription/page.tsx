'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCw, 
  Trash2, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  ArrowUpRight
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
}

export default function SubscriptionDashboard() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSub(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch subscription data');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchSubscription();
    });
  }, []);

  const handleCancel = async () => {
    if (!sub) return;
    if (!confirm('Are you sure you want to cancel your subscription auto-renewal? You will keep your member access until the end of your billing cycle.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (res.ok) {
        const updatedSub = await res.json();
        setSub(updatedSub);
        setSuccessMessage('Auto-renewal successfully cancelled. Your access remains active until the end of your billing term.');
        router.refresh();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to cancel subscription');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!sub) return;
    
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'renew' }),
      });

      if (res.ok) {
        const updatedSub = await res.json();
        setSub(updatedSub);
        setSuccessMessage('Subscription successfully renewed! Thank you for supporting GolfGive.');
        router.refresh();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to renew subscription');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper values
  const getDaysRemaining = (renewalDateStr: string) => {
    const end = new Date(renewalDateStr).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  };

  const formatPrice = (amount: number, type: string) => {
    return `$${amount.toFixed(2)} / ${type === 'monthly' ? 'month' : 'year'}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Subscriber
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cancelled (Pending Expiry)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-800 border border-neutral-700 text-neutral-400">
            Inactive
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-neutral-400 text-sm">Syncing your subscription details...</p>
      </div>
    );
  }

  // Active status validator helper (matching service logic)
  const isCurrentlyActive = sub && (sub.status === 'active' || (sub.status === 'cancelled' && new Date(sub.renewal_date) >= new Date()));

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Subscription Management</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Manage your membership, billing cycle, and billing options.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400 text-sm flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Empty State: User has no subscription record */}
      {!sub ? (
        <div className="bg-neutral-900/40 border border-white/10 rounded-3xl p-8 text-center max-w-2xl mx-auto flex flex-col items-center justify-center gap-6 mt-6">
          <div className="p-4 bg-emerald-950/50 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <CreditCard className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold">No Active Membership</h2>
            <p className="text-neutral-400 text-sm mt-2 max-w-md mx-auto">
              Subscribe to a plan to start logging golf rounds, track scores, participate in draws, and support local charities.
            </p>
          </div>
          <Link
            href="/pricing"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/80 active:scale-[0.98]"
          >
            Browse Pricing Plans
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Subscription Details Panel */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-900/5 rounded-full blur-2xl pointer-events-none -z-10"></div>
              
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-1">
                    Current Plan
                  </p>
                  <h2 className="text-2xl font-extrabold capitalize text-white">
                    {sub.plan_type} Subscription
                  </h2>
                </div>
                <div>
                  {getStatusBadge(sub.status)}
                </div>
              </div>

              {/* Progress and Term Info */}
              {isCurrentlyActive && (
                <div className="space-y-4 mb-6">
                  {(() => {
                    const daysLeft = getDaysRemaining(sub.renewal_date);
                    const totalDays = sub.plan_type === 'monthly' ? 30 : 365;
                    const progress = Math.min(100, Math.max(0, (daysLeft / totalDays) * 100));

                    return (
                      <>
                        <div className="flex justify-between items-end text-sm">
                          <span className="text-neutral-400 font-medium">Time remaining</span>
                          <span className="font-bold text-white">{daysLeft} days remaining</span>
                        </div>
                        <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Details table */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-white/5 pt-6 text-sm">
                <div>
                  <span className="text-neutral-500 block">Price & Frequency</span>
                  <span className="font-semibold text-white">{formatPrice(sub.amount, sub.plan_type)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Start Date</span>
                  <span className="font-semibold text-white">
                    {new Date(sub.start_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">
                    {sub.status === 'cancelled' ? 'Access Expiration Date' : 'Next Renewal Date'}
                  </span>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-500/70" />
                    {new Date(sub.renewal_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
                {sub.cancelled_at && (
                  <div>
                    <span className="text-red-400 block">Auto-Renewal Cancelled</span>
                    <span className="font-semibold text-neutral-400 text-xs">
                      {new Date(sub.cancelled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
              <h3 className="font-bold text-lg mb-2">Subscription Settings</h3>
              <p className="text-neutral-400 text-sm mb-6">
                Reactivate your plan, or change settings regarding your billing term.
              </p>

              <div className="flex flex-wrap gap-4">
                {/* Cancel Button */}
                {sub.status === 'active' && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="bg-neutral-950 border border-red-900/20 hover:border-red-950 hover:bg-red-950/20 text-red-400 font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Cancel Auto-Renewal
                  </button>
                )}

                {/* Renew Button */}
                {(sub.status === 'cancelled' || sub.status === 'expired') && (
                  <button
                    onClick={handleRenew}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80 active:scale-[0.98]"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                    Reactivate Auto-Renewal
                  </button>
                )}

                <Link
                  href="/pricing"
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center"
                >
                  Change Billing Plan
                </Link>
              </div>
            </div>
          </div>

          {/* Side Features / Access Status Card */}
          <div className="space-y-6">
            <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Feature Access Status
              </h3>
              
              <ul className="space-y-3.5 text-sm text-neutral-300">
                <li className="flex items-center justify-between">
                  <span>Log Score Entry</span>
                  <span className={`font-semibold ${isCurrentlyActive ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {isCurrentlyActive ? 'Unlocked' : 'Locked'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Draw Participation</span>
                  <span className={`font-semibold ${isCurrentlyActive ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {isCurrentlyActive ? 'Unlocked' : 'Locked'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Dashboard Stats</span>
                  <span className={`font-semibold ${isCurrentlyActive ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {isCurrentlyActive ? 'Unlocked' : 'Locked'}
                  </span>
                </li>
                <li className="flex items-center justify-between border-t border-white/5 pt-3.5">
                  <span>Charity Support Selection</span>
                  <span className="font-semibold text-emerald-400">Unlimited</span>
                </li>
              </ul>

              {!isCurrentlyActive && (
                <div className="mt-6 p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex gap-2.5 text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Your subscriber benefits are currently locked. Renew your plan to start tracking your rounds and enter draws.
                  </span>
                </div>
              )}
            </div>

            {/* Help / support box */}
            <div className="bg-neutral-900/20 border border-white/5 rounded-3xl p-6 flex items-start gap-4">
              <HelpCircle className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Need Billing Help?</h4>
                <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
                  Have questions about payment history, receipt details, or plan options? Reach out to support@golfgive.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
