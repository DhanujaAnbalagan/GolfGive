'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { ShieldAlert, Users, Settings, CreditCard, Ticket, Trophy, BarChart3, ClipboardList } from 'lucide-react';

const adminLinks = [
  { label: 'Admin Overview', href: '/admin', icon: ShieldAlert },
  { label: 'All Golf Scores', href: '/admin/scores', icon: Users },
  { label: 'Manage Draws', href: '/admin/draws', icon: Ticket },
  { label: 'Platform Winners', href: '/admin/winners', icon: Trophy },
  { label: 'BI Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Audit Logs', href: '/admin/audit', icon: ClipboardList },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#07050b] text-white min-h-screen">
      {/* Admin Sidebar */}
      <Sidebar title="Admin Dashboard" links={adminLinks} role="admin" />
      
      {/* Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
