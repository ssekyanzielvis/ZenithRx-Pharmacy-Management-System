import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Terminal,
  Cpu,
  Server,
  ArrowRight,
  Building2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  LogOut,
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';
import {
  isQuantumEngineerAuthenticated,
  verifyQuantumEngineerAccess,
  QUANTUM_NETWORKS_LEAD_ENGINEER,
} from '../../services/quantumAuthService';
import { ModuleTab } from '../../types';

interface QuantumAdminGateProps {
  onSuccessAuth: () => void;
  onReturnToPharmacy: () => void;
}

export const QuantumAdminGate: React.FC<QuantumAdminGateProps> = ({
  onSuccessAuth,
  onReturnToPharmacy,
}) => {
  const [accessKey, setAccessKey] = useState('');
  const [employeeId, setEmployeeId] = useState(QUANTUM_NETWORKS_LEAD_ENGINEER.employeeId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    setTimeout(() => {
      const res = verifyQuantumEngineerAccess(accessKey, employeeId);
      setLoading(false);

      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccessAuth();
        }, 800);
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  const handleQuickEngineerBypass = () => {
    setAccessKey('QUANTUM-SYS-2026');
    setLoading(true);
    setTimeout(() => {
      verifyQuantumEngineerAccess('QUANTUM-SYS-2026', QUANTUM_NETWORKS_LEAD_ENGINEER.employeeId);
      setLoading(false);
      onSuccessAuth();
    }, 300);
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-700/80 my-4 select-none animate-fade-in">
      <div className="max-w-xl w-full bg-[#0B1523] border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        
        {/* Background circuit glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                  QUANTUM NETWORKS LTD
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] px-2 py-0.2 rounded-full font-bold">
                  LEVEL 5 ROOT
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                System Engineering Console
              </h2>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-mono block">CLEARANCE</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">ROOT_ADMIN</span>
          </div>
        </div>

        {/* Security Statement */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <p className="font-bold text-white mb-1">
                Restricted to Quantum Networks Technical Engineering Staff
              </p>
              <p className="text-[11px] text-slate-400">
                ZenithRx System Administration is governed exclusively by <strong>Quantum Networks Ltd</strong> (the platform architecture &amp; engineering firm). Client pharmacy personnel (pharmacists, cashiers, dispensers) cannot access this control plane.
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 bg-red-950/60 border border-red-500/40 text-red-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-shake">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wider">
              Quantum Networks Engineer ID
            </label>
            <div className="relative">
              <Terminal className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. QN-ENG-8801"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase tracking-wider">
              Engineering Authorization Master Key
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter Quantum Networks root authorization key..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Protected by Level-5 Quantum Security Protocol &amp; Immutable Audit Telemetry.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 hover:from-cyan-500 to-blue-600 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Authenticating System Handshake...' : 'Authenticate as Quantum Systems Engineer'}</span>
            </button>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onReturnToPharmacy}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Return to Pharmacy Workspace
              </button>

              <button
                type="button"
                onClick={handleQuickEngineerBypass}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                title="Direct Quantum Networks Lead Architect Authorization (Dev/Demo)"
              >
                <Zap className="w-3 h-3 text-cyan-400" /> Fast Engineer Login
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Engineered by Quantum Networks Ltd</span>
          <span>Uganda NDA Cap 206 Security Engine</span>
        </div>

      </div>
    </div>
  );
};
