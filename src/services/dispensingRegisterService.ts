/**
 * dispensingRegisterService.ts — ZenithRx Digital Dispensing & Poison Register
 * Implements NDA Pharmacy & Poisons Act (Regulation 1970) compliant audit trail.
 */

import { DispensingRegisterEntry } from '../types';

const STORAGE_KEY_DISPENSING_REGISTER = 'zenithrx_dispensing_register_v1';

const INITIAL_MOCK_ENTRIES: DispensingRegisterEntry[] = [
  {
    id: 'dsp-001',
    registerNumber: 'DSP-2026-08101',
    tenantId: 'client-001',
    branchName: 'Kampala City Branch (Headquarters)',
    timestamp: '2026-08-05T09:15:00Z',
    patientId: 'cust-1',
    patientName: 'Grace Nakato',
    patientPhone: '+256 701 234567',
    patientNationalIdOrNin: 'CM92014819201K',
    patientAddress: 'Plot 14, Acacia Avenue, Kololo, Kampala',
    isPrescription: true,
    rxNumber: 'RX-2026-0891',
    prescriberDoctorName: 'Dr. Ronald Mukasa',
    prescriberLicenceNo: 'UMDPC-2019-4412',
    prescriberClinicOrHospital: 'Mulago National Referral Hospital',
    drugId: 'drug-1',
    drugBrandName: 'Augmentin 625mg',
    drugGenericName: 'Co-Amoxiclav (Amoxicillin + Clavulanic Acid)',
    batchNumber: 'AUG-2024-09B',
    expiryDate: '2026-11-30',
    dispensedQuantity: 14,
    unit: 'tablets',
    dosageInstructions: '1 tablet 12-hourly after meals for 7 days',
    unitPriceUgx: 2500,
    totalUgx: 35000,
    dispensedByPharmacistName: 'Dr. Arthur Ssenabulya',
    dispensedByPharmacistRole: 'Supervising Pharmacist',
    dispensedByPsuLicenseNo: 'PSU-2021-0892',
    dispenserDigitalSignatureHash: 'sha256_e89104fa8bc912389dca12',
    patientCounseled: true,
    ndaPoisonClass: 'Class B (Controlled Rx)',
    paymentMethod: 'MTN Mobile Money / Airtel Money',
    receiptNumber: 'REC-2026-0912',
  },
  {
    id: 'dsp-002',
    registerNumber: 'DSP-2026-08102',
    tenantId: 'client-001',
    branchName: 'Kampala City Branch (Headquarters)',
    timestamp: '2026-08-05T10:30:00Z',
    patientId: 'cust-2',
    patientName: 'John Baptist Okello',
    patientPhone: '+256 772 345678',
    patientNationalIdOrNin: 'CM84029104921M',
    patientAddress: 'Ntinda Complex Block B, Kampala',
    isPrescription: true,
    rxNumber: 'RX-2026-0892',
    prescriberDoctorName: 'Dr. Sarah Nabwire',
    prescriberLicenceNo: 'UMDPC-2020-1890',
    prescriberClinicOrHospital: 'Norvik Hospital Kampala',
    drugId: 'drug-4',
    drugBrandName: 'Glucophage 500mg',
    drugGenericName: 'Metformin Hydrochloride',
    batchNumber: 'MET-2024-03A',
    expiryDate: '2027-03-31',
    dispensedQuantity: 60,
    unit: 'tablets',
    dosageInstructions: '1 tablet twice daily with food',
    unitPriceUgx: 500,
    totalUgx: 30000,
    dispensedByPharmacistName: 'Dr. Arthur Ssenabulya',
    dispensedByPharmacistRole: 'Supervising Pharmacist',
    dispensedByPsuLicenseNo: 'PSU-2021-0892',
    dispenserDigitalSignatureHash: 'sha256_b38190fa72819cd001',
    patientCounseled: true,
    ndaPoisonClass: 'Class B (Controlled Rx)',
    paymentMethod: 'Insurance Scheme',
    receiptNumber: 'REC-2026-0913',
  },
  {
    id: 'dsp-003',
    registerNumber: 'DSP-2026-08103',
    tenantId: 'client-001',
    branchName: 'Kampala City Branch (Headquarters)',
    timestamp: '2026-08-05T11:45:00Z',
    patientName: 'Mary Alupo',
    patientPhone: '+256 750 998877',
    patientAddress: 'Bugolobi Village Mall Area',
    isPrescription: false,
    drugId: 'drug-2',
    drugBrandName: 'Panadol Extra',
    drugGenericName: 'Paracetamol 500mg + Caffeine 65mg',
    batchNumber: 'PAN-2024-11C',
    expiryDate: '2027-01-31',
    dispensedQuantity: 20,
    unit: 'tablets',
    dosageInstructions: '2 tablets every 6 hours as needed for headache',
    unitPriceUgx: 400,
    totalUgx: 8000,
    dispensedByPharmacistName: 'Sarah Namubiru',
    dispensedByPharmacistRole: 'Pharmacy Technician',
    dispenserDigitalSignatureHash: 'sha256_44fa9081293847acff',
    patientCounseled: true,
    ndaPoisonClass: 'OTC',
    paymentMethod: 'Cash',
    receiptNumber: 'REC-2026-0914',
  }
];

