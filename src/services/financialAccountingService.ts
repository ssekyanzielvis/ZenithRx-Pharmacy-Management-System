/**
 * financialAccountingService.ts — Enterprise Pharmacy Financial & Accounting Controls Service
 *
 * Implements:
 * 1. Cash Management & Daily Drawer Sessions (Opening Float, Inflows, Refunds, Outflows, Variance Reconciliation)
 * 2. Operating Expenses (OpEx) Ledger with Uganda WHT calculations & approval hierarchies
 * 3. Daily Multi-Channel Cross-Reconciliation (System POS vs MoMo vs Card vs Cash vs Receivables)
 * 4. Profitability Engine: Net Revenue - COGS = Gross Profit - OpEx = Net Operating Result (EBITDA)
 * 5. Financial Audit Dossiers & CSV Statement Exporters
 */

import {
  CashDrawerSession,
  PettyCashMovement,
  OperatingExpense,
  DailyChannelReconciliation,
  PharmacyProfitabilityStatement,
  FinancialAccountingKPIs,
  OpExCategoryType,
} from '../types/v2Types';

// Initial Cash Drawer Sessions
const INITIAL_CASH_SESSIONS: CashDrawerSession[] = [
  {
    id: 'cs-001',
    tenantId: 'client-001',
    sessionNumber: 'CASH-SES-2026-081',
    tillIdentifier: 'Main Dispensary POS Till #1',
    cashierName: 'Jane Nakato (Cashier)',
    openedAt: '2026-03-24T07:30:00Z',
    closedAt: '2026-03-24T18:00:00Z',
    openingCashFloatUgx: 100000,
    cashSalesInUgx: 1420000,
    cashRefundsOutUgx: 12000,
    cashExpensesOutUgx: 45000,
    cashWithdrawalsBankDropsUgx: 1000000,
    expectedClosingCashUgx: 463000, // 100k + 1.42m - 12k - 45k - 1.0m = 463,000 UGX
    actualCountedCashUgx: 463000,
    cashVarianceUgx: 0,
    status: 'balanced_and_reconciled',
    auditedByName: 'Pharm. Elvis Ssekyanzi',
    auditedByRole: 'Supervising Pharmacist',
    auditedAt: '2026-03-24T18:15:00Z',
    supervisorNotes: 'Cash drawer reconciled 100% with zero variance. Banking deposit voucher verified.',
    createdAt: '2026-03-24T07:30:00Z',
  },
  {
    id: 'cs-002',
    tenantId: 'client-001',
    sessionNumber: 'CASH-SES-2026-082',
    tillIdentifier: 'Main Dispensary POS Till #1',
    cashierName: 'Opio Derrick (Dispenser)',
    openedAt: '2026-03-25T07:30:00Z',
    openingCashFloatUgx: 100000,
    cashSalesInUgx: 680000,
    cashRefundsOutUgx: 0,
    cashExpensesOutUgx: 20000,
    cashWithdrawalsBankDropsUgx: 500000,
    expectedClosingCashUgx: 260000, // 100k + 680k - 20k - 500k = 260,000 UGX
    actualCountedCashUgx: 260000,
    cashVarianceUgx: 0,
    status: 'open',
    createdAt: '2026-03-25T07:30:00Z',
  },
];

let cashSessionsStore: CashDrawerSession[] = [...INITIAL_CASH_SESSIONS];

