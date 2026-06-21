'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Heart, 
  ChevronRight, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const { user, isLoading } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [featuredCharities, setFeaturedCharities] = React.useState<{ id: string; name: string; description: string; image_url: string; slug: string }[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  React.useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await fetch('/api/charities?featured=true');
        if (res.ok) {
          const data = await res.json();
          setFeaturedCharities(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading featured charities:', error);
      }
    };
    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-emerald-500 selection:text-neutral-950 flex flex-col relative overflow-hidden">
      
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial from-emerald-950/20 via-green-950/5 to-transparent -z-10 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[800px] -left-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-emerald-950/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-neutral-200 to-emerald-400 bg-clip-text text-transparent">
              GolfGive
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#impact" className="hover:text-white transition-colors">Our Impact</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="h-10 w-24 bg-white/5 animate-pulse rounded-xl"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link 
                  href={user.role === 'admin' ? '/admin' : '/dashboard'} 
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition-all"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-950/55 hover:shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-neutral-400 hover:text-white text-sm font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white text-sm font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-950/55 hover:shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  Register Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-neutral-950 px-6 py-6 space-y-4">
            <nav className="flex flex-col gap-4 text-base font-medium text-neutral-400">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)} 
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)} 
                className="hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a 
                href="#impact" 
                onClick={() => setMobileMenuOpen(false)} 
                className="hover:text-white transition-colors"
              >
                Our Impact
              </a>
            </nav>
            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              {user ? (
                <>
                  <Link 
                    href={user.role === 'admin' ? '/admin' : '/dashboard'} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center bg-white/5 border border-white/10 py-3 rounded-xl text-white text-sm font-semibold"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full text-center bg-emerald-600 py-3 rounded-xl text-white text-sm font-semibold"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center border border-white/10 py-3 rounded-xl text-neutral-300 text-sm font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center bg-emerald-600 py-3 rounded-xl text-white text-sm font-semibold"
                  >
                    Register Now
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center relative">
        {/* Sparkle Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/60 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400 mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          The Modern Golf Fundraising Platform
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Track Your Handicap.{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-300 bg-clip-text text-transparent">
            Support Worthy Causes.
          </span>
        </h1>
        
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl font-light mb-10 leading-relaxed">
          GolfGive connects amateur golf score tracking with charitable sweepstakes. Log your scores, improve your performance, and help raise money for global charities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          {user ? (
            <Link 
              href={user.role === 'admin' ? '/admin' : '/dashboard'} 
              className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-semibold py-4 px-8 rounded-xl shadow-xl shadow-emerald-950/60 hover:shadow-emerald-500/25 transition-all duration-300 group"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link 
                href="/signup" 
                className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-semibold py-4 px-8 rounded-xl shadow-xl shadow-emerald-950/60 hover:shadow-emerald-500/25 transition-all duration-300 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#features" 
                className="w-full sm:w-auto inline-flex items-center justify-center bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300"
              >
                Learn More
              </a>
            </>
          )}
        </div>

        {/* Dashboard Preview mockup */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-white/10 bg-neutral-900/40 p-4 backdrop-blur-xl shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-10 rounded-2xl pointer-events-none"></div>
          <div className="h-6 flex items-center gap-2 mb-4 px-2">
            <span className="w-3 h-3 rounded-full bg-red-500/60"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/60"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/60"></span>
          </div>
          <div className="aspect-[16/9] w-full rounded-xl bg-neutral-950/80 flex flex-col justify-center items-center text-center p-8 border border-white/5 overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <Trophy className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold mb-2">GolfGive Dashboard Preview</h3>
            <p className="text-neutral-400 text-sm max-w-sm">
              Track your daily golf scores (1–45 range), view statistics, and support weekly causes. Log in to unlock.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-white/5 bg-neutral-950 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight">
              Designed for Golfers with a Purpose
            </h2>
            <p className="text-neutral-400 text-lg">
              Unlock metrics to improve your game while contributing directly to registered non-profits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/20 rounded-xl w-fit text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Score Tracking</h3>
              <p className="text-neutral-400 leading-relaxed">
                Log your standard scores (from 1 to 45) for any date. Track your trends, view statistics, and watch your game improve.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/20 rounded-xl w-fit text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Charity Integrations</h3>
              <p className="text-neutral-400 leading-relaxed">
                Every score logged contributes to sweepstakes that fund certified global charities, helping feed, house, and heal communities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/20 rounded-xl w-fit text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Role-Based Access</h3>
              <p className="text-neutral-400 leading-relaxed">
                Clear divisions of labor: users get their dedicated player portal while administrators oversee scores and platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-white/5 bg-radial from-[#041d11]/30 via-neutral-950 to-neutral-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight">
              Get Started In 3 Easy Steps
            </h2>
            <p className="text-neutral-400 text-lg">
              No complex handicap math required. Just enter your score and support a campaign.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="text-5xl font-black text-emerald-950 mb-4 group-hover:text-emerald-900 transition-colors">01</div>
              <h3 className="text-xl font-bold mb-2">Create Account</h3>
              <p className="text-neutral-400 max-w-xs leading-relaxed">
                Register as a player or administrator to establish your secure golf profile.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="text-5xl font-black text-emerald-950 mb-4 group-hover:text-emerald-900 transition-colors">02</div>
              <h3 className="text-xl font-bold mb-2">Log Daily Scores</h3>
              <p className="text-neutral-400 max-w-xs leading-relaxed">
                Enter your latest golf round score (validated between 1 and 45). Restrict score to one entry per day.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="text-5xl font-black text-emerald-950 mb-4 group-hover:text-emerald-900 transition-colors">03</div>
              <h3 className="text-xl font-bold mb-2">Support & Compete</h3>
              <p className="text-neutral-400 max-w-xs leading-relaxed">
                Watch your scores impact active campaigns and enter sweepstakes for amazing golf gear and prizes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities Section */}
      {featuredCharities.length > 0 && (
        <section className="py-24 border-t border-white/5 bg-neutral-950 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 mb-2">
                <Heart className="w-3.5 h-3.5 fill-current" />
                Our Partner Charities
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight">
                Featured Organizations
              </h2>
              <p className="text-neutral-400 text-lg">
                A portion of all sweepstakes proceeds are directly distributed to support these vetted partners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCharities.map((item) => (
                <div 
                  key={item.id}
                  className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-emerald-500/20 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between"
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
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
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

                  <div className="p-6 pt-0 border-t border-white/5 mt-4 flex justify-end">
                    <Link 
                      href={`/charities/${item.slug}`} 
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group/btn"
                    >
                      Learn More
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link 
                href="/charities"
                className="inline-flex items-center gap-1.5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-white font-semibold py-3 px-6 rounded-xl text-xs transition-colors"
              >
                Browse All Charities
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Impact / CTA Banner */}
      <section id="impact" className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-950/60 to-green-950/20 border border-emerald-500/20 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden backdrop-blur-md">
          <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-3xl font-extrabold mb-4">Ready to tee off for good?</h2>
            <p className="text-emerald-100/70 font-light">
              Join hundreds of other golf enthusiasts and start tracking your handicap while raising money for charity organizations.
            </p>
          </div>

          <div>
            {user ? (
              <Link 
                href={user.role === 'admin' ? '/admin' : '/dashboard'} 
                className="inline-flex items-center bg-white hover:bg-neutral-100 text-neutral-950 font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
              >
                Go to Dashboard
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            ) : (
              <Link 
                href="/signup" 
                className="inline-flex items-center bg-white hover:bg-neutral-100 text-neutral-950 font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
              >
                Get Started Now
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-neutral-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-neutral-500">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-white text-base">GolfGive</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-neutral-300">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-300">Terms of Service</a>
            <a href="#" className="hover:text-neutral-300">Contact Support</a>
          </div>
          
          <p>© {new Date().getFullYear()} GolfGive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
