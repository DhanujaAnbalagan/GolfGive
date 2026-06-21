'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { createClient } from '@/lib/supabase/client';
import { Trophy, LogOut, User } from 'lucide-react';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  title: string;
  links: SidebarLink[];
  role: 'user' | 'admin';
}

export default function Sidebar({ links, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-neutral-900 border-r border-white/5 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="p-1.5 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-emerald-400">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight block leading-none">
            GolfGive
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mt-0.5 block">
            {role === 'admin' ? 'Admin Portal' : 'Player Portal'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-950/50 border border-emerald-500/20 text-emerald-400'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isActive ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-300'
              }`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-neutral-950/20 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-white/5"></div>
            <div className="flex-1 space-y-1">
              <div className="h-3.5 bg-white/5 rounded w-24"></div>
              <div className="h-2.5 bg-white/5 rounded w-16"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold uppercase">
              {user?.full_name ? user.full_name.charAt(0) : <User className="w-5 h-5 text-neutral-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.full_name || 'Loading...'}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-red-950/20 border border-white/5 hover:border-red-900/30 text-neutral-400 hover:text-red-400 text-xs font-semibold py-2.5 rounded-xl transition-all duration-300 group"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
