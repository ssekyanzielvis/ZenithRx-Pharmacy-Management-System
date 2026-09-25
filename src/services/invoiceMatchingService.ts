/**
 * invoiceMatchingService.ts — Enterprise 3-Way Invoice Matching & Reconciliation Engine
 *
 * Implements actual line-by-line 3-way matching:
 *   Purchase Order Items  ×  Goods Received Items  ×  Supplier Invoice Line Items
 *
 * Features:
 *   • Per-item quantity variance detection (PO vs GRN vs Invoice)
 *   • Per-item unit price variance detection (PO vs Invoice)
 *   • Configurable tolerance thresholds (% and absolute)
 *   • Session-level verdict aggregation
 *   • Dispute creation and credit/debit note management
 *   • Full audit trail and reconciliation reports
 */

import {
  ThreeWayMatchSession,
  ThreeWayMatchLineDetail,
  ThreeWayMatchDispute,
  ThreeWayLineVerdict,
  ThreeWaySessionVerdict,
  MatchToleranceConfig,
  InvoiceLineItem,
  ThreeWayReconciliationReport,
  P2PPurchaseOrderItem,
  P2PGoodsReceivedItem,
} from '../types/v2Types';

// ─── In-Memory Stores ───────────────────────────────────────────────────────

const toleranceConfigStore: Record<string, MatchToleranceConfig> = {
  'client-001': {
    id: 'tol-001',
    tenantId: 'client-001',
    quantityTolerancePercent: 2.0,
    quantityToleranceAbsoluteUnits: 2,
    priceTolerancePercent: 1.5,
    priceToleranceAbsoluteUgx: 5000,
    totalValueToleranceUgx: 50000,
    autoApproveExactMatch: true,
    autoApproveWithinTolerance: false,
    requireDualAuthorizationAboveUgx: 5000000,
    configuredByName: 'System Administrator',
    configuredByRole: 'Platform Admin',
  },
};

let matchSessionsStore: ThreeWayMatchSession[] = [];
let disputesStore: ThreeWayMatchDispute[] = [];
let invoiceLineItemsStore: Record<string, InvoiceLineItem[]> = {};

// ─── Tolerance Configuration ─────────────────────────────────────────────────

export function getToleranceConfig(tenantId: string = 'client-001'): MatchToleranceConfig {
  return (
    toleranceConfigStore[tenantId] || {
      id: 'tol-default',
      tenantId,
      quantityTolerancePercent: 2.0,
      quantityToleranceAbsoluteUnits: 2,
      priceTolerancePercent: 1.5,
      priceToleranceAbsoluteUgx: 5000,
      totalValueToleranceUgx: 50000,
      autoApproveExactMatch: true,
      autoApproveWithinTolerance: false,
      requireDualAuthorizationAboveUgx: 5000000,
      configuredByName: 'System Default',
      configuredByRole: 'System',
    }
  );
}

export function updateToleranceConfig(
  tenantId: string,
  updates: Partial<Omit<MatchToleranceConfig, 'id' | 'tenantId'>>,
  updaterName: string,
  updaterRole: string
): MatchToleranceConfig {
  const existing = getToleranceConfig(tenantId);
  const updated: MatchToleranceConfig = {
    ...existing,
    ...updates,
    configuredByName: updaterName,
    configuredByRole: updaterRole,
  };
  toleranceConfigStore[tenantId] = updated;
  return updated;
}

// ─── Invoice Line Items Management ──────────────────────────────────────────

export function registerInvoiceLineItems(
  invoiceId: string,
  lineItems: Omit<InvoiceLineItem, 'id'>[]
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = lineItems.map((item, index) => ({
    ...item,
    id: `invl-${invoiceId}-${index}-${Date.now()}`,
  }));
  invoiceLineItemsStore[invoiceId] = items;
  return items;
}

export function getInvoiceLineItems(invoiceId: string): InvoiceLineItem[] {
  return invoiceLineItemsStore[invoiceId] || [];
}

// ─── Core 3-Way Matching Engine ─────────────────────────────────────────────

/**
 * Execute the full 3-way matching engine.
 *
 * For each PO line item, finds the corresponding GRN item and Invoice item,
 * then computes quantity and price variances. Applies tolerance rules and
 * determines per-line and session-level verdicts.
 */
