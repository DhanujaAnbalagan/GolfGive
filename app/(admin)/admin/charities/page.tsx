'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Heart, 
  Plus, 
  Trash2, 
  Edit2, 
  Star, 
  Globe, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  website_url: string | null;
  featured: boolean;
}

const charityFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  image_url: z.string().url('Invalid image URL'),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  featured: z.boolean()
});

type FormValues = z.infer<typeof charityFormSchema>;

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Dialog States
  const [creatingCharity, setCreatingCharity] = useState(false);
  const [editingCharity, setEditingCharity] = useState<Charity | null>(null);
  const [deletingCharity, setDeletingCharity] = useState<Charity | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form for Create Form
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<FormValues>({
    resolver: zodResolver(charityFormSchema),
    defaultValues: {
      featured: false
    }
  });

  // React Hook Form for Edit Form
  const { 
    register: registerEdit, 
    handleSubmit: handleSubmitEdit, 
    reset: resetEdit,
    formState: { errors: editErrors } 
  } = useForm<FormValues>({
    resolver: zodResolver(charityFormSchema)
  });

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  const fetchCharities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/charities');
      if (!res.ok) throw new Error('Failed to load charities');
      const data = await res.json();
      setCharities(data);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Error fetching charities', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchCharities();
    });
  }, [fetchCharities]);

  // Pre-fill Edit form when editingCharity changes
  useEffect(() => {
    if (editingCharity) {
      resetEdit({
        name: editingCharity.name,
        description: editingCharity.description,
        image_url: editingCharity.image_url,
        website_url: editingCharity.website_url || '',
        featured: editingCharity.featured
      });
    }
  }, [editingCharity, resetEdit]);

  // Create Charity Submit handler
  const onCreateSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/charities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create charity');

      setCharities([data, ...charities]);
      setCreatingCharity(false);
      reset({ name: '', description: '', image_url: '', website_url: '', featured: false });
      triggerToast('Charity created successfully!', 'success');
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Charity Submit handler
  const onEditSubmit = async (values: FormValues) => {
    if (!editingCharity) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/charities/${editingCharity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update charity');

      setCharities(charities.map(c => c.id === editingCharity.id ? data : c));
      setEditingCharity(null);
      triggerToast('Charity updated successfully!', 'success');
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Charity handler
  const onDeleteConfirm = async () => {
    if (!deletingCharity) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/charities/${deletingCharity.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete charity');
      }

      setCharities(charities.filter(c => c.id !== deletingCharity.id));
      setDeletingCharity(null);
      triggerToast('Charity deleted successfully.', 'success');
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Toggle Featured status handler
  const handleToggleFeatured = async (item: Charity) => {
    try {
      const res = await fetch(`/api/charities/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          image_url: item.image_url,
          website_url: item.website_url || '',
          featured: !item.featured
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update featured flag');

      setCharities(charities.map(c => c.id === item.id ? data : c));
      triggerToast(
        data.featured ? `"${data.name}" marked as featured!` : `"${data.name}" removed from featured list.`,
        'success'
      );
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  return (
    <div className="space-y-8 relative pb-20">
      
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Charity Management</h1>
          <p className="text-neutral-400 mt-1">Register, configure, and mark featured partner charities on GolfGive.</p>
        </div>
        <button
          onClick={() => setCreatingCharity(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Charity
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-neutral-400">Loading charities...</p>
        </div>
      ) : charities.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto min-h-[250px] flex flex-col items-center justify-center">
          <Heart className="w-12 h-12 text-neutral-600 mb-4" />
          <h3 className="text-sm font-bold text-neutral-300">No Charities Registered</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Click &quot;Add Charity&quot; above to setup your first partner organization.
          </p>
        </div>
      ) : (
        /* Charities Table */
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                  <th className="py-4 px-6">Charity Partner</th>
                  <th className="py-4 px-6 text-center">Featured</th>
                  <th className="py-4 px-6">Website</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {charities.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-neutral-950 border border-white/5 overflow-hidden flex-shrink-0 relative">
                          <Image src={item.image_url} alt={item.name} fill unoptimized className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{item.name}</p>
                          <p className="text-xs text-neutral-500 truncate max-w-xs">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleFeatured(item)}
                        className={`p-2 rounded-lg border transition-all ${
                          item.featured 
                            ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-400' 
                            : 'bg-neutral-950 border-white/5 text-neutral-600 hover:text-neutral-400'
                        }`}
                        title={item.featured ? 'Remove Featured Status' : 'Mark as Featured'}
                      >
                        <Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      {item.website_url ? (
                        <a 
                          href={item.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Link
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-600">--</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCharity(item)}
                          className="p-2 text-neutral-400 hover:text-white bg-neutral-950 border border-white/5 hover:border-emerald-500/30 rounded-lg transition-all"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCharity(item)}
                          className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-950 border border-white/5 hover:border-red-900/30 rounded-lg transition-all"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Charity Modal */}
      {creatingCharity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Register New Charity
              </h3>
              <button 
                onClick={() => setCreatingCharity(false)} 
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Charity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Red Cross International"
                  {...register('name')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Full Description
                </label>
                <textarea
                  placeholder="Summarize organization's mission and impact..."
                  rows={4}
                  {...register('description')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  {...register('image_url')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    errors.image_url ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {errors.image_url && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.image_url.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Website URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://redcross.org"
                  {...register('website_url')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    errors.website_url ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {errors.website_url && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.website_url.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-950 border border-white/5 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">Mark as Featured</p>
                  <p className="text-[10px] text-neutral-500">Render at the top of directory and homepage banner</p>
                </div>
                <input
                  type="checkbox"
                  {...register('featured')}
                  className="w-4 h-4 accent-emerald-500 rounded focus:ring-0 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCreatingCharity(false)}
                  className="bg-neutral-950 border border-white/5 hover:bg-neutral-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Register Charity'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Charity Modal */}
      {editingCharity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-500" />
                Edit Charity Details
              </h3>
              <button 
                onClick={() => setEditingCharity(null)} 
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Charity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Red Cross International"
                  {...registerEdit('name')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    editErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {editErrors.name && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editErrors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Full Description
                </label>
                <textarea
                  placeholder="Summarize organization's mission and impact..."
                  rows={4}
                  {...registerEdit('description')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    editErrors.description ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {editErrors.description && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editErrors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  {...registerEdit('image_url')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    editErrors.image_url ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {editErrors.image_url && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editErrors.image_url.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Website URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://redcross.org"
                  {...registerEdit('website_url')}
                  className={`w-full bg-neutral-950 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 transition-all ${
                    editErrors.website_url ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'
                  }`}
                />
                {editErrors.website_url && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editErrors.website_url.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-950 border border-white/5 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">Mark as Featured</p>
                  <p className="text-[10px] text-neutral-500">Render at the top of directory and homepage banner</p>
                </div>
                <input
                  type="checkbox"
                  {...registerEdit('featured')}
                  className="w-4 h-4 accent-emerald-500 rounded focus:ring-0 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingCharity(null)}
                  className="bg-neutral-950 border border-white/5 hover:bg-neutral-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCharity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-950 border border-red-500/30 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete partner?</h3>
            </div>

            <p className="text-sm text-neutral-400">
              Are you sure you want to delete <strong className="text-white">{deletingCharity.name}</strong> from GolfGive? Active selections pointing to this charity will be unlinked automatically.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCharity(null)}
                className="bg-neutral-950 border border-white/5 hover:bg-neutral-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Delete Partner'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
