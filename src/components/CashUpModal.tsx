import React, { useState } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  CreditCard, 
  Smartphone, 
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { POSTransaction } from '../types';
import { useFinancialLedger, CashUpRecord } from '../hooks/useFinancialLedger';
import { formatUGX } from '../services/formatters';

interface CashUpModalProps {
  transactions: POSTransaction[];
  tenantName?: string;
  cashierName?: string;
  onClose: () => void;
}

export const CashUpModal: React.FC<CashUpModalProps> = ({
  transactions,
  tenantName = 'Mulago Care Pharmacy',
  cashierName = 'David Kintu',
  onClose,
}) => {
  const {
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
    finalizeCashUp,
  } = useFinancialLedger(transactions);

  const [savedRecord, setSavedRecord] = useState<CashUpRecord | null>(null);

  const handleSaveAndPrint = async () => {
    const record = await finalizeCashUp(cashierName);
    setSavedRecord(record);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E36]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E3ECE8] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E3ECE8] bg-[#F8FBFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[#20A66A]">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#263B33] flex items-center gap-2">
                End-of-Day Cash-Up Reconciliation (Z-Report)
              </h3>
              <p className="text-xs text-[#5E7A70]">
                Shift closure, payment channel breakdown & cash drawer verification for {tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#5E7A70] hover:text-[#263B33] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:p-0 print:max-h-none">
          
          {/* Printable Z-Report Sheet (visible on print or review) */}
          <div className="bg-[#F8FBFA] p-5 rounded-2xl border border-[#E3ECE8] space-y-4">
            <div className="flex justify-between items-start border-b border-[#E3ECE8] pb-3">
              <div>
                <span className="text-xs text-[#5E7A70] font-mono block">ZENITHRX REGISTER SETTLEMENT</span>
                <span className="text-base font-bold text-[#263B33]">{tenantName}</span>
                <span className="text-xs text-[#5E7A70] block mt-0.5">
                  Cashier: <strong className="text-[#263B33]">{cashierName}</strong> | Shift Date: {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#5E7A70]">Gross Collections</span>
                <div className="text-xl font-bold text-emerald-700 font-mono">
                  {formatUGX(channelBreakdown.gross)}
                </div>
                <span className="text-[11px] text-[#5E7A70]">{channelBreakdown.transactionCount} transactions</span>
              </div>
            </div>

            {/* Payment Channels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-[#E3ECE8] shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-[#5E7A70] mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Cash Sales
                </div>
                <div className="text-sm font-bold text-[#263B33] font-mono">{formatUGX(channelBreakdown.cash)}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E3ECE8] shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-[#5E7A70] mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" /> MoMo / Airtel
                </div>
                <div className="text-sm font-bold text-[#263B33] font-mono">{formatUGX(channelBreakdown.momo)}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E3ECE8] shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-[#5E7A70] mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Card / POS
                </div>
                <div className="text-sm font-bold text-[#263B33] font-mono">{formatUGX(channelBreakdown.card)}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E3ECE8] shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-[#5E7A70] mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" /> Insurance
                </div>
                <div className="text-sm font-bold text-[#263B33] font-mono">{formatUGX(channelBreakdown.insurance)}</div>
              </div>
            </div>
          </div>

          {/* Drawer Reconciliation Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E3ECE8] shadow-xs">
              <label className="text-xs font-semibold text-[#263B33] block mb-1.5">
                Opening Cash Float (UGX)
              </label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                className="w-full bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg px-3 py-2 text-sm text-[#263B33] font-mono focus:outline-none focus:ring-2 focus:ring-[#20A66A]"
              />
              <span className="text-[11px] text-[#5E7A70] mt-1 block">Standard shift starter cash</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E3ECE8] shadow-xs">
              <label className="text-xs font-semibold text-[#263B33] block mb-1.5">
                Actual Physical Cash Count (UGX)
              </label>
              <input
                type="number"
                placeholder="Enter counted cash in till..."
                value={actualCountedCash || ''}
                onChange={(e) => setActualCountedCash(Number(e.target.value) || 0)}
                className="w-full bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg px-3 py-2 text-sm text-emerald-700 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#20A66A]"
              />
              <span className="text-[11px] text-[#5E7A70] mt-1 block">Physical notes & coins in drawer</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E3ECE8] shadow-xs">
              <label className="text-xs font-semibold text-[#263B33] block mb-1.5">
                Authorized Payouts (UGX)
              </label>
              <input
                type="number"
                value={cashPayouts || ''}
                onChange={(e) => setCashPayouts(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg px-3 py-2 text-sm text-rose-700 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[11px] text-[#5E7A70] mt-1 block">Petty cash / courier payouts</span>
            </div>
          </div>

          {/* Variance Status Indicator */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            Math.abs(cashVariance) < 100
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : cashVariance < 0
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-3">
              {Math.abs(cashVariance) < 100 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {Math.abs(cashVariance) < 100
                    ? 'Drawer Perfectly Balanced'
                    : cashVariance < 0
                    ? 'Cash Shortage Detected'
                    : 'Cash Overage Detected'}
                </span>
                <span className="text-xs text-[#5E7A70]">
                  Expected: <strong className="text-[#263B33]">{formatUGX(expectedDrawerCash)}</strong> | Variance:{' '}
                  <strong className={cashVariance < 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {cashVariance > 0 ? `+${formatUGX(cashVariance)}` : formatUGX(cashVariance)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#5E7A70] block">Status</span>
              <span className="text-sm font-bold font-mono">
                {Math.abs(cashVariance) < 100 ? 'BALANCED' : 'VARIANCE FLAGGED'}
              </span>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-xs font-semibold text-[#263B33] block mb-1.5">
              Shift Closure Remarks / Handover Notes
            </label>
            <textarea
              rows={2}
              value={cashierNotes}
              onChange={(e) => setCashierNotes(e.target.value)}
              placeholder="e.g. Registered change handoff to night shift dispenser..."
              className="w-full bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl p-3 text-sm text-[#263B33] focus:outline-none focus:ring-2 focus:ring-[#20A66A]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3ECE8] bg-[#F8FBFA] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-[#5E7A70] text-sm font-semibold rounded-xl transition border border-[#E3ECE8]"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSaveAndPrint}
            className="px-5 py-2.5 bg-[#20A66A] hover:bg-[#1B8E5A] text-white text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Finalize & Print Z-Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashUpModal;
