/**
 * InsuranceSchemes.tsx — ZenithRx Insurance Claims & Reconciliation Hub
 * Clean Architecture: Presentation Layer
 * Integrates pre-authorization verification, dynamic co-pay calculation,
 * batch electronic submission, and claims reconciliation.
 */

import React, { useState } from 'react';
import { InsuranceProvider, InsuranceClaim } from '../types';
import { useInsuranceClaims } from '../hooks/useInsuranceClaims';
import { formatUGX } from '../services/formatters';
import {
  ShieldCheck,
  Plus,
  Phone,
  CheckCircle2,
  FileCheck2,
  Send,
  Loader2,
  Search,
  Printer,
  Building2,
  DollarSign,
  AlertCircle,
  X,
  FileText,
  Clock,
  User,
  Calculator,
  Check,
  Ban,
  Layers,
  ChevronRight
} from 'lucide-react';

interface InsuranceSchemesProps {
  providers: InsuranceProvider[];
  tenantId?: string;
}

export const InsuranceSchemes: React.FC<InsuranceSchemesProps> = ({
  providers,
  tenantId,
}) => {
  const {
    activeTab,
    setActiveTab,
    filteredClaims,
    metrics,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    providerFilter,
    setProviderFilter,
    verifierForm,
    setVerifierForm,
    isValidating,
    verificationResult,
    handleVerifyEligibility,
    isBatchSubmitting,
    batchSuccessMessage,
    handleBatchSubmit,
    handleReconcileClaim,
    handleApproveClaim,
    handleRejectClaim,
    handleCreateClaim,
    handlePrintClaim,
  } = useInsuranceClaims({ providers, tenantId });

  // Reconciliation modal state
  const [reconcilingClaimId, setReconcilingClaimId] = useState<string | null>(null);
  const [remittanceInput, setRemittanceInput] = useState('');

  // Rejection modal state
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // New Claim Form State
  const [newClaimForm, setNewClaimForm] = useState<Partial<InsuranceClaim>>({
    providerId: providers[0]?.id || 'INS-01',
    providerName: providers[0]?.providerName || 'Jubilee Health Insurance Uganda',
    memberNumber: '',
    patientName: '',
    patientPhone: '+256 ',
    diagnosisCode: '',
    preAuthCode: '',
    items: [{ drugName: '', quantity: 1, unitPrice: 5000, total: 5000 }],
  });

  const handleOpenReconcile = (claimId: string) => {
    setReconcilingClaimId(claimId);
    setRemittanceInput(`REM-${Date.now().toString().slice(-4)}`);
  };

  const handleConfirmReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (reconcilingClaimId) {
      handleReconcileClaim(reconcilingClaimId, remittanceInput);
      setReconcilingClaimId(null);
    }
  };

  const handleOpenReject = (claimId: string) => {
    setRejectingClaimId(claimId);
    setRejectionReasonInput('Pre-authorization expired or non-formulary medication.');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectingClaimId) {
      handleRejectClaim(rejectingClaimId, rejectionReasonInput);
      setRejectingClaimId(null);
    }
  };

  const handleAddItemToNewClaim = () => {
    setNewClaimForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), { drugName: '', quantity: 1, unitPrice: 5000, total: 5000 }],
    }));
  };

  const handleCreateNewClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimForm.patientName || !newClaimForm.memberNumber) return;

    const prov = providers.find((p) => p.id === newClaimForm.providerId) || providers[0];
    const items = newClaimForm.items || [];
    const totalAmount = items.reduce((sum, it) => sum + it.total, 0);
    const coveredAmount = Math.round(totalAmount * (prov ? prov.coverageRatio : 0.8));
    const copayAmount = totalAmount - coveredAmount;

    const fullClaim: InsuranceClaim = {
      id: `CLM-${Date.now()}`,
      claimNumber: `CLM-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 90 + 10)}`,
      providerId: prov ? prov.id : 'INS-01',
      providerName: prov ? prov.providerName : 'Jubilee Health Insurance Uganda',
      memberNumber: newClaimForm.memberNumber,
      patientName: newClaimForm.patientName,
      patientPhone: newClaimForm.patientPhone || '',
      diagnosisCode: newClaimForm.diagnosisCode || 'General Consultation',
      preAuthCode: (newClaimForm.preAuthCode || 'AUTH-' + Math.floor(Math.random() * 90000 + 10000)).toUpperCase(),
      totalAmount,
      coveredAmount,
      copayAmount,
      status: 'Draft',
      submissionDate: new Date().toISOString().split('T')[0],
      items,
    };

    handleCreateClaim(fullClaim);
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Header & EDI Action Banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0B1E36] via-[#1E3A5F] to-[#0284C7] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Electronic Claims Clearinghouse
            </span>
            <span className="bg-sky-500/20 text-sky-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-400/30 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Real-time Co-Pay Split Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Insurance Schemes & Claims Reconciliation</h1>
          <p className="text-slate-300 text-sm mt-0.5">
            Verify member pre-authorization eligibility, calculate copay splits, and reconcile remittance payouts.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('newClaim')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Claim</span>
          </button>

          <button
            onClick={handleBatchSubmit}
            disabled={isBatchSubmitting || metrics.draftCount === 0}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all ${
              metrics.draftCount > 0 && !isBatchSubmitting
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 hover:-translate-y-0.5'
                : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isBatchSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Transmit Batch EDI ({metrics.draftCount} Drafts)</span>
          </button>
        </div>
      </div>

      {/* Batch Success Feedback */}
      {batchSuccessMessage && (
        <div className="bg-emerald-500 text-slate-950 p-4 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-950" />
            {batchSuccessMessage}
          </span>
          <span className="bg-slate-950 text-white px-2 py-0.5 rounded text-[10px]">EDI TRANSMITTED</span>
        </div>
      )}

      {/* ─── Financial Metrics Overview ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Receivables
            </span>
            <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {formatUGX(metrics.totalReceivables)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{metrics.pendingReviewCount} claims under review</p>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reconciled & Settled
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatUGX(metrics.totalReconciled)}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Remittance advice verified</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Draft Claims
            </span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.draftCount} Claims
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Ready for batch EDI transmit</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Partnered Insurers
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {providers.length} Schemes
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Direct billing active</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation Bar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'claims'
              ? 'bg-[#0B1E36] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Claims Reconciliation Portal</span>
        </button>

        <button
          onClick={() => setActiveTab('verifier')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'verifier'
              ? 'bg-[#0B1E36] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-sky-400" />
          <span>Pre-Auth & Eligibility Verifier</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'providers'
              ? 'bg-[#0B1E36] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Insurers & Coverage Schemes</span>
        </button>

        <button
          onClick={() => setActiveTab('newClaim')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'newClaim'
              ? 'bg-[#0B1E36] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Direct Claim</span>
        </button>
      </div>

      {/* ─── Tab 1: Claims Reconciliation Portal ───────────────────────────── */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by claim#, patient, member#..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                {(['All', 'Draft', 'Submitted', 'Approved', 'Reconciled', 'Rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Provider Filter */}
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <option value="All">All Providers</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.providerName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Claims Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5">Claim # & Date</th>
                    <th className="p-3.5">Patient & Member ID</th>
                    <th className="p-3.5">Insurance Scheme</th>
                    <th className="p-3.5 text-right">Total Bill</th>
                    <th className="p-3.5 text-right">Covered / Co-Pay</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No insurance claims found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new direct claim.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {claim.claimNumber}
                          </span>
                          <div className="text-slate-400 text-[11px] mt-0.5">{claim.submissionDate}</div>
                          <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                            PreAuth: {claim.preAuthCode}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {claim.patientName}
                          </div>
                          <div className="text-slate-500 text-[11px]">Mem: {claim.memberNumber}</div>
                          <div className="text-slate-400 text-[10px]">{claim.patientPhone}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {claim.providerName}
                          </div>
                          <div className="text-slate-400 text-[11px]">{claim.diagnosisCode || 'Clinical claim'}</div>
                          {claim.remittanceAdviceNo && (
                            <div className="text-[10px] font-mono text-emerald-600 font-semibold">
                              Remittance: {claim.remittanceAdviceNo}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatUGX(claim.totalAmount)}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatUGX(claim.coveredAmount)}
                          </div>
                          <div className="text-[11px] text-amber-600">
                            Co-Pay: {formatUGX(claim.copayAmount)}
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              claim.status === 'Reconciled'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                                : claim.status === 'Approved'
                                ? 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-300'
                                : claim.status === 'Submitted'
                                ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300'
                                : claim.status === 'Draft'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300'
                                : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-300'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handlePrintClaim(claim)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                              title="Print Official Medical Claim Voucher"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {claim.status === 'Submitted' && (
                              <button
                                onClick={() => handleApproveClaim(claim.id)}
                                className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg"
                                title="Mark Approved by Clearinghouse"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {(claim.status === 'Submitted' || claim.status === 'Approved') && (
                              <button
                                onClick={() => handleOpenReconcile(claim.id)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                                title="Reconcile Remittance Advice Payout"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {claim.status === 'Submitted' && (
                              <button
                                onClick={() => handleOpenReject(claim.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg"
                                title="Reject Claim"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 2: Pre-Auth & Member Eligibility Verifier ─────────────────── */}
      {activeTab === 'verifier' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-sky-500" />
                Pre-Authorization & Member Eligibility Engine
              </h3>
              <p className="text-slate-500 mt-0.5">
                Query insurer pre-auth database and compute patient co-payment split prior to dispensing.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Insurance Scheme / Provider</label>
                <select
                  value={verifierForm.providerId}
                  onChange={(e) => setVerifierForm({ ...verifierForm, providerId: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.providerName} (Coverage: {Math.round(p.coverageRatio * 100)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Member Policy / Card Number *</label>
                <input
                  type="text"
                  placeholder="e.g. JUB-883921-A"
                  value={verifierForm.memberNumber}
                  onChange={(e) => setVerifierForm({ ...verifierForm, memberNumber: e.target.value })}
                  className="w-full mt-1 p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Wanjiku"
                  value={verifierForm.patientName}
                  onChange={(e) => setVerifierForm({ ...verifierForm, patientName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Pre-Auth / Approval Code (if issued)</label>
                <input
                  type="text"
                  placeholder="e.g. JUB-AUTH-77821"
                  value={verifierForm.preAuthCode}
                  onChange={(e) => setVerifierForm({ ...verifierForm, preAuthCode: e.target.value })}
                  className="w-full mt-1 p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Estimated Total Drug Bill (UGX)</label>
                <input
                  type="number"
                  value={verifierForm.claimAmount}
                  onChange={(e) => setVerifierForm({ ...verifierForm, claimAmount: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                onClick={handleVerifyEligibility}
                disabled={isValidating}
                className="w-full py-3 bg-[#0284C7] hover:bg-sky-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Querying Clearinghouse Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Eligibility & Calculate Co-Pay</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Result Column */}
          <div className="lg:col-span-6 space-y-4">
            {verificationResult ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6 shadow-sm space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                        Member Eligible & Pre-Auth Confirmed
                      </h4>
                      <p className="text-slate-500 text-[11px]">Direct insurance dispensing authorized</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                    ACTIVE POLICY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400">Patient:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {verificationResult.patientName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Policy / Member No:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {verificationResult.memberNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Approved Insurer:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {verificationResult.providerName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Pre-Auth Code:</span>
                    <p className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {verificationResult.preAuthCode}
                    </p>
                  </div>
                </div>

                {/* Co-Pay Calculation Card */}
                <div className="border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 p-4 rounded-xl space-y-2">
                  <span className="font-bold text-sky-950 dark:text-sky-200 text-xs">
                    Co-Pay Split Calculation ({Math.round(verificationResult.coverageRatio * 100)}% Coverage)
                  </span>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-slate-600 dark:text-slate-400">Total Prescription Bill:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatUGX(verificationResult.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      Insurer Covered (Payable via EDI):
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {formatUGX(verificationResult.coveredAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-sky-200 dark:border-sky-800">
                    <span className="text-amber-700 dark:text-amber-300 font-bold">
                      Patient Co-Payment (Pay at POS):
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-300">
                      {formatUGX(verificationResult.copayAmount)}
                    </span>
                  </div>
                </div>

                {/* Approved Drugs */}
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Covered Formulary Medications:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {verificationResult.approvedDrugs.map((drug, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg text-[11px]"
                      >
                        ✓ {drug}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
                <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Awaiting Eligibility Query</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enter member number and scheme to verify pre-auth limit and calculate exact co-pay breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab 3: Insurers & Coverage Directory ──────────────────────────── */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((prov) => (
            <div
              key={prov.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {prov.providerName}
                  </h4>
                  <p className="text-slate-400 font-mono text-[11px] mt-0.5">Code: {prov.code}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {prov.status}
                </span>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-500">Coverage Ratio:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {Math.round(prov.coverageRatio * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending Claims:</span>
                  <span className="font-bold text-amber-600">{prov.pendingClaimsCount} Claims</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Claimed Value:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {formatUGX(prov.totalClaimedAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-500 pt-1">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prov.contactPhone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tab 4: New Direct Claim Form ──────────────────────────────────── */}
      {activeTab === 'newClaim' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl mx-auto space-y-4 text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" />
              Create Direct Insurance Claim
            </h3>
            <p className="text-slate-500 mt-0.5">
              Register itemized prescription dispensing claim for submission to insurance scheme.
            </p>
          </div>

          <form onSubmit={handleCreateNewClaimSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Insurance Scheme *</label>
                <select
                  value={newClaimForm.providerId}
                  onChange={(e) => {
                    const p = providers.find((pr) => pr.id === e.target.value);
                    setNewClaimForm({
                      ...newClaimForm,
                      providerId: e.target.value,
                      providerName: p?.providerName || '',
                    });
                  }}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.providerName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Member Policy # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NHIS-5529104"
                  value={newClaimForm.memberNumber || ''}
                  onChange={(e) => setNewClaimForm({ ...newClaimForm, memberNumber: e.target.value })}
                  className="w-full mt-1 p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Kiptoo"
                  value={newClaimForm.patientName || ''}
                  onChange={(e) => setNewClaimForm({ ...newClaimForm, patientName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Pre-Auth / Voucher Code</label>
                <input
                  type="text"
                  placeholder="e.g. AUTH-2026-991"
                  value={newClaimForm.preAuthCode || ''}
                  onChange={(e) => setNewClaimForm({ ...newClaimForm, preAuthCode: e.target.value })}
                  className="w-full mt-1 p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Diagnosis Code / Condition</label>
                <input
                  type="text"
                  placeholder="e.g. E11.9 (Type 2 Diabetes) or Routine Refill"
                  value={newClaimForm.diagnosisCode || ''}
                  onChange={(e) => setNewClaimForm({ ...newClaimForm, diagnosisCode: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">Claimed Medications</label>
                <button
                  type="button"
                  onClick={handleAddItemToNewClaim}
                  className="text-xs text-sky-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug Row
                </button>
              </div>

              {newClaimForm.items?.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Medication Name (e.g. Metformin 500mg)"
                    value={item.drugName}
                    onChange={(e) => {
                      const updated = [...(newClaimForm.items || [])];
                      updated[idx].drugName = e.target.value;
                      setNewClaimForm({ ...newClaimForm, items: updated });
                    }}
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...(newClaimForm.items || [])];
                      const q = Number(e.target.value);
                      updated[idx].quantity = q;
                      updated[idx].total = q * updated[idx].unitPrice;
                      setNewClaimForm({ ...newClaimForm, items: updated });
                    }}
                    className="w-16 p-2 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const updated = [...(newClaimForm.items || [])];
                      const u = Number(e.target.value);
                      updated[idx].unitPrice = u;
                      updated[idx].total = updated[idx].quantity * u;
                      setNewClaimForm({ ...newClaimForm, items: updated });
                    }}
                    className="w-24 p-2 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('claims')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0284C7] hover:bg-sky-600 text-white font-bold rounded-xl shadow-md"
              >
                Create Claim Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Reconciliation Modal ──────────────────────────────────────────── */}
      {reconcilingClaimId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Reconcile Remittance Advice
              </h3>
              <button
                onClick={() => setReconcilingClaimId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReconcile} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Remittance Advice Reference / Bank Reference *
                </label>
                <input
                  type="text"
                  required
                  value={remittanceInput}
                  onChange={(e) => setRemittanceInput(e.target.value)}
                  placeholder="e.g. REM-JUB-2026-0912"
                  className="w-full mt-1 p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReconcilingClaimId(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Rejection Modal ───────────────────────────────────────────────── */}
      {rejectingClaimId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Ban className="w-5 h-5 text-red-500" />
                Reject Claim
              </h3>
              <button
                onClick={() => setRejectingClaimId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Clearinghouse Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingClaimId(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
