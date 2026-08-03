import React, { useState } from 'react';
import { DrugItem, PurchaseOrder } from '../types';
import {
  RefreshCw,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  DollarSign
} from 'lucide-react';

interface AutomatedReorderingProps {
  drugs: DrugItem[];
  purchaseOrders: PurchaseOrder[];
  onCreatePO: (po: PurchaseOrder) => void;
}

export const AutomatedReordering: React.FC<AutomatedReorderingProps> = ({
  drugs,
  purchaseOrders,
  onCreatePO,
}) => {
  const lowStockDrugs = drugs.filter((d) => d.stockQty <= d.reorderLevel);
  const [selectedSupplier, setSelectedSupplier] = useState('GlaxoSmithKline Uganda Ltd');
  const [poSentSuccess, setPoSentSuccess] = useState(false);

  const suppliers = [
    { name: 'GlaxoSmithKline Uganda Ltd', email: 'orders@gsk.co.ug' },
    { name: 'Pfizer Pharmaceuticals Uganda', email: 'orders.ug@pfizer.com' },
    { name: 'Novartis Pharma East Africa', email: 'supply@novartis.co.ug' },
    { name: 'Abacus Pharma Uganda', email: 'sales@abacuspharma.com' },
    { name: 'Quantum Pharma Distributors', email: 'supplies@quantumnetworks.com' },
  ];

  const handleGenerateAutoPO = () => {
    if (lowStockDrugs.length === 0) return;

    const chosenSupplier = suppliers.find((s) => s.name === selectedSupplier) || suppliers[0];

    const poItems = lowStockDrugs.map((d) => ({
      drugId: d.id,
      brandName: d.brandName,
      currentStock: d.stockQty,
      orderQty: Math.max(d.reorderLevel * 2, 20),
      unitCost: d.costPrice,
    }));

    const totalAmt = poItems.reduce((acc, curr) => acc + curr.orderQty * curr.unitCost, 0);

    const newPO: PurchaseOrder = {
      id: `PO-${Math.floor(Math.random() * 900 + 100)}`,
      poNumber: `PO-2026-${Math.floor(Math.random() * 90000 + 10000)}`,
      supplierName: chosenSupplier.name,
      supplierEmail: chosenSupplier.email,
      dateCreated: '2026-07-22',
      items: poItems,
      status: 'Sent to Supplier',
      totalAmount: totalAmt,
    };

    onCreatePO(newPO);
    setPoSentSuccess(true);
    setTimeout(() => setPoSentSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-sky-400" />
            Automated Re-ordering Engine
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            Min stock threshold monitoring, automated Purchase Order (PO) synthesis, and distributor fulfillment tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-3 py-2 bg-[#122D50] border border-sky-700/60 text-sky-100 rounded-xl text-xs font-bold outline-none"
          >
            {suppliers.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={handleGenerateAutoPO}
            disabled={lowStockDrugs.length === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Generate & Dispatch PO</span>
          </button>
        </div>
      </div>

      {poSentSuccess && (
        <div className="bg-emerald-500 text-slate-950 p-4 rounded-xl font-black text-xs flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Automated Purchase Order successfully dispatched to {selectedSupplier}!
          </span>
          <span className="bg-slate-900 text-white px-3 py-1 rounded text-[10px]">DISPATCHED</span>
        </div>
      )}

      {/* Grid: Low Stock Queue & Recent POs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Low Stock Identified Items Column */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Stock Below Reorder Level ({lowStockDrugs.length})
            </h3>
            <span className="text-xs font-bold text-slate-500">Auto-Detected</span>
          </div>

          <div className="space-y-2.5 max-h-[450px] overflow-y-auto">
            {lowStockDrugs.length > 0 ? (
              lowStockDrugs.map((d) => (
                <div key={d.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">{d.brandName}</p>
                    <p className="text-[11px] text-slate-500">{d.genericName}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Supplier: {d.manufacturer}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full block">
                      In Stock: {d.stockQty} / Min: {d.reorderLevel}
                    </span>
                    <p className="text-[11px] text-slate-600 font-mono mt-1">
                      Order Qty: {d.reorderLevel * 2} {d.unit.split(' ')[0]}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400 font-medium">
                All inventory levels are healthy! No automated re-ordering needed.
              </div>
            )}
          </div>
        </div>

        {/* Purchase Orders Sent Log Column */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              Purchase Order Log ({purchaseOrders.length})
            </h3>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-sky-900 bg-sky-100 px-2 py-0.5 rounded">
                    {po.poNumber}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    {po.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{po.supplierName}</p>
                    <p className="text-[10px] text-slate-500">{po.supplierEmail} • {po.dateCreated}</p>
                  </div>
                  <p className="font-black text-slate-900 font-mono">
                    UGX {po.totalAmount.toLocaleString()}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 font-mono">
                  Items Ordered: {po.items.map((i) => `${i.brandName} (${i.orderQty})`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
