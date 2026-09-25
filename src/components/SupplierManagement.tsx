import React, { useState } from 'react';
import {
  getSuppliers,
  getSupplierCatalogue,
  getSupplierRfqs,
  createSupplierRfq,
} from '../services/supplierMarketplaceService';
import {
  Building2,
  PackageCheck,
  Search,
  Plus,
  Star,
  ShieldCheck,
  Truck,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { formatUGX } from '../services/formatters';

interface SupplierManagementProps {
  tenantId?: string;
  pharmacyName?: string;
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'Kampala City Pharmacy',
}) => {
  const [suppliers] = useState(getSuppliers());
  const [catalogue] = useState(getSupplierCatalogue());
  const [rfqs, setRfqs] = useState(getSupplierRfqs(tenantId));
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'catalogue' | 'rfqs'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);

  // RFQ Form State
  const [rfqDrugGeneric, setRfqDrugGeneric] = useState('');
  const [rfqBrand, setRfqBrand] = useState('');
  const [rfqQty, setRfqQty] = useState(50);
  const [rfqUnit, setRfqUnit] = useState('packs');
  const [rfqTargetPrice, setRfqTargetPrice] = useState(20000);

  const handleCreateRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqDrugGeneric) return;

    const newRfq = createSupplierRfq({
      tenantId,
      pharmacyName,
      status: 'Sent to Suppliers',
      items: [
        {
          drugGeneric: rfqDrugGeneric,
          preferredBrand: rfqBrand || undefined,
          quantity: rfqQty,
          unit: rfqUnit,
          targetPriceUgx: rfqTargetPrice,
        },
      ],
      supplierBids: [
        {
          supplierId: 'sup-001',
          supplierName: 'Abacus Pharma (A) Limited',
          quotedTotalUgx: rfqQty * (rfqTargetPrice * 0.95),
          leadTimeDays: 1,
          bidTimestamp: new Date().toISOString(),
        },
      ],
    });

    setRfqs([newRfq, ...rfqs]);
    setIsRfqModalOpen(false);
    setRfqDrugGeneric('');
    setRfqBrand('');
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ndaWholesaleLicenseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoriesSupplied.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCatalogue = catalogue.filter(
    (c) =>
      c.drugBrandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified NDA Wholesalers
            </span>
            <span className="text-xs font-semibold text-slate-500">Centralized Procurement Marketplace</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Supplier Marketplace &amp; Procurement
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Compare wholesale medicine prices, verified NDA Good Distribution Practice (GDP) licences, and issue Requests for Quotations (RFQs).
          </p>
        </div>

        <button
          onClick={() => setIsRfqModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>New Supplier RFQ</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === 'directory'
              ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Wholesale Distributors ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('catalogue')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === 'catalogue'
              ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Live Price Catalogue ({catalogue.length} Items)
        </button>
        <button
          onClick={() => setActiveSubTab('rfqs')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === 'rfqs'
              ? 'border-cyan-600 text-cyan-700 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Procurement RFQs ({rfqs.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'directory'
                ? 'Search distributor by name, licence or category...'
                : 'Search brand name, generic or supplier...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Tab 1: Directory */}
      {activeSubTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{supplier.companyName}</h3>
                    <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold mt-0.5">
                      Lic: {supplier.ndaWholesaleLicenseNo}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{supplier.ratingScore}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">PSU Pharmacist:</span> {supplier.psuSupervisingPharmacist}</p>
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">Address:</span> {supplier.physicalAddress}</p>
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">Contact:</span> {supplier.contactPerson} ({supplier.phone})</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {supplier.categoriesSupplied.map((cat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1 text-slate-500">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Lead Time: {supplier.leadTimeDays}d</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Terms: {supplier.paymentTerms}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Catalogue */}
      {activeSubTab === 'catalogue' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Medication &amp; Pack</th>
                  <th className="px-4 py-3.5">Distributor</th>
                  <th className="px-4 py-3.5">Wholesale Unit Price</th>
                  <th className="px-4 py-3.5">MOQ</th>
                  <th className="px-4 py-3.5">Est. Expiry</th>
                  <th className="px-4 py-3.5">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCatalogue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.drugBrandName}</div>
                      <div className="text-[11px] text-slate-500 italic">{item.genericName} • {item.strength}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{item.packSize}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.supplierName}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatUGX(item.unitPriceUgx)}
                    </td>
                    <td className="px-4 py-3 font-semibold">{item.moq} packs</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{item.expiryDateEstimate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        In Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: RFQs */}
      {activeSubTab === 'rfqs' && (
        <div className="space-y-4">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{rfq.rfqNumber}</span>
                    <span className="text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-full">
                      {rfq.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Created on {new Date(rfq.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {rfq.items.length} Items Requested
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {rfq.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {it.drugGeneric} {it.preferredBrand && `(${it.preferredBrand})`} — {it.quantity} {it.unit}
                    </span>
                    <span className="text-slate-500">Target: {formatUGX(it.targetPriceUgx || 0)}/unit</span>
                  </div>
                ))}
              </div>

              {rfq.supplierBids && rfq.supplierBids.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Received Quotes</p>
                  <div className="space-y-2">
                    {rfq.supplierBids.map((bid, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{bid.supplierName}</span>
                          <div className="text-[10px] text-slate-500">Delivery in {bid.leadTimeDays} business day</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatUGX(bid.quotedTotalUgx)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RFQ Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">New Supplier RFQ</h3>
              <button onClick={() => setIsRfqModalOpen(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Generic Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Co-Amoxiclav 625mg"
                  value={rfqDrugGeneric}
                  onChange={(e) => setRfqDrugGeneric(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Preferred Brand (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Augmentin"
                  value={rfqBrand}
                  onChange={(e) => setRfqBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={rfqQty}
                    onChange={(e) => setRfqQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Target Price (UGX/Unit)</label>
                  <input
                    type="number"
                    value={rfqTargetPrice}
                    onChange={(e) => setRfqTargetPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Broadcast RFQ to Suppliers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
