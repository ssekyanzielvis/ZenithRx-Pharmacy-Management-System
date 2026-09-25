import React, { useState, useEffect } from 'react';
import {
  getCircuitBreakerState,
  setCircuitBreakerState,
} from '../../services/adminGovernanceService';
import { CircuitBreakerState } from '../../types';
import {
  AlertOctagon,
  Flame,
  ShieldAlert,
  PowerOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ZapOff,
} from 'lucide-react';

export const AdminIncidentResponse: React.FC = () => {
  const [breaker, setBreaker] = useState<CircuitBreakerState>(getCircuitBreakerState());
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleToggleBreaker = (key: keyof CircuitBreakerState) => {
    const newVal = !breaker[key];
    const updated = setCircuitBreakerState(
      { [key]: newVal },
      'Arthur Ssenabulya (Lead Systems Architect)'
    );
    setBreaker(updated);
    setStatusMsg(`Circuit breaker state [${key}] updated to: ${newVal ? 'TRIPPED / ISOLATED' : 'NORMAL'}`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Circuit Breakers &amp; Kill Switches (§4.4)
            </span>
            <span className="text-xs font-semibold text-slate-500">Emergency Incident Response</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Incident Response &amp; Subsystem Circuit Breakers
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Instantaneous kill-switches to isolate corrupted subsystems, freeze offline POS syncing, or cut compromised payment channels during live outages.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Switches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Global Emergency Platform Freeze</h3>
              <p className="text-xs text-slate-500">Locks all tenant workstations in read-only audit mode</p>
            </div>
            <button
              onClick={() => handleToggleBreaker('globalEmergencyFreeze')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                breaker.globalEmergencyFreeze
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {breaker.globalEmergencyFreeze ? 'TRIPPED (FROZEN)' : 'NORMAL (ONLINE)'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">POS Retail Offline Sync Kill-Switch</h3>
              <p className="text-xs text-slate-500">Disables offline queue ingestion if malicious transactions detected</p>
            </div>
            <button
              onClick={() => handleToggleBreaker('isolatePosTransactions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                breaker.isolatePosTransactions
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {breaker.isolatePosTransactions ? 'ISOLATED' : 'ACTIVE'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Payment Gateway Escrow Circuit Breaker</h3>
              <p className="text-xs text-slate-500">Halts external MoMo &amp; Visa webhooks during network flapping</p>
            </div>
            <button
              onClick={() => handleToggleBreaker('isolatePaymentGateways')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                breaker.isolatePaymentGateways
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {breaker.isolatePaymentGateways ? 'ISOLATED' : 'ACTIVE'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Clinical AI Counseling Circuit Breaker</h3>
              <p className="text-xs text-slate-500">Bypasses LLM API calls in favor of static fallback formulary</p>
            </div>
            <button
              onClick={() => handleToggleBreaker('isolateAiServices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                breaker.isolateAiServices
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {breaker.isolateAiServices ? 'BYPASSED' : 'ACTIVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
