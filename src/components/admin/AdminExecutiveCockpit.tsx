import React from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Activity,
  AlertTriangle,
  Users,
  ShieldCheck,
  Building,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { formatUGX } from '../../services/formatters';

export const AdminExecutiveCockpit: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Enterprise Executive Intelligence
            </span>
            <span className="text-xs font-semibold text-slate-500">Real-Time Multi-Tenant Telemetry</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Executive Cockpit &amp; Financial Analytics
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Macro SaaS subscription revenue projections, aggregated pharmaceutical turnover, doctor prescribing patterns, and inventory write-off risks.
          </p>
        </div>
      </div>

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Platform ARR</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {formatUGX(148800000)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            +18.4% vs last quarter
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Pharmacy Tenants</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-700 dark:text-indigo-300">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            42 Pharmacies
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            100% NDA Licensed &amp; Verified
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Profit Margin</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-700 dark:text-purple-300">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            34.6%
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Across 14,200 transactions
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Expiry Risk</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {formatUGX(4850000)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Expiring within 90 days
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Prescribing Doctors Analytics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Top Prescribing Doctors (Prescription Traffic)
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Current Month</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Dr. Ronald Mukasa (Mulago NRH)', rxCount: 84, valUgx: 12400000, compliance: '100% UMDPC Verified' },
              { name: 'Dr. Sarah Nabwire (Norvik Hospital)', rxCount: 62, valUgx: 8900000, compliance: '100% UMDPC Verified' },
              { name: 'Dr. David Mukasa (Case Medical Centre)', rxCount: 48, valUgx: 6750000, compliance: '100% UMDPC Verified' },
              { name: 'Dr. John Kyeyune (Nakasero Hospital)', rxCount: 35, valUgx: 4800000, compliance: '100% UMDPC Verified' },
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{doc.name}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{doc.compliance}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">{doc.rxCount} Prescriptions</div>
                  <div className="text-[11px] text-slate-500">{formatUGX(doc.valUgx)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Volume Drug Categories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              High-Velocity Therapeutic Categories
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Volume Share</span>
          </div>

          <div className="space-y-3">
            {[
              { category: 'Antibiotics & Antimicrobials', percent: 38, volume: 'UGX 54,200,000', color: 'bg-indigo-500' },
              { category: 'Cardiovascular & Hypertension', percent: 26, volume: 'UGX 37,800,000', color: 'bg-emerald-500' },
              { category: 'Diabetes Care & Insulins', percent: 18, volume: 'UGX 25,600,000', color: 'bg-sky-500' },
              { category: 'Analgesics & Anti-Inflammatories', percent: 12, volume: 'UGX 17,200,000', color: 'bg-amber-500' },
              { category: 'Respiratory & Inhalers', percent: 6, volume: 'UGX 8,900,000', color: 'bg-purple-500' },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{cat.category}</span>
                  <span className="text-slate-500">{cat.volume} ({cat.percent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
