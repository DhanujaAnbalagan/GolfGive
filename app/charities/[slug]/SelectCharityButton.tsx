'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface SelectCharityButtonProps {
  charityId: string;
  isLoggedIn: boolean;
}

export default function SelectCharityButton({ charityId, isLoggedIn }: SelectCharityButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSelect = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user-charity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charity_id: charityId,
          contribution_percentage: 10 // Default starting contribution
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to select charity');
      }

      setToast({ message: 'Charity selected successfully!', type: 'success' });
      
      // Auto redirect to dashboard/charity after brief delay
      setTimeout(() => {
        router.push('/dashboard/charity');
      }, 1500);
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Internal server error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      <button
        onClick={handleSelect}
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-300"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Heart className="w-5 h-5 fill-current" />
            Select This Charity
          </>
        )}
      </button>
    </>
  );
}
