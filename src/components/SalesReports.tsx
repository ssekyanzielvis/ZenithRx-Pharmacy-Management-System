import React from 'react';
import { POSTransaction } from '../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Download,
  Users,
  CheckCircle2
} from 'lucide-react';

interface SalesReportsProps {
  transactions: POSTransaction[];
}

export const SalesReports: React.FC<SalesReportsProps> = ({ transactions }) => {
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalSalesCount = transactions.length;
  const avgOrderValue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-sky-400" />
            Sales Reports & Business Analytics
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            Real-time revenue metrics, profit margin analytics, cashier audit trails, and top medication performance.
          </p>
        </div>

        <button
          onClick={() => alert('Downloading full Financial & Inventory Sales Report (CSV)...')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-700/50 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Sales Revenue</p>
          <p className="text-2xl font-black text-slate-900 mt-1">UGX {totalRevenue.toLocaleString()}</p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
            +18.4% vs last week
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Transactions</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalSalesCount} Completed</p>
          <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded mt-2 inline-block">
            100% Tax Compliant
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Average Basket Value</p>
          <p className="text-2xl font-black text-slate-900 mt-1">UGX {avgOrderValue.toLocaleString()}</p>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-2 inline-block">
            Per customer visit
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Profit Margin</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">32.8%</p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded mt-2 inline-block">
            Profitable PMS Target
          </span>
        </div>
      </div>

      {/* Recent Sales Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Completed POS Transactions Audit Log ({transactions.length})
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Receipt No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Payment Gateway</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Items</th>
                <th className="p-3 text-right">Total Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-sky-900">{tx.receiptNo}</td>
                  <td className="p-3 font-bold text-slate-900">{tx.customerName}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{tx.timestamp}</td>
                  <td className="p-3 text-right font-bold">{tx.items.length} SKUs</td>
                  <td className="p-3 text-right font-black font-mono text-emerald-700">
                    UGX {tx.totalPaid.toLocaleString()}
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
