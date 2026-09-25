import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Layers,
  ShieldCheck,
  FileCheck,
  Scan,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DrugItem } from '../types';
import {
  advancedStockService,
  ScanMode,
  DecodedScanResult,
} from '../services/advancedStockAndScanningService';

interface BarcodeScannerModalProps {
  drugs: DrugItem[];
  isOpen: boolean;
  onClose: () => void;
  onScanResult?: (drug: DrugItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  drugs,
  isOpen,
  onClose,
  onScanResult,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('medicine_barcode');
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<DecodedScanResult | null>(null);
  const [hasCameraError, setHasCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Hardware Laser Scanner Listener
    let barcodeBuffer = '';
    let timeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 2) {
          const res = advancedStockService.decodeScan(barcodeBuffer, scanMode);
          setScanResult(res);
        }
        barcodeBuffer = '';
        if (timeout) clearTimeout(timeout);
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 60);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Camera initialization
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraError(false);
      } catch (err) {
        console.error('Failed to access camera:', err);
        setHasCameraError(true);
      }
    };

    startCamera();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, scanMode]);

  if (!isOpen) return null;

  const handleManualScan = (customCode?: string) => {
    const code = customCode || manualInput;
    if (!code.trim()) return;
    const res = advancedStockService.decodeScan(code.trim(), scanMode);
    setScanResult(res);
  };

  const sampleCodes: Record<ScanMode, { label: string; code: string; desc: string }[]> = {
    medicine_barcode: [
      { label: 'Amoxicillin 500mg', code: '6164000123456', desc: 'SKU Barcode' },
      { label: 'Metformin 500mg', code: '6164000789012', desc: 'SKU Barcode' },
      { label: 'Ventolin Inhaler', code: '6164000456789', desc: 'SKU Barcode' },
    ],
    batch_qr: [
      { label: 'Valid Batch AUG-2026', code: 'BATCH:AUG-2026-KLA|EXP:2028-04-30|SN:991823', desc: 'Passed FEFO' },
      { label: 'Quarantined Recall Batch', code: 'BATCH:RECALL-NDA-09|EXP:2027-10-31|SN:441029', desc: 'NDA Recall Alert' },
      { label: 'Expired Batch Check', code: 'BATCH:PAR-2022-01|EXP:2023-12-31|SN:110293', desc: 'Expired Lot' },
    ],
    product_verification: [
      { label: 'Authentic NDA Scratch Code', code: 'NDA-AUTH-9921-UGX-882', desc: 'Genuine Anti-Counterfeit' },
      { label: 'Unverified / Fake Batch', code: 'FAKE-COUNTERFEIT-CODE-001', desc: 'Suspected Counterfeit' },
    ],
    prescription_reference: [
      { label: 'Rx Slip #RX-9921-KLA', code: 'RX-9921-KLA', desc: 'Dr. Arthur Ssenabulya' },
      { label: 'Rx Slip #RX-8842-ENT', code: 'RX-8842-ENT', desc: 'Entebbe Clinic Outpatient' },
    ],
  };

  return (
    <div className="fixed inset-0 bg-[#0B1E36]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <Scan className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Smart Barcode &amp; QR Scanner Station
          </h3>
          <p className="text-xs text-slate-500">
            Hardware laser scanner listener &amp; camera optical recognition with FEFO and anti-counterfeit verification.
          </p>
        </div>

        {/* Scan Mode Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          {[
            { id: 'medicine_barcode', label: 'Medicine Barcode', icon: Barcode },
            { id: 'batch_qr', label: 'Batch / FEFO', icon: Layers },
            { id: 'product_verification', label: 'Anti-Counterfeit', icon: ShieldCheck },
            { id: 'prescription_reference', label: 'Rx Reference', icon: FileCheck },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = scanMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setScanMode(mode.id as ScanMode);
                  setScanResult(null);
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate w-full text-center">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Camera Viewfinder */}
        <div className="relative w-full h-40 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
          {/* Laser scanning beam line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 animate-bounce shadow-lg shadow-emerald-400 z-10" />

          {!hasCameraError ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-75"
            />
          ) : (
            <div className="text-center z-10 p-3">
              <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-slate-300 font-bold">Hardware USB / Bluetooth Scanner Active</p>
              <p className="text-[10px] text-slate-500">Scan any physical barcode or pick a demo code below</p>
            </div>
          )}

          {!hasCameraError && (
            <div className="z-10 flex flex-col items-center pointer-events-none">
              <div className="w-48 h-20 border-2 border-dashed border-emerald-400/70 rounded-xl flex items-center justify-center">
                <p className="text-[10px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                  ALIGN {scanMode.toUpperCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Manual Barcode Input */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
              placeholder={
                scanMode === 'medicine_barcode'
                  ? 'Enter or scan SKU barcode (e.g. 6164000123456)...'
                  : scanMode === 'batch_qr'
                  ? 'Enter Batch QR payload...'
                  : scanMode === 'product_verification'
                  ? 'Enter 16-digit NDA scratch code...'
                  : 'Enter prescription code (e.g. RX-9921-KLA)...'
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => handleManualScan()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Decode
            </button>
          </div>
        </div>

        {/* Quick Sample Picks */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Test Preset Samples:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {sampleCodes[scanMode].map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setManualInput(item.code);
                  handleManualScan(item.code);
                }}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {item.label}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Decoded Scan Result Card */}
        {scanResult && (
          <div
            className={`p-4 rounded-2xl border space-y-3 animate-fade-in ${
              scanResult.verified
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-black flex items-center gap-1.5 ${
                  scanResult.verified ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                {scanResult.verified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Item Verified
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Verification Warning
                  </>
                )}
              </span>

              {scanResult.item?.unitPriceUgx && (
                <span className="text-xs font-black font-mono text-emerald-800 dark:text-emerald-200">
                  UGX {scanResult.item.unitPriceUgx.toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {scanResult.item?.brandName}
              </p>
              <p className="text-xs text-slate-500 italic">{scanResult.item?.genericName}</p>

              {scanResult.item?.batchNumber && (
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                  <span>Batch: <strong>{scanResult.item.batchNumber}</strong></span>
                  {scanResult.item.expiryDate && (
                    <span>Exp: <strong>{scanResult.item.expiryDate}</strong></span>
                  )}
                </div>
              )}

              {scanResult.item?.prescriberName && (
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-800/70 text-[11px]">
                  <span>Prescriber: <strong>{scanResult.item.prescriberName}</strong></span>
                  <br />
                  <span>Patient: <strong>{scanResult.item.patientName}</strong></span>
                </div>
              )}

              {scanResult.warnings && scanResult.warnings.length > 0 && (
                <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs font-bold space-y-1">
                  {scanResult.warnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}

              {scanResult.actionRecommendation && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  {scanResult.actionRecommendation}
                </p>
              )}
            </div>

            {onScanResult && scanResult.item && (
              <button
                onClick={() => {
                  const drugObj: any = {
                    id: scanResult.item?.id || 'scanned-drug',
                    brandName: scanResult.item?.brandName || 'Scanned Drug',
                    genericName: scanResult.item?.genericName || '',
                    barcode: scanResult.item?.barcode || manualInput,
                    sellingPrice: scanResult.item?.unitPriceUgx || 20000,
                  };
                  onScanResult(drugObj);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Add Scanned Item to Active Cart / Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
