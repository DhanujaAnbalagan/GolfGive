'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Database,
  Activity,
  Calendar,
  Filter,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  X,
  CheckCircle
} from 'lucide-react';

// Pie chart colors
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subs' | 'charities' | 'draws' | 'health'>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subType, setSubType] = useState('all');

  // Overview metrics
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [health, setHealth] = useState<Record<string, any> | null>(null);

  // Categories metrics datasets
  const [userStats, setUserStats] = useState<Record<string, any> | null>(null);
  const [subStats, setSubStats] = useState<Record<string, any> | null>(null);
  const [revenueStats, setRevenueStats] = useState<Record<string, any> | null>(null);
  const [charityStats, setCharityStats] = useState<Record<string, any> | null>(null);
  const [drawStats, setDrawStats] = useState<Record<string, any> | null>(null);
  const [winnerStats, setWinnerStats] = useState<Record<string, any> | null>(null);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('users');
  const [exportFormat, setExportFormat] = useState('csv');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOverviewData = async () => {
    try {
      const res = await fetch('/api/analytics/overview');
      if (!res.ok) throw new Error('Failed to load overview data');
      const data = await res.json();
      setOverview(data.stats);
      setHealth(data.health);
    } catch (err) {
      console.error('Error fetching overview stats:', err);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/analytics/users');
      if (res.ok) setUserStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubscriptionStats = async () => {
    try {
      const res = await fetch('/api/analytics/subscriptions');
      if (res.ok) setSubStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRevenueStats = async () => {
    try {
      const res = await fetch('/api/analytics/revenue');
      if (res.ok) setRevenueStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCharityStats = async () => {
    try {
      const res = await fetch('/api/analytics/charities');
      if (res.ok) setCharityStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDrawStats = async () => {
    try {
      const res = await fetch('/api/analytics/draws');
      if (res.ok) setDrawStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWinnerStats = async () => {
    try {
      const res = await fetch('/api/analytics/winners');
      if (res.ok) setWinnerStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllStats = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchOverviewData(),
      fetchUserStats(),
      fetchSubscriptionStats(),
      fetchRevenueStats(),
      fetchCharityStats(),
      fetchDrawStats(),
      fetchWinnerStats()
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadAllStats();
    });
  }, [loadAllStats]);

  const handleExport = async () => {
    setActionLoading('export');
    try {
      const params = new URLSearchParams({
        type: exportType,
        format: exportFormat
      });

      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to generate report export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const ext = exportFormat === 'excel' ? 'xls' : 'csv';
      a.download = `report_${exportType}_${Date.now()}.${ext}`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      triggerToast('Report exported successfully!', 'success');
      setShowExportModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Export failed';
      triggerToast(message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-neutral-400 text-sm">Aggregating platform intelligence metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative print:bg-white print:text-neutral-900 print:p-0">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl transition-all duration-300 print:hidden ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20' 
            : 'bg-red-950/90 border-red-500/30 text-red-400 shadow-red-950/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight print:text-black">BI Analytics & Reports</h1>
          <p className="text-neutral-400 mt-1 print:hidden">Monitor system registrations, subscription sales, charity contributions, and drawing participation.</p>
        </div>
        
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
          >
            <Printer className="w-4 h-4" />
            Print PDF Summary
          </button>
          
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-emerald-500/10"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-900/40 p-4 rounded-2xl border border-white/5 print:hidden">
        {/* Date Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-neutral-500 hidden md:block" />
          <input
            type="date"
            className="bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-neutral-600 text-xs">to</span>
          <input
            type="date"
            className="bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Plan Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <Filter className="w-4 h-4 text-neutral-500 hidden md:block" />
          <select
            className="w-full md:w-40 bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs focus:outline-none text-neutral-300 transition-colors"
            value={subType}
            onChange={(e) => setSubType(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="monthly">Monthly Only</option>
            <option value="yearly">Yearly Only</option>
          </select>
        </div>
      </div>

      {/* Overview stats cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden print:border-neutral-300 print:bg-white">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block print:text-neutral-500">Total Users</span>
          <h3 className="text-3xl font-black text-white mt-2 print:text-black">{overview?.totalUsers}</h3>
          <p className="text-xs text-emerald-500 mt-2 print:text-neutral-500">
            {overview?.activeSubscribers} Active members
          </p>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden print:border-neutral-300 print:bg-white">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block print:text-neutral-500">Gross Sales Revenue</span>
          <h3 className="text-3xl font-black text-emerald-400 mt-2 print:text-black">
            ${overview?.totalRevenue?.toLocaleString()}
          </h3>
          <p className="text-xs text-neutral-500 mt-2">
            ARPU: ${revenueStats?.arpu || 0}
          </p>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden print:border-neutral-300 print:bg-white">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block print:text-neutral-500">Charity Donations</span>
          <h3 className="text-3xl font-black text-white mt-2 print:text-black">
            ${overview?.totalCharityContributions?.toLocaleString()}
          </h3>
          <p className="text-xs text-neutral-500 mt-2">
            From subscriber fees
          </p>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden print:border-neutral-300 print:bg-white">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block print:text-neutral-500">Prizes Paid Out</span>
          <h3 className="text-3xl font-black text-white mt-2 print:text-black">
            ${winnerStats?.totalPaid?.toLocaleString()}
          </h3>
          <p className="text-xs text-neutral-500 mt-2">
            Across {overview?.totalWinners} winners
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/5 print:hidden">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'User Growth' },
          { id: 'subs', label: 'Subscriptions' },
          { id: 'charities', label: 'Charity' },
          { id: 'draws', label: 'Draws' },
          { id: 'health', label: 'System Health' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'subs' | 'charities' | 'draws' | 'health')}
            className={`px-6 py-3.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Contents */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:grid-cols-1">
            <div className="lg:col-span-8 bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 print:text-black">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Monthly Gross Revenue & Sales Trend
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Summary of transaction sales volume over time.</p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={subStats?.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminRevGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="month" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#adminRevGlow)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-6 print:border-neutral-300 print:bg-white">
              <h3 className="text-sm font-bold text-white print:text-black">Overview Metrics Summary</h3>
              
              <div className="space-y-3.5 text-xs text-neutral-400">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Pending Scorecard Reviews:</span>
                  <span className="font-semibold text-amber-500 font-mono">{overview?.pendingWinnerReviews}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Current Drawing Jackpot:</span>
                  <span className="font-semibold text-white font-mono">${overview?.currentJackpot}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Paid Winners Count:</span>
                  <span className="font-semibold text-emerald-400 font-mono">{overview?.paidWinners}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Plan Distribution Split:</span>
                  <span className="font-semibold text-white font-mono">
                    {overview?.monthlySubscribers} Monthly / {overview?.yearlySubscribers} Yearly
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Growth Rate:</span>
                  <span className="font-semibold text-emerald-400 font-mono">+{revenueStats?.growthPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER GROWTH TAB */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
            {/* registrations monthly */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white">
              <h3 className="text-sm font-bold text-white print:text-black">User Registrations History</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userStats?.registrations} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="month" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                    <Bar dataKey="registrations" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* new registrations weekly */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white">
              <h3 className="text-sm font-bold text-white print:text-black">New Registrations Weekly</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userStats?.weekly} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="week" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                    <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'subs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
            {/* status breakdown */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white">
              <h3 className="text-sm font-bold text-white print:text-black">Subscriber Status Breakdown</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subStats?.statusBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* plan distribution */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white print:text-black">Plan Distribution Ratio</h3>
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subStats?.planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {subStats?.planDistribution?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center gap-6 text-xs text-neutral-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  Monthly Plan: {subStats?.planDistribution?.[0]?.value || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                  Yearly Plan: {subStats?.planDistribution?.[1]?.value || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CHARITY TAB */}
        {activeTab === 'charities' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
            {/* top supported */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white">
              <h3 className="text-sm font-bold text-white print:text-black">Donations Share By Charity ($)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charityStats?.topSupported} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis type="number" stroke="#666" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#666" fontSize={8} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                    <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* contribution share breakdown */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white print:text-black">Contribution Percentage Distribution</h3>
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charityStats?.percentageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {charityStats?.percentageDistribution?.map((_entry: Record<string, unknown>, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 text-xs text-neutral-400 mt-2">
                {charityStats?.percentageDistribution?.map((item: { name: string; value: number }, idx: number) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    {item.name}: {item.value} users
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
            {/* monthly participation */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white">
              <h3 className="text-sm font-bold text-white print:text-black">Draw Participation Over Time</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={drawStats?.monthlyParticipation} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="month" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                    <Bar dataKey="entries" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* draw types distribution */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white print:text-black">Draw Configurations Stats</h3>
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={drawStats?.drawTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {drawStats?.drawTypes?.map((_entry: Record<string, unknown>, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center gap-4 text-xs text-neutral-400 mt-2">
                {drawStats?.drawTypes?.map((item: { name: string; value: number }, idx: number) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    {item.name} ({item.value}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1">
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white">
              <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Database Tables Record Tally
              </h3>
              
              <div className="space-y-3.5 text-xs text-neutral-400 mt-2">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Platform Records Count (Total):</span>
                  <span className="font-semibold text-white font-mono">{health?.totalDatabaseRecords} rows</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Uploaded Proof Files (Storage):</span>
                  <span className="font-semibold text-white font-mono">{health?.totalUploadedProofs} scorecards</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Active Database Sessions:</span>
                  <span className="font-semibold text-emerald-400 font-mono">{health?.totalActiveSessions} connections</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Database Query Time:</span>
                  <span className="font-semibold text-white font-mono">{health?.averageResponseTime}</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 print:border-neutral-300 print:bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  API Network Gateway Health
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Real-time status check of next/api servers routing gateways.</p>
              </div>

              <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5 text-center space-y-2 flex-1 flex flex-col justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse mx-auto"></span>
                <strong className="text-sm text-white block mt-2">All API Gateways Active</strong>
                <span className="text-[10px] text-neutral-500 font-mono block">Status: {health?.apiHealthStatus}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm print:hidden">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative overflow-hidden animate-zoom-in">
            {/* Close Button */}
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-white/5 rounded-lg text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Export Platform Reports</h3>
            <p className="text-xs text-neutral-400 mb-6">Select dataset category and file format structure to compile the report.</p>

            <div className="space-y-4">
              {/* Report type */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold block mb-1.5">Report Type</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-neutral-300 transition-colors"
                >
                  <option value="users">User accounts report</option>
                  <option value="subscriptions">Platform billing subscriptions</option>
                  <option value="revenue">Financial revenue transaction history</option>
                  <option value="charities">Charities selection donation shares</option>
                  <option value="draws">Monthly draws participation ledger</option>
                  <option value="winners">Winners rewards claim ledger</option>
                </select>
              </div>

              {/* Format selection */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold block mb-1.5">File Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-neutral-300 transition-colors"
                >
                  <option value="csv">Standard CSV File (.csv)</option>
                  <option value="excel">Microsoft Excel Sheet (.xls)</option>
                </select>
              </div>

              {/* Action button */}
              <button
                onClick={handleExport}
                disabled={actionLoading === 'export'}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold py-3.5 rounded-xl text-sm transition-all duration-300 disabled:cursor-not-allowed mt-2"
              >
                {actionLoading === 'export' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Report File...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Compile & Download Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
