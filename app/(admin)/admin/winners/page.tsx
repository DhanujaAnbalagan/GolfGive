'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Loader2, 
  DollarSign, 
  CheckCircle,
  Clock,
  Award,
  RefreshCw,
  AlertCircle,
  FileText,
  Eye,
  Check,
  X,
  Play
} from 'lucide-react';

interface WinnerRecord {
  id: string;
  draw_id: string;
  match_type: number;
  prize_amount: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'processing' | 'paid';
  proof_url: string | null;
  signed_proof_url: string | null;
  review_notes: string | null;
  created_at: string;
  paid_at: string | null;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  draws: {
    draw_month: number;
    draw_year: number;
    jackpot_amount: number;
    winning_numbers: number[];
  } | null;
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<WinnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'processing'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Toast Alert State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Review Dialog State
  const [selectedWinner, setSelectedWinner] = useState<WinnerRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWinners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/winners');
      if (!res.ok) throw new Error('Failed to load platform winners');
      const data = await res.json();
      setWinners(data);

      // Refresh currently selected winner details if modal is open using functional state updater to avoid dependencies
      setSelectedWinner(prev => {
        if (prev) {
          const refreshed = data.find((w: WinnerRecord) => w.id === prev.id);
          if (refreshed) return refreshed;
        }
        return prev;
      });
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchWinners();
    });
  }, [fetchWinners]);

  const handleApprove = async (winnerId: string) => {
    setActionLoading('approve');
    try {
      const res = await fetch(`/api/winners/${winnerId}/approve`, {
        method: 'PUT'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to approve winner claim');

      triggerToast('Winner scorecard proof approved!', 'success');
      fetchWinners();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (winnerId: string) => {
    if (!reviewNotes.trim()) {
      triggerToast('Review notes are required for rejection', 'error');
      return;
    }

    setActionLoading('reject');
    try {
      const res = await fetch(`/api/winners/${winnerId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reject winner claim');

      triggerToast('Winner scorecard proof rejected and user notified.', 'success');
      setReviewNotes('');
      fetchWinners();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePaymentStatus = async (winnerId: string, status: 'processing' | 'paid') => {
    setActionLoading(`payment-${status}`);
    try {
      const res = await fetch(`/api/winners/${winnerId}/mark-paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Failed to transition payment to ${status}`);

      triggerToast(`Winnings marked as ${status}!`, 'success');
      fetchWinners();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
  };

  // Filter lists
  const filteredWinners = winners.filter((w) => {
    // Payment filter
    if (statusFilter !== 'all' && w.payment_status !== statusFilter) return false;
    
    // Verification filter
    if (verificationFilter !== 'all' && w.verification_status !== verificationFilter) return false;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = w.profiles?.full_name?.toLowerCase() || '';
      const email = w.profiles?.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    }

    return true;
  });

  // Analytics Cards Metrics
  const pendingReviews = winners.filter(w => w.proof_url && w.verification_status === 'pending').length;
  const approvedWinners = winners.filter(w => w.verification_status === 'approved').length;
  const rejectedWinners = winners.filter(w => w.verification_status === 'rejected').length;
  const paidWinners = winners.filter(w => w.payment_status === 'paid').length;
  const pendingPayments = winners.filter(w => w.verification_status === 'approved' && w.payment_status !== 'paid').length;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20' 
            : 'bg-red-950/90 border-red-500/30 text-red-400 shadow-red-950/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Platform Winners & Payouts</h1>
          <p className="text-neutral-400 text-sm mt-1">Review scorecard proofs, verify claims eligibility, and disburse prize rewards.</p>
        </div>
        <button
          onClick={fetchWinners}
          className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Analytics widgets grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Pending Reviews */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Pending Reviews</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-500">{pendingReviews}</span>
            <Clock className="w-4 h-4 text-amber-500/50" />
          </div>
        </div>

        {/* Approved Winners */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Approved Claims</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-400">{approvedWinners}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400/50" />
          </div>
        </div>

        {/* Rejected Winners */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Rejected Claims</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-red-400">{rejectedWinners}</span>
            <X className="w-4 h-4 text-red-400/50" />
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Pending Release</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-purple-400">{pendingPayments}</span>
            <DollarSign className="w-4 h-4 text-purple-400/50" />
          </div>
        </div>

        {/* Paid Winners */}
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Paid Payouts</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-400">{paidWinners}</span>
            <Award className="w-4 h-4 text-emerald-400/50" />
          </div>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-900/40 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none transition-colors"
            placeholder="Search by winner name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto shrink-0">
          {/* Verification filter */}
          <select
            className="w-full md:w-40 bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-neutral-300 transition-colors"
            value={verificationFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVerificationFilter(e.target.value as any)}
          >
            <option value="all">All Verification</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Payment filter */}
          <select
            className="w-full md:w-40 bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm focus:outline-none text-neutral-300 transition-colors"
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Payment States</option>
            <option value="pending">Unpaid</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/20 border border-white/5 rounded-3xl">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <span className="text-sm text-neutral-500">Querying platform winning ledger...</span>
        </div>
      ) : filteredWinners.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/20 border border-white/5 rounded-3xl">
          <Award className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="font-bold text-lg">No Winners Found</h3>
          <p className="text-sm text-neutral-500 mt-1">Adjust search parameters or filter rules.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-neutral-950/50 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Winner Name</th>
                  <th className="py-4 px-6">Draw Date</th>
                  <th className="py-4 px-6">Match Type</th>
                  <th className="py-4 px-6">Prize Reward</th>
                  <th className="py-4 px-6">Proof File</th>
                  <th className="py-4 px-6">Verification</th>
                  <th className="py-4 px-6">Payment</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-neutral-200">
                {filteredWinners.map((winner) => (
                  <tr key={winner.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-bold">
                      <div>
                        <p className="text-white leading-tight">{winner.profiles?.full_name || 'Deleted Account'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{winner.profiles?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {winner.draws ? `${getMonthName(winner.draws.draw_month)} ${winner.draws.draw_year}` : 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-medium">
                      {winner.match_type} Matches
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-400">
                      ${Number(winner.prize_amount).toLocaleString()}
                    </td>
                    
                    {/* Proof indicator */}
                    <td className="py-4 px-6">
                      {winner.proof_url ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <FileText className="w-3.5 h-3.5" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-xs">—</span>
                      )}
                    </td>

                    {/* Verification Status badge */}
                    <td className="py-4 px-6">
                      {!winner.proof_url ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-950/40 border border-red-500/20 text-red-400 rounded-md">
                          Awaiting Proof
                        </span>
                      ) : winner.verification_status === 'pending' ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-950/40 border border-yellow-500/20 text-yellow-400 rounded-md animate-pulse">
                          Pending Review
                        </span>
                      ) : winner.verification_status === 'approved' ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-md">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-950/40 border border-red-500/20 text-red-400 rounded-md">
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Payment Status badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        winner.payment_status === 'paid'
                          ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400'
                          : winner.payment_status === 'processing'
                            ? 'bg-purple-950/40 border border-purple-500/20 text-purple-400'
                            : 'bg-neutral-800 border border-white/5 text-neutral-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          winner.payment_status === 'paid' ? 'bg-emerald-400' : winner.payment_status === 'processing' ? 'bg-purple-400' : 'bg-neutral-500'
                        }`} />
                        {winner.payment_status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => {
                          setSelectedWinner(winner);
                          setReviewNotes(winner.review_notes || '');
                        }}
                        className="flex items-center gap-1 bg-neutral-950 hover:bg-neutral-800 border border-white/5 hover:border-emerald-500/20 text-neutral-400 hover:text-emerald-400 font-bold px-3 py-1.5 rounded-xl text-xs transition-all duration-300 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 relative overflow-hidden animate-zoom-in max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedWinner(null);
                setReviewNotes('');
              }}
              className="absolute top-4 right-4 p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-white/5 rounded-lg text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Claim Review Panel</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Review player verification proof, add review notes, approve claim status, and process payouts.
            </p>

            <div className="space-y-6">
              {/* Winner Info */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-950/50 p-4 border border-white/5 rounded-2xl text-xs">
                <div>
                  <span className="text-neutral-500 block mb-0.5">Player Name</span>
                  <span className="font-semibold text-white">{selectedWinner.profiles?.full_name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Claim Amount</span>
                  <span className="font-bold text-emerald-400">${Number(selectedWinner.prize_amount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Draw period</span>
                  <span className="font-semibold text-white">
                    {selectedWinner.draws ? `${getMonthName(selectedWinner.draws.draw_month)} ${selectedWinner.draws.draw_year}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Matches count</span>
                  <span className="font-semibold text-white">{selectedWinner.match_type} Matches</span>
                </div>
              </div>

              {/* Proof Preview */}
              <div className="space-y-2">
                <span className="text-xs text-neutral-400 font-semibold block">Uploaded Scorecard Proof</span>
                
                {selectedWinner.proof_url ? (
                  <div className="border border-white/10 rounded-2xl bg-neutral-950 p-4 text-center min-h-[140px] flex flex-col justify-center items-center gap-3">
                    {/* Render Image or PDF link */}
                    {selectedWinner.proof_url.endsWith('.pdf') ? (
                      <>
                        <FileText className="w-12 h-12 text-red-500" />
                        <span className="text-xs font-semibold text-white">PDF Document Loaded</span>
                        <a
                          href={selectedWinner.signed_proof_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-neutral-900 border border-white/5 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                        >
                          View PDF Document
                        </a>
                      </>
                    ) : (
                      <div className="relative w-full h-44 overflow-hidden rounded-lg flex items-center justify-center">
                        <Image
                          src={selectedWinner.signed_proof_url || ''}
                          alt="Winner proof scorecard"
                          fill
                          unoptimized
                          className="object-contain rounded-lg border border-white/5 shadow"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-neutral-500 text-xs">
                    No proof scorecard uploaded yet. User has not completed submission.
                  </div>
                )}
              </div>

              {/* Action: Verification controls */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="text-xs text-neutral-400 font-semibold block">Step 1: Verification Review</span>
                
                <textarea
                  placeholder="Mandatory notes required if rejecting winner proof..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs focus:outline-none text-white transition-colors h-20"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(selectedWinner.id)}
                    disabled={actionLoading === 'reject' || !selectedWinner.proof_url}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-950 hover:bg-red-950/20 border border-white/5 hover:border-red-900/30 text-neutral-400 hover:text-red-400 font-semibold py-2.5 rounded-xl text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject Claim
                  </button>
                  <button
                    onClick={() => handleApprove(selectedWinner.id)}
                    disabled={actionLoading === 'approve' || !selectedWinner.proof_url || selectedWinner.verification_status === 'approved'}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition-all duration-300 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve Claim
                  </button>
                </div>
              </div>

              {/* Action: Payment controls */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="text-xs text-neutral-400 font-semibold block">Step 2: Payout Management (Only for Approved Claims)</span>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  Once a user scorecard proof is marked as approved, you can transition the disbursement status from processing to paid.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedWinner.id, 'processing')}
                    disabled={selectedWinner.verification_status !== 'approved' || selectedWinner.payment_status === 'processing' || selectedWinner.payment_status === 'paid' || actionLoading === 'payment-processing'}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-950 hover:bg-purple-950/20 border border-white/5 hover:border-purple-900/30 text-neutral-400 hover:text-purple-400 font-semibold py-2.5 rounded-xl text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Mark Processing
                  </button>
                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedWinner.id, 'paid')}
                    disabled={selectedWinner.verification_status !== 'approved' || selectedWinner.payment_status === 'paid' || actionLoading === 'payment-paid'}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition-all duration-300 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Mark Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
