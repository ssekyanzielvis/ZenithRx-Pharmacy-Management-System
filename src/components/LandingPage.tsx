import React, { useState } from 'react';
import { PromoBannerView } from './PromoBannerView';
import { UseAuthReturn } from '../hooks/useAuth';
import { LoginPage } from './auth/LoginPage';
import { SignUpPage } from './auth/SignUpPage';
import { INITIAL_CLIENT_SUBSCRIPTIONS } from '../data/mockData';
import { ClientSubscription } from '../types';
import { Pill, LogIn, UserPlus } from 'lucide-react';

interface LandingPageProps {
  onGetStarted?: () => void;
  auth?: UseAuthReturn;
  onOpenAdmin?: () => void;
}

type AuthModal = 'none' | 'login' | 'signup';

export const LandingPage: React.FC<LandingPageProps> = ({ auth, onOpenAdmin }) => {
  const [authModal, setAuthModal] = useState<AuthModal>(
    window.location.hash.includes('login') ? 'login' : 'none'
  );
  const [activeClient, setActiveClient] = useState<ClientSubscription>(
    INITIAL_CLIENT_SUBSCRIPTIONS[0]
  );

  const handleOpenLogin = () => {
    setAuthModal('login');
  };

  const handleOpenSignUp = () => {
    setAuthModal('signup');
  };

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-white font-sans">
      {/* ── Top Header Bar for Visitors ── */}
      <header className="sticky top-0 z-40 bg-[#1E293B]/95 backdrop-blur-xl border-b border-slate-700 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-md">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-black text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ZenithRx
            </span>
            <span className="hidden sm:inline-block ml-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              · Next-Gen Pharmacy Management Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
              title="Enter System Administrator Control Plane (/admin)"
            >
              <span>🔒 Admin Portal</span>
            </button>
          )}
          <button
            onClick={handleOpenSignUp}
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Up</span>
          </button>
          <button
            onClick={handleOpenLogin}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Staff Sign In</span>
          </button>
        </div>
      </header>

      {/* ── Main Landing Page Content (PromoBannerView) ── */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto">
        <PromoBannerView
          onSelectFeature={handleOpenLogin}
          openBarcodeScanner={handleOpenLogin}
          activeClient={activeClient}
          setActiveClient={setActiveClient}
        />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#1E293B] text-slate-400 py-6 px-4 border-t border-slate-700 text-center text-xs space-y-2">
        <p className="text-white font-black tracking-wide">
          ZENITHRX – NEXT-GEN PHARMACY MANAGEMENT PLATFORM
        </p>
        <p className="text-slate-400">
          WhatsApp: <span className="text-green-400 font-bold">+256-755091826</span> | Call:{' '}
          <span className="text-blue-400 font-bold">0200 913 555</span> | Email:{' '}
          <span className="text-slate-200">quantumnetworks@gmail.com</span>
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-500 text-[11px] pt-1">
          <span>Official Web: www.quantumnetworks.com • Powered by Gemini AI Clinical Engine</span>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              System Administrator Login (/admin)
            </button>
          )}
        </div>
      </footer>

      {/* ── Login Modal Overlay ── */}
      {authModal === 'login' && auth && (
        <LoginPage
          auth={auth}
          isModal
          onClose={() => setAuthModal('none')}
          onSwitchToSignUp={() => setAuthModal('signup')}
        />
      )}

      {/* ── SignUp Modal Overlay ── */}
      {authModal === 'signup' && auth && (
        <SignUpPage
          auth={auth}
          isModal
          onClose={() => setAuthModal('none')}
          onSwitchToLogin={() => setAuthModal('login')}
        />
      )}
    </div>
  );
};
