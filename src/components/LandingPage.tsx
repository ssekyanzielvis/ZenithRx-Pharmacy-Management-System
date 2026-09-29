import React, { useState } from 'react';
import { PromoBannerView } from './PromoBannerView';
import { UseAuthReturn } from '../hooks/useAuth';
import { LoginPage } from './auth/LoginPage';
import { SignUpPage } from './auth/SignUpPage';
import { RegisterPharmacyPage } from './auth/RegisterPharmacyPage';
import { INITIAL_CLIENT_SUBSCRIPTIONS } from '../data/mockData';
import { ClientSubscription } from '../types';
import { Pill, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onGetStarted?: () => void;
  auth?: UseAuthReturn;
  onOpenAdmin?: () => void;
}

type AuthModal = 'none' | 'login' | 'signup';

export const LandingPage: React.FC<LandingPageProps> = ({ auth, onOpenAdmin }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const getInitialAuthView = (): AuthModal => {
    const p = (window.location.pathname + window.location.hash).toLowerCase();
    if (p.includes('register') || p.includes('signup')) return 'signup';
    if (p.includes('login') || p.includes('signin')) return 'login';
    return 'none';
  };

  const [authModal, setAuthModal] = useState<AuthModal>(getInitialAuthView);
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
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070F1C] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* ── Top Header Bar for Visitors ── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1526]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-xs bg-white border border-slate-200 dark:border-emerald-500/30">
            <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-slate-900 dark:text-white font-black text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ZenithRx
            </span>
            <span className="hidden sm:inline-block ml-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              · Clinical Pharmacy Management System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Enter System Administrator Control Plane (/admin)"
            >
              <span>🔒 Admin Portal</span>
            </button>
          )}
          <button
            onClick={handleOpenSignUp}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Register Pharmacy</span>
          </button>
          <button
            onClick={handleOpenLogin}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Staff &amp; Owner Sign In</span>
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
      <footer className="bg-white dark:bg-[#0B1526]/80 text-slate-600 dark:text-slate-400 py-6 px-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs space-y-2 shadow-xs transition-colors duration-200">
        <p className="text-slate-900 dark:text-white font-extrabold tracking-wide">
          ZENITHRX — CLINICAL PHARMACY MANAGEMENT SYSTEM
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          WhatsApp: <span className="text-emerald-700 dark:text-emerald-400 font-bold">+256-755091826</span> | Call:{' '}
          <span className="text-blue-700 dark:text-blue-400 font-bold">0200 913 555</span> | Email:{' '}
          <span className="text-slate-800 dark:text-slate-300 font-medium">quantumnetworks@gmail.com</span>
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-500 dark:text-slate-400 text-[11px] pt-1">
          <span>Official Web: www.quantumnetworks.com • NDA-Licensed • Uganda</span>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-bold underline cursor-pointer"
            >
              System Administrator Login (/admin)
            </button>
          )}
        </div>
      </footer>

      {/* ── Dedicated Pharmacy Staff & Owner Sign-In Page ── */}
      {authModal === 'login' && auth && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8FAFC] dark:bg-[#070F1C]">
          <LoginPage
            auth={auth}
            onBackToLanding={() => setAuthModal('none')}
            onSwitchToSignUp={() => setAuthModal('signup')}
            onOpenAdmin={onOpenAdmin}
          />
        </div>
      )}

      {/* ── Dedicated Register Pharmacy Page ── */}
      {authModal === 'signup' && auth && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8FAFC] dark:bg-[#070F1C]">
          <RegisterPharmacyPage
            auth={auth}
            onBackToLanding={() => setAuthModal('none')}
            onSwitchToLogin={() => setAuthModal('login')}
          />
        </div>
      )}
    </div>
  );
};
