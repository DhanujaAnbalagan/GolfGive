'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { LayoutDashboard, Target, Settings, CreditCard, Ticket, Award, LineChart } from 'lucide-react';

const userLinks = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Scores', href: '/dashboard/scores', icon: Target },
  { label: 'Monthly Draws', href: '/dashboard/draws', icon: Ticket },
  { label: 'My Winnings', href: '/dashboard/winnings', icon: Award },
  { label: 'My Insights', href: '/dashboard/analytics', icon: LineChart },
  { label: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#050b08] text-white min-h-screen">
      {/* Dashboard Sidebar */}
      <Sidebar title="Player Dashboard" links={userLinks} role="user" />
      
      {/* Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
