import React, { useState } from 'react';
import { DrugItem, ExpiryReportItem } from '../types';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  CheckCircle2,
  Tag,
  Download,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface ExpiryAlertsProps {
  drugs: DrugItem[];
  onApplyClearanceDiscount: (drugId: string) => void;
  onQuarantineStock: (drugId: string) => void;
}

export const ExpiryAlerts: React.FC<ExpiryAlertsProps> = ({
  drugs,
  onApplyClearanceDiscount,
  onQuarantineStock,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Expired' | 'Critical' | 'Warning'>('All');
  const [manifestGenerated, setManifestGenerated] = useState(false);

  // Today is simulated as 2026-07-22
  const today = new Date('2026-07-22');

  const expiryItems: ExpiryReportItem[] = drugs.map((d) => {
    const expDate = new Date(d.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let riskStatus: 'Expired' | 'Critical (<30 days)' | 'Warning (<90 days)' = 'Warning (<90 days)';
    if (daysRemaining <= 0) {
      riskStatus = 'Expired';
    } else if (daysRemaining <= 30) {
      riskStatus = 'Critical (<30 days)';
    }

    return { drug: d, daysRemaining, riskStatus };
  }).filter(item => item.daysRemaining <= 90);

  const expiredList = expiryItems.filter((i) => i.riskStatus === 'Expired');
  const criticalList = expiryItems.filter((i) => i.riskStatus === 'Critical (<30 days)');
  const warningList = expiryItems.filter((i) => i.riskStatus === 'Warning (<90 days)');

  const filteredItems = expiryItems.filter((i) => {
    if (activeFilter === 'Expired') return i.riskStatus === 'Expired';
    if (activeFilter === 'Critical') return i.riskStatus === 'Critical (<30 days)';
    if (activeFilter === 'Warning') return i.riskStatus === 'Warning (<90 days)';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-400 animate-pulse" />
            Expiry Alerts & Quarantine Engine
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            Prevent pharmaceutical waste with automated early batch warnings, clearance pricing, and supplier returns.
          </p>
        </div>

        <button
          onClick={() => {
            setManifestGenerated(true);
            setTimeout(() => setManifestGenerated(false), 3000);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-700/50 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Return Manifest</span>
        </button>
      </div>

      {manifestGenerated && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Supplier Return Manifest (PDF / CSV) exported for expired/expiring batches!
          </span>
          <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded">Corelytix PMS</span>
        </div>
      )}

      {/* Expiry Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveFilter('Expired')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'Expired'
              ? 'bg-rose-950 text-white border-rose-500 shadow-lg'
              : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-rose-600 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-600" /> Expired Stock
            </span>
            <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
              QUARANTINE
            </span>
          </div>
          <p className="text-3xl font-black mt-3">{expiredList.length} Items</p>
          <p className="text-xs text-slate-500 mt-1">Immediate withdrawal from sellable inventory</p>
        </div>

        <div
          onClick={() => setActiveFilter('Critical')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'Critical'
              ? 'bg-amber-950 text-white border-amber-500 shadow-lg'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical (&lt;30 Days)
            </span>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              CLEARANCE
            </span>
          </div>
          <p className="text-3xl font-black mt-3">{criticalList.length} Items</p>
          <p className="text-xs text-slate-500 mt-1">Recommended 30% discount mark down</p>
        </div>

        <div
          onClick={() => setActiveFilter('Warning')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'Warning'
              ? 'bg-sky-950 text-white border-sky-500 shadow-lg'
              : 'bg-white text-slate-900 border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-sky-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" /> Warning (&lt;90 Days)
            </span>
            <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
              MONITOR
            </span>
          </div>
          <p className="text-3xl font-black mt-3">{warningList.length} Items</p>
          <p className="text-xs text-slate-500 mt-1">Monitor turnover or return to distributor</p>
        </div>
      </div>

      {/* Detailed Expiry Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Batch Expiry Management Table ({filteredItems.length})
          </h3>
          <div className="flex items-center gap-1">
            {(['All', 'Expired', 'Critical', 'Warning'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Medication Name</th>
                <th className="p-3">Batch No</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 text-center">Days Remaining</th>
                <th className="p-3 text-center">In Stock</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.map(({ drug, daysRemaining, riskStatus }) => (
                <tr key={drug.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{drug.brandName}</p>
                    <p className="text-[11px] text-slate-500 italic">{drug.genericName}</p>
                  </td>

                  <td className="p-3 font-mono text-slate-800">{drug.batchNumber}</td>

                  <td className="p-3 font-bold text-slate-900">{drug.expiryDate}</td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        daysRemaining <= 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : daysRemaining <= 30
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {daysRemaining <= 0 ? 'EXPIRED' : `${daysRemaining} Days`}
                    </span>
                  </td>

                  <td className="p-3 text-center font-bold text-slate-900">
                    {drug.stockQty} {drug.unit.split(' ')[0]}
                  </td>

                  <td className="p-3 text-right font-black font-mono text-slate-900">
                    UGX {drug.sellingPrice.toLocaleString()}
                  </td>

                  <td className="p-3 text-center space-x-2">
                    {daysRemaining <= 0 ? (
                      <button
                        onClick={() => onQuarantineStock(drug.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                      >
                        Quarantine Stock
                      </button>
                    ) : (
                      <button
                        onClick={() => onApplyClearanceDiscount(drug.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-sm inline-flex"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Clearance -30%
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
