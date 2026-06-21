'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in development; replace with Sentry/logging service in production
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Something went wrong</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            An unexpected error occurred. Please try again, or contact support if the problem persists.
          </p>
        </div>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-neutral-900 border border-white/5 rounded-xl p-4 text-left">
            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-neutral-500 mt-1">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold transition-colors border border-white/10"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
