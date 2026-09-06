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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                End-of-Day Cash-Up Reconciliation (Z-Report)
              </h3>
              <p className="text-xs text-slate-400">
                Shift closure, payment channel breakdown & cash drawer verification for {tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:p-0 print:max-h-none">
          
          {/* Printable Z-Report Sheet (visible on print or review) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-slate-500 font-mono block">ZENITHRX REGISTER SETTLEMENT</span>
                <span className="text-base font-bold text-white">{tenantName}</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Cashier: <strong className="text-slate-200">{cashierName}</strong> | Shift Date: {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Gross Collections</span>
                <div className="text-xl font-extrabold text-emerald-400 font-mono">
                  {formatUGX(channelBreakdown.gross)}
                </div>
                <span className="text-[11px] text-slate-500">{channelBreakdown.transactionCount} transactions</span>
              </div>
            </div>

            {/* Payment Channels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Cash Sales
                </div>
                <div className="text-sm font-bold text-white font-mono">{formatUGX(channelBreakdown.cash)}</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" /> MoMo / Airtel
                </div>
                <div className="text-sm font-bold text-white font-mono">{formatUGX(channelBreakdown.momo)}</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" /> Card / POS
                </div>
                <div className="text-sm font-bold text-white font-mono">{formatUGX(channelBreakdown.card)}</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" /> Insurance
                </div>
                <div className="text-sm font-bold text-white font-mono">{formatUGX(channelBreakdown.insurance)}</div>
              </div>
            </div>
          </div>

          {/* Drawer Reconciliation Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Opening Cash Float (UGX)
              </label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Standard shift starter cash</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Actual Physical Cash Count (UGX)
              </label>
              <input
                type="number"
                placeholder="Enter counted cash in till..."
                value={actualCountedCash || ''}
                onChange={(e) => setActualCountedCash(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Physical notes & coins in drawer</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Authorized Payouts (UGX)
              </label>
              <input
                type="number"
                value={cashPayouts || ''}
                onChange={(e) => setCashPayouts(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-rose-300 font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Petty cash / courier payouts</span>
            </div>
          </div>

          {/* Variance Status Indicator */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            Math.abs(cashVariance) < 100
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : cashVariance < 0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <div className="flex items-center gap-3">
              {Math.abs(cashVariance) < 100 ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {Math.abs(cashVariance) < 100
                    ? 'Drawer Perfectly Balanced'
                    : cashVariance < 0
                    ? 'Cash Shortage Detected'
                    : 'Cash Overage Detected'}
                </span>
                <span className="text-xs text-slate-400">
                  Expected: <strong className="text-slate-200">{formatUGX(expectedDrawerCash)}</strong> | Variance:{' '}
                  <strong className={cashVariance < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {cashVariance > 0 ? `+${formatUGX(cashVariance)}` : formatUGX(cashVariance)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Status</span>
              <span className="text-sm font-bold font-mono">
                {Math.abs(cashVariance) < 100 ? 'BALANCED' : 'VARIANCE FLAGGED'}
              </span>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Shift Closure Remarks / Handover Notes
            </label>
            <textarea
              rows={2}
              value={cashierNotes}
              onChange={(e) => setCashierNotes(e.target.value)}
              placeholder="e.g. Registered change handoff to night shift dispenser..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSaveAndPrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
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
