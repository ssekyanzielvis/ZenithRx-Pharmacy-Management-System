import React, { useState, useEffect } from 'react';
import {
  getPlatformPolicies,
  updatePlatformPolicies,
} from '../../services/adminGovernanceService';
import { PlatformPolicySettings } from '../../types';
import {
  Shield,
  Lock,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Save,
} from 'lucide-react';

export const AdminPoliciesPanel: React.FC = () => {
  const [policies, setPolicies] = useState<PlatformPolicySettings>(getPlatformPolicies());
  const [savedMessage, setSavedMessage] = useState(false);

  const handleToggle = (key: keyof PlatformPolicySettings) => {
    setPolicies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updatePlatformPolicies(policies);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Ring-0 Security Control
            </span>
            <span className="text-xs font-semibold text-slate-500">Platform Policies &amp; Compliance Enforcers</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Platform Policies &amp; Global Security Controls (§4.1)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Configure system-wide authentication invariants, inactivity lockout timers, IP whitelists, and maintenance circuit switches.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <Save className="w-4 h-4" />
          <span>Save Policies</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Global platform policies updated and synced across all tenant clusters.</span>
        </div>
      )}

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication & Session Security */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            Session Security &amp; 2FA Policies
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Auto-Lockout Inactivity Timer</span>
                <p className="text-[11px] text-slate-500">Lock cashier/pharmacist workstation after idle period</p>
              </div>
              <select
                value={policies.autoLockoutIdleMinutes}
                onChange={(e) => setPolicies({ ...policies, autoLockoutIdleMinutes: Number(e.target.value) })}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Enforce Mandatory 2FA for Pharmacists</span>
                <p className="text-[11px] text-slate-500">Requires TOTP / SMS code for prescription dispensing roles</p>
              </div>
              <input
                type="checkbox"
                checked={policies.enforce2FAForPharmacists}
                onChange={() => handleToggle('enforce2FAForPharmacists')}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Strict UMDPC Doctor Licence Validation</span>
                <p className="text-[11px] text-slate-500">Reject prescriptions from unverified practitioner licences</p>
              </div>
              <input
                type="checkbox"
                checked={policies.requireDoctorLicenceStrictValidation}
                onChange={() => handleToggle('requireDoctorLicenceStrictValidation')}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Global Emergency & Whitelist */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-500" />
            Infrastructure &amp; Network Whitelist
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Emergency Maintenance Banner</span>
                <p className="text-[11px] text-slate-500">Display global notice on all client workspaces</p>
              </div>
              <input
                type="checkbox"
                checked={policies.enableEmergencyMaintenanceBanner}
                onChange={() => handleToggle('enableEmergencyMaintenanceBanner')}
                className="w-5 h-5 text-rose-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Maintenance Notice Message</label>
              <input
                type="text"
                value={policies.maintenanceMessage}
                onChange={(e) => setPolicies({ ...policies, maintenanceMessage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Auto-Submit ADRs to NDA Pharmacovigilance</span>
                <p className="text-[11px] text-slate-500">Automatically broadcast Yellow Sheets to NDA servers</p>
              </div>
              <input
                type="checkbox"
                checked={policies.ndaYellowSheetAutoSubmit}
                onChange={() => handleToggle('ndaYellowSheetAutoSubmit')}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
