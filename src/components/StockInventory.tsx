import React, { useState } from 'react';
import { DrugItem } from '../types';
import {
  Package,
  Plus,
  Search,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Edit2,
  DollarSign,
  TrendingDown,
  Layers,
  X
} from 'lucide-react';

interface StockInventoryProps {
  drugs: DrugItem[];
  onAddDrug: (drug: DrugItem) => void;
  onUpdateDrug: (drug: DrugItem) => void;
  openBarcodeScanner: () => void;
}

export const StockInventory: React.FC<StockInventoryProps> = ({
  drugs,
  onAddDrug,
  onUpdateDrug,
  openBarcodeScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<DrugItem | null>(null);

  const categories = [
    'All',
    'Antibiotics',
    'Analgesics',
    'Cardiovascular',
    'Diabetes',
    'Respiratory',
    'OTC & Supplements',
    'Gastrointestinal',
  ];

  const filteredDrugs = drugs.filter((d) => {
    const matchesSearch =
      d.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalStockValue = drugs.reduce((acc, curr) => acc + curr.costPrice * curr.stockQty, 0);
  const totalSellingValue = drugs.reduce((acc, curr) => acc + curr.sellingPrice * curr.stockQty, 0);
  const lowStockCount = drugs.filter((d) => d.stockQty <= d.reorderLevel).length;

  const [formData, setFormData] = useState<Partial<DrugItem>>({
    brandName: '',
    genericName: '',
    barcode: `${Math.floor(Math.random() * 9000000000000 + 1000000000000)}`,
    batchNumber: 'BATCH-2026-01',
    category: 'Antibiotics',
    shelfLocation: 'Rack A-01',
    costPrice: 500,
    sellingPrice: 800,
    stockQty: 50,
    reorderLevel: 15,
    expiryDate: '2027-12-31',
    manufacturer: 'Corelytix Pharma',
    prescriptionRequired: false,
    unit: 'pack (30 tablets)',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.genericName) return;

    if (editingDrug) {
      const updated: DrugItem = {
        ...editingDrug,
        ...formData as DrugItem,
      };
      onUpdateDrug(updated);
      setEditingDrug(null);
    } else {
      const newDrug: DrugItem = {
        id: `DRUG-${Math.floor(Math.random() * 900 + 100)}`,
        ...formData as DrugItem,
      };
      onAddDrug(newDrug);
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Stats Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-sky-400" />
              Stock & Inventory Control
            </h2>
            <p className="text-xs text-sky-200 mt-1">
              Real-time multi-shelf medication catalog, batch tracking, and inventory valuation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openBarcodeScanner}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-700/50 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>

            <button
              onClick={() => {
                setEditingDrug(null);
                setFormData({
                  brandName: '',
                  genericName: '',
                  barcode: `${Math.floor(Math.random() * 9000000000000 + 1000000000000)}`,
                  batchNumber: 'BATCH-2026-01',
                  category: 'Antibiotics',
                  shelfLocation: 'Rack A-01',
                  costPrice: 500,
                  sellingPrice: 800,
                  stockQty: 50,
                  reorderLevel: 15,
                  expiryDate: '2027-12-31',
                  manufacturer: 'Corelytix Pharma',
                  prescriptionRequired: false,
                  unit: 'pack (30 tablets)',
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication Stock</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#122D50] p-3 rounded-xl border border-sky-800/40">
            <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Total Catalog Items</p>
            <p className="text-xl font-black text-white mt-0.5">{drugs.length} SKUs</p>
          </div>

          <div className="bg-[#122D50] p-3 rounded-xl border border-sky-800/40">
            <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Stock Valuation (Cost)</p>
            <p className="text-xl font-black text-white mt-0.5">
              UGX {totalStockValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#122D50] p-3 rounded-xl border border-sky-800/40">
            <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Estimated Retail Value</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              UGX {totalSellingValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#122D50] p-3 rounded-xl border border-sky-800/40">
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Low Stock Warning
            </p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{lowStockCount} Items</p>
          </div>
        </div>
      </div>

      {/* Filter and Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search drug name, generic, barcode, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Data Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Brand & Generic Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Batch & Expiry</th>
                <th className="p-3">Shelf</th>
                <th className="p-3 text-right">Cost</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-center">In Stock</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDrugs.map((drug) => {
                const isLowStock = drug.stockQty <= drug.reorderLevel;
                return (
                  <tr key={drug.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-extrabold text-slate-900">{drug.brandName}</p>
                          <p className="text-[11px] text-slate-500 italic">{drug.genericName}</p>
                        </div>
                        {drug.prescriptionRequired && (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-300">
                            Rx Only
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {drug.category}
                      </span>
                    </td>

                    <td className="p-3 text-slate-600">
                      <div>Batch: <span className="font-mono text-slate-800">{drug.batchNumber}</span></div>
                      <div className="text-[11px] text-slate-400">Exp: {drug.expiryDate}</div>
                    </td>

                    <td className="p-3">
                      <span className="bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded text-[11px] font-mono">
                        {drug.shelfLocation}
                      </span>
                    </td>

                    <td className="p-3 text-right text-slate-600 font-mono">
                      UGX {drug.costPrice.toLocaleString()}
                    </td>

                    <td className="p-3 text-right font-black text-slate-900 font-mono">
                      UGX {drug.sellingPrice.toLocaleString()}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                          isLowStock
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isLowStock && <AlertCircle className="w-3 h-3" />}
                        {drug.stockQty} {drug.unit.split(' ')[0]}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setEditingDrug(drug);
                          setFormData(drug);
                          setShowAddModal(true);
                        }}
                        className="p-1.5 rounded bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                        title="Edit stock details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Drug Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900">
              {editingDrug ? 'Edit Drug Item' : 'Add New Drug Medication'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Generic Chemical Name</label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Shelf Location</label>
                  <input
                    type="text"
                    value={formData.shelfLocation}
                    onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Cost Price (UGX)</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Selling Price (UGX)</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="rxCheck"
                    checked={formData.prescriptionRequired}
                    onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <label htmlFor="rxCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Prescription Required (Rx Only)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer mt-2"
              >
                {editingDrug ? 'Update Inventory Item' : 'Save New Drug Stock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
