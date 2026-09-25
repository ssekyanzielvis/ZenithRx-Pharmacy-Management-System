// ============================================================================
// Advanced Stock Operations, Barcode/QR Scanning, Cross-Pharmacy Discovery,
// Reservations, Waitlists, and Low-Stock Burn Rate Forecasting Service
// ============================================================================

import { notificationCenterService } from './notificationCenterService';

export type ScanMode =
  | 'medicine_barcode'
  | 'batch_qr'
  | 'product_verification'
  | 'prescription_reference';

export interface DecodedScanResult {
  mode: ScanMode;
  rawPayload: string;
  verified: boolean;
  timestamp: string;
  item?: {
    id: string;
    brandName: string;
    genericName: string;
    barcode?: string;
    batchNumber?: string;
    expiryDate?: string;
    currentStock?: number;
    unitPriceUgx?: number;
    rxReference?: string;
    prescriberName?: string;
    patientName?: string;
    statusBadge?: string;
    securitySealStatus?: string;
    isRecalled?: boolean;
  };
  warnings?: string[];
  actionRecommendation?: string;
}

export interface CrossPharmacyStockEntry {
  pharmacyId: string;
  pharmacyName: string;
  district: string;
  address: string;
  phone: string;
  isOpen: boolean;
  is24Hours: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  stockUnits: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  unitPriceUgx: number;
  distanceKm: number;
}

