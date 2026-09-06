/**
 * usePOS.ts — ZenithRx Point of Sale Application Hook
 * Encapsulates cart management, pricing, tax, discount, and receipt logic.
 * Clean Architecture: Application Layer
 */

import { useState, useMemo, useCallback } from 'react';
import { DrugItem, POSTransaction, Prescription } from '../types';
import { generateReceiptNo, generateId, todayISO } from '../services/formatters';

const VAT_RATE = 0.18; // 18% Uganda VAT

export interface CartItem {
  drugId: string;
  brandName: string;
  genericName: string;
  batchNumber: string;
  unitPrice: number;
  quantity: number;
  total: number;
  isPrescription: boolean;
  prescriptionRequired: boolean;
}

export type PaymentMethod = POSTransaction['paymentMethod'];

export function usePOS(drugs: DrugItem[], prescriptions: Prescription[]) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [insuranceCopayPercent, setInsuranceCopayPercent] = useState(20); // 20% patient co-pay
  const [insuranceCoveredPercent, setInsuranceCoveredPercent] = useState(80);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  /** Filtered drug search results */
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return drugs.filter((d) => {
      const matchesSearch =
        !query ||
        d.brandName.toLowerCase().includes(query) ||
        d.genericName.toLowerCase().includes(query) ||
        d.barcode.includes(query);
      const matchesCategory =
        categoryFilter === 'All' || d.category === categoryFilter;
      return matchesSearch && matchesCategory && d.stockQty > 0;
    });
  }, [drugs, searchQuery, categoryFilter]);

  /** Pending prescriptions available to load into cart */
  const pendingPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => rx.status === 'Pending');
  }, [prescriptions]);

  /** Add a drug to cart */
  const addToCart = useCallback((drug: DrugItem, qty = 1, isPrescription = false) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.drugId === drug.id);
      if (existing) {
        return prev.map((item) =>
          item.drugId === drug.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                total: (item.quantity + qty) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          drugId: drug.id,
          brandName: drug.brandName,
          genericName: drug.genericName,
          batchNumber: drug.batchNumber,
          unitPrice: drug.sellingPrice,
          quantity: qty,
          total: qty * drug.sellingPrice,
          isPrescription,
          prescriptionRequired: drug.prescriptionRequired,
        },
      ];
    });
  }, []);

  /** Remove an item from cart */
  const removeFromCart = useCallback((drugId: string) => {
    setCart((prev) => prev.filter((item) => item.drugId !== drugId));
  }, []);

  /** Update quantity of a cart item */
  const updateQuantity = useCallback((drugId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.drugId !== drugId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.drugId === drugId
          ? { ...item, quantity: qty, total: qty * item.unitPrice }
          : item
      )
    );
  }, []);

  /** Clear the entire cart */
  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountAmount(0);
    setPaymentMethod('Cash');
    setSearchQuery('');
  }, []);

  /** Load a pending prescription into cart */
  const loadPrescription = useCallback(
    (rx: Prescription) => {
      const newItems: CartItem[] = rx.medications.map((med) => {
        const drug = drugs.find((d) => d.id === med.drugId);
        return {
          drugId: med.drugId,
          brandName: med.drugName,
          genericName: drug?.genericName ?? med.drugName,
          batchNumber: drug?.batchNumber ?? '—',
          unitPrice: med.unitPrice,
          quantity: med.quantity,
          total: med.quantity * med.unitPrice,
          isPrescription: true,
          prescriptionRequired: drug?.prescriptionRequired ?? true,
        };
      });
      setCart(newItems);
      setCustomerName(rx.patientName);
    },
    [drugs]
  );

  /** Computed pricing totals */
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
    const tax = subtotal * VAT_RATE;
    const afterTax = subtotal + tax;
    const discount = Math.min(discountAmount, afterTax);
    const totalPaid = Math.max(0, afterTax - discount);

    // Insurance split
    const insuranceCoveredAmount =
      paymentMethod === 'Insurance Scheme'
        ? totalPaid * (insuranceCoveredPercent / 100)
        : 0;
    const insuranceCopayAmount =
      paymentMethod === 'Insurance Scheme'
        ? totalPaid * (insuranceCopayPercent / 100)
        : totalPaid;

    return {
      subtotal,
      tax,
      discount,
      totalPaid,
      insuranceCoveredAmount,
      insuranceCopayAmount,
      itemCount: cart.reduce((acc, item) => acc + item.quantity, 0),
    };
  }, [cart, discountAmount, paymentMethod, insuranceCoveredPercent, insuranceCopayPercent]);

  /** Build a completed transaction object */
  const buildTransaction = useCallback(
    (cashierName: string): POSTransaction => {
      return {
        id: generateId('TXN'),
        receiptNo: generateReceiptNo(),
        customerName: customerName || 'Walk-In Customer',
        customerPhone: customerPhone || undefined,
        items: cart.map((item) => ({
          drugId: item.drugId,
          brandName: item.brandName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
          isPrescription: item.isPrescription,
        })),
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        discountAmount: totals.discount,
        insuranceCopayAmount: totals.insuranceCopayAmount,
        insuranceCoveredAmount: totals.insuranceCoveredAmount,
        totalPaid: totals.totalPaid,
        paymentMethod,
        cashierName,
        timestamp: new Date().toLocaleString('en-UG', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    },
    [cart, customerName, customerPhone, totals, paymentMethod]
  );

  const isEmpty = cart.length === 0;

  return {
    cart,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    searchResults,
    pendingPrescriptions,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    paymentMethod,
    setPaymentMethod,
    discountAmount,
    setDiscountAmount,
    insuranceCopayPercent,
    setInsuranceCopayPercent,
    insuranceCoveredPercent,
    setInsuranceCoveredPercent,
    totals,
    isEmpty,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadPrescription,
    buildTransaction,
  };
}
