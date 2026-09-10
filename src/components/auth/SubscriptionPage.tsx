import React, { useState } from 'react';
import {
  Pill,
  Check,
  Zap,
  Crown,
  Rocket,
  Star,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';
import { INITIAL_PACKAGE_TIERS } from '../../data/mockData';
import type { BillingCycle } from '../../types';

interface SubscriptionPageProps {
  auth: UseAuthReturn;
}

const tierIcons: Record<string, React.ReactNode> = {
  'Starter':      <Rocket className="w-6 h-6" />,
  'Professional': <Star className="w-6 h-6" />,
  'Enterprise':   <Crown className="w-6 h-6" />,
};

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ auth }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [activating, setActivating]     = useState<string | null>(null);

  const yearlyMultiplier = 10; // 10 months = 2 months free

  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === 'yearly') {
      return monthlyPrice * yearlyMultiplier;
    }
    return monthlyPrice;
  };

  const formatUgx = (amount: number) => {
    return `UGX ${amount.toLocaleString('en-UG')}`;
  };

  const handleSubscribe = (tierId: string) => {
    setActivating(tierId);
    // Simulate a brief processing delay
    setTimeout(() => {
      auth.activateSubscription(tierId, billingCycle);
      setActivating(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070F1C] text-white relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background glow effects */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-600/8 rounded-full blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[180px]" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#070F1C]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-black text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ZenithRx
            </span>
            <span className="hidden sm:inline-block ml-2 text-sky-400/80 text-xs font-bold uppercase tracking-wider">
              · Choose Your Plan
            </span>
          </div>
        </div>

        {auth.user && (
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs hidden sm:block">
              Welcome, <span className="text-white font-bold">{auth.user.fullName}</span>
            </span>
            <button
              onClick={() => auth.signOut()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4">
            <Zap className="w-3.5 h-3.5" /> Activate Your Pharmacy
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Choose the Right Plan
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              for Your Pharmacy
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Unlock powerful pharmacy management tools. Choose a billing cycle that works best for your business.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center mb-10 sm:mb-14">
          <div className="relative bg-[#0B1E36] border border-white/10 rounded-2xl p-1.5 flex items-center shadow-xl shadow-black/40">
            {/* Sliding background indicator */}
            <div
              className={`absolute top-1.5 h-[calc(100%-12px)] w-[calc(50%-4px)] rounded-xl bg-gradient-to-r transition-all duration-300 ease-out ${
                billingCycle === 'monthly'
                  ? 'left-1.5 from-sky-600 to-cyan-500'
                  : 'left-[calc(50%+2px)] from-emerald-600 to-cyan-500'
              }`}
            />

            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 flex items-center justify-center gap-2 px-6 sm:px-10 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`relative z-10 flex items-center justify-center gap-2 px-6 sm:px-10 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {INITIAL_PACKAGE_TIERS.map((tier) => {
            const price = getPrice(tier.discountPriceUgx);
            const originalPrice = getPrice(tier.originalPriceUgx);
            const isPopular = tier.isPopular;
            const isActivating = activating === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl border p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] ${
                  isPopular
                    ? 'bg-gradient-to-b from-[#0C2445] to-[#0B1E36] border-sky-500/40 shadow-2xl shadow-sky-500/10'
                    : 'bg-[#0B1E36]/80 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-sky-500/30">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Tier Icon & Name */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg mb-4`}>
                    <span className="text-white">{tierIcons[tier.id] ?? <Zap className="w-6 h-6" />}</span>
                  </div>
                  <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {tier.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">{tier.tagline}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {formatUgx(price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {originalPrice > price && (
                      <span className="text-sm text-slate-500 line-through">
                        {formatUgx(originalPrice)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-emerald-400 text-[11px] font-bold mt-1.5">
                      ✨ That's {formatUgx(Math.round(price / 12))}/month — 2 months free!
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPopular ? 'text-sky-400' : 'text-emerald-400'}`} />
                      <span className="text-slate-300 text-xs leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={!!activating}
                  className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                    isPopular
                      ? 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/25'
                      : 'bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-white/25'
                  } disabled:opacity-50`}
                >
                  {isActivating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Subscribe Now</>
                  )}
                </button>

                {/* Max Users Info */}
                <p className="text-center text-slate-500 text-[10px] mt-3">
                  Up to {tier.maxUsers} users · Cancel anytime
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>All plans include <strong className="text-white">30-day free trial</strong> · No credit card required to start</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Prices are in Ugandan Shillings (UGX). VAT exclusive. · Powered by Quantum Networks Ltd
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B1E36] text-slate-400 py-6 px-4 border-t border-[#1E3A5F] text-center text-xs space-y-1 mt-8">
        <p className="text-white font-black tracking-wide">
          ZENITHRX – NEXT-GEN PHARMACY MANAGEMENT PLATFORM
        </p>
        <p className="text-slate-400">
          WhatsApp: <span className="text-emerald-400 font-bold">+256-755091826</span> | Call:{' '}
          <span className="text-sky-300 font-bold">0200 913 555</span> | Email:{' '}
          <span className="text-slate-200">quantumnetworks@gmail.com</span>
        </p>
        <p className="text-slate-500 text-[11px] pt-1">
          Official Web: www.quantumnetworks.com • Powered by Gemini AI Clinical Engine
        </p>
      </footer>
    </div>
  );
};