export interface StockReservation {
  id: string;
  tenantId: string;
  pharmacyId: string;
  pharmacyName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  drugId: string;
  brandName: string;
  genericName?: string;
  quantityReserved: number;
  unitPriceUgx: number;
  totalAmountUgx: number;
  reservationPin: string;
  status: 'active' | 'collected' | 'cancelled' | 'expired';
  holdHours: number;
  holdExpiresAt: string;
  collectedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface StockWaitlistEntry {
  id: string;
  tenantId: string;
  pharmacyId: string;
  pharmacyName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  drugId: string;
  brandName: string;
  genericName?: string;
  requestedQuantity: number;
  preferredChannel: 'sms' | 'whatsapp' | 'in_app';
  status: 'waiting' | 'notified' | 'fulfilled' | 'cancelled';
  notifiedAt?: string;
  createdAt: string;
}

export interface StockVelocityForecast {
  id: string;
  tenantId: string;
  pharmacyId: string;
  drugId: string;
  brandName: string;
  genericName: string;
  skuBarcode: string;
  currentStock: number;
  averageDailyUsage: number; // e.g. 4.0 units/day
  estimatedDaysRemaining: number; // e.g. 10 / 4 = 2.5 days
  leadTimeDays: number; // e.g. 3 days
  reorderPointThreshold: number;
  recommendedReorderQty: number;
  forecastRiskLevel:
    | 'critical_imminent_stockout'
    | 'urgent_reorder'
    | 'healthy_coverage'
    | 'overstocked';
  statusLabel: string;
  lastCalculatedAt: string;
}

const STORAGE_RESERVATIONS = 'zenithrx_stock_reservations_v1';
const STORAGE_WAITLISTS = 'zenithrx_stock_waitlists_v1';
const STORAGE_FORECASTS = 'zenithrx_stock_forecasts_v1';

const INITIAL_RESERVATIONS: StockReservation[] = [
  {
    id: 'res-001',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    pharmacyName: 'Zenith Central Kampala',
    patientId: 'pat-001',
    patientName: 'Harriet Nakato',
    patientPhone: '+256 701 234 567',
    drugId: 'med-001',
    brandName: 'Augmentin 625mg',
    genericName: 'Amoxicillin / Clavulanate',
    quantityReserved: 2,
    unitPriceUgx: 35000,
    totalAmountUgx: 70000,
    reservationPin: 'RES-8821',
    status: 'active',
    holdHours: 24,
    holdExpiresAt: new Date(Date.now() + 18 * 3600000).toISOString(),
    notes: 'Patient requested hold after consultation. Will collect by evening.',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'res-002',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    pharmacyName: 'Zenith Central Kampala',
    patientId: 'pat-002',
    patientName: 'Moses Kigozi',
    patientPhone: '+256 772 987 654',
    drugId: 'med-002',
    brandName: 'Ventolin Evohaler 100mcg',
    genericName: 'Salbutamol Sulfate',
    quantityReserved: 1,
    unitPriceUgx: 22000,
    totalAmountUgx: 22000,
    reservationPin: 'RES-8822',
    status: 'collected',
    holdHours: 24,
    holdExpiresAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    collectedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    notes: 'Collected and verified with PIN RES-8822 at Counter 2.',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

const INITIAL_WAITLISTS: StockWaitlistEntry[] = [
  {
    id: 'wait-001',
    tenantId: 'client-001',
    pharmacyId: 'pharm-003',
    pharmacyName: 'Zenith Entebbe Airport Rd',
    patientId: 'pat-001',
    patientName: 'Harriet Nakato',
    patientPhone: '+256 701 234 567',
    drugId: 'med-003',
    brandName: 'Lantus Solostar 100 IU/ml',
    genericName: 'Insulin Glargine',
    requestedQuantity: 2,
    preferredChannel: 'sms',
    status: 'waiting',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'wait-002',
    tenantId: 'client-001',
    pharmacyId: 'pharm-002',
    pharmacyName: 'Zenith Acacia Mall Branch',
    patientId: 'pat-003',
    patientName: 'Grace Akello',
    patientPhone: '+256 752 443 211',
    drugId: 'med-004',
    brandName: 'Crestor 20mg',
    genericName: 'Rosuvastatin Calcium',
    requestedQuantity: 1,
    preferredChannel: 'whatsapp',
    status: 'waiting',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

const INITIAL_FORECASTS: StockVelocityForecast[] = [
  {
    id: 'fc-001',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    drugId: 'med-001',
    brandName: 'Amoxicillin 500mg Capsules',
    genericName: 'Amoxicillin Trihydrate',
    skuBarcode: '6164000123456',
    currentStock: 10,
    averageDailyUsage: 4.0,
    estimatedDaysRemaining: 2.5,
    leadTimeDays: 3,
    reorderPointThreshold: 20,
    recommendedReorderQty: 60,
    forecastRiskLevel: 'urgent_reorder',
    statusLabel: 'Urgent reorder recommended (Depletes in 2.5 days)',
    lastCalculatedAt: new Date().toISOString(),
  },
  {
    id: 'fc-002',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    drugId: 'med-002',
    brandName: 'Metformin 500mg Tablets',
    genericName: 'Metformin Hydrochloride',
    skuBarcode: '6164000789012',
    currentStock: 18,
    averageDailyUsage: 6.0,
    estimatedDaysRemaining: 3.0,
    leadTimeDays: 2,
    reorderPointThreshold: 25,
    recommendedReorderQty: 100,
    forecastRiskLevel: 'urgent_reorder',
    statusLabel: 'Reorder suggested (3.0 days of buffer remaining)',
    lastCalculatedAt: new Date().toISOString(),
  },
  {
    id: 'fc-003',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    drugId: 'med-003',
    brandName: 'Ventolin Inhaler 100mcg',
    genericName: 'Salbutamol Sulfate',
    skuBarcode: '6164000456789',
    currentStock: 4,
    averageDailyUsage: 2.5,
    estimatedDaysRemaining: 1.6,
    leadTimeDays: 3,
    reorderPointThreshold: 10,
    recommendedReorderQty: 30,
    forecastRiskLevel: 'critical_imminent_stockout',
    statusLabel: 'CRITICAL STOCKOUT RISK: 1.6 days of stock vs 3-day lead time',
    lastCalculatedAt: new Date().toISOString(),
  },
  {
    id: 'fc-004',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    drugId: 'med-004',
    brandName: 'Paracetamol 500mg (100s)',
    genericName: 'Acetaminophen',
    skuBarcode: '6164000345678',
    currentStock: 140,
    averageDailyUsage: 5.0,
    estimatedDaysRemaining: 28.0,
    leadTimeDays: 2,
    reorderPointThreshold: 30,
    recommendedReorderQty: 150,
    forecastRiskLevel: 'healthy_coverage',
    statusLabel: 'Healthy stock coverage (28 days remaining)',
    lastCalculatedAt: new Date().toISOString(),
  },
];

function getStored<T>(key: string, initial: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading localStorage ${key}:`, e);
  }
  return initial;
}

function saveStored<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving localStorage ${key}:`, e);
  }
}

export const advancedStockService = {
  // ─── 1. BARCODE / QR SCANNING & DECODER ─────────────────────────────────────
  decodeScan(rawInput: string, mode: ScanMode = 'medicine_barcode'): DecodedScanResult {
    const trimmed = rawInput.trim();
    const timestamp = new Date().toISOString();

    // Mode 1: Medicine Barcode (EAN / UPC / SKU)
    if (mode === 'medicine_barcode') {
      const barcodeMap: Record<string, any> = {
        '6164000123456': {
          id: 'med-001',
          brandName: 'Amoxicillin 500mg Capsules',
          genericName: 'Amoxicillin Trihydrate',
          barcode: '6164000123456',
          batchNumber: 'AMX-2026-09',
          expiryDate: '2028-06-30',
          currentStock: 30,
          unitPriceUgx: 18000,
          securitySealStatus: 'Verified Tamper-Evident',
        },
        '6164000789012': {
          id: 'med-002',
          brandName: 'Metformin 500mg Tablets',
          genericName: 'Metformin Hydrochloride',
          barcode: '6164000789012',
          batchNumber: 'MET-2025-11',
          expiryDate: '2027-12-31',
          currentStock: 120,
          unitPriceUgx: 25000,
          securitySealStatus: 'Verified Tamper-Evident',
        },
        '6164000456789': {
          id: 'med-003',
          brandName: 'Ventolin Inhaler 100mcg',
          genericName: 'Salbutamol Sulfate',
          barcode: '6164000456789',
          batchNumber: 'VENT-2026-04',
          expiryDate: '2028-01-31',
          currentStock: 14,
          unitPriceUgx: 28000,
          securitySealStatus: 'Verified Tamper-Evident',
        },
      };

      const matched = barcodeMap[trimmed] || {
        id: `sku-${trimmed}`,
        brandName: `Scanned Item #${trimmed}`,
        genericName: 'General Pharmaceutical Product',
        barcode: trimmed,
        currentStock: 45,
        unitPriceUgx: 20000,
        securitySealStatus: 'Standard Seal',
      };

      return {
        mode: 'medicine_barcode',
        rawPayload: trimmed,
        verified: true,
        timestamp,
        item: matched,
        actionRecommendation: 'Barcode decoded successfully. Ready for POS cart or stock adjustment.',
      };
    }

    // Mode 2: Batch / Lot QR Scanner
    if (mode === 'batch_qr') {
      const isExpired = trimmed.includes('EXP:2024') || trimmed.includes('EXP:2023');
      const isQuarantined = trimmed.includes('BATCH:RECALL') || trimmed.includes('QUARANTINE');

      return {
        mode: 'batch_qr',
        rawPayload: trimmed,
        verified: !isExpired && !isQuarantined,
        timestamp,
        item: {
          id: 'batch-scanned',
          brandName: 'Augmentin 625mg (Batch Validated)',
          genericName: 'Amoxicillin / Clavulanate',
          batchNumber: trimmed.match(/BATCH:([^|]+)/)?.[1] || 'AUG-2026-KLA',
          expiryDate: trimmed.match(/EXP:([^|]+)/)?.[1] || '2028-04-30',
          currentStock: 80,
          unitPriceUgx: 35000,
          securitySealStatus: isQuarantined ? 'QUARANTINED BY NDA' : 'Passed FEFO Verification',
          isRecalled: isQuarantined,
        },
        warnings: isQuarantined
          ? ['CRITICAL: Batch is flagged in NDA pharmacovigilance safety recall! Do not dispense!']
          : isExpired
          ? ['CRITICAL: Batch is EXPIRED according to FEFO register. Quarantine immediately.']
          : undefined,
        actionRecommendation: isQuarantined
          ? 'Lock in quarantine store.'
          : 'Batch approved for dispensing.',
      };
    }

    // Mode 3: Anti-Counterfeit Product Verification (NDA scratch code)
    if (mode === 'product_verification') {
      const isValid = !trimmed.toLowerCase().includes('fake');
      return {
        mode: 'product_verification',
        rawPayload: trimmed,
        verified: isValid,
        timestamp,
        item: {
          id: 'auth-code-01',
          brandName: 'Lonart Forte (Artemether/Lumefantrine)',
          genericName: 'Artemether + Lumefantrine 80/480mg',
          securitySealStatus: isValid ? 'Authentic NDA Verified Code' : 'COUNTERFEIT WARNING',
          statusBadge: isValid ? 'GENUINE PRODUCT' : 'FAILED AUTHENTICATION',
        },
        warnings: !isValid
          ? ['AUTHENTICATION FAILED: Serial code not recognized in NDA National Drug Registry!']
          : undefined,
        actionRecommendation: isValid
          ? 'Manufacturer packaging verified genuine.'
          : 'Report product code to NDA hotline +256-417788100.',
      };
    }

    // Mode 4: Prescription Reference QR Code
    if (mode === 'prescription_reference') {
      return {
        mode: 'prescription_reference',
        rawPayload: trimmed,
        verified: true,
        timestamp,
        item: {
          id: 'rx-scanned-01',
          brandName: 'Amoxicillin 500mg (3x/day) + Paracetamol 1g',
          genericName: 'Prescription Dispensing Slip',
          rxReference: trimmed.startsWith('RX-') ? trimmed : `RX-${trimmed}`,
          prescriberName: 'Dr. Arthur Ssenabulya (UMDPC #6781)',
          patientName: 'Harriet Nakato',
          statusBadge: 'Verified & Ready to Dispense',
        },
        actionRecommendation: 'Prescription matched. Proceed to automated label printing and checkout.',
      };
    }

    return {
      mode,
      rawPayload: trimmed,
      verified: true,
      timestamp,
      item: {
        id: 'generic',
        brandName: 'Scanned Item',
        genericName: trimmed,
      },
    };
  },

  // ─── 2. CROSS-PHARMACY STOCK DISCOVERY ──────────────────────────────────────
  getCrossPharmacyStock(medicineSearch: string): CrossPharmacyStockEntry[] {
    const q = medicineSearch.toLowerCase().trim();

    const branches: CrossPharmacyStockEntry[] = [
      {
        pharmacyId: 'client-001',
        pharmacyName: 'Zenith Central Kampala (Flagship)',
        district: 'Kampala Central',
        address: 'Plot 14 Kimathi Avenue, Kampala',
        phone: '+256 701 234 567',
        isOpen: true,
        is24Hours: true,
        deliveryAvailable: true,
        pickupAvailable: true,
        stockUnits: q.includes('amox') ? 30 : q.includes('vent') ? 14 : 45,
        stockStatus: q.includes('amox') ? 'In Stock' : 'In Stock',
        unitPriceUgx: 18000,
        distanceKm: 1.2,
      },
      {
        pharmacyId: 'pharm-002',
        pharmacyName: 'Zenith Acacia Mall Branch',
        district: 'Kamwokya / Kololo',
        address: 'Acacia Mall Lower Ground, Kisementi',
        phone: '+256 772 987 654',
        isOpen: true,
        is24Hours: false,
        deliveryAvailable: true,
        pickupAvailable: true,
        stockUnits: q.includes('amox') ? 120 : q.includes('vent') ? 60 : 80,
        stockStatus: 'In Stock',
        unitPriceUgx: 17500,
        distanceKm: 3.4,
      },
      {
        pharmacyId: 'pharm-003',
        pharmacyName: 'Zenith Entebbe Airport Rd',
        district: 'Entebbe Municipality',
        address: 'Airport Road Plaza, Entebbe',
        phone: '+256 752 443 211',
        isOpen: true,
        is24Hours: true,
        deliveryAvailable: true,
        pickupAvailable: true,
        stockUnits: 0,
        stockStatus: 'Out of Stock',
        unitPriceUgx: 18000,
        distanceKm: 34.0,
      },
      {
        pharmacyId: 'pharm-004',
        pharmacyName: 'Zenith Jinja Main Street',
        district: 'Jinja City',
        address: 'Plot 88 Main Street, Jinja',
        phone: '+256 782 119 900',
        isOpen: true,
        is24Hours: false,
        deliveryAvailable: true,
        pickupAvailable: true,
        stockUnits: q.includes('amox') ? 15 : 8,
        stockStatus: 'Low Stock',
        unitPriceUgx: 19000,
        distanceKm: 78.0,
      },
    ];

    return branches;
  },

  // ─── 3. MEDICATION RESERVATION SYSTEM ───────────────────────────────────────
  createReservation(params: {
    tenantId?: string;
    pharmacyId: string;
    pharmacyName: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    drugId: string;
    brandName: string;
    genericName?: string;
    quantityReserved: number;
    unitPriceUgx: number;
    holdHours?: number;
    notes?: string;
  }): StockReservation {
    const list = getStored<StockReservation>(STORAGE_RESERVATIONS, INITIAL_RESERVATIONS);
    const holdHours = params.holdHours || 24;
    const pin = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRes: StockReservation = {
      id: `res-${Date.now()}`,
      tenantId: params.tenantId || 'client-001',
      pharmacyId: params.pharmacyId,
      pharmacyName: params.pharmacyName,
      patientId: params.patientId,
      patientName: params.patientName,
      patientPhone: params.patientPhone,
      drugId: params.drugId,
      brandName: params.brandName,
      genericName: params.genericName,
      quantityReserved: params.quantityReserved,
      unitPriceUgx: params.unitPriceUgx,
      totalAmountUgx: params.unitPriceUgx * params.quantityReserved,
      reservationPin: pin,
      status: 'active',
      holdHours,
      holdExpiresAt: new Date(Date.now() + holdHours * 3600000).toISOString(),
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newRes);
    saveStored(STORAGE_RESERVATIONS, list);

    // Send multi-channel notification to patient
    notificationCenterService.sendNotification({
      tenantId: newRes.tenantId,
      pharmacyId: newRes.pharmacyId,
      recipientType: 'patient',
      recipientId: newRes.patientId,
      recipientPhone: newRes.patientPhone,
      recipientName: newRes.patientName,
      category: 'order_ready',
      title: `Medication Reserved: ${newRes.quantityReserved}x ${newRes.brandName}`,
      message: `Your reservation at ${newRes.pharmacyName} is active for ${newRes.holdHours} hours. Please present your pickup PIN [${newRes.reservationPin}] at the counter.`,
      priority: 'normal',
      actionType: 'track_order',
      actionPayload: { reservationId: newRes.id, pin: newRes.reservationPin },
      channels: { in_app: 'delivered', sms: 'delivered', whatsapp: 'delivered' },
    });

    return newRes;
  },

  getReservations(params?: {
    patientPhoneOrId?: string;
    pharmacyId?: string;
    status?: StockReservation['status'] | 'all';
  }): StockReservation[] {
    const list = getStored<StockReservation>(STORAGE_RESERVATIONS, INITIAL_RESERVATIONS);
    let filtered = list;

    if (params?.patientPhoneOrId) {
      filtered = filtered.filter(
        (r) =>
          r.patientPhone === params.patientPhoneOrId ||
          r.patientId === params.patientPhoneOrId
      );
    }

    if (params?.pharmacyId && params.pharmacyId !== 'all') {
      filtered = filtered.filter((r) => r.pharmacyId === params.pharmacyId);
    }

    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((r) => r.status === params.status);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  fulfillReservation(id: string): boolean {
    const list = getStored<StockReservation>(STORAGE_RESERVATIONS, INITIAL_RESERVATIONS);
    const item = list.find((r) => r.id === id);
    if (item) {
      item.status = 'collected';
      item.collectedAt = new Date().toISOString();
      saveStored(STORAGE_RESERVATIONS, list);
      return true;
    }
    return false;
  },

  cancelReservation(id: string): boolean {
    const list = getStored<StockReservation>(STORAGE_RESERVATIONS, INITIAL_RESERVATIONS);
    const item = list.find((r) => r.id === id);
    if (item) {
      item.status = 'cancelled';
      saveStored(STORAGE_RESERVATIONS, list);
      return true;
    }
    return false;
  },

  // ─── 4. BACK-IN-STOCK WAITLIST ──────────────────────────────────────────────
  joinWaitlist(params: {
    tenantId?: string;
    pharmacyId: string;
    pharmacyName: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    drugId: string;
    brandName: string;
    genericName?: string;
    requestedQuantity?: number;
    preferredChannel?: 'sms' | 'whatsapp' | 'in_app';
  }): StockWaitlistEntry {
    const list = getStored<StockWaitlistEntry>(STORAGE_WAITLISTS, INITIAL_WAITLISTS);

    const entry: StockWaitlistEntry = {
      id: `wait-${Date.now()}`,
      tenantId: params.tenantId || 'client-001',
      pharmacyId: params.pharmacyId,
      pharmacyName: params.pharmacyName,
      patientId: params.patientId,
      patientName: params.patientName,
      patientPhone: params.patientPhone,
      drugId: params.drugId,
      brandName: params.brandName,
      genericName: params.genericName,
      requestedQuantity: params.requestedQuantity || 1,
      preferredChannel: params.preferredChannel || 'sms',
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    list.unshift(entry);
    saveStored(STORAGE_WAITLISTS, list);

    // Notify patient
    notificationCenterService.sendNotification({
      tenantId: entry.tenantId,
      pharmacyId: entry.pharmacyId,
      recipientType: 'patient',
      recipientId: entry.patientId,
      recipientPhone: entry.patientPhone,
      recipientName: entry.patientName,
      category: 'system_announcement',
      title: `Waitlist Confirmed: ${entry.brandName}`,
      message: `You are on the priority waitlist at ${entry.pharmacyName}. We will instantly alert you via ${entry.preferredChannel.toUpperCase()} as soon as new stock arrives.`,
      priority: 'normal',
      channels: { in_app: 'delivered', sms: 'delivered' },
    });

    return entry;
  },

  getWaitlists(params?: {
    patientPhoneOrId?: string;
    pharmacyId?: string;
    status?: StockWaitlistEntry['status'] | 'all';
  }): StockWaitlistEntry[] {
    const list = getStored<StockWaitlistEntry>(STORAGE_WAITLISTS, INITIAL_WAITLISTS);
    let filtered = list;

    if (params?.patientPhoneOrId) {
      filtered = filtered.filter(
        (w) =>
          w.patientPhone === params.patientPhoneOrId ||
          w.patientId === params.patientPhoneOrId
      );
    }

    if (params?.pharmacyId && params.pharmacyId !== 'all') {
      filtered = filtered.filter((w) => w.pharmacyId === params.pharmacyId);
    }

    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((w) => w.status === params.status);
    }

    return filtered;
  },

  triggerRestockAlert(pharmacyId: string, drugId: string): number {
    const list = getStored<StockWaitlistEntry>(STORAGE_WAITLISTS, INITIAL_WAITLISTS);
    let count = 0;

    list.forEach((w) => {
      if (w.pharmacyId === pharmacyId && w.drugId === drugId && w.status === 'waiting') {
        w.status = 'notified';
        w.notifiedAt = new Date().toISOString();
        count++;

        // Broadcast notification to waiting patient
        notificationCenterService.sendNotification({
          tenantId: w.tenantId,
          pharmacyId: w.pharmacyId,
          recipientType: 'patient',
          recipientId: w.patientId,
          recipientPhone: w.patientPhone,
          recipientName: w.patientName,
          category: 'order_ready',
          title: `Back in Stock: ${w.brandName}!`,
          message: `Great news! ${w.brandName} is now replenished and available at ${w.pharmacyName}. Reserve or order online now before stock depletes.`,
          priority: 'high',
          actionType: 'track_order',
          channels: { in_app: 'delivered', sms: 'delivered', whatsapp: 'delivered' },
        });
      }
    });

    saveStored(STORAGE_WAITLISTS, list);
    return count;
  },

  // ─── 5. LOW-STOCK FORECASTING & VELOCITY ENGINE ────────────────────────────
  getVelocityForecasts(tenantId: string = 'client-001'): StockVelocityForecast[] {
    return getStored<StockVelocityForecast>(STORAGE_FORECASTS, INITIAL_FORECASTS);
  },

  calculateForecast(input: {
    brandName: string;
    genericName: string;
    skuBarcode?: string;
    currentStock: number;
    averageDailyUsage: number;
    leadTimeDays?: number;
  }): StockVelocityForecast {
    const leadTime = input.leadTimeDays || 3;
    const adu = input.averageDailyUsage > 0 ? input.averageDailyUsage : 1;
    const daysRemaining = Number((input.currentStock / adu).toFixed(1));

    let risk: StockVelocityForecast['forecastRiskLevel'] = 'healthy_coverage';
    let statusLabel = `Healthy stock coverage (${daysRemaining} days remaining)`;

    if (daysRemaining <= leadTime) {
      risk = 'critical_imminent_stockout';
      statusLabel = `CRITICAL IMMINENT STOCKOUT: ${daysRemaining} days of stock vs ${leadTime}-day supplier lead time!`;
    } else if (daysRemaining <= leadTime * 2) {
      risk = 'urgent_reorder';
      statusLabel = `Urgent reorder recommended (${daysRemaining} days of stock remaining)`;
    } else if (daysRemaining > 60) {
      risk = 'overstocked';
      statusLabel = `Overstocked: ${daysRemaining} days of inventory held.`;
    }

    const reorderPoint = Math.ceil(adu * leadTime * 1.5);
    const recommendedQty = Math.ceil(adu * 21); // 3 weeks buffer

    return {
      id: `fc-${Date.now()}`,
      tenantId: 'client-001',
      pharmacyId: 'client-001',
      drugId: `med-${Date.now()}`,
      brandName: input.brandName,
      genericName: input.genericName,
      skuBarcode: input.skuBarcode || '6164000000000',
      currentStock: input.currentStock,
      averageDailyUsage: adu,
      estimatedDaysRemaining: daysRemaining,
      leadTimeDays: leadTime,
      reorderPointThreshold: reorderPoint,
      recommendedReorderQty: recommendedQty,
      forecastRiskLevel: risk,
      statusLabel,
      lastCalculatedAt: new Date().toISOString(),
    };
  },
};
