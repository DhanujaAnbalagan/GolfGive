'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Search, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Loader2,
  Trophy
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

export default function CharitiesDirectoryPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const res = await fetch('/api/charities');
        if (res.ok) {
          const data = await res.json();
          setCharities(data);
        }
      } catch (error) {
        console.error('Error loading charities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharities();
  }, []);

  // Filter charities based on search query
  const filteredCharities = charities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredCharities = charities.filter(c => c.featured);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-emerald-500 selection:text-neutral-950">
      
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-radial from-emerald-950/15 via-green-950/5 to-transparent -z-10 blur-3xl pointer-events-none"></div>

      {/* Header/Navbar */}
      <header className="border-b border-white/5 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              GolfGive
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/login" className="text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2 px-4 rounded-xl transition-all">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        
        {/* Title & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-current" />
              Charity Partners
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight">Support Worthy Causes</h1>
            <p className="text-neutral-400 max-w-xl font-light">
              Explore our vetted non-profit organization partners. Select a preferred charity to receive your score-backed sweepstakes donations.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search charities by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-sm text-neutral-400">Loading charity directory...</p>
          </div>
        ) : (
          <>
            {/* Featured Section (only show when not searching and featured charities exist) */}
            {!searchQuery && featuredCharities.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Featured Charities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {featuredCharities.slice(0, 3).map((item) => (
                    <div 
                      key={item.id}
                      className="bg-gradient-to-br from-emerald-950/20 to-neutral-900 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/40 transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[16/9] w-full relative overflow-hidden bg-neutral-950 border-b border-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 bg-yellow-500/90 border border-yellow-400/30 text-neutral-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                            <Sparkles className="w-3 h-3 fill-current" />
                            Featured
                          </div>
                        </div>
                        <div className="p-6 space-y-3">
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-neutral-400 text-xs line-clamp-3 font-light leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                        {item.website_url && (
                          <a 
                            href={item.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                          >
                            Website
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <Link 
                          href={`/charities/${item.slug}`} 
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group/btn"
                        >
                          View details
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Grid List */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold">
                {searchQuery ? `Search Results (${filteredCharities.length})` : 'All Partner Charities'}
              </h2>
              
              {filteredCharities.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto">
                  <Heart className="w-12 h-12 text-neutral-600 mb-4 mx-auto" />
                  <h3 className="text-sm font-bold text-neutral-300">No charities match your search</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Try searching for another keyword or check back later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {filteredCharities.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-white/10 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[16/9] w-full relative overflow-hidden bg-neutral-950 border-b border-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-6 space-y-3">
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-neutral-400 text-xs line-clamp-3 font-light leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                        {item.website_url && (
                          <a 
                            href={item.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                          >
                            Website
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <Link 
                          href={`/charities/${item.slug}`} 
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group/btn"
                        >
                          View details
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
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