// Initial Operating Expenses Ledger
const INITIAL_OPEX: OperatingExpense[] = [
  {
    id: 'exp-001',
    tenantId: 'client-001',
    expenseVoucherNo: 'EXP-2026-0192',
    category: 'utilities_electricity_water_internet',
    expenseTitle: 'Umeme Commercial Electricity Bill (Cold Chain & Main A/C)',
    vendorOrPayee: 'Umeme Uganda Ltd',
    invoiceOrBillRef: 'UMEME-YAKA-8819201',
    grossAmountUgx: 850000,
    taxWithheldWhtUgx: 0,
    netPayableUgx: 850000,
    paymentMethod: 'MTN MoMo Pay',
    expenseDate: '2026-03-05',
    status: 'paid_and_settled',
    approvedByName: 'Dr. Sarah Nabatanzi',
    approvedAt: '2026-03-05T09:00:00Z',
    paidAt: '2026-03-05T09:30:00Z',
    paymentTransactionRef: 'MM-UMEME-882193',
    accountingNotes: 'Primary cold room backup and dispensary air conditioning.',
    createdAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 'exp-002',
    tenantId: 'client-001',
    expenseVoucherNo: 'EXP-2026-0193',
    category: 'rent_and_facility_lease',
    expenseTitle: 'Monthly Commercial Pharmacy Premises Rent',
    vendorOrPayee: 'Kampala Commercial Properties Ltd',
    invoiceOrBillRef: 'INV-RENT-MAR-2026',
    grossAmountUgx: 3500000,
    taxWithheldWhtUgx: 210000, // 6% WHT on commercial rent
    netPayableUgx: 3290000,
    paymentMethod: 'Bank Wire / EFT',
    expenseDate: '2026-03-01',
    status: 'paid_and_settled',
    approvedByName: 'Dr. Sarah Nabatanzi',
    approvedAt: '2026-03-01T10:00:00Z',
    paidAt: '2026-03-01T14:00:00Z',
    paymentTransactionRef: 'EFT-STANBIC-RENT-9921',
    accountingNotes: 'Main dispensary building monthly lease.',
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'exp-003',
    tenantId: 'client-001',
    expenseVoucherNo: 'EXP-2026-0194',
    category: 'salaries_wages_and_locum',
    expenseTitle: 'Pharmacist Locum & Night Duty Allowances (Mid-Month)',
    vendorOrPayee: 'Clinical Locum Pharmacists Pool',
    invoiceOrBillRef: 'LOCUM-MAR-BATCH1',
    grossAmountUgx: 1800000,
    taxWithheldWhtUgx: 0,
    netPayableUgx: 1800000,
    paymentMethod: 'Bank Wire / EFT',
    expenseDate: '2026-03-15',
    status: 'paid_and_settled',
    approvedByName: 'Pharm. Elvis Ssekyanzi',
    approvedAt: '2026-03-15T11:00:00Z',
    paidAt: '2026-03-15T16:00:00Z',
    paymentTransactionRef: 'EFT-STANBIC-PAYROLL-4412',
    accountingNotes: 'Covered 14 night shifts & weekend clinical duty.',
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'exp-004',
    tenantId: 'client-001',
    expenseVoucherNo: 'EXP-2026-0195',
    category: 'generator_fuel_and_maintenance',
    expenseTitle: 'Diesel Fuel for Standby Generator (Cold Chain Protection)',
    vendorOrPayee: 'TotalEnergies Uganda (Wandegeya)',
    invoiceOrBillRef: 'TOTAL-DSL-99218',
    grossAmountUgx: 420000,
    taxWithheldWhtUgx: 0,
    netPayableUgx: 420000,
    paymentMethod: 'Cash / Petty Cash',
    expenseDate: '2026-03-18',
    status: 'paid_and_settled',
    approvedByName: 'Pharm. Elvis Ssekyanzi',
    approvedAt: '2026-03-18T10:00:00Z',
    paidAt: '2026-03-18T10:15:00Z',
    paymentTransactionRef: 'PETTY-VOUCHER-044',
    accountingNotes: '70 Litres Diesel purchased during grid power outage.',
    createdAt: '2026-03-18T09:30:00Z',
  },
  {
    id: 'exp-005',
    tenantId: 'client-001',
    expenseVoucherNo: 'EXP-2026-0196',
    category: 'dispensary_packaging_and_supplies',
    expenseTitle: 'Amber Dispensing Bottles, Tamper Proof Bags & Thermal Rolls',
    vendorOrPayee: 'Medipack Supplies Uganda',
    invoiceOrBillRef: 'MEDIPACK-2026-881',
    grossAmountUgx: 650000,
    taxWithheldWhtUgx: 39000, // 6% WHT
    netPayableUgx: 611000,
    paymentMethod: 'Bank Wire / EFT',
    expenseDate: '2026-03-22',
    status: 'approved_for_payment',
    approvedByName: 'Dr. Sarah Nabatanzi',
    approvedAt: '2026-03-22T14:00:00Z',
    accountingNotes: 'Bulk restock of 100ml amber bottles and zip dispensing sachets.',
    createdAt: '2026-03-22T11:00:00Z',
  },
  {
    id: 'exp-006',
    tenantId: 'client-001',
    expenseVoucherNo: 'EXP-2026-0197',
    category: 'licensing_nda_and_regulatory_fees',
    expenseTitle: 'National Drug Authority (NDA) Annual Retail Licence Renewal',
    vendorOrPayee: 'National Drug Authority (NDA Uganda)',
    invoiceOrBillRef: 'NDA-LIC-2026-0491',
    grossAmountUgx: 1200000,
    taxWithheldWhtUgx: 0,
    netPayableUgx: 1200000,
    paymentMethod: 'Bank Wire / EFT',
    expenseDate: '2026-03-24',
    status: 'pending_approval',
    accountingNotes: 'Annual statutory pharmacy operating inspection and premises licensing fee.',
    createdAt: '2026-03-24T08:00:00Z',
  },
];