export function executeThreeWayMatch(params: {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  supplierName: string;
  poItems: P2PPurchaseOrderItem[];
  grnItems: P2PGoodsReceivedItem[];
  invoiceLineItems: InvoiceLineItem[];
  poTotalUgx: number;
  invoiceTotalUgx: number;
  executedByName: string;
  executedByRole: string;
}): ThreeWayMatchSession {
  const config = getToleranceConfig(params.tenantId);
  const sessionId = `match-session-${Date.now()}`;
  const sessionRef = `3WAY-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

  // Build lookup maps for GRN items and Invoice items by genericName (case-insensitive)
  const grnByGeneric = new Map<string, P2PGoodsReceivedItem>();
  for (const g of params.grnItems) {
    grnByGeneric.set(g.genericName.toLowerCase(), g);
  }

  const invByGeneric = new Map<string, InvoiceLineItem>();
  for (const inv of params.invoiceLineItems) {
    invByGeneric.set(inv.genericName.toLowerCase(), inv);
  }

  // Also by PO item ID if available
  const grnByPoItemId = new Map<string, P2PGoodsReceivedItem>();
  const invByPoItemId = new Map<string, InvoiceLineItem>();
  for (const g of params.grnItems) {
    // GRN items don't have poItemId in the interface, so we match by name
  }
  for (const inv of params.invoiceLineItems) {
    if (inv.poItemId) {
      invByPoItemId.set(inv.poItemId, inv);
    }
  }

  const lineDetails: ThreeWayMatchLineDetail[] = [];
  const processedGrnKeys = new Set<string>();
  const processedInvKeys = new Set<string>();

  // ─── Phase 1: Match each PO line item ─────────────────────────────────
  for (const poItem of params.poItems) {
    const key = poItem.genericName.toLowerCase();

    // Find matching GRN item
    const grnItem = grnByGeneric.get(key);
    // Find matching Invoice item (by PO item ID first, then by generic name)
    const invItem = invByPoItemId.get(poItem.id) || invByGeneric.get(key);

    if (grnItem) processedGrnKeys.add(key);
    if (invItem) processedInvKeys.add(invItem.genericName.toLowerCase());

    const grnDeliveredQty = grnItem?.deliveredQuantity || 0;
    const grnAcceptedQty = grnItem?.deliveredQuantity || 0; // accepted = delivered after QC pass
    const invBilledQty = invItem?.invoicedQuantity || 0;
    const invUnitCost = invItem?.unitCostUgx || 0;
    const invLineTotal = invItem?.lineTotalUgx || 0;

    // Compute variances
    const qtyVariancePoVsGrn = grnDeliveredQty - poItem.orderedQuantity;
    const qtyVarianceGrnVsInvoice = invBilledQty - grnDeliveredQty;
    const qtyVariancePoVsInvoice = invBilledQty - poItem.orderedQuantity;
    const priceVariancePerUnit = invUnitCost - poItem.unitCostUgx;
    const valueVariance = invLineTotal - poItem.totalLineAmountUgx;

    // Apply tolerance checks
    const lineDetail = computeLineVerdict({
      sessionId,
      poItem,
      grnItem,
      invItem,
      grnDeliveredQty,
      grnAcceptedQty,
      invBilledQty,
      invUnitCost,
      invLineTotal,
      qtyVariancePoVsGrn,
      qtyVarianceGrnVsInvoice,
      qtyVariancePoVsInvoice,
      priceVariancePerUnit,
      valueVariance,
      config,
    });

    lineDetails.push(lineDetail);
  }

  // ─── Phase 2: Check for Invoice items not present in PO ───────────────
  for (const invItem of params.invoiceLineItems) {
    const key = invItem.genericName.toLowerCase();
    if (!processedInvKeys.has(key)) {
      lineDetails.push({
        id: `mld-extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        matchSessionId: sessionId,
        drugId: invItem.drugId,
        genericName: invItem.genericName,
        brandName: invItem.brandName,
        unitOfMeasure: invItem.unitOfMeasure,
        poOrderedQuantity: 0,
        poUnitCostUgx: 0,
        poLineTotalUgx: 0,
        grnDeliveredQuantity: 0,
        grnAcceptedQuantity: 0,
        invoiceItemId: invItem.id,
        invoiceBilledQuantity: invItem.invoicedQuantity,
        invoiceUnitCostUgx: invItem.unitCostUgx,
        invoiceLineTotalUgx: invItem.lineTotalUgx,
        qtyVariancePoVsGrn: 0,
        qtyVarianceGrnVsInvoice: invItem.invoicedQuantity,
        qtyVariancePoVsInvoice: invItem.invoicedQuantity,
        priceVariancePoVsInvoiceUgx: invItem.unitCostUgx,
        valueVarianceUgx: invItem.lineTotalUgx,
        lineVerdict: 'unmatched',
        varianceExplanation: `⚠ Item "${invItem.genericName}" appears on Supplier Invoice but was NOT on the Purchase Order. Possible unauthorized addition.`,
        isFlagged: true,
        flagReason: 'Invoice contains item not present on Purchase Order',
      });
    }
  }

  // ─── Phase 3: Aggregate session-level summary ─────────────────────────
  const linesExactMatched = lineDetails.filter((l) => l.lineVerdict === 'exact_match').length;
  const linesWithinTolerance = lineDetails.filter((l) => l.lineVerdict === 'within_tolerance').length;
  const linesQtyMismatch = lineDetails.filter(
    (l) => l.lineVerdict === 'quantity_mismatch' || l.lineVerdict === 'quantity_and_price_mismatch'
  ).length;
  const linesPriceMismatch = lineDetails.filter(
    (l) => l.lineVerdict === 'price_mismatch' || l.lineVerdict === 'quantity_and_price_mismatch'
  ).length;
  const linesMissing = lineDetails.filter(
    (l) =>
      l.lineVerdict === 'item_missing_from_invoice' ||
      l.lineVerdict === 'item_missing_from_grn' ||
      l.lineVerdict === 'unmatched'
  ).length;

  // Compute GRN accepted value from PO line costs × GRN quantities
  let grnTotalAcceptedUgx = 0;
  for (const ld of lineDetails) {
    if (ld.grnDeliveredQuantity > 0 && ld.poUnitCostUgx > 0) {
      grnTotalAcceptedUgx += ld.grnDeliveredQuantity * ld.poUnitCostUgx;
    }
  }

  const totalQtyVariancePoVsGrn = lineDetails.reduce((s, l) => s + l.qtyVariancePoVsGrn, 0);
  const totalQtyVarianceGrnVsInvoice = lineDetails.reduce((s, l) => s + l.qtyVarianceGrnVsInvoice, 0);
  const totalPriceVariance = params.invoiceTotalUgx - params.poTotalUgx;
  const netFinancialVariance = params.invoiceTotalUgx - grnTotalAcceptedUgx;

  // Determine session verdict
  const { verdict, summary, riskAssessment, recommendedAction } = computeSessionVerdict({
    linesExactMatched,
    linesWithinTolerance,
    linesQtyMismatch,
    linesPriceMismatch,
    linesMissing,
    totalLines: lineDetails.length,
    netFinancialVariance,
    config,
    poTotal: params.poTotalUgx,
    invoiceTotal: params.invoiceTotalUgx,
    grnTotal: grnTotalAcceptedUgx,
  });

  const session: ThreeWayMatchSession = {
    id: sessionId,
    tenantId: params.tenantId,
    matchSessionReference: sessionRef,
    invoiceId: params.invoiceId,
    invoiceNumber: params.invoiceNumber,
    purchaseOrderId: params.purchaseOrderId,
    poNumber: params.poNumber,
    grnId: params.grnId,
    grnNumber: params.grnNumber,
    supplierName: params.supplierName,
    poTotalAuthorizedUgx: params.poTotalUgx,
    grnTotalAcceptedUgx,
    invoiceTotalBilledUgx: params.invoiceTotalUgx,
    poVsGrnQtyVarianceTotal: totalQtyVariancePoVsGrn,
    poVsInvoicePriceVarianceUgx: totalPriceVariance,
    grnVsInvoiceQtyVarianceTotal: totalQtyVarianceGrnVsInvoice,
    netFinancialVarianceUgx: netFinancialVariance,
    totalLineItems: lineDetails.length,
    linesExactMatched,
    linesWithinTolerance,
    linesQtyMismatch,
    linesPriceMismatch,
    linesMissing,
    sessionVerdict: verdict,
    verdictSummary: summary,
    financialRiskAssessment: riskAssessment,
    recommendedAction: recommendedAction,
    executedByName: params.executedByName,
    executedByRole: params.executedByRole,
    executedAt: new Date().toISOString(),
    lineDetails,
    createdAt: new Date().toISOString(),
  };

  matchSessionsStore = [session, ...matchSessionsStore];
  return session;
}

// ─── Line-Level Verdict Computation ─────────────────────────────────────────

