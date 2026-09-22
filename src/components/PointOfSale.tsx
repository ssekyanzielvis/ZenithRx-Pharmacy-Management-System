import React, { useState } from 'react';
import { DrugItem, POSTransaction, Prescription } from '../types';
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
  FileText,
  Receipt
} from 'lucide-react';
import { CashUpModal } from './CashUpModal';
import { PaymentOrchestratorModal } from './PaymentOrchestratorModal';
import { PaymentIntent } from '../services/paymentOrchestrationService';

interface CartItem {
  drug: DrugItem;
  quantity: number;
}

interface PointOfSaleProps {
  drugs: DrugItem[];
  prescriptions?: Prescription[];
  transactions?: POSTransaction[];
  onCompleteSale: (transaction: POSTransaction) => void;
  openBarcodeScanner: () => void;
}

export const PointOfSale: React.FC<PointOfSaleProps> = ({
  drugs,
  prescriptions = [],
  transactions = [],
  onCompleteSale,
  openBarcodeScanner,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRxModal, setShowRxModal] = useState(false);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa / Mobile' | 'Card' | 'Insurance Scheme' | 'WhatsApp Invoice'>('M-Pesa / Mobile');
  const [mpesaRef, setMpesaRef] = useState('QGH' + Math.floor(Math.random() * 900000 + 100000));
  const [insuranceCopayRatio, setInsuranceCopayRatio] = useState<number>(0.20); // 20% patient co-pay
  const [completedReceipt, setCompletedReceipt] = useState<POSTransaction | null>(null);
  const [isCashUpOpen, setIsCashUpOpen] = useState(false);
  const [isOrchestratorOpen, setIsOrchestratorOpen] = useState(false);

  const handleOrchestratedSuccess = (paymentIntent: PaymentIntent) => {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);

    const transaction: POSTransaction = {
      id: `POS-${Date.now()}`,
      receiptNo: paymentIntent.receiptNumber || `REC-${year}-${rand}`,
      customerName: paymentIntent.patientName || customerName,
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
      discountAmount: paymentIntent.discountAmountUgx,
      insuranceCopayAmount: paymentIntent.splits.find(s => s.method === 'INSURANCE_COPAY')?.amountUgx || 0,
      insuranceCoveredAmount: 0,
      totalPaid: paymentIntent.totalCapturedUgx,
      paymentMethod: paymentIntent.splits.length > 1 ? 'M-Pesa / Mobile' : (paymentIntent.splits[0]?.method as any || 'Cash'),
      mpesaRef: paymentIntent.splits.find(s => s.method === 'MTN_MOMO' || s.method === 'AIRTEL_MONEY')?.providerReference,
      cashierName: paymentIntent.initiatedBy || 'David Kintu',
      timestamp: new Date().toLocaleString('en-UG', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    };

    onCompleteSale(transaction);
    setCompletedReceipt(transaction);
    setCart([]);
    setIsOrchestratorOpen(false);
  };

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
  const taxAmount = Math.round(subtotal * 0.18); // 18% VAT — spec §6.2
  const totalAmount = subtotal + taxAmount;

  // Insurance co-pay calculation
  const isInsurance = paymentMethod === 'Insurance Scheme';
  const patientCopayAmount = isInsurance ? Math.round(totalAmount * insuranceCopayRatio) : totalAmount;
  const insuranceCoveredAmount = isInsurance ? totalAmount - patientCopayAmount : 0;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);

    const transaction: POSTransaction = {
      id: `POS-${Date.now()}`,
      receiptNo: `REC-${year}-${rand}`,
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
      timestamp: new Date().toLocaleString('en-UG', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    };

    onCompleteSale(transaction);
    setCompletedReceipt(transaction);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            Price &amp; Billing Management (POS)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            High-speed barcode checkout, tax calculation, insurance co-pay splits, and instant receipting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCashUpOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-all border border-slate-200"
          >
            <Receipt className="w-4 h-4 text-emerald-700" />
            <span>End-of-Day Cash-Up (Z-Report)</span>
          </button>

          <button
            onClick={openBarcodeScanner}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Item Barcode</span>
          </button>
        </div>
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
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                onClick={() => addToCart(drug)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                      {drug.brandName}
                    </p>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                      {drug.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">{drug.genericName}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    UGX {drug.sellingPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Plus className="w-3 h-3" /> Add
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Load Pending Prescription — spec §6.2 */}
          <button
            onClick={() => setShowRxModal(true)}
            disabled={prescriptions.filter(rx => rx.status === 'Pending').length === 0}
            className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>⚡ Load Pending Prescription ({prescriptions.filter(rx => rx.status === 'Pending').length})</span>
          </button>
        </div>

        {/* Right Column: Active Cart & Billing Terminal */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
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
                      <span className="w-6 text-center font-bold text-xs">{quantity}</span>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Payment Gateway</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'M-Pesa / Mobile', icon: <Smartphone className="w-3.5 h-3.5 text-green-600" /> },
                  { id: 'Cash', icon: <DollarSign className="w-3.5 h-3.5 text-blue-600" /> },
                  { id: 'Card', icon: <CreditCard className="w-3.5 h-3.5 text-blue-600" /> },
                  { id: 'Insurance Scheme', icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-2 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pm.icon}
                    <span className="truncate">{pm.id}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'M-Pesa / Mobile' && (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl space-y-1">
                  <label className="text-[10px] font-bold text-green-900 uppercase block">Mobile Money Reference</label>
                  <input
                    type="text"
                    value={mpesaRef}
                    onChange={(e) => setMpesaRef(e.target.value)}
                    className="w-full p-1.5 bg-white border border-green-300 rounded font-mono font-bold text-xs text-green-900 outline-none"
                  />
                </div>
              )}

              {paymentMethod === 'Insurance Scheme' && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-blue-900">
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
                    className="w-full accent-blue-600"
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
                <div className="flex justify-between text-blue-300">
                  <span>Insurance Covered:</span>
                  <span>UGX {insuranceCoveredAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Payable:</span>
                <span className="text-green-400">UGX {patientCopayAmount.toLocaleString()}</span>
              </div>
            </div>

          </div>

          <div className="space-y-2">
            <button
              onClick={() => setIsOrchestratorOpen(true)}
              disabled={cart.length === 0}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-40"
            >
              <CreditCard className="w-4 h-4" />
              <span>Multi-Channel Split Payment</span>
            </button>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-all disabled:opacity-40"
            >
              <Printer className="w-4 h-4 text-green-400" />
              <span>Quick Direct Checkout &amp; Receipt</span>
            </button>
          </div>
        </div>

      </div>

      {/* Itemized Printable Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div id="thermal-receipt" className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 relative font-mono text-xs text-slate-900">
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

      {/* ─── Load Pending Prescription Modal ────────────────────────────────── */}
      {showRxModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
                <FileText className="w-5 h-5 text-indigo-500" />
                Load Pending Prescription to Cart
              </h3>
              <button onClick={() => setShowRxModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {prescriptions.filter(rx => rx.status === 'Pending').length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">No pending prescriptions found.</p>
              ) : (
                prescriptions.filter(rx => rx.status === 'Pending').map(rx => (
                  <button
                    key={rx.id}
                    onClick={() => {
                      setCart([]);
                      const newCart: CartItem[] = rx.medications.map(med => ({
                        drug: drugs.find(d => d.id === med.drugId) || {
                          id: med.drugId, brandName: med.drugName, genericName: med.drugName,
                          barcode: '', batchNumber: '', category: 'Prescription', shelfLocation: '',
                          costPrice: med.unitPrice * 0.6, sellingPrice: med.unitPrice,
                          stockQty: 999, reorderLevel: 5, expiryDate: '2027-12-31',
                          manufacturer: '', prescriptionRequired: true, unit: 'pcs',
                        },
                        quantity: med.quantity,
                      }));
                      setCart(newCart);
                      setCustomerName(rx.patientName);
                      setCustomerPhone(rx.patientPhone || '');
                      setShowRxModal(false);
                    }}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{rx.rxNumber}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">Patient: <b>{rx.patientName}</b> • Dr. {rx.doctorName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rx.medications.length} medication(s) — {rx.date}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* End-of-Day Cash-Up Modal */}
      {isCashUpOpen && (
        <CashUpModal
          transactions={transactions}
          onClose={() => setIsCashUpOpen(false)}
        />
      )}

      {/* Payment Orchestrator & Split Modal (§11.18) */}
      {isOrchestratorOpen && (
        <PaymentOrchestratorModal
          totalAmountUgx={totalAmount}
          taxAmountUgx={taxAmount}
          customerName={customerName}
          customerPhone={customerPhone || '+256 772 000000'}
          onSuccess={handleOrchestratedSuccess}
          onClose={() => setIsOrchestratorOpen(false)}
        />
      )}
    </div>
  );
};