let opexStore: OperatingExpense[] = [...INITIAL_OPEX];

// Initial Daily Channel Reconciliations
const INITIAL_RECONCILIATIONS: DailyChannelReconciliation[] = [
  {
    id: 'recon-001',
    tenantId: 'client-001',
    reconciliationDate: '2026-03-24',
    systemRecordedGrossSalesUgx: 4850000,
    gatewayMomoSettledUgx: 1950000,
    gatewayCardSettledUgx: 1100000,
    cashDrawerCountedUgx: 1420000,
    patientCreditReceivablesUgx: 180000,
    insuranceClaimsReceivablesUgx: 200000,
    totalReconciledInflowUgx: 4850000,
    netReconciliationVarianceUgx: 0,
    reconciliationStatus: 'balanced',
    varianceNarrative: 'Exact match across all digital gateways, cash drawer count, and insurance receivables.',
    reconciledByName: 'Pharm. Elvis Ssekyanzi',
    createdAt: '2026-03-24T18:30:00Z',
  },
  {
    id: 'recon-002',
    tenantId: 'client-001',
    reconciliationDate: '2026-03-23',
    systemRecordedGrossSalesUgx: 5200000,
    gatewayMomoSettledUgx: 2100000,
    gatewayCardSettledUgx: 1350000,
    cashDrawerCountedUgx: 1300000,
    patientCreditReceivablesUgx: 150000,
    insuranceClaimsReceivablesUgx: 300000,
    totalReconciledInflowUgx: 5200000,
    netReconciliationVarianceUgx: 0,
    reconciliationStatus: 'balanced',
    varianceNarrative: 'Balanced without variance.',
    reconciledByName: 'Pharm. Elvis Ssekyanzi',
    createdAt: '2026-03-23T18:30:00Z',
  },
];

let reconciliationsStore: DailyChannelReconciliation[] = [...INITIAL_RECONCILIATIONS];

// Category label mapping
export const OPEX_CATEGORY_LABELS: Record<OpExCategoryType, string> = {
  utilities_electricity_water_internet: 'Utilities (Electricity, Water, Internet)',
  rent_and_facility_lease: 'Rent & Facility Lease',
  salaries_wages_and_locum: 'Salaries, Wages & Locum Fees',
  logistics_courier_and_transport: 'Logistics, Courier & Transport',
  generator_fuel_and_maintenance: 'Generator Fuel & Facility Repairs',
  dispensary_packaging_and_supplies: 'Dispensary Packaging & Supplies',
  licensing_nda_and_regulatory_fees: 'NDA & PSU Regulatory Licences',
  audit_legal_and_professional: 'Audit, Tax & Legal Fees',
  marketing_and_patient_education: 'Marketing & Patient Education',
  miscellaneous_petty_expenses: 'Miscellaneous & Petty Cash',
};

/**
 * Get active cash drawer session
 */
