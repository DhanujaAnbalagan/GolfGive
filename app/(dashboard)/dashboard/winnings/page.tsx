'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Award,
  Upload,
  FileText,
  FileCode,
  X,
  CheckCircle,
  Eye,
  Bell
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
  draws: {
    draw_month: number;
    draw_year: number;
    jackpot_amount: number;
    winning_numbers: number[];
  } | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export default function PlayerWinningsPage() {
  const { user } = useAuthStore();
  const [winnings, setWinnings] = useState<WinnerRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Upload Modal State
  const [selectedWinner, setSelectedWinner] = useState<WinnerRecord | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const supabase = createClient();

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWinnings = useCallback(async () => {
    try {
      const res = await fetch('/api/winners');
      if (!res.ok) throw new Error('Failed to load winnings data');
      const data = await res.json();
      setWinnings(data);
    } catch (err: unknown) {
      console.error('Error fetching winnings:', err);
      triggerToast(err instanceof Error ? err.message : 'Failed to fetch winnings', 'error');
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user, supabase]);

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Error reading notification:', err);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchWinnings(), fetchNotifications()]);
    setLoading(false);
  }, [fetchWinnings, fetchNotifications]);

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => {
        loadData();
      });
    }
  }, [user, loadData]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!ext || !allowedExtensions.includes(ext)) {
      triggerToast('Invalid file format. Only JPG, JPEG, PNG, and PDF are supported.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      triggerToast('File size exceeds maximum limit of 10MB', 'error');
      return;
    }

    setUploadFile(file);
  };

  const handleUploadProof = async () => {
    if (!selectedWinner || !uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('winnerId', selectedWinner.id);

      const res = await fetch('/api/winners/upload-proof', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload proof');

      triggerToast('Verification scorecard proof uploaded successfully!', 'success');
      setSelectedWinner(null);
      setUploadFile(null);
      loadData();
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
  };

  // Calculations
  const totalAmount = winnings.reduce((sum, item) => sum + Number(item.prize_amount), 0);
  const pendingAmount = winnings
    .filter(item => item.payment_status === 'pending' || item.payment_status === 'processing')
    .reduce((sum, item) => sum + Number(item.prize_amount), 0);
  const paidAmount = winnings
    .filter(item => item.payment_status === 'paid')
    .reduce((sum, item) => sum + Number(item.prize_amount), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-neutral-400 text-sm">Loading winnings details...</p>
      </div>
    );
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Winnings & Claims</h1>
          <p className="text-neutral-400 mt-1">Upload scorecard proofs, track verification reviews, and monitor payment status.</p>
        </div>
      </div>

      {/* Grid: Stats & Notification Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Stats cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">Total Winnings</span>
                <h3 className="text-2xl font-black text-white mt-1.5">
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-3 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Across {winnings.length} wins
              </p>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">Total Paid</span>
                <h3 className="text-2xl font-black text-emerald-400 mt-1.5">
                  ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                {winnings.filter(w => w.payment_status === 'paid').length} processed payouts
              </p>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">Pending Release</span>
                <h3 className="text-2xl font-black text-amber-500 mt-1.5">
                  ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                {winnings.filter(w => w.payment_status !== 'paid').length} claims in process
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notification Alerts Feed */}
        <div className="lg:col-span-4 bg-neutral-900 border border-white/5 rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-500" />
            Claim Activity Logs
          </h3>
          
          {notifications.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-6">No activity updates yet.</p>
          ) : (
            <div className="space-y-3 max-h-36 overflow-y-auto">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                  className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-neutral-950/20 border-white/5 text-neutral-400'
                      : 'bg-emerald-950/20 border-emerald-500/25 text-white font-medium'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold">{notif.title}</span>
                    <span className="text-[9px] text-neutral-500 font-mono">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Winnings & Claims Ledger */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Winning Claims Log</h3>
        
        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-neutral-400 font-semibold text-xs bg-neutral-950/30">
                  <th className="px-6 py-4">Draw Period</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Prize Amount</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {winnings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <Award className="w-10 h-10 text-neutral-600" />
                        <p className="text-sm">You haven&apos;t won any draws yet. Maintain your active membership to participate!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  winnings.map((item) => {
                    // Computed verification state
                    const needsUpload = !item.proof_url || item.verification_status === 'rejected';
                    
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {item.draws ? `${getMonthName(item.draws.draw_month)} ${item.draws.draw_year}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg">
                            {item.match_type} Matches
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          ${Number(item.prize_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        
                        {/* Verification badge */}
                        <td className="px-6 py-4">
                          {!item.proof_url ? (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-950/40 border border-red-500/20 text-red-400 rounded-md">
                              Awaiting Proof
                            </span>
                          ) : item.verification_status === 'pending' ? (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-950/40 border border-yellow-500/20 text-yellow-400 rounded-md">
                              Under Review
                            </span>
                          ) : item.verification_status === 'approved' ? (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-md">
                              Approved
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 text-xs font-semibold bg-red-950/40 border border-red-500/20 text-red-400 rounded-md">
                                Rejected
                              </span>
                              {item.review_notes && (
                                <p className="text-[10px] text-red-400 max-w-xs truncate leading-normal">
                                  Notes: {item.review_notes}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Payment badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            item.payment_status === 'paid'
                              ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400'
                              : item.payment_status === 'processing'
                                ? 'bg-purple-950/40 border border-purple-500/20 text-purple-400 animate-pulse'
                                : 'bg-neutral-800 border border-white/5 text-neutral-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.payment_status === 'paid' ? 'bg-emerald-400' : item.payment_status === 'processing' ? 'bg-purple-400' : 'bg-neutral-500'
                            }`} />
                            {item.payment_status === 'paid' ? 'Paid' : item.payment_status === 'processing' ? 'Processing' : 'Unpaid'}
                          </span>
                          {item.paid_at && (
                            <p className="text-[10px] text-neutral-500 font-mono mt-1">
                              {new Date(item.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          {needsUpload ? (
                            <button
                              onClick={() => setSelectedWinner(item)}
                              className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-all duration-300 mx-auto"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Upload Proof
                            </button>
                          ) : (
                            <div className="flex justify-center gap-2">
                              {item.signed_proof_url && (
                                <a
                                  href={item.signed_proof_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-neutral-950 border border-white/5 text-neutral-400 hover:text-white rounded-xl transition-all"
                                  title="View Proof File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <span className="text-neutral-500 text-xs flex items-center justify-center gap-0.5">
                                Submitted
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Proof Dialog */}
      {selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative overflow-hidden animate-zoom-in">
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedWinner(null);
                setUploadFile(null);
              }}
              className="absolute top-4 right-4 p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-white/5 rounded-lg text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Upload Verification Proof</h3>
            <p className="text-xs text-neutral-400 mb-4">
              To verify your win, please upload a screenshot or image of your golf score scorecard.
            </p>

            <div className="space-y-4">
              {/* Drag Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-950/20' 
                    : 'border-white/10 bg-neutral-950 hover:bg-neutral-950/50'
                }`}
              >
                <input
                  type="file"
                  id="proof-file-input"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                />
                
                <label 
                  htmlFor="proof-file-input"
                  className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full h-full"
                >
                  <div className="p-3 bg-neutral-900 border border-white/5 text-neutral-400 rounded-xl">
                    <Upload className="w-6 h-6 text-emerald-400" />
                  </div>
                  
                  {uploadFile ? (
                    <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      {uploadFile.name.endsWith('.pdf') ? <FileText className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                      <span className="max-w-[200px] truncate">{uploadFile.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-white block">Click to upload or drag & drop</span>
                      <span className="text-[10px] text-neutral-500 block mt-1">PNG, JPG, JPEG or PDF (Max 10MB)</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Submit */}
              <button
                onClick={handleUploadProof}
                disabled={uploading || !uploadFile}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold py-3.5 rounded-xl text-sm transition-all duration-300 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading Scorecard...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit Scorecard Proof
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
