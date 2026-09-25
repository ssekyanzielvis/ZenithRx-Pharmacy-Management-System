import React, { useState, useMemo } from 'react';
import { DrugItem, POSTransaction, Prescription } from '../types';
import {
  POSCartItem,
  POSSalesTransaction,
  POSSaleType,
  POSCustomerType,
  POSPaymentMethod,
  POSDailyZReport,
} from '../types/v2Types';
import {
  getAvailableBatchesForDrug,
  getAllPOSTransactions,
  processPOSSalesTransaction,
  voidPOSSalesTransaction,
  refundPOSSalesTransaction,
  generatePOSDailyZReport,
  formatThermalReceipt,
} from '../services/posDispensingService';
import { fefoDispensingService, formatExpiryMonthYear } from '../services/fefoDispensingService';
import { formatUGX } from '../services/formatters';
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
  Receipt,
  User,
  History,
  RotateCcw,
  Ban,
  Tag,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  FileCheck,
  Percent,
  Calculator,
  Calendar,
  Building2,
  Check,
  ChevronRight,
  Pill,
} from 'lucide-react';
import { CashUpModal } from './CashUpModal';
import { PaymentOrchestratorModal } from './PaymentOrchestratorModal';
import { PaymentIntent } from '../services/paymentOrchestrationService';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { createDigitalReceiptFromPOS } from '../services/electronicReceiptService';

interface PointOfSaleProps {
  drugs: DrugItem[];
  prescriptions?: Prescription[];
  transactions?: POSTransaction[];
  onCompleteSale?: (transaction: POSTransaction) => void;
  openBarcodeScanner: () => void;
  currentCashierName?: string;
}

