/**
 * FefoBatchSelector.tsx — ZenithRx Active FEFO Batch Selection & Pharmacist Assistant
 * Replaces static expiry reporting with active clinical decision assistance:
 * - Highlights Recommended Batch A (e.g. Expires Jan 2027) vs Batch B (Expires Jun 2027)
 * - Auto-allocates multi-batch quantities
 * - Warns on out-of-sequence FEFO overrides with mandatory rationale
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  fefoDispensingService,
  ActiveDrugBatch,
  formatExpiryMonthYear,
  getDaysUntilExpiry,
} from '../services/fefoDispensingService';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Package,
  ShieldAlert,
  Clock,
  Info,
  ChevronDown,
} from 'lucide-react';

interface FefoBatchSelectorProps {
  drugId: string;
  drugName?: string;
  requestedQuantity?: number;
  treatmentDurationDays?: number;
  selectedBatchNumber: string;
  onSelectBatch: (batch: ActiveDrugBatch, overrideReason?: string) => void;
  className?: string;
}

export const FefoBatchSelector: React.FC<FefoBatchSelectorProps> = ({
  drugId,
  drugName = 'Medicine',
  requestedQuantity = 1,
  treatmentDurationDays = 0,
  selectedBatchNumber,
  onSelectBatch,
  className = '',
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [pendingOverrideBatch, setPendingOverrideBatch] = useState<ActiveDrugBatch | null>(null);
  const [overrideReason, setOverrideReason] = useState('Customer explicitly requested longer shelf-life');
  const [customOverrideNotes, setCustomOverrideNotes] = useState('');

  // Compute recommendation
  const fefoData = useMemo(() => {
    return fefoDispensingService.getFefoRecommendation(
      drugId,
      requestedQuantity,
      treatmentDurationDays,
      drugName
    );
  }, [drugId, requestedQuantity, treatmentDurationDays, drugName]);

  const recommendedBatch = fefoData.recommendedBatch;

  // Auto-select recommended batch if nothing selected or current selection is invalid
  useEffect(() => {
    if (recommendedBatch && (!selectedBatchNumber || selectedBatchNumber === 'auto')) {
      onSelectBatch(recommendedBatch);
    }
  }, [recommendedBatch, selectedBatchNumber, onSelectBatch]);

  const handleBatchClick = (batch: ActiveDrugBatch) => {
    if (batch.status !== 'available' || batch.quantityAvailable === 0) return;

    // Check if this selection is out-of-sequence
    const violationCheck = fefoDispensingService.checkFefoSequenceViolation(
      drugId,
      batch.batchNumber,
      requestedQuantity
    );

    if (violationCheck.isViolation) {
      setPendingOverrideBatch(batch);
      setShowOverrideModal(true);
    } else {
      onSelectBatch(batch);
    }
  };

  const handleConfirmOverride = () => {
    if (pendingOverrideBatch) {
      const fullReason = `${overrideReason}${customOverrideNotes ? `: ${customOverrideNotes}` : ''}`;
      onSelectBatch(pendingOverrideBatch, fullReason);
    }
    setShowOverrideModal(false);
    setPendingOverrideBatch(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* ─── Top FEFO Active Recommendation Assistant Banner ─────────────────── */}
      {recommendedBatch && (
        <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-sky-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-600 text-white rounded-lg shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                FEFO Dispensing Assistant
              </span>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
              Priority 1 • Stock Protection
            </span>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold leading-relaxed">
              {fefoData.guidanceMessage}
            </p>
          </div>

          {/* Treatment Duration Warning if applicable */}
          {!fefoData.isTreatmentDurationCompatible && fefoData.treatmentDurationWarning && (
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><b>Regimen Check:</b> {fefoData.treatmentDurationWarning}</span>
            </div>
          )}

          {/* Multi-batch Split Summary if quantity spans multiple batches */}
          {fefoData.isMultiBatchSplit && (
            <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px] space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Automatic Multi-Batch FEFO Allocation:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                {fefoData.allocatedBatches.map((item, idx) => (
                  <div
                    key={item.batch.id || idx}
                    className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px]"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {item.batch.batchNumber}
                      </span>
                      <span className="text-slate-400 ml-1">({item.expiryFormatted})</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Dispense {item.allocatedQuantity} units
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Available Batches Visual List / Selector ────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Available In-Stock Batches ({fefoData.allBatches.length})</span>
          <span className="text-[10px] text-slate-400 font-normal">Earliest Expiry First</span>
        </label>

        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
          {fefoData.allBatches.map((batch, idx) => {
            const isSelected = selectedBatchNumber === batch.batchNumber || selectedBatchNumber === batch.id;
            const isRecommended = recommendedBatch?.batchNumber === batch.batchNumber;
            const daysLeft = getDaysUntilExpiry(batch.expiryDate);
            const isExpiringSoon = daysLeft < 90 && daysLeft > 0;
            const isExpired = daysLeft <= 0;
            const expiryMonth = formatExpiryMonthYear(batch.expiryDate);

            return (
              <div
                key={batch.id || idx}
                onClick={() => handleBatchClick(batch)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                    : isRecommended
                    ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800 hover:border-teal-400'
                    : isExpired
                    ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                      {batch.batchNumber}
                    </span>

                    {isRecommended && (
                      <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.2 rounded-full flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" /> Recommended (FEFO)
                      </span>
                    )}

                    {idx > 0 && !isExpired && (
                      <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded">
                        Priority {idx + 1}
                      </span>
                    )}

                    {isExpired && (
                      <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded">
                        EXPIRED (Locked)
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Expires: <b>{expiryMonth}</b> ({daysLeft} days)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-400" />
                      Stock: <b>{batch.quantityAvailable} units</b>
                    </span>
                    <span>•</span>
                    <span>{batch.shelfLocation}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isSelected ? (
                    <span className="p-1 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isExpired || batch.quantityAvailable === 0}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Out-of-Sequence FEFO Override Confirmation Modal ────────────────── */}
      {showOverrideModal && pendingOverrideBatch && recommendedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-950 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  FEFO Out-of-Sequence Override Alert
                </h3>
                <p className="text-[11px] text-slate-500">
                  Compliance Check: Good Pharmacy Practice Stock Rotation
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-semibold">
                <b>Batch {recommendedBatch.batchNumber}</b> expires earlier (<b>{formatExpiryMonthYear(recommendedBatch.expiryDate)}</b>) and has <b>{recommendedBatch.quantityAvailable} units</b> remaining in stock.
              </p>
              <p className="text-[11px]">
                Dispensing selected <b>Batch {pendingOverrideBatch.batchNumber}</b> (Expires <b>{formatExpiryMonthYear(pendingOverrideBatch.expiryDate)}</b>) out of sequence risks premature expiry write-off of Batch {recommendedBatch.batchNumber}.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Select Clinical / Operational Justification *
              </label>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="Customer explicitly requested longer shelf-life">
                  Customer explicitly requested longer shelf-life for travel / chronic reserve
                </option>
                <option value="Batch A package physically damaged on shelf (quarantined for inspection)">
                  Batch A outer carton damaged on shelf (quarantined for QC inspection)
                </option>
                <option value="Prescribed long-duration therapy exceeds Batch A shelf life">
                  Prescribed long-duration therapy exceeds Batch A remaining shelf-life
                </option>
                <option value="Prescriber specified batch number on script">
                  Prescriber specifically indicated batch lot on prescription
                </option>
                <option value="Other clinical supervisor override">
                  Other authorized pharmacist supervisor override
                </option>
              </select>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">
                  Additional Notes (Optional):
                </label>
                <input
                  type="text"
                  placeholder="Enter specific dispensing override notes..."
                  value={customOverrideNotes}
                  onChange={(e) => setCustomOverrideNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setPendingOverrideBatch(null);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                Cancel (Keep Recommended Batch)
              </button>

              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-4 py-2 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all"
              >
                Confirm Override &amp; Dispense
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
