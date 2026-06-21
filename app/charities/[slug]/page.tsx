import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { charityService } from '@/services/charityService';
import { 
  Trophy, 
  Globe, 
  ArrowLeft, 
  Sparkles,
  ShieldCheck,
  Award
} from 'lucide-react';
import SelectCharityButton from './SelectCharityButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CharityDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: charity, error } = await charityService.getCharityBySlug(supabase, slug);

  if (error || !charity) {
    notFound();
  }

  // Check if current user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-emerald-500 selection:text-neutral-950">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-radial from-emerald-950/15 via-green-950/5 to-transparent -z-10 blur-3xl pointer-events-none"></div>

      {/* Header/Navbar */}
      <header className="border-b border-white/5 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/charities" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to directory
          </Link>
          
          <Link href="/" className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-white text-base">GolfGive</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Banner Card */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="aspect-[21/9] w-full relative bg-neutral-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={charity.image_url} 
              alt={charity.name} 
              className="w-full h-full object-cover"
            />
            {charity.featured && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-neutral-950 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Featured Partner
              </div>
            )}
          </div>
          
          <div className="p-8 md:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1.5">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">{charity.name}</h1>
                {charity.website_url && (
                  <a 
                    href={charity.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Official Website
                  </a>
                )}
              </div>

              {/* Dynamic Select Button Component */}
              <SelectCharityButton charityId={charity.id} isLoggedIn={!!user} />
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Full Description */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold border-b border-white/5 pb-3">About the Charity</h2>
            <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
              {charity.description}
            </p>
          </div>

          {/* Right Column: Impact metrics and verification cards */}
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Donation Impact
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed font-light">
                This organization is a verified non-profit partner on GolfGive. By selecting them, your contribution percentage applies directly to funds raised during weekly sweepstakes events.
              </p>
              <div className="border-t border-white/5 pt-3">
                <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Fund Status</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Vetted & Eligible
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 mt-20 bg-neutral-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-neutral-500">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-white text-base">GolfGive</span>
          </div>
          <p>© {new Date().getFullYear()} GolfGive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
