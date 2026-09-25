/**
 * supplierMarketplaceService.ts — Centralized Supplier Marketplace & RFQs (§9, §23)
 * Provides verified NDA wholesale distributor directory, live pricing catalog, and PO dispatch.
 */

import { SupplierProfile, SupplierCatalogueItem, SupplierRFQ } from '../types';

const STORAGE_KEY_SUPPLIERS = 'zenithrx_suppliers_v1';
const STORAGE_KEY_CATALOGUE = 'zenithrx_supplier_catalogue_v1';
const STORAGE_KEY_RFQS = 'zenithrx_supplier_rfqs_v1';

export const INITIAL_SUPPLIERS: SupplierProfile[] = [
  {
    id: 'sup-001',
    companyName: 'Abacus Pharma (A) Limited',
    ndaWholesaleLicenseNo: 'NDA/WHL/2026/0012',
    psuSupervisingPharmacist: 'Dr. Joseph Mukwaya (PSU-2015-0192)',
    contactPerson: 'Kalyango Denis',
    email: 'orders@abacuspharma.com',
    phone: '+256 414 345000',
    physicalAddress: 'Plot 28B-32B, 7th Street Industrial Area, Kampala',
    districtsCovered: ['Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu'],
    leadTimeDays: 1,
    minimumOrderValueUgx: 100000,
    paymentTerms: '30 Days Net',
    verifiedCompliance: true,
    ratingScore: 4.9,
    categoriesSupplied: ['Antibiotics', 'Cardiovascular', 'Diabetes', 'Cold Chain / Biologics', 'IV Fluids'],
  },
  {
    id: 'sup-002',
    companyName: 'Medreich East Africa Ltd',
    ndaWholesaleLicenseNo: 'NDA/WHL/2026/0048',
    psuSupervisingPharmacist: 'Dr. Hellen Nansubuga (PSU-2018-0419)',
    contactPerson: 'Suleiman Mutebi',
    email: 'supply@medreich.ug',
    phone: '+256 312 900120',
    physicalAddress: 'Plot 104, Jinja Road, Nakawa Industrial Estate, Kampala',
    districtsCovered: ['Kampala', 'Entebbe', 'Wakiso', 'Masaka'],
    leadTimeDays: 2,
    minimumOrderValueUgx: 50000,
    paymentTerms: '14 Days Net',
    verifiedCompliance: true,
    ratingScore: 4.7,
    categoriesSupplied: ['Generics', 'Analgesics', 'Respiratory', 'OTC & Supplements', 'Dermatology'],
  },
  {
    id: 'sup-003',
    companyName: 'Quality Chemical Industries Ltd (QCIL)',
    ndaWholesaleLicenseNo: 'NDA/WHL/2026/0004',
    psuSupervisingPharmacist: 'Dr. Emmanuel Katongole (PSU-2010-0014)',
    contactPerson: 'Grace Akello',
    email: 'commercial@qcil.co.ug',
    phone: '+256 414 567890',
    physicalAddress: 'Luzira Industrial Park, Plot 48-52, Kampala',
    districtsCovered: ['Nationwide (All 135 Districts)'],
    leadTimeDays: 3,
    minimumOrderValueUgx: 250000,
    paymentTerms: '30 Days Net',
    verifiedCompliance: true,
    ratingScore: 4.95,
    categoriesSupplied: ['ARVs / HIV', 'Antimalarials', 'Hepatitis B Therapeutics', 'Essential Antibiotics'],
  }
];

export const INITIAL_CATALOGUE_ITEMS: SupplierCatalogueItem[] = [
  {
    id: 'cat-1',
    supplierId: 'sup-001',
    supplierName: 'Abacus Pharma (A) Limited',
    drugBrandName: 'Augmentin 625mg',
    genericName: 'Co-Amoxiclav 625mg',
    strength: '625mg',
    packSize: 'Pack of 14 tablets',
    unitPriceUgx: 24000,
    inStock: true,
    moq: 5,
    expiryDateEstimate: '2027-09-30',
  },
  {
    id: 'cat-2',
    supplierId: 'sup-001',
    supplierName: 'Abacus Pharma (A) Limited',
    drugBrandName: 'Lantus SoloStar 100 IU/ml',
    genericName: 'Insulin Glargine 100 IU/ml',
    strength: '100 IU/ml',
    packSize: 'Box of 5 Pens (3ml each)',
    unitPriceUgx: 210000,
    inStock: true,
    moq: 2,
    expiryDateEstimate: '2027-06-30',
  },
  {
    id: 'cat-3',
    supplierId: 'sup-002',
    supplierName: 'Medreich East Africa Ltd',
    drugBrandName: 'Glucophage 500mg',
    genericName: 'Metformin Hydrochloride 500mg',
    strength: '500mg',
    packSize: 'Box of 100 tablets (10x10 blister)',
    unitPriceUgx: 28000,
    inStock: true,
    moq: 3,
    expiryDateEstimate: '2028-02-28',
  },
  {
    id: 'cat-4',
    supplierId: 'sup-002',
    supplierName: 'Medreich East Africa Ltd',
    drugBrandName: 'Norvasc 5mg',
    genericName: 'Amlodipine Besylate 5mg',
    strength: '5mg',
    packSize: 'Box of 30 tablets',
    unitPriceUgx: 32000,
    inStock: true,
    moq: 5,
    expiryDateEstimate: '2027-11-30',
  }
];

export const getSuppliers = (): SupplierProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
      return INITIAL_SUPPLIERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUPPLIERS;
  }
};

export const getSupplierCatalogue = (supplierId?: string): SupplierCatalogueItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATALOGUE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CATALOGUE, JSON.stringify(INITIAL_CATALOGUE_ITEMS));
      return supplierId ? INITIAL_CATALOGUE_ITEMS.filter(i => i.supplierId === supplierId) : INITIAL_CATALOGUE_ITEMS;
    }
    const all: SupplierCatalogueItem[] = JSON.parse(raw);
    return supplierId ? all.filter(i => i.supplierId === supplierId) : all;
  } catch {
    return INITIAL_CATALOGUE_ITEMS;
  }
};

export const getSupplierRfqs = (tenantId?: string): SupplierRFQ[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RFQS);
    if (!raw) return [];
    const all: SupplierRFQ[] = JSON.parse(raw);
    return tenantId ? all.filter(r => r.tenantId === tenantId) : all;
  } catch {
    return [];
  }
};

export const createSupplierRfq = (rfq: Omit<SupplierRFQ, 'id' | 'rfqNumber' | 'createdAt'>): SupplierRFQ => {
  const all = getSupplierRfqs();
  const rfqNumber = `RFQ-UG-${new Date().getFullYear()}-${String(all.length + 101).padStart(4, '0')}`;
  const newRfq: SupplierRFQ = {
    ...rfq,
    id: `rfq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    rfqNumber,
    createdAt: new Date().toISOString(),
  };

  const updated = [newRfq, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_RFQS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to create RFQ', e);
  }
  return newRfq;
};
