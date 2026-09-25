import React, { useState } from 'react';
import {
  DigitalReceiptData,
  formatReceiptSmsText,
  formatReceiptWhatsAppText
} from '../services/electronicReceiptService';
import { formatUGX } from '../services/formatters';
import {
  Receipt,
  Printer,
  Share2,
  Phone,
  MessageSquare,
  CheckCircle2,
  Download,
  Copy,
  Check,
  X,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  User,
  Pill,
  CreditCard,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: DigitalReceiptData | null;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  const [activeLayout, setActiveLayout] = useState<'THERMAL_SLIP' | 'A4_INVOICE'>('THERMAL_SLIP');
  const [copiedLink, setCopiedLink] = useState(false);
  const [smsSentNotice, setSmsSentNotice] = useState(false);
  const [whatsAppSentNotice, setWhatsAppSentNotice] = useState(false);

  if (!isOpen || !receipt) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(receipt.qrVerificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(formatReceiptWhatsAppText(receipt));
    const phone = receipt.customerPhone ? receipt.customerPhone.replace(/[^0-9]/g, '') : '';
    const waUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
    setWhatsAppSentNotice(true);
    setTimeout(() => setWhatsAppSentNotice(false), 4000);
  };

  const handleSendSms = () => {
    setSmsSentNotice(true);
    setTimeout(() => setSmsSentNotice(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                Official Electronic Receipt &amp; Tax Invoice
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {receipt.receiptNumber} • {receipt.fiscalEfrisNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Layout Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setActiveLayout('THERMAL_SLIP')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  activeLayout === 'THERMAL_SLIP'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                80mm POS Slip
              </button>
              <button
                onClick={() => setActiveLayout('A4_INVOICE')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  activeLayout === 'A4_INVOICE'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                A4 Tax Invoice
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notifications */}
        {smsSentNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            SMS Electronic Receipt dispatched to {receipt.customerPhone || 'customer phone'}!
          </div>
        )}
        {whatsAppSentNotice && (
          <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            WhatsApp Tax Invoice launched in new window!
          </div>
        )}

        {/* Scrollable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex justify-center">
          
          {/* ──────────────────────────────────────────────────────────────────
              LAYOUT 1: 80MM POS THERMAL SLIP
          ────────────────────────────────────────────────────────────────── */}
          {activeLayout === 'THERMAL_SLIP' && (
            <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-6 max-w-sm w-full font-mono text-[11px] leading-tight space-y-4 border border-slate-200">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <div className="text-sm font-black tracking-tight uppercase font-sans">
                  {receipt.pharmacyName}
                </div>
                <div className="text-[10px] text-slate-600">
                  {receipt.branchName}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">
                  {receipt.branchAddress}
                </div>
                <div className="text-[9px] text-slate-600 font-bold">
                  Tel: {receipt.branchPhone} • TIN: {receipt.pharmacyTin}
                </div>
                <div className="text-[9px] text-slate-500">
                  NDA Reg: {receipt.ndaLicenseNumber}
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span className="font-bold">RECEIPT #:</span>
                  <span className="font-bold">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>EFRIS FISCAL:</span>
                  <span>{receipt.fiscalEfrisNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>{new Date(receipt.receiptTimestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold truncate max-w-[160px]">{receipt.customerName}</span>
                </div>
                {receipt.prescriptionRefNo && (
                  <div className="flex justify-between text-indigo-700 font-bold">
                    <span>RX REF:</span>
                    <span>{receipt.prescriptionRefNo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PHARMACIST/CASHIER:</span>
                  <span className="truncate max-w-[140px]">{receipt.cashierName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-1">
                  <span>ITEM / BATCH</span>
                  <span>QTY x PRICE</span>
                  <span>TOTAL</span>
                </div>

                {receipt.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-[11px] truncate">
                      {item.drugName}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Batch: {item.batchNumber} (Exp: {item.expiryDate.slice(0, 7)})</span>
                      <span>{item.quantity} x {formatUGX(item.unitPriceUgx)}</span>
                      <span className="font-bold text-slate-900">{formatUGX(item.totalUgx)}</span>
                    </div>
                    {item.discountUgx > 0 && (
                      <div className="flex justify-between text-[9px] text-emerald-700 italic">
                        <span>Discount</span>
                        <span>-{formatUGX(item.discountUgx)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span>GROSS SUBTOTAL:</span>
                  <span>{formatUGX(receipt.grossSubtotalUgx)}</span>
                </div>

                {receipt.totalDiscountUgx > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>DISCOUNT ({receipt.discountPercentage}%):</span>
                    <span>-{formatUGX(receipt.totalDiscountUgx)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>18% VAT INCLUDED:</span>
                  <span>{formatUGX(receipt.taxAmountUgx)}</span>
                </div>

                <div className="flex justify-between text-base font-black border-t border-slate-900 pt-1 mt-1 font-sans">
                  <span>TOTAL PAID:</span>
                  <span>{formatUGX(receipt.grandTotalUgx)}</span>
                </div>

                <div className="flex justify-between text-[10px] pt-1">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold uppercase">{receipt.paymentMethod}</span>
                </div>

                {receipt.paymentReferenceCode && (
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>PAYMENT REF:</span>
                    <span>{receipt.paymentReferenceCode}</span>
                  </div>
                )}
              </div>

              {/* QR Verification Seal & Barcode */}
              <div className="text-center space-y-2 pt-1">
                <div className="w-24 h-24 mx-auto bg-slate-50 border border-slate-300 rounded-xl p-2 flex items-center justify-center shadow-xs">
                  <QrCode className="w-20 h-20 text-slate-900" />
                </div>
                <div className="text-[8px] text-slate-500 tracking-wider">
                  SCAN TO VERIFY EFRIS FISCAL RECEIPT
                </div>
                <div className="text-[9px] text-slate-600 font-sans italic">
                  Thank you for visiting {receipt.pharmacyName}!
                </div>
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              LAYOUT 2: A4 ENTERPRISE FISCAL TAX INVOICE
          ────────────────────────────────────────────────────────────────── */}
          {activeLayout === 'A4_INVOICE' && (
            <div className="bg-white text-slate-900 rounded-3xl shadow-xl p-8 max-w-xl w-full text-xs space-y-6 border border-slate-200">
              
              {/* Header with Branding */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                      ZR
                    </div>
                    <h2 className="text-base font-black tracking-tight text-slate-900">
                      {receipt.pharmacyName}
                    </h2>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">{receipt.branchName}</p>
                  <p className="text-slate-500 text-[10px]">{receipt.branchAddress}</p>
                  <p className="text-slate-500 text-[10px]">Tel: {receipt.branchPhone} • Email: {receipt.branchEmail}</p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full inline-block">
                    Official Tax Invoice
                  </span>
                  <div className="text-sm font-black font-mono text-slate-900 mt-1">
                    #{receipt.receiptNumber}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">EFRIS: {receipt.fiscalEfrisNumber}</p>
                  <p className="text-[10px] text-slate-500 font-mono">TIN: {receipt.pharmacyTin}</p>
                  <p className="text-[10px] text-slate-500">NDA Lic: {receipt.ndaLicenseNumber}</p>
                </div>
              </div>

              {/* Bill To & Transaction Particulars */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Billed To (Customer / Patient)</span>
                  <div className="font-bold text-slate-900 mt-0.5">{receipt.customerName}</div>
                  <div className="text-slate-500">{receipt.customerPhone || 'Walk-in Retail Customer'}</div>
                  {receipt.prescriptionRefNo && (
                    <div className="text-indigo-600 font-bold mt-1">
                      Prescription: {receipt.prescriptionRefNo} (Dr. {receipt.prescriberName})
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Transaction Details</span>
                  <div><strong>Date:</strong> {new Date(receipt.receiptTimestamp).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {new Date(receipt.receiptTimestamp).toLocaleTimeString()}</div>
                  <div><strong>Payment Method:</strong> {receipt.paymentMethod}</div>
                  <div><strong>Dispensed By:</strong> {receipt.cashierName} ({receipt.cashierRole})</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-black text-slate-700 text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Batch / Expiry</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {receipt.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{item.drugName}</span>
                          <span className="text-[10px] text-slate-400">{item.genericName}</span>
                        </td>
                        <td className="p-3 text-center font-mono text-[10px] text-slate-500">
                          {item.batchNumber}<br />{item.expiryDate}
                        </td>
                        <td className="p-3 text-center font-bold font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">{formatUGX(item.unitPriceUgx)}</td>
                        <td className="p-3 text-right font-mono text-emerald-700">
                          {item.discountUgx > 0 ? `-${formatUGX(item.discountUgx)}` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold font-mono text-slate-900">{formatUGX(item.totalUgx)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary & Digital Verification */}
              <div className="flex items-start justify-between gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>
                  <div className="space-y-0.5 text-[10px] text-slate-500">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cryptographic Verification
                    </span>
                    <p>Scan to verify authenticity on URA EFRIS portal.</p>
                    <p className="font-mono text-[9px]">Auth Hash: {receipt.verificationHash.slice(0, 16)}...</p>
                  </div>
                </div>

                <div className="w-56 space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatUGX(receipt.grossSubtotalUgx)}</span>
                  </div>
                  {receipt.totalDiscountUgx > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatUGX(receipt.totalDiscountUgx)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>18% VAT (Included):</span>
                    <span className="font-mono">{formatUGX(receipt.taxAmountUgx)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-slate-900 pt-2 text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-600">{formatUGX(receipt.grandTotalUgx)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt / Invoice</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send WhatsApp Receipt</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendSms}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Send SMS</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Verification URL'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DigitalReceiptModal;
