/**
 * useFinancialLedger.ts — Financial Ledger, Payment Orchestration & Cash-Up Hook
 * Clean Architecture: Application Layer
 * Complies with technical.md §11.18 (Financial Controls & Reconciliation)
 */

import { useState, useMemo, useCallback } from 'react';
import { POSTransaction } from '../types';
import { logAuditEvent } from '../repositories/auditRepository';

export interface CashUpRecord {
  id: string;
  reconciliationDate: string;
  cashierName: string;
  tenantId: string;
  openingFloatUgx: number;
  totalCashSalesUgx: number;
  totalMomoSalesUgx: number;
  totalCardSalesUgx: number;
  totalInsuranceSalesUgx: number;
  totalGrossRevenueUgx: number;
  expectedDrawerCashUgx: number;
  actualCountedCashUgx: number;
  cashVarianceUgx: number; // actual - expected
  payoutsUgx: number;
  payoutReason?: string;
  status: 'Balanced' | 'Discrepancy' | 'Approved';
  notes?: string;
  supervisorSignature?: string;
}

export function useFinancialLedger(transactions: POSTransaction[], tenantId = 'CLIENT-001') {
  const [openingFloat, setOpeningFloat] = useState<number>(100000); // Standard 100,000 UGX opening change float
  const [actualCountedCash, setActualCountedCash] = useState<number>(0);
  const [cashPayouts, setCashPayouts] = useState<number>(0);
  const [payoutReason, setPayoutReason] = useState<string>('');
  const [cashierNotes, setCashierNotes] = useState<string>('');
  const [cashUpHistory, setCashUpHistory] = useState<CashUpRecord[]>([
    {
      id: 'Z-REP-2026-0804',
      reconciliationDate: '2026-08-04T19:00:00.000Z',
      cashierName: 'David Kintu',
      tenantId: 'CLIENT-001',
      openingFloatUgx: 100000,
      totalCashSalesUgx: 1850000,
      totalMomoSalesUgx: 2420000,
      totalCardSalesUgx: 850000,
      totalInsuranceSalesUgx: 1200000,
      totalGrossRevenueUgx: 6320000,
      expectedDrawerCashUgx: 1950000,
      actualCountedCashUgx: 1950000,
      cashVarianceUgx: 0,
      payoutsUgx: 0,
      status: 'Balanced',
      notes: 'Evening shift register closed without variance.',
      supervisorSignature: 'Pharm. Moses Musoke',
    },
  ]);

  // Aggregate collections across payment channels
  const channelBreakdown = useMemo(() => {
    let cash = 0;
    let momo = 0;
    let card = 0;
    let insurance = 0;
    let whatsapp = 0;

    transactions.forEach((tx) => {
      const amount = tx.totalPaid;
      switch (tx.paymentMethod) {
        case 'Cash':
          cash += amount;
          break;
        case 'Mobile Money':
        case 'MTN Mobile Money / Airtel Money':
        case 'M-Pesa / Mobile':
          momo += amount;
          break;
        case 'Card':
          card += amount;
          break;
        case 'Insurance Scheme':
          insurance += amount;
          break;
        case 'WhatsApp Invoice':
          whatsapp += amount;
          break;
        default:
          cash += amount;
          break;
      }
    });

    const gross = cash + momo + card + insurance + whatsapp;

    return {
      cash,
      momo,
      card,
      insurance,
      whatsapp,
      gross,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  // Expected Cash in Register = Opening Float + Cash Sales - Payouts
  const expectedDrawerCash = useMemo(() => {
    return openingFloat + channelBreakdown.cash - cashPayouts;
  }, [openingFloat, channelBreakdown.cash, cashPayouts]);

  // Variance = Actual Counted Cash - Expected Cash
  const cashVariance = useMemo(() => {
    return actualCountedCash - expectedDrawerCash;
  }, [actualCountedCash, expectedDrawerCash]);

  // Finalize and save daily End-of-Day Cash-Up reconciliation (Z-Report)
  const finalizeCashUp = useCallback(
    async (cashierName: string, supervisorName?: string) => {
      const isBalanced = Math.abs(cashVariance) < 100; // within 100 UGX tolerance

      const newRecord: CashUpRecord = {
        id: `Z-REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
        reconciliationDate: new Date().toISOString(),
        cashierName,
        tenantId,
        openingFloatUgx: openingFloat,
        totalCashSalesUgx: channelBreakdown.cash,
        totalMomoSalesUgx: channelBreakdown.momo,
        totalCardSalesUgx: channelBreakdown.card,
        totalInsuranceSalesUgx: channelBreakdown.insurance,
        totalGrossRevenueUgx: channelBreakdown.gross,
        expectedDrawerCashUgx: expectedDrawerCash,
        actualCountedCashUgx: actualCountedCash,
        cashVarianceUgx: cashVariance,
        payoutsUgx: cashPayouts,
        payoutReason,
        status: isBalanced ? 'Balanced' : 'Discrepancy',
        notes: cashierNotes,
        supervisorSignature: supervisorName || 'Pharm. Moses Musoke',
      };

      setCashUpHistory((prev) => [newRecord, ...prev]);

      // Write immutable audit log
      await logAuditEvent({
        tenantId,
        performedBy: cashierName,
        performedByName: cashierName,
        userRole: 'POS Cashier / Dispenser',
        action: 'SALE_COMPLETE' as any,
        entityType: 'CashUpZReport',
        entityId: newRecord.id,
        severity: isBalanced ? 'INFO' : 'WARNING',
        notes: `End-of-Day Register Z-Report submitted. Gross Revenue: UGX ${channelBreakdown.gross.toLocaleString()}, Cash Counted: UGX ${actualCountedCash.toLocaleString()}, Variance: UGX ${cashVariance.toLocaleString()}.`,
      });

      return newRecord;
    },
    [
      cashVariance,
      openingFloat,
      channelBreakdown,
      expectedDrawerCash,
      actualCountedCash,
      cashPayouts,
      payoutReason,
      cashierNotes,
      tenantId,
    ]
  );

  return {
    openingFloat,
    setOpeningFloat,
    actualCountedCash,
    setActualCountedCash,
    cashPayouts,
    setCashPayouts,
    payoutReason,
    setPayoutReason,
    cashierNotes,
    setCashierNotes,
    channelBreakdown,
    expectedDrawerCash,
    cashVariance,
    cashUpHistory,
    finalizeCashUp,
  };
}
