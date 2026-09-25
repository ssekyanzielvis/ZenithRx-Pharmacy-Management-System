import React, { useState, useEffect } from 'react';
import {
  getPharmacistCredentials,
  verifyPharmacistCredential,
} from '../../services/pharmacistVerificationService';
import { PharmacistCredentialRecord } from '../../types';
import {
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  AlertTriangle,
  UserCheck,
  Building,
} from 'lucide-react';

export const AdminPharmacistVerification: React.FC = () => {
  const [pharmacists, setPharmacists] = useState<PharmacistCredentialRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setPharmacists(getPharmacistCredentials());
  }, []);

  const handleVerify = (id: string) => {
    const updated = verifyPharmacistCredential(
      id,
      'Quantum Networks Verification Desk',
      'VERIFIED_ACTIVE'
    );
    if (updated) {
      setPharmacists(getPharmacistCredentials());
      setSuccessMsg(`Pharmacist ${updated.pharmacistName} successfully verified and licensed for supervisory role.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const filtered = pharmacists.filter(
    (p) =>
      p.pharmacistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.psuRegNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pharmacyAssignedName && p.pharmacyAssignedName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              PSU &amp; NDA Professional Registry (§5)
            </span>
            <span className="text-xs font-semibold text-slate-500">Supervisory Credentials &amp; Annual Practicing Certificates</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Pharmacist Verification &amp; Credential Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Audit Pharmaceutical Society of Uganda (PSU) registrations, Annual Practicing Certificates (APC), and verify supervising pharmacists.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pharmacists List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search pharmacist name, PSU reg, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {filtered.map((ph) => (
          <div
            key={ph.id}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{ph.pharmacistName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ph.verificationStatus === 'VERIFIED_ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                  }`}
                >
                  {ph.verificationStatus.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 font-mono">
                <div>PSU Reg: <strong className="text-slate-800 dark:text-slate-200">{ph.psuRegNumber}</strong></div>
                <div>Annual Practicing Cert: <strong>{ph.annualPracticingCertNo}</strong> (Exp: {ph.certExpiryDate})</div>
                {ph.ndaSupervisingLicenceNo && (
                  <div>NDA Supervising Licence: <strong>{ph.ndaSupervisingLicenceNo}</strong></div>
                )}
              </div>

              {ph.pharmacyAssignedName && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-sans">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned Pharmacy: <strong>{ph.pharmacyAssignedName}</strong></span>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {ph.verificationStatus === 'PENDING_VERIFICATION' ? (
                <button
                  onClick={() => handleVerify(ph.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Verify PSU Credential</span>
                </button>
              ) : (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified by PSU Registry
                  </span>
                  {ph.verifiedAt && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Verified on {new Date(ph.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
