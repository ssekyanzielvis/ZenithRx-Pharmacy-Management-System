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
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* ── Top Header Bar for Visitors ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-xs bg-white border border-slate-200">
            <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-slate-900 font-black text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ZenithRx
            </span>
            <span className="hidden sm:inline-block ml-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              · Clinical Pharmacy Management System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Enter System Administrator Control Plane (/admin)"
            >
              <span>🔒 Admin Portal</span>
            </button>
          )}
          <button
            onClick={handleOpenSignUp}
            className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Sign Up</span>
          </button>
          <button
            onClick={handleOpenLogin}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2"
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
      <footer className="bg-white text-slate-600 py-6 px-4 border-t border-slate-200 text-center text-xs space-y-2 shadow-xs">
        <p className="text-slate-900 font-extrabold tracking-wide">
          ZENITHRX — CLINICAL PHARMACY MANAGEMENT SYSTEM
        </p>
        <p className="text-slate-600">
          WhatsApp: <span className="text-emerald-700 font-bold">+256-755091826</span> | Call:{' '}
          <span className="text-blue-700 font-bold">0200 913 555</span> | Email:{' '}
          <span className="text-slate-800 font-medium">quantumnetworks@gmail.com</span>
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-500 text-[11px] pt-1">
          <span>Official Web: www.quantumnetworks.com • NDA-Licensed • Uganda</span>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
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
