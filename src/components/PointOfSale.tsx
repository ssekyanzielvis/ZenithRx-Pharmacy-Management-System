import React, { useState } from 'react';
import { DrugItem, POSTransaction } from '../types';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  DollarSign,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Printer,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';

interface CartItem {
  drug: DrugItem;
  quantity: number;
}

interface PointOfSaleProps {
  drugs: DrugItem[];
  onCompleteSale: (transaction: POSTransaction) => void;
  openBarcodeScanner: () => void;
}

export const PointOfSale: React.FC<PointOfSaleProps> = ({
  drugs,
  onCompleteSale,
  openBarcodeScanner,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa / Mobile' | 'Card' | 'Insurance Scheme' | 'WhatsApp Invoice'>('M-Pesa / Mobile');
  const [mpesaRef, setMpesaRef] = useState('QGH' + Math.floor(Math.random() * 900000 + 100000));
  const [insuranceCopayRatio, setInsuranceCopayRatio] = useState<number>(0.20); // 20% patient co-pay
  const [completedReceipt, setCompletedReceipt] = useState<POSTransaction | null>(null);

  const filteredDrugs = drugs.filter(
    (d) =>
      d.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.barcode.includes(searchTerm)
  );

  const addToCart = (drug: DrugItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.drug.id === drug.id);
      if (existing) {
        return prev.map((item) =>
          item.drug.id === drug.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { drug, quantity: 1 }];
    });
  };

  const updateQuantity = (drugId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.drug.id === drugId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (drugId: string) => {
    setCart((prev) => prev.filter((item) => item.drug.id !== drugId));
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.drug.sellingPrice * curr.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.16); // 16% VAT
  const totalAmount = subtotal + taxAmount;

  // Insurance co-pay calculation
  const isInsurance = paymentMethod === 'Insurance Scheme';
  const patientCopayAmount = isInsurance ? Math.round(totalAmount * insuranceCopayRatio) : totalAmount;
  const insuranceCoveredAmount = isInsurance ? totalAmount - patientCopayAmount : 0;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const transaction: POSTransaction = {
      id: `POS-${Math.floor(Math.random() * 9000 + 1000)}`,
      receiptNo: `REC-2026-0722-${Math.floor(Math.random() * 90 + 10)}`,
      customerName,
      customerPhone,
      items: cart.map((c) => ({
        drugId: c.drug.id,
        brandName: c.drug.brandName,
        unitPrice: c.drug.sellingPrice,
        quantity: c.quantity,
        total: c.drug.sellingPrice * c.quantity,
        isPrescription: c.drug.prescriptionRequired,
      })),
      subtotal,
      taxAmount,
      discountAmount: 0,
      insuranceCopayAmount: patientCopayAmount,
      insuranceCoveredAmount,
      totalPaid: patientCopayAmount,
      paymentMethod,
      mpesaRef: paymentMethod === 'M-Pesa / Mobile' ? mpesaRef : undefined,
      cashierName: 'Jane Pharmacist',
      timestamp: '2026-07-22 11:30 AM',
    };

    onCompleteSale(transaction);
    setCompletedReceipt(transaction);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-sky-400" />
            Price & Billing Management (POS)
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            High-speed barcode checkout, tax calculation, insurance co-pay splits, and instant receipting.
          </p>
        </div>

        <button
          onClick={openBarcodeScanner}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Item Barcode</span>
        </button>
      </div>

      {/* POS Grid: Left Drug Catalog Search, Right Checkout Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Drug Lookup Catalog */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Type drug name, barcode, or category to add to billing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                onClick={() => addToCart(drug)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/50 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-900 group-hover:text-sky-900">
                      {drug.brandName}
                    </p>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                      {drug.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">{drug.genericName}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-mono font-black text-slate-900">
                    UGX {drug.sellingPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Plus className="w-3 h-3" /> Add
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Cart & Billing Terminal */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-sky-600" />
                POS Basket ({cart.length} SKUs)
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Customer Details Input */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Phone Number</label>
                <input
                  type="text"
                  placeholder="+256 7..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length > 0 ? (
                cart.map(({ drug, quantity }) => (
                  <div key={drug.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{drug.brandName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        UGX {drug.sellingPrice} × {quantity} = UGX {(drug.sellingPrice * quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(drug.id, -1)}
                        className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black text-xs">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(drug.id, 1)}
                        className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(drug.id)}
                        className="p-1 ml-1 rounded text-rose-600 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Cart is empty. Click drugs from the left catalog or scan barcode.
                </div>
              )}
            </div>

            {/* Payment Gateway Options */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select Payment Gateway</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'M-Pesa / Mobile', icon: <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> },
                  { id: 'Cash', icon: <DollarSign className="w-3.5 h-3.5 text-sky-600" /> },
                  { id: 'Card', icon: <CreditCard className="w-3.5 h-3.5 text-blue-600" /> },
                  { id: 'Insurance Scheme', icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-2 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'bg-sky-900 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pm.icon}
                    <span className="truncate">{pm.id}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'M-Pesa / Mobile' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <label className="text-[10px] font-bold text-emerald-900 uppercase block">M-Pesa Transaction Ref</label>
                  <input
                    type="text"
                    value={mpesaRef}
                    onChange={(e) => setMpesaRef(e.target.value)}
                    className="w-full p-1.5 bg-white border border-emerald-300 rounded font-mono font-bold text-xs text-emerald-900 outline-none"
                  />
                </div>
              )}

              {paymentMethod === 'Insurance Scheme' && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-indigo-900">
                    <span>Patient Co-pay Ratio</span>
                    <span>{(insuranceCopayRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={insuranceCopayRatio}
                    onChange={(e) => setInsuranceCopayRatio(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}
            </div>

            {/* Total Billing Calculation */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>UGX {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>VAT / Tax (18%):</span>
                <span>UGX {taxAmount.toLocaleString()}</span>
              </div>
              {isInsurance && (
                <div className="flex justify-between text-indigo-300">
                  <span>Insurance Covered:</span>
                  <span>UGX {insuranceCoveredAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Payable:</span>
                <span className="text-emerald-400">UGX {patientCopayAmount.toLocaleString()}</span>
              </div>
            </div>

          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span>Complete Checkout & Print Receipt</span>
          </button>
        </div>

      </div>

      {/* Itemized Printable Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 relative font-mono text-xs text-slate-900">
            <button
              onClick={() => setCompletedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header matching Quantum branding */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
              <h3 className="font-black text-sm tracking-wider uppercase">ZENITHRX PHARMACY SYSTEM</h3>
              <p className="text-[10px] text-slate-500">Official Payment Tax Receipt</p>
              <p className="text-[10px] font-bold text-sky-800">{completedReceipt.receiptNo}</p>
              <p className="text-[10px] text-slate-400">{completedReceipt.timestamp}</p>
            </div>

            <div className="text-[11px] space-y-0.5">
              <p><span className="font-bold">Customer:</span> {completedReceipt.customerName}</p>
              <p><span className="font-bold">Cashier:</span> {completedReceipt.cashierName}</p>
              <p><span className="font-bold">Payment Gateway:</span> {completedReceipt.paymentMethod}</p>
              {completedReceipt.mpesaRef && (
                <p><span className="font-bold">Mobile Ref:</span> {completedReceipt.mpesaRef}</p>
              )}
            </div>

            {/* Receipt Items */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5">
              {completedReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div>
                    <p className="font-bold">{item.brandName}</p>
                    <p className="text-[10px] text-slate-500">{item.quantity} × UGX {item.unitPrice}</p>
                  </div>
                  <p className="font-bold">UGX {item.total.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>UGX {completedReceipt.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax VAT (18%):</span>
                <span>UGX {completedReceipt.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200">
                <span>TOTAL PAID:</span>
                <span>UGX {completedReceipt.totalPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1">
              <p className="text-[10px] font-bold text-slate-600">Thank you for choosing ZenithRx!</p>
              <p className="text-[9px] text-slate-400">www.quantumnetworks.com • WhatsApp +256-755091826</p>
            </div>

            <button
              onClick={() => {
                window.print();
                setCompletedReceipt(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
