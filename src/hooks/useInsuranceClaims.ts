/**
 * useInsuranceClaims.ts — ZenithRx Insurance & Claims Reconciliation Hook
 * Clean Architecture: Application Layer
 * Manages insurer provider registries, pre-auth verification, co-pay calculation engine,
 * batch electronic submission, and claims reconciliation.
 */

import { useState, useMemo, useCallback } from 'react';
import { InsuranceProvider, InsuranceClaim } from '../types';
import { INITIAL_INSURANCE_CLAIMS } from '../data/mockData';

export interface UseInsuranceClaimsProps {
  providers: InsuranceProvider[];
  tenantId?: string;
}

export function useInsuranceClaims({ providers }: UseInsuranceClaimsProps) {
  const [activeTab, setActiveTab] = useState<'providers' | 'claims' | 'verifier' | 'newClaim'>('claims');
  const [claims, setClaims] = useState<InsuranceClaim[]>(INITIAL_INSURANCE_CLAIMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [providerFilter, setProviderFilter] = useState<string>('All');

  // Pre-Auth & Eligibility Verifier State
  const [verifierForm, setVerifierForm] = useState({
    providerId: providers[0]?.id || 'INS-01',
    memberNumber: '',
    patientName: '',
    preAuthCode: '',
    claimAmount: 50000,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    providerName: string;
    patientName: string;
    memberNumber: string;
    preAuthCode: string;
    totalAmount: number;
    coverageRatio: number;
    coveredAmount: number;
    copayAmount: number;
    approvedDrugs: string[];
    preAuthLimit: number;
  } | null>(null);

  // Batch Submission State
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Selected Claim for Detail / Print
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);

  // ─── Filtered Claims ────────────────────────────────────────────────────────
  const filteredClaims = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return claims.filter((claim) => {
      const matchesSearch =
        claim.claimNumber.toLowerCase().includes(q) ||
        claim.patientName.toLowerCase().includes(q) ||
        claim.memberNumber.toLowerCase().includes(q) ||
        claim.preAuthCode.toLowerCase().includes(q) ||
        claim.providerName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
      const matchesProvider = providerFilter === 'All' || claim.providerId === providerFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [claims, searchTerm, statusFilter, providerFilter]);

  // ─── Summary Financial Metrics ──────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalClaimsCount = claims.length;
    const totalReceivables = claims
      .filter((c) => c.status === 'Submitted' || c.status === 'Approved')
      .reduce((sum, c) => sum + c.coveredAmount, 0);

    const totalReconciled = claims
      .filter((c) => c.status === 'Reconciled')
      .reduce((sum, c) => sum + c.coveredAmount, 0);

    const pendingReviewCount = claims.filter((c) => c.status === 'Submitted').length;
    const draftCount = claims.filter((c) => c.status === 'Draft').length;

    return {
      totalClaimsCount,
      totalReceivables,
      totalReconciled,
      pendingReviewCount,
      draftCount,
    };
  }, [claims]);

  // ─── Pre-Auth Eligibility Verification ─────────────────────────────────────
  const handleVerifyEligibility = useCallback(() => {
    if (!verifierForm.memberNumber.trim() && !verifierForm.preAuthCode.trim()) return;

    setIsValidating(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsValidating(false);
      const prov = providers.find((p) => p.id === verifierForm.providerId) || providers[0];
      const ratio = prov ? prov.coverageRatio : 0.8;
      const total = Number(verifierForm.claimAmount) || 50000;
      const covered = Math.round(total * ratio);
      const copay = total - covered;

      setVerificationResult({
        valid: true,
        providerName: prov ? prov.providerName : 'Jubilee Health Insurance',
        patientName: verifierForm.patientName || 'Sarah Wanjiku',
        memberNumber: verifierForm.memberNumber || 'JUB-883921-A',
        preAuthCode: (verifierForm.preAuthCode || 'AUTH-' + Math.floor(Math.random() * 90000 + 10000)).toUpperCase(),
        totalAmount: total,
        coverageRatio: ratio,
        coveredAmount: covered,
        copayAmount: copay,
        approvedDrugs: ['Augmentin 625mg', 'Panadol Extra', 'Ventolin Evohaler', 'Lipitor 20mg'],
        preAuthLimit: 300000,
      });
    }, 800);
  }, [verifierForm, providers]);

  // ─── Batch Electronic Submission ───────────────────────────────────────────
  const handleBatchSubmit = useCallback(() => {
    setIsBatchSubmitting(true);
    setTimeout(() => {
      let submittedCount = 0;
      let totalAmountSubmitted = 0;

      setClaims((prev) =>
        prev.map((c) => {
          if (c.status === 'Draft') {
            submittedCount++;
            totalAmountSubmitted += c.coveredAmount;
            return {
              ...c,
              status: 'Submitted' as const,
              submissionDate: new Date().toISOString().split('T')[0],
            };
          }
          return c;
        })
      );

      setIsBatchSubmitting(false);
      setBatchSuccessMessage(
        `Batch EDI transmitted! ${submittedCount} draft claims submitted to insurer clearinghouse.`
      );
      setTimeout(() => setBatchSuccessMessage(null), 4000);
    }, 1200);
  }, []);

  // ─── Claims Reconciliation Actions ─────────────────────────────────────────
  const handleReconcileClaim = useCallback((claimId: string, remittanceAdviceNo: string) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId) {
          return {
            ...c,
            status: 'Reconciled' as const,
            reconciliationDate: new Date().toISOString().split('T')[0],
            remittanceAdviceNo: remittanceAdviceNo || `REM-${Date.now().toString().slice(-4)}`,
          };
        }
        return c;
      })
    );
  }, []);

  const handleApproveClaim = useCallback((claimId: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'Approved' as const } : c))
    );
  }, []);

  const handleRejectClaim = useCallback((claimId: string, reason: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: 'Rejected' as const,
              rejectionReason: reason || 'Pre-authorization expired or non-formulary item.',
            }
          : c
      )
    );
  }, []);

  // ─── Add New Claim ─────────────────────────────────────────────────────────
  const handleCreateClaim = useCallback((newClaim: InsuranceClaim) => {
    setClaims((prev) => [newClaim, ...prev]);
    setActiveTab('claims');
  }, []);

  // ─── Print Claim Sheet ─────────────────────────────────────────────────────
  const handlePrintClaim = useCallback((claim: InsuranceClaim) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Insurance Claim - ${claim.claimNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; max-width: 750px; margin: 0 auto; color: #1e293b; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
            .sub { font-size: 12px; color: #64748b; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 13px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
            .box-title { font-weight: bold; margin-bottom: 6px; color: #0284c7; font-size: 11px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            .totals { margin-top: 20px; text-align: right; font-size: 13px; }
            .total-row { padding: 4px 0; }
            .grand-total { font-size: 16px; font-weight: bold; color: #0284c7; }
            .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 12px; }
            .sig-line { border-top: 1px solid #000; padding-top: 6px; margin-top: 50px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">ZENITHRX PHARMACY</h1>
              <div class="sub">Official Medical Scheme Claim & Dispensing Voucher</div>
              <div class="sub">NDA Pharmacy Reg: NDA/LIC/PHA/2026/0182</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 14px;">${claim.claimNumber}</div>
              <div class="sub">Date: ${claim.submissionDate}</div>
              <div class="sub">Status: <b>${claim.status.toUpperCase()}</b></div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <div class="box-title">Patient & Member Information</div>
              <div><b>Patient:</b> ${claim.patientName}</div>
              <div><b>Member / Policy No:</b> ${claim.memberNumber}</div>
              <div><b>Phone:</b> ${claim.patientPhone}</div>
              <div><b>Diagnosis (ICD-10):</b> ${claim.diagnosisCode || 'N/A'}</div>
            </div>

            <div class="box">
              <div class="box-title">Insurance Scheme Details</div>
              <div><b>Provider:</b> ${claim.providerName}</div>
              <div><b>Pre-Auth Code:</b> ${claim.preAuthCode}</div>
              <div><b>Rx Ref No:</b> ${claim.rxNumber || 'Direct Dispense'}</div>
              ${claim.remittanceAdviceNo ? `<div><b>Remittance Ref:</b> ${claim.remittanceAdviceNo}</div>` : ''}
            </div>
          </div>

          <div style="font-weight: bold; font-size: 13px; margin-top: 10px;">Itemized Dispensed Medications:</div>
          <table>
            <thead>
              <tr>
                <th>Item & Regimen</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price (UGX)</th>
                <th style="text-align: right;">Total (UGX)</th>
              </tr>
            </thead>
            <tbody>
              ${claim.items.map((it) => `
                <tr>
                  <td><b>${it.drugName}</b></td>
                  <td style="text-align: center;">${it.quantity}</td>
                  <td style="text-align: right;">${it.unitPrice.toLocaleString()}</td>
                  <td style="text-align: right;"><b>${it.total.toLocaleString()}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">Claim Subtotal: <b>UGX ${claim.totalAmount.toLocaleString()}</b></div>
            <div class="total-row" style="color: #15803d;">Insurer Covered Portion: <b>UGX ${claim.coveredAmount.toLocaleString()}</b></div>
            <div class="total-row" style="color: #b45309;">Patient Co-Payment: <b>UGX ${claim.copayAmount.toLocaleString()}</b></div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">Patient / Member Signature</div>
            </div>
            <div>
              <div class="sig-line">Dispensing Pharmacist Signature & Stamp</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  return {
    activeTab,
    setActiveTab,
    claims,
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
    selectedClaim,
    setSelectedClaim,
  };
}