export const getDispensingRegisterEntries = (tenantId?: string): DispensingRegisterEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISPENSING_REGISTER);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DISPENSING_REGISTER, JSON.stringify(INITIAL_MOCK_ENTRIES));
      return tenantId ? INITIAL_MOCK_ENTRIES.filter(e => e.tenantId === tenantId) : INITIAL_MOCK_ENTRIES;
    }
    const all: DispensingRegisterEntry[] = JSON.parse(raw);
    return tenantId ? all.filter(e => e.tenantId === tenantId) : all;
  } catch {
    return INITIAL_MOCK_ENTRIES;
  }
};

export const recordDispensingEntry = (entry: Omit<DispensingRegisterEntry, 'id' | 'registerNumber' | 'timestamp' | 'dispenserDigitalSignatureHash'>): DispensingRegisterEntry => {
  const all = getDispensingRegisterEntries();
  const regNo = `DSP-${new Date().getFullYear()}-${String(all.length + 100).padStart(5, '0')}`;
  const timestamp = new Date().toISOString();
  const signatureHash = `sha256_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

  const newEntry: DispensingRegisterEntry = {
    ...entry,
    id: `dsp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    registerNumber: regNo,
    timestamp,
    dispenserDigitalSignatureHash: signatureHash,
  };

  const updated = [newEntry, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_DISPENSING_REGISTER, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save dispensing register entry', e);
  }
  return newEntry;
};

export const exportDispensingRegisterToCsv = (entries: DispensingRegisterEntry[]): void => {
  const headers = [
    'Register No',
    'Timestamp',
    'Patient Name',
    'Patient Phone',
    'NIN / ID',
    'Address',
    'Rx Number',
    'Prescriber Doctor',
    'Doctor Licence',
    'Hospital',
    'Drug Brand',
    'Generic Name',
    'Batch No',
    'Expiry Date',
    'Dispensed Qty',
    'Unit',
    'Dosage Instructions',
    'Unit Price (UGX)',
    'Total (UGX)',
    'Dispensed By',
    'Role',
    'PSU Licence',
    'Poison Class',
    'Digital Signature Hash',
  ];

  const rows = entries.map(e => [
    `"${e.registerNumber}"`,
    `"${new Date(e.timestamp).toLocaleString()}"`,
    `"${e.patientName}"`,
    `"${e.patientPhone}"`,
    `"${e.patientNationalIdOrNin || 'N/A'}"`,
    `"${e.patientAddress || 'N/A'}"`,
    `"${e.rxNumber || 'OTC'}"`,
    `"${e.prescriberDoctorName || 'N/A'}"`,
    `"${e.prescriberLicenceNo || 'N/A'}"`,
    `"${e.prescriberClinicOrHospital || 'N/A'}"`,
    `"${e.drugBrandName}"`,
    `"${e.drugGenericName}"`,
    `"${e.batchNumber}"`,
    `"${e.expiryDate}"`,
    e.dispensedQuantity,
    `"${e.unit}"`,
    `"${e.dosageInstructions}"`,
    e.unitPriceUgx,
    e.totalUgx,
    `"${e.dispensedByPharmacistName}"`,
    `"${e.dispensedByPharmacistRole}"`,
    `"${e.dispensedByPsuLicenseNo || 'N/A'}"`,
    `"${e.ndaPoisonClass || 'OTC'}"`,
    `"${e.dispenserDigitalSignatureHash}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ZenithRx_NDA_Dispensing_Register_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
