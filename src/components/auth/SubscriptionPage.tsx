import React, { useState } from 'react';
import {
  Pill,
  Check,
  Zap,
  Crown,
  Rocket,
  Star,
  ArrowRight,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';
import { INITIAL_PACKAGE_TIERS } from '../../data/mockData';
import type { BillingCycle, PackageTier } from '../../types';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal';

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
  const [selectedTierForCheckout, setSelectedTierForCheckout] = useState<PackageTier | null>(null);

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

  const handleSubscribe = (tier: PackageTier) => {
    setSelectedTierForCheckout(tier);
  };

  return (
    <div className="min-h-screen bg-[#F5FAF8] dark:bg-[#0B131F] text-[#263B33] dark:text-slate-200 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0D1A2A] border-b border-[#E3ECE8] dark:border-slate-700 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8F7F0] border border-[#C3E8D8] flex items-center justify-center text-[#20A66A] shadow-xs">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#263B33] dark:text-slate-100 font-black text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ZenithRx
            </span>
            <span className="hidden sm:inline-block ml-2 text-[#5E7A70] text-xs font-semibold">
              · Pharmacy Subscription Plans
            </span>
          </div>
        </div>

        {auth.user && (
          <div className="flex items-center gap-3">
            <span className="text-[#5E7A70] text-xs hidden sm:block">
              Welcome, <span className="text-[#263B33] font-bold">{auth.user.fullName}</span>
            </span>
            <button
              onClick={() => auth.signOut()}
              className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-600 text-[#5E7A70] dark:text-slate-300 text-xs font-semibold hover:bg-[#F0F5F3] dark:hover:bg-slate-700 hover:text-[#263B33] dark:hover:text-slate-100 transition-all cursor-pointer shadow-2xs"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F7F0] border border-[#C3E8D8] text-[#1E744F] text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5 text-[#20A66A]" /> Activate Pharmacy Workspace
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-[#263B33] dark:text-slate-100" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Select a Subscription Plan for Your Pharmacy
          </h1>
          <p className="text-[#5E7A70] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Professional dispensing, inventory control, and AI-assisted clinical workflows tailored to Ugandan pharmacies.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="bg-[#F0F5F3] dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-700 rounded-xl p-1 flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-[#20A66A] dark:text-emerald-300 shadow-xs border border-[#E3ECE8] dark:border-slate-600'
                  : 'text-[#5E7A70] dark:text-slate-400 hover:text-[#263B33] dark:hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-700 text-[#20A66A] dark:text-emerald-300 shadow-xs border border-[#E3ECE8] dark:border-slate-600'
                  : 'text-[#5E7A70] dark:text-slate-400 hover:text-[#263B33] dark:hover:text-slate-200'
              }`}
            >
              Annual Billing
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
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

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl bg-white dark:bg-[#132032] border p-6 sm:p-8 transition-all duration-200 shadow-sm flex flex-col justify-between ${
                  isPopular
                    ? 'border-2 border-[#20A66A] shadow-md ring-4 ring-[#20A66A]/10'
                    : 'border-[#E3ECE8] dark:border-slate-700 hover:border-[#C3E8D8] dark:hover:border-emerald-800'
                }`}
              >
                <div>
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="px-3.5 py-0.5 rounded-full bg-[#20A66A] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Tier Icon & Name */}
                  <div className="mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F7F0] border border-[#C3E8D8] flex items-center justify-center text-[#20A66A] shadow-xs mb-3">
                      <span>{tierIcons[tier.id] ?? <Zap className="w-5 h-5" />}</span>
                    </div>
                    <h3 className="text-xl font-black text-[#263B33] dark:text-slate-100" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {tier.name}
                    </h3>
                    <p className="text-[#5E7A70] text-xs mt-1">{tier.tagline}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6 pb-5 border-b border-[#E3ECE8] dark:border-slate-700">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[#263B33] dark:text-slate-100" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {formatUgx(price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {originalPrice > price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatUgx(originalPrice)}
                        </span>
                      )}
                      <span className="text-xs text-[#5E7A70]">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-[#1E744F] text-[11px] font-semibold mt-1">
                        Effective {formatUgx(Math.round(price / 12))}/mo (2 months free)
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#20A66A]" />
                        <span className="text-[#263B33] dark:text-slate-200 text-xs leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(tier)}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'bg-[#20A66A] hover:bg-[#188755] text-white shadow-xs'
                        : 'bg-[#F0F5F3] dark:bg-slate-700 hover:bg-[#E3ECE8] dark:hover:bg-slate-600 text-[#263B33] dark:text-slate-200 border border-[#E3ECE8] dark:border-slate-600'
                    }`}
                  >
                    <span>Subscribe to {tier.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Max Users Info */}
                  <p className="text-center text-[#5E7A70] text-[10px] mt-2.5">
                    Up to {tier.maxUsers} staff seats · Cancel anytime
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="mt-10 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-700 text-[#5E7A70] dark:text-slate-300 text-xs shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>All plans include <strong className="text-[#263B33]">30-day trial</strong> · Official Uganda NDA Premise Verification</span>
          </div>
          <p className="text-[#5E7A70] text-[11px]">
            Rates in Ugandan Shillings (UGX). Powered by Quantum Networks Ltd
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0D1A2A] text-[#5E7A70] dark:text-slate-400 py-6 px-4 border-t border-[#E3ECE8] dark:border-slate-700 text-center text-xs space-y-1 mt-10">
        <p className="text-[#263B33] dark:text-slate-200 font-bold">
          ZenithRx Pharmacy Management &amp; Dispensing System
        </p>
        <p className="text-[#5E7A70]">
          WhatsApp: <span className="text-[#20A66A] font-semibold">+256-755091826</span> | Phone:{' '}
          <span className="text-[#2F80C9] font-semibold">0200 913 555</span> | Support:{' '}
          <span className="text-[#263B33]">support@zenithrx.ug</span>
        </p>
      </footer>

      {/* Checkout Modal with MTN MoMo, Airtel Money, and Universal Card Payment */}
      {selectedTierForCheckout && (
        <SubscriptionCheckoutModal
          isOpen={!!selectedTierForCheckout}
          onClose={() => setSelectedTierForCheckout(null)}
          tier={selectedTierForCheckout}
          billingCycle={billingCycle}
          auth={auth}
        />
      )}
    </div>
  );
};
