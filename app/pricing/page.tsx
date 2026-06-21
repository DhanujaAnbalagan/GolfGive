'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Trophy, Check, ArrowRight, Loader2, CreditCard, Shield, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Dummy card fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  const plans = {
    monthly: {
      name: 'Monthly',
      price: 9.99,
      amount: 9.99,
      duration: 'month',
      description: 'Ideal for casual players looking to log scores and enter draws.',
      features: [
        'Enter up to 5 golf scores',
        'Participate in regular draws & sweepstakes',
        'Support your preferred charity (10%-100%)',
        'Basic score analytics dashboard',
        'Ad-free player experience'
      ]
    },
    yearly: {
      name: 'Yearly',
      price: 99.99,
      amount: 99.99,
      duration: 'year',
      description: 'Best value for dedicated players committed to giving back.',
      features: [
        'All Monthly plan features included',
        'Save 16% compared to monthly subscription',
        'Priority access to charity events & draws',
        'Extended historic stats tracking',
        'Dedicated member support'
      ]
    }
  };

  const handleSubscribeClick = (plan: 'monthly' | 'yearly') => {
    if (!user) {
      // Redirect to login with pricing as destination
      router.push(`/login?redirect=/pricing`);
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setCheckoutStep('form');
    setErrorMessage('');
    if (user.full_name) {
      setCardName(user.full_name);
    }
  };

  const executeCheckoutSimulation = async (shouldSucceed: boolean) => {
    setCheckoutStep('processing');
    setErrorMessage('');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!shouldSucceed) {
      setCheckoutStep('error');
      setErrorMessage('Your card was declined. Please check your card details and try again or use another payment method.');
      return;
    }

    try {
      const selectedPlanDetails = plans[selectedPlan];
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: selectedPlan,
          amount: selectedPlanDetails.amount,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update subscription in database');
      }

      setCheckoutStep('success');
    } catch (err: unknown) {
      setCheckoutStep('error');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial from-emerald-950/20 via-green-950/5 to-transparent -z-10 blur-3xl pointer-events-none"></div>
      
      {/* Header/Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-neutral-200 to-emerald-400 bg-clip-text text-transparent">
              GolfGive
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-10 w-24 bg-white/5 animate-pulse rounded-xl"></div>
            ) : user ? (
              <Link 
                href={user.role === 'admin' ? '/admin' : '/dashboard'} 
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-5 rounded-xl shadow-lg transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center relative z-10 w-full">
        {/* Title */}
        <div className="text-center max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 animate-fade-in">
            Pricing Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Membership Plans designed for <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">Impact</span>
          </h1>
          <p className="text-neutral-400 text-lg">
            Track your golf rounds, qualify for exclusive sweepstakes, and fund local charities with every subscription.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Monthly Plan */}
          <div className="relative bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:border-emerald-500/30 transition-all duration-300 flex flex-col group hover:-translate-y-1">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-neutral-200 mb-2">{plans.monthly.name}</h3>
              <p className="text-sm text-neutral-400 min-h-[40px]">{plans.monthly.description}</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold">${plans.monthly.price}</span>
                <span className="text-neutral-500 text-sm ml-2">/ {plans.monthly.duration}</span>
              </div>
            </div>
            
            <div className="border-t border-white/5 my-6"></div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-neutral-300">
              {plans.monthly.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="p-0.5 bg-emerald-950 text-emerald-400 rounded-md mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribeClick('monthly')}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="relative bg-gradient-to-b from-emerald-950/20 to-neutral-900/80 backdrop-blur-md border-2 border-emerald-500/50 rounded-3xl p-8 shadow-2xl shadow-emerald-950/30 flex flex-col group hover:-translate-y-1 transition-all duration-300">
            {/* Discount Badge */}
            <div className="absolute -top-4 right-6 bg-gradient-to-r from-emerald-500 to-green-600 text-neutral-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Save 16%
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-emerald-400 mb-2">{plans.yearly.name}</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-500/20 mb-2">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-neutral-300 min-h-[40px]">{plans.yearly.description}</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-white">${plans.yearly.price}</span>
                <span className="text-neutral-400 text-sm ml-2">/ {plans.yearly.duration}</span>
              </div>
            </div>
            
            <div className="border-t border-emerald-500/20 my-6"></div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-neutral-200">
              {plans.yearly.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="p-0.5 bg-emerald-500 text-neutral-950 rounded-md mt-0.5">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribeClick('yearly')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80 active:scale-[0.98]"
            >
              Subscribe Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security / Quality badge */}
        <div className="mt-12 flex items-center gap-6 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500/70" />
            <span>Secure Checkout</span>
          </div>
          <div className="h-4 w-px bg-white/5"></div>
          <div>Cancel subscription anytime</div>
        </div>
      </main>

      {/* Mock Checkout Modal Dialog Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-left overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold">Secure Checkout</h3>
              </div>
              {checkoutStep !== 'processing' && (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Form State */}
            {checkoutStep === 'form' && (
              <div>
                {/* Plan Summary */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{plans[selectedPlan].name} Membership</p>
                      <p className="text-xs text-neutral-400">Supporting your chosen charity</p>
                    </div>
                    <p className="text-lg font-extrabold text-emerald-400">${plans[selectedPlan].price}</p>
                  </div>
                </div>

                {/* Simulated Card Inputs */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Card Number
                    </label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        className="w-full bg-neutral-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>

                {/* Simulation Control Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => executeCheckoutSimulation(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                  >
                    Simulate Success Payment
                  </button>
                  <button
                    onClick={() => executeCheckoutSimulation(false)}
                    className="w-full bg-neutral-800 hover:bg-red-950/30 border border-white/5 hover:border-red-900/30 text-neutral-300 hover:text-red-400 font-semibold py-2.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Simulate Failed Payment
                  </button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {checkoutStep === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                <h4 className="font-bold text-lg mb-2">Processing Transaction</h4>
                <p className="text-sm text-neutral-400 max-w-xs">
                  We are validating card details and securing billing channels with our mock gateway...
                </p>
              </div>
            )}

            {/* Success State */}
            {checkoutStep === 'success' && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 mb-4">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h4 className="font-bold text-xl text-white mb-2">Payment Completed!</h4>
                <p className="text-sm text-neutral-400 mb-6 max-w-xs">
                  Your mock payment of ${plans[selectedPlan].price} was authorized. You now have active member access!
                </p>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    router.refresh();
                    router.push('/dashboard/subscription');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200"
                >
                  Go to Subscription Panel
                </button>
              </div>
            )}

            {/* Error State */}
            {checkoutStep === 'error' && (
              <div>
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl flex gap-3 text-red-400 mb-6 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold">Transaction Declined</h5>
                    <p className="text-xs text-red-400/80 mt-1">{errorMessage}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setCheckoutStep('form')}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200"
                  >
                    Modify Card Details & Retry
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full bg-neutral-900 border border-white/5 hover:bg-white/5 text-neutral-400 font-semibold py-2.5 rounded-2xl transition-all duration-200"
                  >
                    Cancel Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
