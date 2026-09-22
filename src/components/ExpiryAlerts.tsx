/**
 * ExpiryAlerts.tsx — ZenithRx Expiry Risk & Automated Clearance Markdown Engine
 * Clean Architecture: Presentation Layer
 * Integrates FEFO batch expiry monitoring, automated clearance pricing,
 * stock quarantine isolation, and official NDA destruction certificate generation.
 */

import React from 'react';
import { DrugItem } from '../types';
import { useExpiryAlerts } from '../hooks/useExpiryAlerts';
import { formatUGX } from '../services/formatters';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  CheckCircle2,
  Tag,
  Download,
  Clock,
  Printer,
  Search,
  Lock,
  Percent,
  TrendingDown,
  Layers,
  Sparkles,
  Ban,
  FileCheck,
  X,
  Building2,
  FileText
} from 'lucide-react';

interface ExpiryAlertsProps {
  drugs: DrugItem[];
  onApplyClearanceDiscount: (drugId: string, markdownPercent?: number) => void;
  onQuarantineStock: (drugId: string) => void;
  pharmacyName?: string;
  ndaLicenseNo?: string;
  supervisingPharmacist?: string;
}

export const ExpiryAlerts: React.FC<ExpiryAlertsProps> = ({
  drugs,
  onApplyClearanceDiscount,
  onQuarantineStock,
  pharmacyName = 'ZenithRx Pharmacy',
  ndaLicenseNo = 'NDA/LIC/PHA/2026/0182',
  supervisingPharmacist = 'Pharm. Moses Musoke (PSU/REG/2021/1042)',
}) => {
  const {
    activeFilter,
    setActiveFilter,
    searchTerm,
    setSearchTerm,
    atRiskExpiryItems,
    filteredExpiryItems,
    metrics,
    quarantinedDrugIds,
    discountedDrugIds,
    showCertificateModal,
    setShowCertificateModal,
    notification,
    getRecommendedDiscount,
    handleApplyMarkdown,
    handleBulkMarkdownCritical,
    handleQuarantine,
    handlePrintDestructionCertificate,
  } = useExpiryAlerts({
    drugs,
    onApplyClearanceDiscount,
    onQuarantineStock,
    pharmacyName,
    ndaLicenseNo,
    supervisingPharmacist,
  });

  return (
    <div className="space-y-6">
      {/* ─── Top Banner & Clearance Engine Header ───────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 text-slate-900 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-600" /> Automated FEFO Markdown Engine
            </span>
            <span className="bg-rose-50 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> NDA Quarantine &amp; Disposal Protocol
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Expiry Alerts &amp; Markdown Engine</h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Prevent pharmaceutical capital write-offs through automated dynamic clearance discounting and strict NDA stock quarantine.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button
            onClick={handleBulkMarkdownCritical}
            disabled={metrics.criticalCount === 0}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
              metrics.criticalCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Apply 30% Clearance ({metrics.criticalCount} Critical)</span>
          </button>

          <button
            onClick={handlePrintDestructionCertificate}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>NDA Disposal Certificate</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in ${
            notification.type === 'warning'
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'warning' ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
          <span className="bg-slate-950/40 text-white px-2 py-0.5 rounded text-[10px]">
            PROTOCOL EXECUTED
          </span>
        </div>
      )}

      {/* ─── Financial Loss & Recovery KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Capital At Risk
            </span>
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              {formatUGX(metrics.totalAtRiskCost)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Inventory cost valuation (≤90 days)</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expired (Quarantined)
            </span>
            <div className="text-xl font-bold text-red-700 dark:text-red-400 mt-1">
              {metrics.expiredCount} Batches
            </div>
            <p className="text-xs text-red-600 font-semibold mt-0.5">
              Loss: {formatUGX(metrics.expiredCostValue)}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <Ban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Critical (≤30 Days)
            </span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.criticalCount} Batches
            </div>
            <p className="text-xs text-amber-600 font-semibold mt-0.5">
              Value: {formatUGX(metrics.criticalCostValue)}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recoverable Clearance Retail
            </span>
            <div className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {formatUGX(metrics.recoverableRetail)}
            </div>
            <p className="text-xs text-green-600 font-semibold mt-0.5">Estimated markdown return</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Search & Tab Filter Controls ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by brand name, generic, batch#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {[
            { id: 'All', label: 'All At-Risk', count: atRiskExpiryItems.length, color: 'text-blue-500' },
            { id: 'Expired', label: 'Expired', count: metrics.expiredCount, color: 'text-red-500' },
            { id: 'Critical', label: 'Critical (<30d)', count: metrics.criticalCount, color: 'text-red-500' },
            { id: 'Warning', label: 'Warning (<90d)', count: metrics.warningCount, color: 'text-amber-500' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Batch Expiry & Markdown Engine Cards ───────────────────────────── */}
      <div className="space-y-3">
        {filteredExpiryItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              No Batches In This Risk Bracket
            </h4>
            <p className="mt-1">All pharmacy inventory items in this filter are safely within valid expiry windows.</p>
          </div>
        ) : (
          filteredExpiryItems.map((item) => {
            const isQuarantined = quarantinedDrugIds.has(item.drug.id) || item.riskStatus === 'Expired';
            const isDiscounted = discountedDrugIds.has(item.drug.id);
            const recDiscount = getRecommendedDiscount(item.daysRemaining);
            const discountedSellingPrice = Math.round(
              item.drug.sellingPrice * (1 - recDiscount.percent / 100)
            );
            const totalStockLoss = item.drug.costPrice * item.drug.stockQty;

            return (
              <div
                key={item.drug.id}
                className={`p-5 rounded-2xl border transition-all text-xs ${
                  isQuarantined
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 shadow-sm'
                    : item.riskStatus === 'Critical (<30 days)'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Column: Drug & Batch Details */}
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.drug.brandName}
                      </span>
                      <span className="text-slate-500 font-normal">
                        ({item.drug.genericName})
                      </span>

                      {/* Status Badges */}
                      {isQuarantined ? (
                        <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 shadow-sm">
                          <Lock className="w-3 h-3" /> QUARANTINED (LOCKED)
                        </span>
                      ) : item.riskStatus === 'Critical (<30 days)' ? (
                        <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> CRITICAL EXPIRY
                        </span>
                      ) : (
                        <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          WARNING WINDOW
                        </span>
                      )}

                      {isDiscounted && (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-emerald-300">
                          <Percent className="w-3 h-3" /> MARKDOWN ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] pt-1">
                      <span>Batch: <b className="font-mono text-slate-700 dark:text-slate-300">{item.drug.batchNumber}</b></span>
                      <span>Mfg: <b>{item.drug.manufacturer}</b></span>
                      <span>Location: <b>{item.drug.shelfLocation}</b></span>
                      <span>Category: <b>{item.drug.category}</b></span>
                      <span>Current Stock: <b className="text-slate-900 dark:text-slate-100">{item.drug.stockQty} {item.drug.unit}</b></span>
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <span className="font-semibold text-rose-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Expiry Date: <b>{item.drug.expiryDate}</b>
                        {item.daysRemaining <= 0 ? (
                          <span className="font-bold ml-1">(EXPIRED {Math.abs(item.daysRemaining)} DAYS AGO)</span>
                        ) : (
                          <span className="font-bold ml-1">({item.daysRemaining} days remaining)</span>
                        )}
                      </span>
                      <span>•</span>
                      <span>Capital Cost: <b>{formatUGX(totalStockLoss)}</b></span>
                    </div>
                  </div>

                  {/* Right Column: Dynamic FEFO Markdown & Quarantine Action Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                    {/* Markdown Price Comparison Widget */}
                    {!isQuarantined && recDiscount.percent > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-right space-y-0.5">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Clearance Target
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="line-through text-slate-400 text-xs">
                            {formatUGX(item.drug.sellingPrice)}
                          </span>
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {formatUGX(discountedSellingPrice)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded">
                          {recDiscount.label}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {!isQuarantined && recDiscount.percent > 0 && (
                        <button
                          onClick={() => handleApplyMarkdown(item.drug.id, recDiscount.percent)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Apply -{recDiscount.percent}% Markdown</span>
                        </button>
                      )}

                      {!isQuarantined && item.riskStatus !== 'Warning (<90 days)' && (
                        <button
                          onClick={() => handleQuarantine(item.drug.id)}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Quarantine</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