export const PointOfSale: React.FC<PointOfSaleProps> = ({
  drugs,
  prescriptions = [],
  transactions = [],
  onCompleteSale,
  openBarcodeScanner,
  currentCashierName = 'Pharm. Elvis Ssekyanzi',
}) => {
  // Main view state
  const [activeView, setActiveView] = useState<'pos_terminal' | 'transaction_history' | 'z_report'>('pos_terminal');

  // POS Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saleType, setSaleType] = useState<POSSaleType>('otc_sale');
  const [customerType, setCustomerType] = useState<POSCustomerType>('walk_in');

  // Customer / Prescription Data
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [patientId, setPatientId] = useState<string | undefined>();
  const [prescriptionId, setPrescriptionId] = useState<string | undefined>();
  const [prescriptionRefNo, setPrescriptionRefNo] = useState<string | undefined>();
  const [prescriberName, setPrescriberName] = useState<string | undefined>();
  const [prescriberLicenceNo, setPrescriberLicenceNo] = useState<string | undefined>();
  const [dispensingNotes, setDispensingNotes] = useState('');

  // Discounts & Tax
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [momoProvider, setMomoProvider] = useState<'MTN MoMo' | 'Airtel Money'>('MTN MoMo');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoRef, setMomoRef] = useState(`MM-TX-${Math.floor(100000 + Math.random() * 900000)}`);
  const [cardAuthCode, setCardAuthCode] = useState(`AUTH-${Math.floor(100000 + Math.random() * 900000)}`);
  const [creditDueDate, setCreditDueDate] = useState('2026-04-24');
  const [insuranceCoveredRatio, setInsuranceCoveredRatio] = useState<number>(0.8); // 80% insurance covered

  // Modals
  const [showRxModal, setShowRxModal] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<POSSalesTransaction | null>(null);
  const activeDigitalReceipt = useMemo(() => {
    return completedReceipt ? createDigitalReceiptFromPOS(completedReceipt) : null;
  }, [completedReceipt]);
  const [isCashUpOpen, setIsCashUpOpen] = useState(false);
  const [isOrchestratorOpen, setIsOrchestratorOpen] = useState(false);

  // Void & Refund Modal States
  const [voidTargetTx, setVoidTargetTx] = useState<POSSalesTransaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidSupervisorCode, setVoidSupervisorCode] = useState('');

  const [refundTargetTx, setRefundTargetTx] = useState<POSSalesTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundDisposition, setRefundDisposition] = useState<'return_to_saleable_stock' | 'quarantine' | 'destruction'>('return_to_saleable_stock');

  // Transactions list
  const [posTransactions, setPosTransactions] = useState<POSSalesTransaction[]>(() => getAllPOSTransactions());
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txFilterStatus, setTxFilterStatus] = useState<string>('all');

  // Calculations
  const grossSubtotal = cart.reduce((acc, curr) => acc + curr.unitSellingPriceUgx * curr.quantity, 0);
  const lineDiscountsTotal = cart.reduce((acc, curr) => acc + curr.discountAmountUgx, 0);
  const orderDiscountAmount = Math.round((grossSubtotal - lineDiscountsTotal) * (orderDiscountPercent / 100));
  const totalDiscounts = lineDiscountsTotal + orderDiscountAmount;

  const totalVat = cart.reduce((acc, curr) => acc + curr.taxAmountUgx, 0);
  const netTotal = Math.max(0, grossSubtotal - totalDiscounts + totalVat);

  const isInsurance = paymentMethod === 'Insurance Scheme';
  const insuranceCoveredAmount = isInsurance ? Math.round(netTotal * insuranceCoveredRatio) : 0;
  const patientPayableAmount = isInsurance ? netTotal - insuranceCoveredAmount : netTotal;
  const cashChange = paymentMethod === 'Cash' && cashTendered > 0 ? Math.max(0, cashTendered - patientPayableAmount) : 0;

  // Filtered drugs
  const filteredDrugs = useMemo(() => {
    return drugs.filter(
      (d) =>
        d.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.barcode.includes(searchTerm) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [drugs, searchTerm]);

  // Filtered transactions history
  const filteredTransactions = useMemo(() => {
    return posTransactions.filter((tx) => {
      const matchesSearch =
        tx.receiptNo.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.customerName.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        (tx.customerPhone && tx.customerPhone.includes(txSearchQuery)) ||
        (tx.prescriptionRefNo && tx.prescriptionRefNo.toLowerCase().includes(txSearchQuery.toLowerCase()));
      const matchesStatus = txFilterStatus === 'all' || tx.status === txFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [posTransactions, txSearchQuery, txFilterStatus]);

  // Cart Management
  const addToCart = (drug: DrugItem) => {
    const batches = getAvailableBatchesForDrug(drug.id);
    const defaultBatch = batches[0] || {
      batchNumber: drug.batchNumber || 'BAT-DEFAULT',
      expiryDate: drug.expiryDate || '2027-12-31',
      shelfLocation: drug.shelfLocation || 'Shelf A1',
      stockQuantity: drug.stockQty || 100,
    };

    setCart((prev) => {
      const existing = prev.find((item) => item.drugId === drug.id && item.batchNumber === defaultBatch.batchNumber);
      if (existing) {
        return prev.map((item) =>
          item.drugId === drug.id && item.batchNumber === defaultBatch.batchNumber
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotalUgx: (item.quantity + 1) * item.unitSellingPriceUgx - item.discountAmountUgx,
              }
            : item
        );
      }

      // Essential human medicines 0% VAT exempt in Uganda
      const taxRate = drug.prescriptionRequired ? 0 : 0; // 0% VAT on pharmaceuticals
      const unitPrice = drug.sellingPrice;

      const newItem: POSCartItem = {
        drugId: drug.id,
        genericName: drug.genericName,
        brandName: drug.brandName,
        dosageForm: drug.category.includes('Injectable') ? 'Injectable' : 'Tablet',
        isPrescriptionOnly: drug.prescriptionRequired,
        quantity: 1,
        availableStock: defaultBatch.stockQuantity,
        batchNumber: defaultBatch.batchNumber,
        batchExpiryDate: defaultBatch.expiryDate,
        shelfLocation: defaultBatch.shelfLocation,
        unitCostUgx: drug.costPrice,
        unitSellingPriceUgx: unitPrice,
        discountPercent: 0,
        discountAmountUgx: 0,
        taxRatePercent: taxRate,
        taxAmountUgx: 0,
        lineTotalUgx: unitPrice,
        dosageInstructions: drug.prescriptionRequired ? 'Take as directed by doctor' : 'Take 1-2 tablets as needed',
      };

      return [...prev, newItem];
    });

    if (drug.prescriptionRequired && saleType === 'otc_sale') {
      setSaleType('prescription_sale');
    }
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) => {
          if (i === index) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const lineGross = newQty * item.unitSellingPriceUgx;
            const lineDisc = Math.round(lineGross * (item.discountPercent / 100));
            const tax = Math.round((lineGross - lineDisc) * (item.taxRatePercent / 100));
            return {
              ...item,
              quantity: newQty,
              discountAmountUgx: lineDisc,
              taxAmountUgx: tax,
              lineTotalUgx: lineGross - lineDisc + tax,
            };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const updateCartItemBatch = (index: number, newBatchNumber: string) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const batches = getAvailableBatchesForDrug(item.drugId);
          const found = batches.find((b) => b.batchNumber === newBatchNumber);
          if (found) {
            return {
              ...item,
              batchNumber: found.batchNumber,
              batchExpiryDate: found.expiryDate,
              shelfLocation: found.shelfLocation,
              availableStock: found.stockQuantity,
            };
          }
        }
        return item;
      })
    );
  };

  const updateCartItemDiscount = (index: number, discountPercent: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const lineGross = item.quantity * item.unitSellingPriceUgx;
          const lineDisc = Math.round(lineGross * (discountPercent / 100));
          const tax = Math.round((lineGross - lineDisc) * (item.taxRatePercent / 100));
          return {
            ...item,
            discountPercent,
            discountAmountUgx: lineDisc,
            taxAmountUgx: tax,
            lineTotalUgx: lineGross - lineDisc + tax,
          };
        }
        return item;
      })
    );
  };

  const updateCartItemDosage = (index: number, dosageInstructions: string) => {
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, dosageInstructions } : item))
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Complete POS Sale
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const tx = processPOSSalesTransaction({
      saleType,
      customerType,
      patientId,
      customerName,
      customerPhone: customerPhone || undefined,
      prescriptionId,
      prescriptionRefNo,
      prescriberName,
      prescriberLicenceNo,
      pharmacistName: currentCashierName,
      dispensingNotes: dispensingNotes || undefined,
      items: cart,
      orderDiscountUgx: orderDiscountAmount,
      discountReason: discountReason || undefined,
      paymentMethod,
      cashTenderedUgx: paymentMethod === 'Cash' ? cashTendered || patientPayableAmount : undefined,
      momoProvider: paymentMethod === 'Mobile Money' ? momoProvider : undefined,
      momoPhone: paymentMethod === 'Mobile Money' ? momoPhone || customerPhone : undefined,
      momoReference: paymentMethod === 'Mobile Money' ? momoRef : undefined,
      cardAuthCode: paymentMethod === 'Card' ? cardAuthCode : undefined,
      creditDueDate: paymentMethod === 'Credit' ? creditDueDate : undefined,
      insuranceCoveredUgx: isInsurance ? insuranceCoveredAmount : 0,
    });

    // Notify legacy hook if provided
    if (onCompleteSale) {
      onCompleteSale({
        id: tx.id,
        receiptNo: tx.receiptNo,
        customerName: tx.customerName,
        customerPhone: tx.customerPhone || '',
        items: tx.items.map((it) => ({
          drugId: it.drugId,
          brandName: it.brandName,
          unitPrice: it.unitSellingPriceUgx,
          quantity: it.quantity,
          total: it.lineTotalUgx,
          isPrescription: it.isPrescriptionOnly,
        })),
        subtotal: tx.grossSubtotalUgx,
        taxAmount: tx.taxVatUgx,
        discountAmount: tx.lineDiscountsUgx + tx.orderDiscountUgx,
        insuranceCopayAmount: tx.patientPaidUgx,
        insuranceCoveredAmount: tx.insuranceCoveredUgx,
        totalPaid: tx.patientPaidUgx,
        paymentMethod: tx.paymentMethod as any,
        mpesaRef: tx.momoReference,
        cashierName: tx.pharmacistName,
        timestamp: new Date().toLocaleString(),
      });
    }

    setPosTransactions(getAllPOSTransactions());
    setCompletedReceipt(tx);
    setCart([]);
    setCashTendered(0);
    setOrderDiscountPercent(0);
    setDiscountReason('');
  };

  // Void Transaction Handler
  const handleExecuteVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTargetTx || !voidReason) return;

    voidPOSSalesTransaction(
      voidTargetTx.id,
      voidReason,
      voidSupervisorCode || 'PIN-9912',
      currentCashierName
    );

    setPosTransactions(getAllPOSTransactions());
    setVoidTargetTx(null);
    setVoidReason('');
  };

  // Refund Transaction Handler
  const handleExecuteRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetTx || refundAmount <= 0) return;

    refundPOSSalesTransaction(
      refundTargetTx.id,
      refundAmount,
      refundReason || 'Customer return within standard dispensing return window',
      refundDisposition
    );

    setPosTransactions(getAllPOSTransactions());
    setRefundTargetTx(null);
    setRefundAmount(0);
    setRefundReason('');
  };

  const dailyZReport: POSDailyZReport = useMemo(() => {
    return generatePOSDailyZReport(new Date().toISOString().slice(0, 10), currentCashierName);
  }, [posTransactions, currentCashierName]);

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              Pharmacy POS &amp; Dispensing Terminal
            </span>
            <span className="text-xs font-semibold text-slate-500">
              NDA Controlled Dispensing &amp; Multi-Gateway Settlement
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Point of Sale &amp; Dispensation
          </h2>
        </div>

        {/* View Navigation Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveView('pos_terminal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'pos_terminal'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            POS Terminal
          </button>
          <button
            onClick={() => setActiveView('transaction_history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'transaction_history'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Sales Register ({posTransactions.length})
          </button>
          <button
            onClick={() => setActiveView('z_report')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'z_report'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Daily Z-Report
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE POS TERMINAL */}
      {activeView === 'pos_terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Drug Lookup Catalog (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
            {/* Customer & Sale Mode Selector */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Customer Mode:</span>
                  <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5 text-xs font-bold">
                    <button
                      onClick={() => {
                        setCustomerType('walk_in');
                        setCustomerName('Walk-in Customer');
                        setPatientId(undefined);
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        customerType === 'walk_in'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Walk-in (OTC)
                    </button>
                    <button
                      onClick={() => {
                        setCustomerType('registered_patient');
                        setCustomerName('Sarah Namubiru');
                        setCustomerPhone('+256 772 123456');
                        setPatientId('pat-001');
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        customerType === 'registered_patient'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Registered Patient
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowRxModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Load Prescription ({prescriptions.filter((rx) => rx.status === 'Pending').length})
                </button>
              </div>

              {/* Patient / Customer Name & Phone Fields */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Customer / Patient Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+256 7..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Prescription metadata if linked */}
              {prescriptionRefNo && (
                <div className="p-2 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                  <span>
                    Linked Rx: <strong>{prescriptionRefNo}</strong> • Prescriber: {prescriberName || 'Doctor'}
                  </span>
                  <button
                    onClick={() => {
                      setPrescriptionRefNo(undefined);
                      setPrescriptionId(undefined);
                      setSaleType('otc_sale');
                    }}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Unlink
                  </button>
                </div>
              )}
            </div>

            {/* Drug Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search brand, generic INN name, barcode, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden text-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                onClick={openBarcodeScanner}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Scan Barcode"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
              </button>
            </div>

            {/* Drug Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredDrugs.map((drug) => {
                const batches = getAvailableBatchesForDrug(drug.id);
                const nextExpBatch = batches[0];

                return (
                  <div
                    key={drug.id}
                    onClick={() => addToCart(drug)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex flex-col justify-between space-y-2 group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">
                          {drug.brandName}
                        </p>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase ${
                            drug.prescriptionRequired
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          {drug.prescriptionRequired ? 'POM (Rx)' : 'OTC'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{drug.genericName}</p>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Batch: {nextExpBatch?.batchNumber || 'Auto'}</span>
                      <span>Stock: {drug.stockQty} packs</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-mono font-black text-slate-900 dark:text-slate-100">
                        {formatUGX(drug.sellingPrice)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Plus className="w-3 h-3" /> Add
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Cart & Billing Terminal (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Basket Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
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

              {/* Cart Items List with Batch Picker & Dosage Sig */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {cart.length > 0 ? (
                  cart.map((item, index) => {
                    const availableBatches = getAvailableBatchesForDrug(item.drugId);

                    return (
                      <div
                        key={`${item.drugId}-${index}`}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {item.brandName}{' '}
                              {item.isPrescriptionOnly && (
                                <span className="text-[9px] text-rose-600 font-bold uppercase">(Rx)</span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {formatUGX(item.unitSellingPriceUgx)} × {item.quantity} ={' '}
                              <strong className="text-slate-900 dark:text-slate-100">
                                {formatUGX(item.lineTotalUgx)}
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateCartItemQuantity(index, -1)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItemQuantity(index, 1)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="p-1 ml-1 rounded text-rose-600 hover:bg-rose-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Active FEFO Batch Selector & Line Discount */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>FEFO Batch:</span>
                              </label>
                              {availableBatches.length > 0 && item.batchNumber === availableBatches[0].batchNumber && (
                                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                                  ⭐ Recommended
                                </span>
                              )}
                            </div>
                            <select
                              value={item.batchNumber}
                              onChange={(e) => updateCartItemBatch(index, e.target.value)}
                              className={`w-full p-1 bg-white dark:bg-slate-900 border rounded text-[10px] font-mono ${
                                availableBatches.length > 0 && item.batchNumber !== availableBatches[0].batchNumber
                                  ? 'border-amber-400 text-amber-900 dark:text-amber-200'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {availableBatches.map((b, bIdx) => (
                                <option key={b.batchNumber} value={b.batchNumber}>
                                  {bIdx === 0 ? '⭐ [FEFO Rec] ' : `[Priority ${bIdx + 1}] `}
                                  {b.batchNumber} (Exp: {formatExpiryMonthYear(b.expiryDate)} • {b.stockQuantity} in stock)
                                </option>
                              ))}
                            </select>

                            {/* Warning if out-of-sequence batch selected */}
                            {availableBatches.length > 1 && item.batchNumber !== availableBatches[0].batchNumber && (
                              <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold mt-1 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                <span>Batch {availableBatches[0].batchNumber} expires earlier ({formatExpiryMonthYear(availableBatches[0].expiryDate)}).</span>
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-slate-400 font-bold block mb-0.5">Line Discount (%):</label>
                            <input
                              type="number"
                              min={0}
                              max={50}
                              value={item.discountPercent}
                              onChange={(e) => updateCartItemDiscount(index, Number(e.target.value))}
                              className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px]"
                            />
                          </div>
                        </div>

                        {/* Custom Dosage Sig Instructions */}
                        <div>
                          <input
                            type="text"
                            placeholder="Dosage Sig e.g. Take 1 tablet twice daily..."
                            value={item.dosageInstructions || ''}
                            onChange={(e) => updateCartItemDosage(index, e.target.value)}
                            className="w-full p-1 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Cart is empty. Click drugs from the left catalog or scan barcode.
                  </div>
                )}
              </div>

              {/* Order Discount */}
              {cart.length > 0 && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Order Discount (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={orderDiscountPercent}
                      onChange={(e) => setOrderDiscountPercent(Number(e.target.value))}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Discount Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Citizen / Staff"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Payment Gateway Options */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Payment Method
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'Cash', icon: DollarSign },
                    { id: 'Mobile Money', icon: Smartphone },
                    { id: 'Card', icon: CreditCard },
                    { id: 'Credit', icon: Tag },
                    { id: 'Insurance Scheme', icon: ShieldCheck },
                    { id: 'Split', icon: Layers },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => {
                          if (pm.id === 'Split') {
                            setIsOrchestratorOpen(true);
                          } else {
                            setPaymentMethod(pm.id as any);
                          }
                        }}
                        className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer text-[11px] ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate">{pm.id}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Conditional Payment Inputs */}
                {paymentMethod === 'Cash' && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase block">
                        Cash Tendered (UGX)
                      </label>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        Change: {formatUGX(cashChange)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step={1000}
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      placeholder={`Exact UGX ${patientPayableAmount.toLocaleString()}`}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg font-mono font-bold text-xs text-emerald-900 dark:text-emerald-100"
                    />
                    <div className="flex items-center gap-1.5">
                      {[10000, 20000, 50000, 100000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashTendered(val)}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                        >
                          {val / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'Mobile Money' && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase block">
                          Provider
                        </label>
                        <select
                          value={momoProvider}
                          onChange={(e) => setMomoProvider(e.target.value as any)}
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-amber-300 rounded text-xs font-bold"
                        >
                          <option value="MTN MoMo">MTN MoMo Pay</option>
                          <option value="Airtel Money">Airtel Money Pay</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase block">
                          Customer Phone
                        </label>
                        <input
                          type="text"
                          value={momoPhone || customerPhone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                          placeholder="+256 7..."
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-amber-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase block">
                        MoMo Transaction Ref
                      </label>
                      <input
                        type="text"
                        value={momoRef}
                        onChange={(e) => setMomoRef(e.target.value)}
                        className="w-full p-1.5 bg-white dark:bg-slate-900 border border-amber-300 rounded font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'Credit' && (
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1.5 text-xs">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block">
                      Patient Store Credit Account (Net 30)
                    </span>
                    <p className="text-[11px] text-purple-700 dark:text-purple-400">
                      Approved limit for {customerName}: <strong>UGX 500,000</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-purple-900 dark:text-purple-300 block">
                          Payment Due Date
                        </label>
                        <input
                          type="date"
                          value={creditDueDate}
                          onChange={(e) => setCreditDueDate(e.target.value)}
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-purple-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Billing Breakdown Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal:</span>
                  <span>{formatUGX(grossSubtotal)}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discounts:</span>
                    <span>-{formatUGX(totalDiscounts)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>VAT / Tax (0% Rx Exempt):</span>
                  <span>{formatUGX(totalVat)}</span>
                </div>
                {isInsurance && (
                  <div className="flex justify-between text-cyan-300">
                    <span>Insurance Covered:</span>
                    <span>{formatUGX(insuranceCoveredAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                  <span>NET PAYABLE:</span>
                  <span className="text-emerald-400">{formatUGX(patientPayableAmount)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Dispense &amp; Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TRANSACTION HISTORY & SALES REGISTER */}
      {activeView === 'transaction_history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                Dispensing Sales Register ({filteredTransactions.length} Transactions)
              </h3>
              <p className="text-xs text-slate-500">
                Complete transactional audit trail with receipt reprint, voiding, and refund capabilities.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search receipt #, patient..."
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <select
                value={txFilterStatus}
                onChange={(e) => setTxFilterStatus(e.target.value)}
                className="p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="voided">Voided</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Date/Time</th>
                  <th className="py-2.5 px-3">Customer / Patient</th>
                  <th className="py-2.5 px-3">Sale Type</th>
                  <th className="py-2.5 px-3">Items &amp; Batches</th>
                  <th className="py-2.5 px-3">Net Total</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {tx.receiptNo}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{tx.customerName}</span>
                      {tx.customerPhone && <span className="text-[10px] text-slate-400">{tx.customerPhone}</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          tx.saleType === 'prescription_sale'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {tx.saleType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {tx.items.map((it, i) => (
                        <span key={i} className="block text-slate-600 dark:text-slate-400">
                          {it.quantity}x {it.brandName} <span className="text-[9px] font-mono font-bold">({it.batchNumber})</span>
                        </span>
                      ))}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-slate-900 dark:text-slate-100">
                      {formatUGX(tx.netTotalUgx)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {tx.paymentMethod}
                      </span>
                      {tx.momoReference && (
                        <span className="block text-[9px] font-mono text-amber-600 font-bold">{tx.momoReference}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          tx.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'voided'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCompletedReceipt(tx)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer shadow-2xs"
                          title="View / Print Digital Receipt & Tax Invoice"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt</span>
                        </button>
                        {tx.status === 'completed' && (
                          <>
                            <button
                              onClick={() => {
                                setRefundTargetTx(tx);
                                setRefundAmount(tx.netTotalUgx);
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 cursor-pointer"
                              title="Refund / Return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setVoidTargetTx(tx)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 cursor-pointer"
                              title="Void Transaction"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: DAILY Z-REPORT / CASH-UP RECONCILIATION */}
      {activeView === 'z_report' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                End-of-Day Balancing
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                Daily Z-Report &amp; Drawer Balancing
              </h3>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Z-Report</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block font-bold">Total Orders</span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                {dailyZReport.totalTransactions}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block font-bold">Gross Sales</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                {formatUGX(dailyZReport.totalGrossSalesUgx)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block font-bold">Discounts Granted</span>
              <span className="text-sm font-black text-emerald-600">
                -{formatUGX(dailyZReport.totalDiscountsUgx)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block font-bold">Net Total Collected</span>
              <span className="text-sm font-black text-emerald-600">
                {formatUGX(dailyZReport.totalNetSalesUgx)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100 block pb-1 border-b border-slate-200 dark:border-slate-700">
              Channel Reconciliation Breakdown
            </span>
            <div className="flex justify-between">
              <span>Cash Drawer Balance:</span>
              <span className="font-bold font-mono">{formatUGX(dailyZReport.cashTotalUgx)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mobile Money (MTN / Airtel):</span>
              <span className="font-bold font-mono">{formatUGX(dailyZReport.momoTotalUgx)}</span>
            </div>
            <div className="flex justify-between">
              <span>Credit Card / POS Terminal:</span>
              <span className="font-bold font-mono">{formatUGX(dailyZReport.cardTotalUgx)}</span>
            </div>
            <div className="flex justify-between">
              <span>Patient Credit (Accounts Receivable):</span>
              <span className="font-bold font-mono">{formatUGX(dailyZReport.creditTotalUgx)}</span>
            </div>
            <div className="flex justify-between">
              <span>Insurance Claims Outstanding:</span>
              <span className="font-bold font-mono">{formatUGX(dailyZReport.insuranceTotalUgx)}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printable / Thermal Receipt */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 relative font-mono text-xs text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCompletedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3 space-y-1">
              <h3 className="font-black text-sm tracking-wider uppercase">ZENITHRX PHARMACY</h3>
              <p className="text-[10px] text-slate-500">NDA Reg: NDA/RET/2026/0491</p>
              <p className="text-[10px] font-bold text-emerald-600">{completedReceipt.receiptNo}</p>
              <p className="text-[10px] text-slate-400">
                {new Date(completedReceipt.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-[11px] space-y-0.5">
              <p>
                <span className="font-bold">Customer:</span> {completedReceipt.customerName}
              </p>
              <p>
                <span className="font-bold">Sale Type:</span> {completedReceipt.saleType.toUpperCase()}
              </p>
              {completedReceipt.prescriptionRefNo && (
                <p>
                  <span className="font-bold">Rx Ref:</span> {completedReceipt.prescriptionRefNo}
                </p>
              )}
              <p>
                <span className="font-bold">Dispenser:</span> {completedReceipt.pharmacistName}
              </p>
              <p>
                <span className="font-bold">Payment:</span> {completedReceipt.paymentMethod}
              </p>
            </div>

            {/* Receipt Items */}
            <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-3 space-y-2">
              {completedReceipt.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{item.brandName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Batch: {item.batchNumber} (Exp: {item.batchExpiryDate})
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {item.quantity} × {formatUGX(item.unitSellingPriceUgx)}
                      </p>
                    </div>
                    <p className="font-bold">{formatUGX(item.lineTotalUgx)}</p>
                  </div>
                  {item.dosageInstructions && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-1 rounded mt-0.5">
                      Sig: {item.dosageInstructions}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatUGX(completedReceipt.grossSubtotalUgx)}</span>
              </div>
              {completedReceipt.lineDiscountsUgx + completedReceipt.orderDiscountUgx > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-{formatUGX(completedReceipt.lineDiscountsUgx + completedReceipt.orderDiscountUgx)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax VAT (0% Rx Exempt):</span>
                <span>{formatUGX(completedReceipt.taxVatUgx)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>NET TOTAL PAID:</span>
                <span className="text-emerald-600">{formatUGX(completedReceipt.patientPaidUgx)}</span>
              </div>
              {completedReceipt.cashChangeUgx !== undefined && completedReceipt.cashChangeUgx > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Change Returned:</span>
                  <span>{formatUGX(completedReceipt.cashChangeUgx)}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1">
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                Thank you for choosing ZenithRx!
              </p>
              <p className="text-[9px] text-slate-400">Medicines dispensed are non-returnable once taken.</p>
            </div>

            <button
              onClick={() => {
                window.print();
                setCompletedReceipt(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Void Transaction with Supervisor PIN */}
      {voidTargetTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Void Transaction ({voidTargetTx.receiptNo})
              </h3>
              <button onClick={() => setVoidTargetTx(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteVoid} className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Voiding this transaction will cancel the sale and <strong>automatically restore all batch inventory</strong> back to active stock.
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Void / Cancellation *
                </label>
                <textarea
                  required
                  rows={2}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Customer walked away before completing payment..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Authorization PIN *
                </label>
                <input
                  required
                  type="password"
                  value={voidSupervisorCode}
                  onChange={(e) => setVoidSupervisorCode(e.target.value)}
                  placeholder="Enter supervisor PIN"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVoidTargetTx(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Confirm Void &amp; Restore Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Refund / Return against Sale */}
      {refundTargetTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-amber-600 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Process Refund / Return ({refundTargetTx.receiptNo})
              </h3>
              <button onClick={() => setRefundTargetTx(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Amount (UGX) *
                </label>
                <input
                  required
                  type="number"
                  max={refundTargetTx.netTotalUgx}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Stock Disposition Routing
                </label>
                <select
                  value={refundDisposition}
                  onChange={(e) => setRefundDisposition(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                >
                  <option value="return_to_saleable_stock">Return to Saleable Stock (Unopened / Intact)</option>
                  <option value="quarantine">Send to Quarantine (Defective / Damaged)</option>
                  <option value="destruction">Tag for Destruction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Justification / Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Unopened medicine returned with original receipt within 2 hours..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRefundTargetTx(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  Execute Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Load Pending Prescription */}
      {showRxModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <FileText className="w-5 h-5 text-indigo-500" />
                Load Verified Prescription
              </h3>
              <button onClick={() => setShowRxModal(false)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {prescriptions.filter((rx) => rx.status === 'Pending').length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">No pending prescriptions found.</p>
              ) : (
                prescriptions
                  .filter((rx) => rx.status === 'Pending')
                  .map((rx) => (
                    <button
                      key={rx.id}
                      onClick={() => {
                        setCart([]);
                        rx.medications.forEach((med) => {
                          const drug = drugs.find((d) => d.id === med.drugId);
                          if (drug) {
                            addToCart(drug);
                          }
                        });
                        setCustomerName(rx.patientName);
                        setCustomerPhone(rx.patientPhone || '');
                        setPrescriptionId(rx.id);
                        setPrescriptionRefNo(rx.rxNumber);
                        setPrescriberName(rx.doctorName);
                        setSaleType('prescription_sale');
                        setCustomerType('registered_patient');
                        setShowRxModal(false);
                      }}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{rx.rxNumber}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          Pending Dispensing
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Patient: <b>{rx.patientName}</b> • Dr. {rx.doctorName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {rx.medications.length} medication(s) prescribed — {rx.date}
                      </p>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Channel Split Modal */}
      {isOrchestratorOpen && (
        <PaymentOrchestratorModal
          totalAmountUgx={patientPayableAmount}
          taxAmountUgx={totalVat}
          customerName={customerName}
          customerPhone={customerPhone || '+256 772 000000'}
          onSuccess={(intent: PaymentIntent) => {
            const tx = processPOSSalesTransaction({
              saleType,
              customerType,
              customerName,
              customerPhone,
              pharmacistName: currentCashierName,
              items: cart,
              paymentMethod: 'Split',
              paymentSplits: intent.splits.map((s) => ({
                method: s.method,
                amountUgx: s.amountUgx,
                reference: s.providerReference,
              })),
            });
            setPosTransactions(getAllPOSTransactions());
            setCompletedReceipt(tx);
            setCart([]);
            setIsOrchestratorOpen(false);
          }}
          onClose={() => setIsOrchestratorOpen(false)}
        />
      )}

      {/* Electronic Digital Receipt / Tax Invoice Modal */}
      {completedReceipt && activeDigitalReceipt && (
        <DigitalReceiptModal
          isOpen={!!completedReceipt}
          onClose={() => setCompletedReceipt(null)}
          receipt={activeDigitalReceipt}
        />
      )}
    </div>
  );
};