function computeLineVerdict(params: {
  sessionId: string;
  poItem: P2PPurchaseOrderItem;
  grnItem?: P2PGoodsReceivedItem;
  invItem?: InvoiceLineItem;
  grnDeliveredQty: number;
  grnAcceptedQty: number;
  invBilledQty: number;
  invUnitCost: number;
  invLineTotal: number;
  qtyVariancePoVsGrn: number;
  qtyVarianceGrnVsInvoice: number;
  qtyVariancePoVsInvoice: number;
  priceVariancePerUnit: number;
  valueVariance: number;
  config: MatchToleranceConfig;
}): ThreeWayMatchLineDetail {
  const { poItem, grnItem, invItem, config } = params;
  const lineId = `mld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Handle missing items
  if (!invItem) {
    return {
      id: lineId,
      matchSessionId: params.sessionId,
      drugId: poItem.drugId,
      genericName: poItem.genericName,
      brandName: poItem.brandName,
      unitOfMeasure: 'Pack',
      poItemId: poItem.id,
      poOrderedQuantity: poItem.orderedQuantity,
      poUnitCostUgx: poItem.unitCostUgx,
      poLineTotalUgx: poItem.totalLineAmountUgx,
      grnItemId: grnItem?.id,
      grnDeliveredQuantity: params.grnDeliveredQty,
      grnAcceptedQuantity: params.grnAcceptedQty,
      grnBatchNumber: grnItem?.batchNumber,
      invoiceBilledQuantity: 0,
      invoiceUnitCostUgx: 0,
      invoiceLineTotalUgx: 0,
      qtyVariancePoVsGrn: params.qtyVariancePoVsGrn,
      qtyVarianceGrnVsInvoice: 0 - params.grnDeliveredQty,
      qtyVariancePoVsInvoice: 0 - poItem.orderedQuantity,
      priceVariancePoVsInvoiceUgx: 0,
      valueVarianceUgx: -poItem.totalLineAmountUgx,
      lineVerdict: 'item_missing_from_invoice',
      varianceExplanation: `⚠ "${poItem.genericName}" was ordered (${poItem.orderedQuantity} units) and received (${params.grnDeliveredQty} units) but does NOT appear on the Supplier Invoice. Invoice is incomplete.`,
      isFlagged: true,
      flagReason: 'Item missing from Supplier Invoice',
    };
  }

  if (!grnItem) {
    return {
      id: lineId,
      matchSessionId: params.sessionId,
      drugId: poItem.drugId,
      genericName: poItem.genericName,
      brandName: poItem.brandName,
      unitOfMeasure: invItem.unitOfMeasure || 'Pack',
      poItemId: poItem.id,
      poOrderedQuantity: poItem.orderedQuantity,
      poUnitCostUgx: poItem.unitCostUgx,
      poLineTotalUgx: poItem.totalLineAmountUgx,
      grnDeliveredQuantity: 0,
      grnAcceptedQuantity: 0,
      invoiceItemId: invItem.id,
      invoiceBilledQuantity: params.invBilledQty,
      invoiceUnitCostUgx: params.invUnitCost,
      invoiceLineTotalUgx: params.invLineTotal,
      qtyVariancePoVsGrn: 0 - poItem.orderedQuantity,
      qtyVarianceGrnVsInvoice: params.invBilledQty,
      qtyVariancePoVsInvoice: params.qtyVariancePoVsInvoice,
      priceVariancePoVsInvoiceUgx: params.priceVariancePerUnit,
      valueVarianceUgx: params.valueVariance,
      lineVerdict: 'item_missing_from_grn',
      varianceExplanation: `⚠ "${poItem.genericName}" was ordered (${poItem.orderedQuantity} units) and invoiced (${params.invBilledQty} units) but NOT received in GRN. Goods not delivered.`,
      isFlagged: true,
      flagReason: 'Item not received but billed',
    };
  }

  // ─── All three sources have data — compute tolerances ──────────────────

  const absQtyVariancePoGrn = Math.abs(params.qtyVariancePoVsGrn);
  const absQtyVarianceGrnInv = Math.abs(params.qtyVarianceGrnVsInvoice);
  const absPriceVariance = Math.abs(params.priceVariancePerUnit);
  const absValueVariance = Math.abs(params.valueVariance);

  // Quantity tolerance check
  const qtyToleranceByPercent = Math.ceil(
    poItem.orderedQuantity * (config.quantityTolerancePercent / 100)
  );
  const qtyTolerance = Math.max(qtyToleranceByPercent, config.quantityToleranceAbsoluteUnits);
  const isQtyWithinTolerancePoGrn = absQtyVariancePoGrn <= qtyTolerance;
  const isQtyWithinToleranceGrnInv = absQtyVarianceGrnInv <= qtyTolerance;

  // Price tolerance check
  const priceToleranceByPercent = poItem.unitCostUgx * (config.priceTolerancePercent / 100);
  const priceTolerance = Math.max(priceToleranceByPercent, config.priceToleranceAbsoluteUgx);
  const isPriceWithinTolerance = absPriceVariance <= priceTolerance;

  // Value tolerance check
  const isValueWithinTolerance = absValueVariance <= config.totalValueToleranceUgx;

  // Determine verdict
  let lineVerdict: ThreeWayLineVerdict;
  let explanation: string;
  let isFlagged = false;
  let flagReason: string | undefined;

  const isExactQtyMatch = params.qtyVariancePoVsGrn === 0 && params.qtyVarianceGrnVsInvoice === 0;
  const isExactPriceMatch = params.priceVariancePerUnit === 0;

  if (isExactQtyMatch && isExactPriceMatch) {
    lineVerdict = 'exact_match';
    explanation = `✅ Perfect 3-Way Match: Ordered ${poItem.orderedQuantity}, Received ${params.grnDeliveredQty}, Invoiced ${params.invBilledQty} @ UGX ${poItem.unitCostUgx.toLocaleString()}/unit.`;
  } else if (
    (isQtyWithinTolerancePoGrn && isQtyWithinToleranceGrnInv && isPriceWithinTolerance) ||
    (isValueWithinTolerance && isQtyWithinTolerancePoGrn && isQtyWithinToleranceGrnInv)
  ) {
    lineVerdict = 'within_tolerance';
    const parts: string[] = [];
    if (!isExactQtyMatch) {
      parts.push(`Qty variance: Ordered ${poItem.orderedQuantity}, Received ${params.grnDeliveredQty}, Invoiced ${params.invBilledQty} (within ±${qtyTolerance} tolerance)`);
    }
    if (!isExactPriceMatch) {
      parts.push(`Price variance: PO @ UGX ${poItem.unitCostUgx.toLocaleString()} vs Invoice @ UGX ${params.invUnitCost.toLocaleString()} (within ±UGX ${priceTolerance.toLocaleString()} tolerance)`);
    }
    explanation = `✓ Within Tolerance: ${parts.join('. ')}.`;
  } else {
    const hasQtyIssue = !isQtyWithinTolerancePoGrn || !isQtyWithinToleranceGrnInv;
    const hasPriceIssue = !isPriceWithinTolerance;

    if (hasQtyIssue && hasPriceIssue) {
      lineVerdict = 'quantity_and_price_mismatch';
      explanation = `⚠ QUANTITY & PRICE MISMATCH: Ordered ${poItem.orderedQuantity}, Received ${params.grnDeliveredQty}, Invoiced ${params.invBilledQty} (exceeds ±${qtyTolerance} tolerance). Price: PO @ UGX ${poItem.unitCostUgx.toLocaleString()} vs Invoice @ UGX ${params.invUnitCost.toLocaleString()} (exceeds ±UGX ${priceTolerance.toLocaleString()} tolerance). Value difference: UGX ${params.valueVariance.toLocaleString()}.`;
      isFlagged = true;
      flagReason = 'Both quantity and price exceed tolerance thresholds';
    } else if (hasQtyIssue) {
      lineVerdict = 'quantity_mismatch';
      const direction =
        params.qtyVarianceGrnVsInvoice > 0
          ? `Invoiced ${params.invBilledQty} units but only received ${params.grnDeliveredQty} — pharmacy is being overbilled for ${Math.abs(params.qtyVarianceGrnVsInvoice)} units`
          : params.qtyVariancePoVsGrn < 0
          ? `Ordered ${poItem.orderedQuantity} but only received ${params.grnDeliveredQty} — short delivery of ${Math.abs(params.qtyVariancePoVsGrn)} units`
          : `Quantity variance exceeds tolerance`;
      explanation = `⚠ QUANTITY MISMATCH: ${direction}. Tolerance: ±${qtyTolerance} units.`;
      isFlagged = true;
      flagReason = 'Quantity variance exceeds tolerance';
    } else {
      lineVerdict = 'price_mismatch';
      const direction = params.priceVariancePerUnit > 0 ? 'overcharged' : 'undercharged';
      explanation = `⚠ PRICE MISMATCH: Supplier ${direction} by UGX ${Math.abs(params.priceVariancePerUnit).toLocaleString()}/unit. PO agreed: UGX ${poItem.unitCostUgx.toLocaleString()}, Invoice billed: UGX ${params.invUnitCost.toLocaleString()}. Impact: UGX ${params.valueVariance.toLocaleString()}.`;
      isFlagged = true;
      flagReason = 'Unit price variance exceeds tolerance';
    }
  }

  return {
    id: lineId,
    matchSessionId: params.sessionId,
    drugId: poItem.drugId,
    genericName: poItem.genericName,
    brandName: poItem.brandName,
    unitOfMeasure: grnItem?.unitOfMeasure || invItem?.unitOfMeasure || 'Pack',
    poItemId: poItem.id,
    poOrderedQuantity: poItem.orderedQuantity,
    poUnitCostUgx: poItem.unitCostUgx,
    poLineTotalUgx: poItem.totalLineAmountUgx,
    grnItemId: grnItem?.id,
    grnDeliveredQuantity: params.grnDeliveredQty,
    grnAcceptedQuantity: params.grnAcceptedQty,
    grnBatchNumber: grnItem?.batchNumber,
    invoiceItemId: invItem?.id,
    invoiceBilledQuantity: params.invBilledQty,
    invoiceUnitCostUgx: params.invUnitCost,
    invoiceLineTotalUgx: params.invLineTotal,
    qtyVariancePoVsGrn: params.qtyVariancePoVsGrn,
    qtyVarianceGrnVsInvoice: params.qtyVarianceGrnVsInvoice,
    qtyVariancePoVsInvoice: params.qtyVariancePoVsInvoice,
    priceVariancePoVsInvoiceUgx: params.priceVariancePerUnit,
    valueVarianceUgx: params.valueVariance,
    lineVerdict,
    varianceExplanation: explanation,
    isFlagged,
    flagReason,
  };
}

// ─── Session-Level Verdict Computation ──────────────────────────────────────

function computeSessionVerdict(params: {
  linesExactMatched: number;
  linesWithinTolerance: number;
  linesQtyMismatch: number;
  linesPriceMismatch: number;
  linesMissing: number;
  totalLines: number;
  netFinancialVariance: number;
  config: MatchToleranceConfig;
  poTotal: number;
  invoiceTotal: number;
  grnTotal: number;
}): {
  verdict: ThreeWaySessionVerdict;
  summary: string;
  riskAssessment: string;
  recommendedAction: string;
} {
  const { linesExactMatched, linesWithinTolerance, linesQtyMismatch, linesPriceMismatch, linesMissing, totalLines } = params;
  const allMatch = linesExactMatched === totalLines;
  const allWithinTol = linesExactMatched + linesWithinTolerance === totalLines;
  const hasQtyIssues = linesQtyMismatch > 0;
  const hasPriceIssues = linesPriceMismatch > 0;
  const hasMissing = linesMissing > 0;
  const absVariance = Math.abs(params.netFinancialVariance);

  if (allMatch) {
    return {
      verdict: 'full_match',
      summary: `✅ FULL 3-WAY MATCH — All ${totalLines} line items match perfectly across Purchase Order, Goods Received Note, and Supplier Invoice. No variances detected.`,
      riskAssessment: 'No financial risk. All quantities and prices verified across all three documents.',
      recommendedAction: params.config.autoApproveExactMatch
        ? 'Auto-approved for payment processing. Generate Payment Voucher.'
        : 'Match verified. Submit for payment authorization.',
    };
  }

  if (allWithinTol) {
    return {
      verdict: 'partial_match_within_tolerance',
      summary: `✓ MATCH WITHIN TOLERANCE — ${linesExactMatched} exact matches, ${linesWithinTolerance} within configurable tolerance. Net variance: UGX ${params.netFinancialVariance.toLocaleString()}.`,
      riskAssessment: `Minor variance of UGX ${absVariance.toLocaleString()} within acceptable tolerance threshold of UGX ${params.config.totalValueToleranceUgx.toLocaleString()}.`,
      recommendedAction: params.config.autoApproveWithinTolerance
        ? 'Auto-approved within tolerance. Generate Payment Voucher.'
        : 'Review recommended. Submit for Finance Officer approval.',
    };
  }

  if (hasQtyIssues && hasPriceIssues) {
    return {
      verdict: 'blocked_multiple_discrepancies',
      summary: `⛔ BLOCKED — MULTIPLE DISCREPANCIES DETECTED — ${linesQtyMismatch} quantity mismatches and ${linesPriceMismatch} price mismatches across ${totalLines} line items. Net financial variance: UGX ${params.netFinancialVariance.toLocaleString()}.`,
      riskAssessment: `HIGH RISK: Combined quantity and price discrepancies totalling UGX ${absVariance.toLocaleString()}. Pharmacy may be overbilled. Do NOT authorize payment until resolved.`,
      recommendedAction: 'HOLD PAYMENT. Raise dispute with supplier. Request credit note for quantity shortages and price corrections. Escalate to Pharmacy Owner if unresolved within 7 days.',
    };
  }

  if (hasQtyIssues || hasMissing) {
    return {
      verdict: 'blocked_quantity_discrepancy',
      summary: `⚠ BLOCKED — QUANTITY DISCREPANCY — ${linesQtyMismatch + linesMissing} line item(s) have quantity variances exceeding tolerance. Ordered vs Received vs Invoiced quantities do not reconcile.`,
      riskAssessment: `Quantity mismatch carries financial risk of UGX ${absVariance.toLocaleString()}. Supplier may be billing for undelivered goods.`,
      recommendedAction: `HOLD PAYMENT. Contact supplier to reconcile ${linesQtyMismatch + linesMissing} line item(s). Request revised invoice matching actual GRN quantities.`,
    };
  }

  if (hasPriceIssues) {
    return {
      verdict: 'blocked_price_discrepancy',
      summary: `⚠ BLOCKED — PRICE DISCREPANCY — ${linesPriceMismatch} line item(s) have unit price variances exceeding tolerance. Supplier invoice prices do not match Purchase Order agreed prices.`,
      riskAssessment: `Price overcharge risk of UGX ${absVariance.toLocaleString()}. Unauthorized price increases detected.`,
      recommendedAction: `HOLD PAYMENT. Request supplier credit note for UGX ${Math.abs(params.invoiceTotal - params.poTotal).toLocaleString()} price difference. Reference PO agreed prices.`,
    };
  }

  return {
    verdict: 'pending_review',
    summary: `Match results require manual review. ${linesExactMatched}/${totalLines} exact matches.`,
    riskAssessment: 'Moderate risk. Manual verification required.',
    recommendedAction: 'Assign to Finance Officer for detailed review.',
  };
}

// ─── Dispute Management ─────────────────────────────────────────────────────

export function raiseMatchDispute(params: {
  tenantId: string;
  matchSessionId: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  disputeType: ThreeWayMatchDispute['disputeType'];
  totalDisputedAmountUgx: number;
  disputedLineCount: number;
  disputeNarrative: string;
  raisedByName: string;
  raisedByRole: string;
}): ThreeWayMatchDispute {
  const dispute: ThreeWayMatchDispute = {
    id: `dispute-${Date.now()}`,
    tenantId: params.tenantId,
    disputeReference: `DIS-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`,
    matchSessionId: params.matchSessionId,
    matchSessionReference: matchSessionsStore.find((s) => s.id === params.matchSessionId)?.matchSessionReference || 'N/A',
    invoiceId: params.invoiceId,
    invoiceNumber: params.invoiceNumber,
    supplierName: params.supplierName,
    disputeType: params.disputeType,
    totalDisputedAmountUgx: params.totalDisputedAmountUgx,
    disputedLineCount: params.disputedLineCount,
    disputeNarrative: params.disputeNarrative,
    status: 'open',
    raisedByName: params.raisedByName,
    raisedByRole: params.raisedByRole,
    raisedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  disputesStore = [dispute, ...disputesStore];

  // Update session verdict to dispute_raised
  const sessionIdx = matchSessionsStore.findIndex((s) => s.id === params.matchSessionId);
  if (sessionIdx !== -1) {
    matchSessionsStore[sessionIdx] = {
      ...matchSessionsStore[sessionIdx],
      sessionVerdict: 'dispute_raised',
    };
  }

  return dispute;
}

export function recordCreditNote(
  disputeId: string,
  creditNoteData: {
    creditNoteNumber: string;
    creditNoteAmountUgx: number;
    creditNoteDate: string;
    supplierResponse: string;
  }
): ThreeWayMatchDispute {
  const idx = disputesStore.findIndex((d) => d.id === disputeId);
  if (idx === -1) throw new Error('Dispute not found');

  disputesStore[idx] = {
    ...disputesStore[idx],
    creditNoteNumber: creditNoteData.creditNoteNumber,
    creditNoteAmountUgx: creditNoteData.creditNoteAmountUgx,
    creditNoteDate: creditNoteData.creditNoteDate,
    supplierResponse: creditNoteData.supplierResponse,
    status: 'credit_note_received',
  };

  return disputesStore[idx];
}

export function resolveDispute(
  disputeId: string,
  resolution: {
    resolvedByName: string;
    resolvedByRole: string;
    resolutionNotes: string;
    finalStatus: 'resolved_and_closed' | 'written_off' | 'price_adjustment_accepted';
  }
): ThreeWayMatchDispute {
  const idx = disputesStore.findIndex((d) => d.id === disputeId);
  if (idx === -1) throw new Error('Dispute not found');

  disputesStore[idx] = {
    ...disputesStore[idx],
    status: resolution.finalStatus,
    resolvedByName: resolution.resolvedByName,
    resolvedByRole: resolution.resolvedByRole,
    resolvedAt: new Date().toISOString(),
    resolutionNotes: resolution.resolutionNotes,
  };

  return disputesStore[idx];
}

export function overrideMatchSession(
  sessionId: string,
  override: {
    approvedByName: string;
    approvedByRole: string;
    overrideReason: string;
  }
): ThreeWayMatchSession {
  const idx = matchSessionsStore.findIndex((s) => s.id === sessionId);
  if (idx === -1) throw new Error('Match session not found');

  matchSessionsStore[idx] = {
    ...matchSessionsStore[idx],
    sessionVerdict: 'override_approved',
    approvedByName: override.approvedByName,
    approvedByRole: override.approvedByRole,
    approvedAt: new Date().toISOString(),
    overrideReason: override.overrideReason,
  };

  return matchSessionsStore[idx];
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function getAllMatchSessions(tenantId: string = 'client-001'): ThreeWayMatchSession[] {
  return matchSessionsStore.filter((s) => s.tenantId === tenantId);
}

export function getMatchSessionById(sessionId: string): ThreeWayMatchSession | undefined {
  return matchSessionsStore.find((s) => s.id === sessionId);
}

export function getDisputesBySession(sessionId: string): ThreeWayMatchDispute[] {
  return disputesStore.filter((d) => d.matchSessionId === sessionId);
}

export function getAllDisputes(tenantId: string = 'client-001'): ThreeWayMatchDispute[] {
  return disputesStore.filter((d) => d.tenantId === tenantId);
}

// ─── Report Generation ──────────────────────────────────────────────────────

export function generateReconciliationReport(
  sessionId: string,
  generatedByName: string
): ThreeWayReconciliationReport | null {
  const session = getMatchSessionById(sessionId);
  if (!session) return null;

  const disputes = getDisputesBySession(sessionId);
  const config = getToleranceConfig(session.tenantId);

  return {
    matchSession: session,
    disputes,
    toleranceConfig: config,
    generatedAt: new Date().toISOString(),
    generatedByName,
  };
}

export function generateMatchReportText(sessionId: string): string {
  const session = getMatchSessionById(sessionId);
  if (!session) return 'Match session not found.';

  const disputes = getDisputesBySession(sessionId);
  const sep = '═'.repeat(90);
  const subSep = '─'.repeat(90);

  const lines: string[] = [
    sep,
    'ZENITHRX PHARMACY — 3-WAY INVOICE MATCHING RECONCILIATION REPORT',
    `MATCH SESSION: ${session.matchSessionReference}`,
    `GENERATED: ${new Date().toISOString()}`,
    sep,
    '',
    '1. DOCUMENT REFERENCES',
    `   Purchase Order:     ${session.poNumber}`,
    `   Goods Received:     ${session.grnNumber}`,
    `   Supplier Invoice:   ${session.invoiceNumber}`,
    `   Supplier:           ${session.supplierName}`,
    '',
    subSep,
    '2. HEADER-LEVEL COMPARISON',
    `   PO Authorized Total:     UGX ${session.poTotalAuthorizedUgx.toLocaleString()}`,
    `   GRN Accepted Value:      UGX ${session.grnTotalAcceptedUgx.toLocaleString()}`,
    `   Invoice Billed Total:    UGX ${session.invoiceTotalBilledUgx.toLocaleString()}`,
    `   ───────────────────────────────────────────`,
    `   Net Financial Variance:  UGX ${session.netFinancialVarianceUgx.toLocaleString()}`,
    '',
    subSep,
    '3. SESSION VERDICT',
    `   Status:  ${session.sessionVerdict.replace(/_/g, ' ').toUpperCase()}`,
    `   Summary: ${session.verdictSummary}`,
    '',
    `   Risk Assessment:     ${session.financialRiskAssessment || 'N/A'}`,
    `   Recommended Action:  ${session.recommendedAction || 'N/A'}`,
    '',
    subSep,
    '4. LINE-BY-LINE MATCHING MATRIX',
    `   Total Lines: ${session.totalLineItems} | Exact: ${session.linesExactMatched} | Tolerance: ${session.linesWithinTolerance} | Qty Issue: ${session.linesQtyMismatch} | Price Issue: ${session.linesPriceMismatch} | Missing: ${session.linesMissing}`,
    '',
  ];

  for (const ld of session.lineDetails) {
    lines.push(`   ${ld.isFlagged ? '⚠' : '✅'} ${ld.genericName} (${ld.brandName || 'Generic'})`);
    lines.push(`      PO:      ${ld.poOrderedQuantity} units @ UGX ${ld.poUnitCostUgx.toLocaleString()} = UGX ${ld.poLineTotalUgx.toLocaleString()}`);
    lines.push(`      GRN:     ${ld.grnDeliveredQuantity} units received (Batch: ${ld.grnBatchNumber || 'N/A'})`);
    lines.push(`      Invoice: ${ld.invoiceBilledQuantity} units @ UGX ${ld.invoiceUnitCostUgx.toLocaleString()} = UGX ${ld.invoiceLineTotalUgx.toLocaleString()}`);
    lines.push(`      Verdict: ${ld.lineVerdict.replace(/_/g, ' ').toUpperCase()}`);
    if (ld.qtyVariancePoVsGrn !== 0 || ld.qtyVarianceGrnVsInvoice !== 0 || ld.priceVariancePoVsInvoiceUgx !== 0) {
      lines.push(`      Variances: Qty (PO→GRN): ${ld.qtyVariancePoVsGrn >= 0 ? '+' : ''}${ld.qtyVariancePoVsGrn} | Qty (GRN→Inv): ${ld.qtyVarianceGrnVsInvoice >= 0 ? '+' : ''}${ld.qtyVarianceGrnVsInvoice} | Price: ${ld.priceVariancePoVsInvoiceUgx >= 0 ? '+' : ''}UGX ${ld.priceVariancePoVsInvoiceUgx.toLocaleString()}`);
    }
    lines.push(`      ${ld.varianceExplanation || ''}`);
    lines.push('');
  }

  if (disputes.length > 0) {
    lines.push(subSep);
    lines.push('5. DISPUTES');
    for (const d of disputes) {
      lines.push(`   ${d.disputeReference}: ${d.disputeType} | UGX ${d.totalDisputedAmountUgx.toLocaleString()} | Status: ${d.status}`);
      if (d.creditNoteNumber) {
        lines.push(`     Credit Note: ${d.creditNoteNumber} — UGX ${d.creditNoteAmountUgx?.toLocaleString()}`);
      }
    }
  }

  lines.push('');
  lines.push(`Executed By: ${session.executedByName} (${session.executedByRole})`);
  lines.push(sep);
  lines.push('END OF 3-WAY MATCHING REPORT — FINANCIAL CONTROLS GOVERNANCE');
  lines.push(sep);

  return lines.join('\n');
}

// ─── Seeded Demo Data ───────────────────────────────────────────────────────

/**
 * Seeds realistic demo matching sessions for the existing P2P dossiers.
 * Call on service initialization.
 */
export function seedDemoMatchSessions(): void {
  if (matchSessionsStore.length > 0) return;

  // Dossier 1: Perfect exact match (settled)
  const session1: ThreeWayMatchSession = {
    id: 'match-session-001',
    tenantId: 'client-001',
    matchSessionReference: '3WAY-2026-10081',
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-ABACUS-2026-904',
    purchaseOrderId: 'po-001',
    poNumber: 'PO-2026-0299',
    grnId: 'grn-001',
    grnNumber: 'GRN-2026-0412',
    supplierName: 'Abacus Pharma (A) Limited',
    poTotalAuthorizedUgx: 18450000,
    grnTotalAcceptedUgx: 18450000,
    invoiceTotalBilledUgx: 18450000,
    poVsGrnQtyVarianceTotal: 0,
    poVsInvoicePriceVarianceUgx: 0,
    grnVsInvoiceQtyVarianceTotal: 0,
    netFinancialVarianceUgx: 0,
    totalLineItems: 3,
    linesExactMatched: 3,
    linesWithinTolerance: 0,
    linesQtyMismatch: 0,
    linesPriceMismatch: 0,
    linesMissing: 0,
    sessionVerdict: 'full_match',
    verdictSummary: '✅ FULL 3-WAY MATCH — All 3 line items match perfectly across Purchase Order, Goods Received Note, and Supplier Invoice. No variances detected.',
    financialRiskAssessment: 'No financial risk. All quantities and prices verified across all three documents.',
    recommendedAction: 'Auto-approved for payment processing. Payment Voucher generated.',
    executedByName: 'Kigozi Jonathan',
    executedByRole: 'Finance & Accounts Officer',
    executedAt: '2026-03-21T10:45:00Z',
    approvedByName: 'Dr. Sarah Nabatanzi',
    approvedByRole: 'Pharmacy Owner',
    approvedAt: '2026-03-22T11:00:00Z',
    lineDetails: [
      {
        id: 'mld-001-1',
        matchSessionId: 'match-session-001',
        drugId: 'drug-coartem',
        genericName: 'Artemether + Lumefantrine (Coartem)',
        brandName: 'Coartem 20/120mg',
        unitOfMeasure: 'Box of 24s',
        poItemId: 'poi-1',
        poOrderedQuantity: 200,
        poUnitCostUgx: 28000,
        poLineTotalUgx: 5600000,
        grnItemId: 'gri-1',
        grnDeliveredQuantity: 200,
        grnAcceptedQuantity: 200,
        grnBatchNumber: 'COA-2026-B81',
        invoiceItemId: 'invl-001-1',
        invoiceBilledQuantity: 200,
        invoiceUnitCostUgx: 28000,
        invoiceLineTotalUgx: 5600000,
        qtyVariancePoVsGrn: 0,
        qtyVarianceGrnVsInvoice: 0,
        qtyVariancePoVsInvoice: 0,
        priceVariancePoVsInvoiceUgx: 0,
        valueVarianceUgx: 0,
        lineVerdict: 'exact_match',
        varianceExplanation: '✅ Perfect 3-Way Match: Ordered 200, Received 200, Invoiced 200 @ UGX 28,000/unit.',
        isFlagged: false,
      },
      {
        id: 'mld-001-2',
        matchSessionId: 'match-session-001',
        drugId: 'drug-augmentin',
        genericName: 'Amoxicillin + Clavulanic Acid (Augmentin)',
        brandName: 'Augmentin 625mg',
        unitOfMeasure: 'Pack of 14s',
        poItemId: 'poi-2',
        poOrderedQuantity: 150,
        poUnitCostUgx: 45000,
        poLineTotalUgx: 6750000,
        grnItemId: 'gri-2',
        grnDeliveredQuantity: 150,
        grnAcceptedQuantity: 150,
        grnBatchNumber: 'AUG-2026-X19',
        invoiceItemId: 'invl-001-2',
        invoiceBilledQuantity: 150,
        invoiceUnitCostUgx: 45000,
        invoiceLineTotalUgx: 6750000,
        qtyVariancePoVsGrn: 0,
        qtyVarianceGrnVsInvoice: 0,
        qtyVariancePoVsInvoice: 0,
        priceVariancePoVsInvoiceUgx: 0,
        valueVarianceUgx: 0,
        lineVerdict: 'exact_match',
        varianceExplanation: '✅ Perfect 3-Way Match: Ordered 150, Received 150, Invoiced 150 @ UGX 45,000/unit.',
        isFlagged: false,
      },
      {
        id: 'mld-001-3',
        matchSessionId: 'match-session-001',
        drugId: 'drug-ceftriaxone',
        genericName: 'Ceftriaxone Sodium Injection',
        brandName: 'Rocephin 1g IV/IM',
        unitOfMeasure: 'Vials',
        poItemId: 'poi-3',
        poOrderedQuantity: 250,
        poUnitCostUgx: 24400,
        poLineTotalUgx: 6100000,
        grnItemId: 'gri-3',
        grnDeliveredQuantity: 250,
        grnAcceptedQuantity: 250,
        grnBatchNumber: 'CEF-2026-H44',
        invoiceItemId: 'invl-001-3',
        invoiceBilledQuantity: 250,
        invoiceUnitCostUgx: 24400,
        invoiceLineTotalUgx: 6100000,
        qtyVariancePoVsGrn: 0,
        qtyVarianceGrnVsInvoice: 0,
        qtyVariancePoVsInvoice: 0,
        priceVariancePoVsInvoiceUgx: 0,
        valueVarianceUgx: 0,
        lineVerdict: 'exact_match',
        varianceExplanation: '✅ Perfect 3-Way Match: Ordered 250, Received 250, Invoiced 250 @ UGX 24,400/unit.',
        isFlagged: false,
      },
    ],
    createdAt: '2026-03-21T10:45:00Z',
  };

  // Dossier 3: Blocked — price mismatch on Telmisartan + quantity short on Rosuvastatin
  const session3: ThreeWayMatchSession = {
    id: 'match-session-003',
    tenantId: 'client-001',
    matchSessionReference: '3WAY-2026-10102',
    invoiceId: 'inv-003',
    invoiceNumber: 'INV-RENE-2026-441',
    purchaseOrderId: 'po-003',
    poNumber: 'PO-2026-0320',
    grnId: 'grn-003',
    grnNumber: 'GRN-2026-0431',
    supplierName: 'Rene Industries Limited',
    poTotalAuthorizedUgx: 8000000,
    grnTotalAcceptedUgx: 7720000, // Received 95 Telmisartan (vs 100 ordered) + all 50 Rosuvastatin
    invoiceTotalBilledUgx: 8200000, // Supplier billed 200K higher
    poVsGrnQtyVarianceTotal: -5, // 5 units short on Telmisartan
    poVsInvoicePriceVarianceUgx: 200000,
    grnVsInvoiceQtyVarianceTotal: 5, // Invoice claims 100 Telmisartan but only 95 received
    netFinancialVarianceUgx: 480000, // 8200000 - 7720000
    totalLineItems: 2,
    linesExactMatched: 0,
    linesWithinTolerance: 0,
    linesQtyMismatch: 1,
    linesPriceMismatch: 1,
    linesMissing: 0,
    sessionVerdict: 'blocked_multiple_discrepancies',
    verdictSummary: '⛔ BLOCKED — MULTIPLE DISCREPANCIES DETECTED — 1 quantity mismatch and 1 price mismatch across 2 line items. Net financial variance: UGX 480,000. Pharmacy is being overbilled.',
    financialRiskAssessment: 'HIGH RISK: Combined quantity and price discrepancies totalling UGX 480,000. Pharmacy may be overbilled. Do NOT authorize payment until resolved.',
    recommendedAction: 'HOLD PAYMENT. Raise dispute with Rene Industries Ltd. Request credit note for 5 units of Telmisartan not delivered and UGX 2,000/unit price overcharge. Escalate to Pharmacy Owner if unresolved within 7 days.',
    executedByName: 'Kigozi Jonathan',
    executedByRole: 'Finance & Accounts Officer',
    executedAt: '2026-03-24T09:00:00Z',
    lineDetails: [
      {
        id: 'mld-003-1',
        matchSessionId: 'match-session-003',
        drugId: 'drug-telmisartan',
        genericName: 'Telmisartan 80mg Tablets',
        brandName: 'Micardis 80mg',
        unitOfMeasure: 'Pack of 28s',
        poItemId: 'poi-31',
        poOrderedQuantity: 100,
        poUnitCostUgx: 52000,
        poLineTotalUgx: 5200000,
        grnItemId: 'gri-31',
        grnDeliveredQuantity: 95,
        grnAcceptedQuantity: 95,
        grnBatchNumber: 'TEL-2026-M41',
        invoiceItemId: 'invl-003-1',
        invoiceBilledQuantity: 100,
        invoiceUnitCostUgx: 54000,
        invoiceLineTotalUgx: 5400000,
        qtyVariancePoVsGrn: -5,
        qtyVarianceGrnVsInvoice: 5,
        qtyVariancePoVsInvoice: 0,
        priceVariancePoVsInvoiceUgx: 2000,
        valueVarianceUgx: 200000,
        lineVerdict: 'quantity_and_price_mismatch',
        varianceExplanation: '⚠ QUANTITY & PRICE MISMATCH: Ordered 100, Received 95, Invoiced 100 (exceeds ±2 tolerance). Supplier billed for 5 units NOT delivered. Price: PO @ UGX 52,000 vs Invoice @ UGX 54,000 — unauthorized price increase of UGX 2,000/unit. Total overbilling: UGX 200,000.',
        isFlagged: true,
        flagReason: 'Quantity shortage + unauthorized price increase',
      },
      {
        id: 'mld-003-2',
        matchSessionId: 'match-session-003',
        drugId: 'drug-rosuvastatin',
        genericName: 'Rosuvastatin 20mg Tablets',
        brandName: 'Crestor 20mg',
        unitOfMeasure: 'Pack of 28s',
        poItemId: 'poi-32',
        poOrderedQuantity: 50,
        poUnitCostUgx: 56000,
        poLineTotalUgx: 2800000,
        grnItemId: 'gri-32',
        grnDeliveredQuantity: 50,
        grnAcceptedQuantity: 50,
        grnBatchNumber: 'ROS-2026-Z77',
        invoiceItemId: 'invl-003-2',
        invoiceBilledQuantity: 50,
        invoiceUnitCostUgx: 56000,
        invoiceLineTotalUgx: 2800000,
        qtyVariancePoVsGrn: 0,
        qtyVarianceGrnVsInvoice: 0,
        qtyVariancePoVsInvoice: 0,
        priceVariancePoVsInvoiceUgx: 0,
        valueVarianceUgx: 0,
        lineVerdict: 'exact_match',
        varianceExplanation: '✅ Perfect 3-Way Match: Ordered 50, Received 50, Invoiced 50 @ UGX 56,000/unit.',
        isFlagged: false,
      },
    ],
    createdAt: '2026-03-24T09:00:00Z',
  };

  matchSessionsStore = [session3, session1]; // Most recent first

  // Pre-seed a dispute for session 3
  const dispute3: ThreeWayMatchDispute = {
    id: 'dispute-001',
    tenantId: 'client-001',
    disputeReference: 'DIS-2026-40102',
    matchSessionId: 'match-session-003',
    matchSessionReference: '3WAY-2026-10102',
    invoiceId: 'inv-003',
    invoiceNumber: 'INV-RENE-2026-441',
    supplierName: 'Rene Industries Limited',
    disputeType: 'both',
    totalDisputedAmountUgx: 480000,
    disputedLineCount: 1,
    disputeNarrative: 'Telmisartan 80mg (Micardis): (1) Supplier billed 100 packs but GRN confirms only 95 received — overbilled for 5 packs @ UGX 54,000 = UGX 270,000. (2) Unit price increased from PO-agreed UGX 52,000 to UGX 54,000 without authorization — surcharge of UGX 2,000 × 100 = UGX 200,000. Total disputed: UGX 480,000. Requesting credit note or revised invoice.',
    status: 'credit_note_requested',
    raisedByName: 'Kigozi Jonathan',
    raisedByRole: 'Finance & Accounts Officer',
    raisedAt: '2026-03-24T10:00:00Z',
    createdAt: '2026-03-24T10:00:00Z',
  };

  disputesStore = [dispute3];

  // Seed corresponding invoice line items
  invoiceLineItemsStore['inv-001'] = [
    { id: 'invl-001-1', invoiceId: 'inv-001', poItemId: 'poi-1', genericName: 'Artemether + Lumefantrine (Coartem)', brandName: 'Coartem 20/120mg', invoicedQuantity: 200, unitCostUgx: 28000, lineTotalUgx: 5600000, unitOfMeasure: 'Box of 24s' },
    { id: 'invl-001-2', invoiceId: 'inv-001', poItemId: 'poi-2', genericName: 'Amoxicillin + Clavulanic Acid (Augmentin)', brandName: 'Augmentin 625mg', invoicedQuantity: 150, unitCostUgx: 45000, lineTotalUgx: 6750000, unitOfMeasure: 'Pack of 14s' },
    { id: 'invl-001-3', invoiceId: 'inv-001', poItemId: 'poi-3', genericName: 'Ceftriaxone Sodium Injection', brandName: 'Rocephin 1g IV/IM', invoicedQuantity: 250, unitCostUgx: 24400, lineTotalUgx: 6100000, unitOfMeasure: 'Vials' },
  ];
  invoiceLineItemsStore['inv-003'] = [
    { id: 'invl-003-1', invoiceId: 'inv-003', poItemId: 'poi-31', genericName: 'Telmisartan 80mg Tablets', brandName: 'Micardis 80mg', invoicedQuantity: 100, unitCostUgx: 54000, lineTotalUgx: 5400000, unitOfMeasure: 'Pack of 28s' },
    { id: 'invl-003-2', invoiceId: 'inv-003', poItemId: 'poi-32', genericName: 'Rosuvastatin 20mg Tablets', brandName: 'Crestor 20mg', invoicedQuantity: 50, unitCostUgx: 56000, lineTotalUgx: 2800000, unitOfMeasure: 'Pack of 28s' },
  ];
}

// Initialize on import
seedDemoMatchSessions();