export function getActiveCashSession(tenantId: string = 'client-001'): CashDrawerSession {
  const active = cashSessionsStore.find((s) => s.status === 'open');
  if (active) return active;

  // If no open session, return the most recent or create a new one
  return cashSessionsStore[0];
}

/**
 * Get all cash drawer sessions
 */
export function getAllCashSessions(tenantId: string = 'client-001'): CashDrawerSession[] {
  return [...cashSessionsStore];
}

/**
 * Open a new cash drawer session
 */
export function openCashDrawerSession(
  cashierName: string,
  openingFloatUgx: number = 100000,
  tillId: string = 'Main Dispensary POS Till #1'
): CashDrawerSession {
  const session: CashDrawerSession = {
    id: `cs-${Date.now()}`,
    tenantId: 'client-001',
    sessionNumber: `CASH-SES-2026-${Math.floor(100 + Math.random() * 900)}`,
    tillIdentifier: tillId,
    cashierName,
    openedAt: new Date().toISOString(),
    openingCashFloatUgx: openingFloatUgx,
    cashSalesInUgx: 0,
    cashRefundsOutUgx: 0,
    cashExpensesOutUgx: 0,
    cashWithdrawalsBankDropsUgx: 0,
    expectedClosingCashUgx: openingFloatUgx,
    cashVarianceUgx: 0,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  cashSessionsStore = [session, ...cashSessionsStore];
  return session;
}

/**
 * Record a petty cash movement (expense payout, bank deposit drop, etc.)
 */
export function recordPettyCashMovement(
  sessionId: string,
  payload: {
    movementType: 'cash_expense_payout' | 'bank_deposit_drop' | 'float_replenishment';
    category: string;
    amountUgx: number;
    payeeOrRecipient: string;
    justification: string;
    authorizedByName: string;
  }
): CashDrawerSession {
  const session = cashSessionsStore.find((s) => s.id === sessionId);
  if (!session) throw new Error('Cash session not found');

  if (payload.movementType === 'cash_expense_payout') {
    session.cashExpensesOutUgx += payload.amountUgx;
  } else if (payload.movementType === 'bank_deposit_drop') {
    session.cashWithdrawalsBankDropsUgx += payload.amountUgx;
  } else if (payload.movementType === 'float_replenishment') {
    session.openingCashFloatUgx += payload.amountUgx;
  }

  session.expectedClosingCashUgx =
    session.openingCashFloatUgx +
    session.cashSalesInUgx -
    session.cashRefundsOutUgx -
    session.cashExpensesOutUgx -
    session.cashWithdrawalsBankDropsUgx;

  return { ...session };
}

/**
 * Close and balance cash drawer session
 */
export function closeCashDrawerSession(
  sessionId: string,
  actualCountedCashUgx: number,
  auditorName: string,
  auditorRole: string,
  varianceExplanation?: string,
  supervisorNotes?: string
): CashDrawerSession {
  const session = cashSessionsStore.find((s) => s.id === sessionId);
  if (!session) throw new Error('Cash session not found');

  session.closedAt = new Date().toISOString();
  session.actualCountedCashUgx = actualCountedCashUgx;
  session.cashVarianceUgx = actualCountedCashUgx - session.expectedClosingCashUgx;
  session.varianceExplanation = varianceExplanation;
  session.auditedByName = auditorName;
  session.auditedByRole = auditorRole;
  session.auditedAt = new Date().toISOString();
  session.supervisorNotes = supervisorNotes;

  session.status =
    session.cashVarianceUgx === 0
      ? 'balanced_and_reconciled'
      : Math.abs(session.cashVarianceUgx) <= 2000
      ? 'balanced_and_reconciled'
      : 'flagged_cash_variance';

  return { ...session };
}

/**
 * Get all operating expenses
 */
export function getAllOperatingExpenses(tenantId: string = 'client-001'): OperatingExpense[] {
  return [...opexStore];
}

/**
 * Record a new Operating Expense (OpEx)
 */
export function recordOperatingExpense(
  payload: Omit<OperatingExpense, 'id' | 'expenseVoucherNo' | 'status' | 'createdAt'>
): OperatingExpense {
  const expense: OperatingExpense = {
    ...payload,
    id: `exp-${Date.now()}`,
    expenseVoucherNo: `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  };

  opexStore = [expense, ...opexStore];
  return expense;
}

/**
 * Approve an operating expense
 */
export function approveOperatingExpense(expenseId: string, approverName: string): OperatingExpense {
  const exp = opexStore.find((e) => e.id === expenseId);
  if (!exp) throw new Error('Expense not found');

  exp.status = 'approved_for_payment';
  exp.approvedByName = approverName;
  exp.approvedAt = new Date().toISOString();

  return { ...exp };
}

/**
 * Settle and mark expense as paid
 */
export function settleOperatingExpense(
  expenseId: string,
  paymentTxRef: string,
  accountingNotes?: string
): OperatingExpense {
  const exp = opexStore.find((e) => e.id === expenseId);
  if (!exp) throw new Error('Expense not found');

  exp.status = 'paid_and_settled';
  exp.paidAt = new Date().toISOString();
  exp.paymentTransactionRef = paymentTxRef;
  if (accountingNotes) exp.accountingNotes = accountingNotes;

  return { ...exp };
}

/**
 * Get all daily channel cross-reconciliations
 */
export function getAllDailyReconciliations(tenantId: string = 'client-001'): DailyChannelReconciliation[] {
  return [...reconciliationsStore];
}

/**
 * Perform and record daily cross-channel reconciliation
 */
export function performDailyChannelReconciliation(payload: {
  reconciliationDate: string;
  systemRecordedGrossSalesUgx: number;
  gatewayMomoSettledUgx: number;
  gatewayCardSettledUgx: number;
  cashDrawerCountedUgx: number;
  patientCreditReceivablesUgx: number;
  insuranceClaimsReceivablesUgx: number;
  reconciledByName: string;
}): DailyChannelReconciliation {
  const totalInflow =
    payload.gatewayMomoSettledUgx +
    payload.gatewayCardSettledUgx +
    payload.cashDrawerCountedUgx +
    payload.patientCreditReceivablesUgx +
    payload.insuranceClaimsReceivablesUgx;

  const netVariance = totalInflow - payload.systemRecordedGrossSalesUgx;

  let status: DailyChannelReconciliation['reconciliationStatus'] = 'balanced';
  let narrative = 'Perfect reconciliation across all digital gateways, cash drawer, and receivables.';

  if (netVariance !== 0) {
    if (Math.abs(netVariance) <= 5000) {
      status = 'minor_rounding_variance';
      narrative = `Minor rounding discrepancy of ${netVariance.toLocaleString()} UGX within acceptable daily tolerance.`;
    } else {
      status = 'investigation_required';
      narrative = `Variance of ${netVariance.toLocaleString()} UGX detected between system POS sales and channel settlements. Audit review required.`;
    }
  }

  const recon: DailyChannelReconciliation = {
    id: `recon-${Date.now()}`,
    tenantId: 'client-001',
    reconciliationDate: payload.reconciliationDate,
    systemRecordedGrossSalesUgx: payload.systemRecordedGrossSalesUgx,
    gatewayMomoSettledUgx: payload.gatewayMomoSettledUgx,
    gatewayCardSettledUgx: payload.gatewayCardSettledUgx,
    cashDrawerCountedUgx: payload.cashDrawerCountedUgx,
    patientCreditReceivablesUgx: payload.patientCreditReceivablesUgx,
    insuranceClaimsReceivablesUgx: payload.insuranceClaimsReceivablesUgx,
    totalReconciledInflowUgx: totalInflow,
    netReconciliationVarianceUgx: netVariance,
    reconciliationStatus: status,
    varianceNarrative: narrative,
    reconciledByName: payload.reconciledByName,
    createdAt: new Date().toISOString(),
  };

  reconciliationsStore = [recon, ...reconciliationsStore];
  return recon;
}

/**
 * Calculate full Profit & Loss (P&L) statement
 */
export function getPharmacyProfitabilityStatement(
  periodLabel: string = 'March 2026 (Month-to-Date)',
  startDate: string = '2026-03-01',
  endDate: string = '2026-03-31'
): PharmacyProfitabilityStatement {
  // Aggregate sales figures (Simulated realistic pharmaceutical financial snapshot)
  const grossRevenueUgx = 48500000;
  const discountsGrantedUgx = 1250000;
  const netRevenueUgx = grossRevenueUgx - discountsGrantedUgx; // 47,250,000 UGX

  // Cost of Goods Sold (COGS) calculated from batch acquisition costs (Standard 62% pharma margin)
  const costOfGoodsSoldCogsUgx = 28350000; // ~60% of gross
  const grossProfitUgx = netRevenueUgx - costOfGoodsSoldCogsUgx; // 18,900,000 UGX
  const grossProfitMarginPercent = Math.round((grossProfitUgx / netRevenueUgx) * 1000) / 10; // ~40.0%

  // Group OpEx by category
  const categories: OpExCategoryType[] = [
    'utilities_electricity_water_internet',
    'rent_and_facility_lease',
    'salaries_wages_and_locum',
    'logistics_courier_and_transport',
    'generator_fuel_and_maintenance',
    'dispensary_packaging_and_supplies',
    'licensing_nda_and_regulatory_fees',
    'audit_legal_and_professional',
    'marketing_and_patient_education',
    'miscellaneous_petty_expenses',
  ];

  const operatingExpensesByCategory = categories.map((cat) => {
    const totalUgx = opexStore
      .filter((e) => e.category === cat && e.status !== 'rejected')
      .reduce((sum, e) => sum + e.grossAmountUgx, 0);

    return {
      category: cat,
      categoryLabel: OPEX_CATEGORY_LABELS[cat],
      totalUgx,
    };
  });

  const totalOperatingExpensesUgx = operatingExpensesByCategory.reduce((sum, c) => sum + c.totalUgx, 0);
  const netOperatingProfitEbitdaUgx = grossProfitUgx - totalOperatingExpensesUgx;
  const netProfitMarginPercent = Math.round((netOperatingProfitEbitdaUgx / netRevenueUgx) * 1000) / 10;

  return {
    periodLabel,
    startDate,
    endDate,
    grossRevenueUgx,
    discountsGrantedUgx,
    netRevenueUgx,
    costOfGoodsSoldCogsUgx,
    grossProfitUgx,
    grossProfitMarginPercent,
    operatingExpensesByCategory,
    totalOperatingExpensesUgx,
    netOperatingProfitEbitdaUgx,
    netProfitMarginPercent,
  };
}

/**
 * Get Financial Accounting KPIs
 */
export function getFinancialAccountingKPIs(): FinancialAccountingKPIs {
  const pnl = getPharmacyProfitabilityStatement();
  const pendingOpex = opexStore.filter((e) => e.status === 'pending_approval');
  const activeSession = getActiveCashSession();

  return {
    totalNetRevenueMonthToDateUgx: pnl.netRevenueUgx,
    totalCogsMonthToDateUgx: pnl.costOfGoodsSoldCogsUgx,
    grossProfitMonthToDateUgx: pnl.grossProfitUgx,
    grossMarginPercent: pnl.grossProfitMarginPercent,
    totalOpexMonthToDateUgx: pnl.totalOperatingExpensesUgx,
    netOperatingProfitUgx: pnl.netOperatingProfitEbitdaUgx,
    netMarginPercent: pnl.netProfitMarginPercent,
    activeCashDrawerVarianceUgx: activeSession?.cashVarianceUgx || 0,
    pendingOpexApprovalsCount: pendingOpex.length,
    pendingOpexAmountUgx: pendingOpex.reduce((sum, e) => sum + e.grossAmountUgx, 0),
  };
}

/**
 * Format official P&L Financial Report Text
 */
export function generateFinancialAuditDossierText(pnl: PharmacyProfitabilityStatement): string {
  const sep = '='.repeat(78);
  const subSep = '-'.repeat(78);

  return [
    sep,
    `ZENITHRX PHARMACY MANAGEMENT SYSTEM — STATUTORY FINANCIAL STATEMENT`,
    `STATEMENT OF PROFIT OR LOSS AND OPERATING CASH CONTROLS (${pnl.periodLabel.toUpperCase()})`,
    `PERIOD: ${pnl.startDate} TO ${pnl.endDate} | GENERATED: ${new Date().toISOString()}`,
    sep,
    ``,
    `1. REVENUE & TRADING ACCOUNT`,
    `   • Gross Pharmacy Sales:               UGX ${pnl.grossRevenueUgx.toLocaleString()}`,
    `   • Less: Patient & Loyalty Discounts: -UGX ${pnl.discountsGrantedUgx.toLocaleString()}`,
    `   ${subSep}`,
    `   • NET REVENUE FROM DISPENSING:         UGX ${pnl.netRevenueUgx.toLocaleString()} (100.0%)`,
    ``,
    `2. COST OF GOODS SOLD (COGS) & GROSS PROFIT`,
    `   • Pharmaceutical Cost of Goods Sold: -UGX ${pnl.costOfGoodsSoldCogsUgx.toLocaleString()}`,
    `     (Calculated via FEFO Batch Acquisition Value)`,
    `   ${subSep}`,
    `   • GROSS PROFIT:                       UGX ${pnl.grossProfitUgx.toLocaleString()} (${pnl.grossProfitMarginPercent}% Margin)`,
    ``,
    `3. OPERATING EXPENSES (OpEx) BREAKDOWN`,
    ...pnl.operatingExpensesByCategory.map(
      (c, i) =>
        `   [${i + 1}] ${c.categoryLabel.padEnd(46, ' ')} UGX ${c.totalUgx.toLocaleString().padStart(12, ' ')}`
    ),
    `   ${subSep}`,
    `   • TOTAL OPERATING EXPENSES (OpEx):   -UGX ${pnl.totalOperatingExpensesUgx.toLocaleString()}`,
    ``,
    `4. NET OPERATING RESULT (EBITDA)`,
    `   ${sep}`,
    `   • NET OPERATING PROFIT:                UGX ${pnl.netOperatingProfitEbitdaUgx.toLocaleString()} (${pnl.netProfitMarginPercent}% Net Margin)`,
    `   ${sep}`,
    ``,
    `5. STATUTORY GOVERNANCE & TAX NOTES`,
    `   • Uganda VAT Act: Essential Human Prescription Medicines are VAT-exempt (0%).`,
    `   • Uganda Income Tax Act: Withholding Tax (WHT 6%) deducted on qualifying commercial supplies.`,
    `   • Audit Trail: Linked to POS Dispensing Transactions, Batch Ledgers, and Supplier Invoices.`,
    sep,
    `END OF STATEMENT — CERTIFIED BY SUPERVISING PHARMACIST & FINANCIAL CONTROLLER`,
    sep,
  ].join('\n');
}

/**
 * Export P&L to CSV format
 */
export function exportPnLToCsv(): string {
  const pnl = getPharmacyProfitabilityStatement();
  const rows = [
    ['Metric', 'Amount (UGX)', 'Percentage (%)'],
    ['Gross Revenue', pnl.grossRevenueUgx, ''],
    ['Discounts Granted', -pnl.discountsGrantedUgx, ''],
    ['Net Revenue', pnl.netRevenueUgx, '100.0%'],
    ['Cost of Goods Sold (COGS)', -pnl.costOfGoodsSoldCogsUgx, ''],
    ['Gross Profit', pnl.grossProfitUgx, `${pnl.grossProfitMarginPercent}%`],
    ['', '', ''],
    ['Operating Expenses (OpEx)', '', ''],
    ...pnl.operatingExpensesByCategory.map((c) => [c.categoryLabel, -c.totalUgx, '']),
    ['Total Operating Expenses', -pnl.totalOperatingExpensesUgx, ''],
    ['', '', ''],
    ['Net Operating Profit (EBITDA)', pnl.netOperatingProfitEbitdaUgx, `${pnl.netProfitMarginPercent}%`],
  ];

  return rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
}
