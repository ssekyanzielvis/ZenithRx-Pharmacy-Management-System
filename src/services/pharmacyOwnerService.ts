/**
 * pharmacyOwnerService.ts — Pharmacy Owner Multi-Branch Intelligence & Operations (§17)
 * Consolidates revenue, multi-branch stock transfers, gross profit margins, and centralized oversight.
 */

import { BranchPerformanceMetric, StockTransferRequest } from '../types';

const STORAGE_KEY_BRANCH_METRICS = 'zenithrx_branch_metrics_v1';
const STORAGE_KEY_STOCK_TRANSFERS = 'zenithrx_stock_transfers_v1';

export const INITIAL_BRANCH_METRICS: BranchPerformanceMetric[] = [
  {
    branchId: 'client-001',
    branchName: 'Kampala City Branch (Headquarters)',
    district: 'Kampala Central',
    supervisingPharmacist: 'Dr. Arthur Ssenabulya (PSU-2021-0892)',
    dailyRevenueUgx: 4850000,
    monthlyRevenueUgx: 142000000,
    grossProfitMarginPercent: 34.2,
    activePrescriptionsCount: 142,
    stockValuationUgx: 320000000,
    lowStockItemsCount: 4,
    expiringItemsCount: 3,
    staffOnDutyCount: 6,
    status: 'Optimal',
  },
  {
    branchId: 'client-002',
    branchName: 'Entebbe Airport Express Branch',
    district: 'Wakiso / Entebbe',
    supervisingPharmacist: 'Dr. Evelyn Nabatanzi (PSU-2020-0412)',
    dailyRevenueUgx: 2900000,
    monthlyRevenueUgx: 88500000,
    grossProfitMarginPercent: 38.5,
    activePrescriptionsCount: 88,
    stockValuationUgx: 185000000,
    lowStockItemsCount: 2,
    expiringItemsCount: 1,
    staffOnDutyCount: 4,
    status: 'Optimal',
  },
  {
    branchId: 'client-003',
    branchName: 'Jinja Highway Branch (Mukono)',
    district: 'Mukono Municipality',
    supervisingPharmacist: 'Dr. Ronald Mukasa (PSU-2019-0118)',
    dailyRevenueUgx: 1750000,
    monthlyRevenueUgx: 52000000,
    grossProfitMarginPercent: 29.8,
    activePrescriptionsCount: 54,
    stockValuationUgx: 120000000,
    lowStockItemsCount: 8,
    expiringItemsCount: 5,
    staffOnDutyCount: 3,
    status: 'Attention Needed',
  }
];

export const INITIAL_STOCK_TRANSFERS: StockTransferRequest[] = [
  {
    id: 'trf-001',
    transferNumber: 'TRF-2026-0041',
    sourceBranchId: 'client-001',
    sourceBranchName: 'Kampala City Branch (Headquarters)',
    destinationBranchId: 'client-003',
    destinationBranchName: 'Jinja Highway Branch (Mukono)',
    drugId: 'drug-1',
    drugBrandName: 'Augmentin 625mg',
    batchNumber: 'AUG-2024-09B',
    expiryDate: '2026-11-30',
    quantityTransferred: 20,
    transferStatus: 'In Transit',
    dispatchedBy: 'Dr. Arthur Ssenabulya',
    dispatchedAt: '2026-08-05T09:00:00Z',
    transferNotes: 'Urgent stock rebalance to cover high local outpatient prescription volume in Mukono.',
  },
  {
    id: 'trf-002',
    transferNumber: 'TRF-2026-0040',
    sourceBranchId: 'client-001',
    sourceBranchName: 'Kampala City Branch (Headquarters)',
    destinationBranchId: 'client-002',
    destinationBranchName: 'Entebbe Airport Express Branch',
    drugId: 'med-004',
    drugBrandName: 'Lantus SoloStar 100 IU/ml',
    batchNumber: 'LAN-2024-04B',
    expiryDate: '2027-04-30',
    quantityTransferred: 10,
    transferStatus: 'Received & Verified',
    dispatchedBy: 'Dr. Arthur Ssenabulya',
    dispatchedAt: '2026-08-04T10:30:00Z',
    receivedBy: 'Dr. Evelyn Nabatanzi',
    receivedAt: '2026-08-04T13:45:00Z',
    transferNotes: 'Cold chain verified intact upon delivery with digital logger reading 4.4°C.',
  }
];

export const getBranchPerformanceMetrics = (): BranchPerformanceMetric[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRANCH_METRICS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BRANCH_METRICS, JSON.stringify(INITIAL_BRANCH_METRICS));
      return INITIAL_BRANCH_METRICS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BRANCH_METRICS;
  }
};

export const getStockTransfers = (): StockTransferRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STOCK_TRANSFERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STOCK_TRANSFERS, JSON.stringify(INITIAL_STOCK_TRANSFERS));
      return INITIAL_STOCK_TRANSFERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STOCK_TRANSFERS;
  }
};

export const createStockTransfer = (
  transfer: Omit<StockTransferRequest, 'id' | 'transferNumber' | 'dispatchedAt' | 'transferStatus'>
): StockTransferRequest => {
  const all = getStockTransfers();
  const transferNumber = `TRF-${new Date().getFullYear()}-${String(all.length + 101).padStart(4, '0')}`;
  const newTransfer: StockTransferRequest = {
    ...transfer,
    id: `trf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    transferNumber,
    transferStatus: 'Pending Dispatch',
    dispatchedAt: new Date().toISOString(),
  };

  const updated = [newTransfer, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_STOCK_TRANSFERS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to create stock transfer', e);
  }
  return newTransfer;
};

export const markStockTransferReceived = (
  transferId: string,
  receivedBy: string,
  notes?: string
): StockTransferRequest | null => {
  const all = getStockTransfers();
  const target = all.find(t => t.id === transferId);
  if (!target) return null;

  const updatedTarget: StockTransferRequest = {
    ...target,
    transferStatus: 'Received & Verified',
    receivedBy,
    receivedAt: new Date().toISOString(),
    transferNotes: notes ? `${target.transferNotes || ''} | Verification: ${notes}` : target.transferNotes,
  };

  const updated = all.map(t => t.id === transferId ? updatedTarget : t);
  try {
    localStorage.setItem(STORAGE_KEY_STOCK_TRANSFERS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update transfer', e);
  }
  return updatedTarget;
};
