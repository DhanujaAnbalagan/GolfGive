import Link from 'next/link';
import { Flag, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Golf flag icon */}
        <div className="flex justify-center">
          <div className="relative">
            <span className="text-[100px] leading-none select-none">⛳</span>
            <div className="absolute -top-2 -right-4 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              404
            </div>
          </div>
        </div>

        {/* Text */}
        <div>
          <h1 className="text-3xl font-extrabold text-white">Out of bounds!</h1>
          <p className="text-neutral-400 mt-3 text-sm leading-relaxed">
            The page you&apos;re looking for has gone into the rough. Let&apos;s get you back on the fairway.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold transition-colors border border-white/10"
          >
            <Flag className="w-4 h-4" />
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
