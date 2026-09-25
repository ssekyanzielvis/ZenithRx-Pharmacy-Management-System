/**
 * adrReportingService.ts — ZenithRx Adverse Drug Reaction (ADR) & Pharmacovigilance
 * Aligned with National Drug Authority (NDA) Uganda Yellow Sheet Pharmacovigilance Standards.
 */

import { AdverseDrugReactionReport } from '../types';

const STORAGE_KEY_ADR_REPORTS = 'zenithrx_adr_reports_v1';

const INITIAL_ADR_REPORTS: AdverseDrugReactionReport[] = [
  {
    id: 'adr-001',
    reportNumber: 'ADR-UG-2026-0014',
    tenantId: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    reporterName: 'Dr. Arthur Ssenabulya',
    reporterRole: 'Supervising Pharmacist',
    reporterContact: '+256 701 234567',
    patientInitials: 'G.N.',
    patientAge: 34,
    patientGender: 'Female',
    patientWeightKg: 62,
    suspectedDrugName: 'Augmentin 625mg',
    suspectedDrugBrand: 'Augmentin (GSK)',
    suspectedDrugBatchNumber: 'AUG-2024-09B',
    suspectedDrugManufacturer: 'GlaxoSmithKline',
    suspectedDrugDose: '625mg 12-hourly',
    suspectedDrugRoute: 'Oral',
    dateStarted: '2026-08-01',
    dateReactionStarted: '2026-08-03',
    reactionDescription: 'Severe maculopapular skin rash covering trunk and upper extremities, mild facial edema, intense pruritus.',
    severity: 'Moderate',
    causality: 'Probable / Likely',
    outcome: 'Recovered / Resolved',
    concomitantDrugs: 'Paracetamol 1g PRN',
    relevantMedicalHistory: 'No prior penicillin allergy documented; mild childhood asthma.',
    ndaYellowSheetStatus: 'Submitted to NDA',
    ndaReferenceNumber: 'NDA-PV-2026-08912',
    dateSubmittedToNda: '2026-08-04T14:30:00Z',
    createdAt: '2026-08-04T11:20:00Z',
  },
  {
    id: 'adr-002',
    reportNumber: 'ADR-UG-2026-0015',
    tenantId: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    reporterName: 'Sarah Namubiru',
    reporterRole: 'Pharmacy Technician',
    reporterContact: '+256 772 345678',
    patientInitials: 'J.O.',
    patientAge: 58,
    patientGender: 'Male',
    patientWeightKg: 78,
    suspectedDrugName: 'Metformin 500mg',
    suspectedDrugBrand: 'Glucophage',
    suspectedDrugBatchNumber: 'MET-2024-03A',
    suspectedDrugManufacturer: 'Merck Healthcare',
    suspectedDrugDose: '500mg BD with meals',
    suspectedDrugRoute: 'Oral',
    dateStarted: '2026-07-20',
    dateReactionStarted: '2026-07-24',
    reactionDescription: 'Severe nausea, abdominal cramps, metallic taste, chronic diarrhea leading to dehydration.',
    severity: 'Mild',
    causality: 'Certain',
    outcome: 'Recovering / Resolving',
    concomitantDrugs: 'Amlodipine 5mg OD',
    relevantMedicalHistory: 'Type 2 Diabetes Mellitus (diagnosed 2026)',
    ndaYellowSheetStatus: 'Draft',
    createdAt: '2026-08-05T08:10:00Z',
  }
];

export const getAdrReports = (tenantId?: string): AdverseDrugReactionReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADR_REPORTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADR_REPORTS, JSON.stringify(INITIAL_ADR_REPORTS));
      return tenantId ? INITIAL_ADR_REPORTS.filter(r => r.tenantId === tenantId) : INITIAL_ADR_REPORTS;
    }
    const all: AdverseDrugReactionReport[] = JSON.parse(raw);
    return tenantId ? all.filter(r => r.tenantId === tenantId) : all;
  } catch {
    return INITIAL_ADR_REPORTS;
  }
};

export const submitAdrReport = (report: Omit<AdverseDrugReactionReport, 'id' | 'reportNumber' | 'createdAt' | 'ndaYellowSheetStatus'>): AdverseDrugReactionReport => {
  const all = getAdrReports();
  const reportNumber = `ADR-UG-${new Date().getFullYear()}-${String(all.length + 1).padStart(4, '0')}`;
  const createdAt = new Date().toISOString();

  const newReport: AdverseDrugReactionReport = {
    ...report,
    id: `adr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reportNumber,
    ndaYellowSheetStatus: 'Draft',
    createdAt,
  };

  const updated = [newReport, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_ADR_REPORTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save ADR report', e);
  }
  return newReport;
};

export const transmitAdrToNdaYellowSheet = (reportId: string): AdverseDrugReactionReport | null => {
  const all = getAdrReports();
  const target = all.find(r => r.id === reportId);
  if (!target) return null;

  const updatedTarget: AdverseDrugReactionReport = {
    ...target,
    ndaYellowSheetStatus: 'Submitted to NDA',
    ndaReferenceNumber: `NDA-PV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    dateSubmittedToNda: new Date().toISOString(),
  };

  const updatedList = all.map(r => r.id === reportId ? updatedTarget : r);
  try {
    localStorage.setItem(STORAGE_KEY_ADR_REPORTS, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Failed to update ADR status', e);
  }
  return updatedTarget;
};
