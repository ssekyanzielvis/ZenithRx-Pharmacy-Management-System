import React, { useState } from 'react';
import { QrCode, X, Camera, CheckCircle2, Search } from 'lucide-react';
import { DrugItem } from '../types';

interface BarcodeScannerModalProps {
  drugs: DrugItem[];
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (drug: DrugItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  drugs,
  isOpen,
  onClose,
  onScanResult,
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannedDrug, setScannedDrug] = useState<DrugItem | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (drugItem?: DrugItem) => {
    const targetDrug = drugItem || drugs.find((d) => d.barcode === manualBarcode) || drugs[0];
    setScannedDrug(targetDrug);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white w-full max-w-md rounded-2xl shadow-2xl border border-sky-800 p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/40">
            <QrCode className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="text-lg font-black tracking-tight text-white">Quantum Barcode Scanner</h3>
          <p className="text-xs text-sky-200">Point scanner or select a test barcode to scan SKU</p>
        </div>

        {/* Camera Scanner Simulation Frame */}
        <div className="relative w-full h-48 bg-slate-950 rounded-xl border-2 border-sky-500/50 flex flex-col items-center justify-center overflow-hidden">
          {/* Laser scanning beam line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-lg shadow-cyan-400"></div>

          <Camera className="w-10 h-10 text-sky-400/40" />
          <p className="text-[11px] text-slate-400 font-mono mt-2">Align medication barcode inside box</p>
        </div>

        {/* Quick Test Barcode Picks */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-sky-300 uppercase block">Quick Scan Sample Drugs:</label>
          <div className="grid grid-cols-2 gap-2">
            {drugs.slice(0, 4).map((d) => (
              <button
                key={d.id}
                onClick={() => handleSimulateScan(d)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-sky-900/60 border border-slate-700 hover:border-sky-500 text-left cursor-pointer transition-all"
              >
                <p className="text-xs font-bold text-white truncate">{d.brandName}</p>
                <p className="text-[10px] font-mono text-sky-300">{d.barcode}</p>
              </button>
            ))}
          </div>
        </div>

        {scannedDrug && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Item Identified!
              </span>
              <span className="font-mono text-emerald-200 font-bold">UGX {scannedDrug.sellingPrice}</span>
            </div>
            <p className="font-extrabold text-white text-sm">{scannedDrug.brandName}</p>
            <p className="text-slate-300 italic">{scannedDrug.genericName}</p>
            <button
              onClick={() => {
                onScanResult(scannedDrug);
                onClose();
              }}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer mt-1"
            >
              Add to POS Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
