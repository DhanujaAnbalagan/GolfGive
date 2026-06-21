'use client';

import { useEffect } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <AlertOctagon className="w-10 h-10 text-orange-400" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-extrabold">Critical Application Error</h1>
            <p className="text-neutral-400 mt-2 text-sm">
              The application encountered a fatal error. Please refresh to continue.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-neutral-900 border border-orange-500/10 rounded-xl p-4 text-left">
              <p className="text-xs font-mono text-orange-400 break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-neutral-500 mt-1">Digest: {error.digest}</p>
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
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
