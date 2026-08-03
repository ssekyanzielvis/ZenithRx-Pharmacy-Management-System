import React, { useState } from 'react';
import { InsuranceProvider } from '../types';
import {
  ShieldCheck,
  Plus,
  Phone,
  CheckCircle2,
  FileCheck2,
  Send,
  Loader2,
  Search
} from 'lucide-react';

interface InsuranceSchemesProps {
  providers: InsuranceProvider[];
}

export const InsuranceSchemes: React.FC<InsuranceSchemesProps> = ({ providers }) => {
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [authResult, setAuthResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [claimsBatched, setClaimsBatched] = useState(false);

  const handleValidateCode = () => {
    if (!authCodeInput.trim()) return;
    setIsValidating(true);
    setAuthResult(null);

    setTimeout(() => {
      setIsValidating(false);
      setAuthResult({
        valid: true,
        patientName: 'Sarah Wanjiku',
        scheme: 'Jubilee Health Insurance',
        preAuthLimit: 50000,
        approvedDrugs: ['Augmentin 625mg', 'Panadol Extra', 'Ventolin Evohaler'],
        code: authCodeInput.toUpperCase(),
      });
    }, 1000);
  };

  const handleBatchClaims = () => {
    setClaimsBatched(true);
    setTimeout(() => setClaimsBatched(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-sky-400" />
            Insurance & Medical Scheme Support
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            Pre-authorization code verification, co-pay split calculator, and bulk electronic claim submission.
          </p>
        </div>

        <button
          onClick={handleBatchClaims}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Batch Submit Electronic Claims</span>
        </button>
      </div>

      {claimsBatched && (
        <div className="bg-emerald-500 text-slate-950 p-4 rounded-xl font-extrabold text-xs flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            59 Pending Medical Claims totaling UGX 576,500 successfully submitted to Insurance Providers!
          </span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px]">SUBMITTED</span>
        </div>
      )}

      {/* Grid: Pre-Authorization Code Checker & Scheme Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pre-Authorization Code Checker Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-sky-600" />
              Pre-Authorization Code Verifier
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter patient pre-auth approval code issued by insurer before dispensing.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Enter Approval / Pre-Auth Code:</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="e.g. AUTH-2026-JUB-991"
                  value={authCodeInput}
                  onChange={(e) => setAuthCodeInput(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase font-bold text-slate-900 outline-none"
                />
                <button
                  onClick={handleValidateCode}
                  disabled={isValidating || !authCodeInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                </button>
              </div>
            </div>

            {authResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-900 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pre-Auth Approved
                  </span>
                  <span className="font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    {authResult.code}
                  </span>
                </div>
                <p className="font-bold text-slate-800">Patient: {authResult.patientName}</p>
                <p className="text-slate-600">Approved Limit: UGX {authResult.preAuthLimit.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">
                  Approved Coverage: {authResult.approvedDrugs.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Insurance Providers Table Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Supported Insurance & Medical Schemes ({providers.length})
          </h3>

          <div className="space-y-3">
            {providers.map((prov) => (
              <div key={prov.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-slate-900 text-xs">{prov.providerName}</p>
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-mono px-2 py-0.2 rounded font-bold">
                      {prov.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Claims Line: {prov.contactPhone}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <p className="font-bold text-slate-700">
                    Coverage: <span className="text-emerald-700 font-extrabold">{(prov.coverageRatio * 100).toFixed(0)}%</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {prov.pendingClaimsCount} Claims • UGX {prov.totalClaimedAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
