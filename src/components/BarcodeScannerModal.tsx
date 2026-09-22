import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Camera, CheckCircle2, Search, AlertCircle } from 'lucide-react';
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
  const [hasCameraError, setHasCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Hardware Laser Scanner Listener
    let barcodeBuffer = '';
    let timeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          const matchedDrug = drugs.find(d => d.barcode === barcodeBuffer);
          if (matchedDrug) {
            setScannedDrug(matchedDrug);
          }
        }
        barcodeBuffer = '';
        if (timeout) clearTimeout(timeout);
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 50); // Scanners type very fast
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 2. WebRTC Camera Initialization
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, drugs]);

  if (!isOpen) return null;

  const handleSimulateScan = (drugItem?: DrugItem) => {
    const targetDrug = drugItem || drugs.find((d) => d.barcode === manualBarcode) || drugs[0];
    setScannedDrug(targetDrug);
  };

  return (
    <div className="fixed inset-0 bg-[#0B1E36]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white text-[#263B33] w-full max-w-md rounded-2xl shadow-2xl border border-[#E3ECE8] p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5E7A70] hover:text-[#263B33] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-50 text-[#20A66A] rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <QrCode className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#263B33]">Medication Barcode Scanner</h3>
          <p className="text-xs text-[#5E7A70]">Point hardware scanner or select sample barcode to scan SKU</p>
        </div>

        {/* Camera Scanner Simulation Frame */}
        <div className="relative w-full h-44 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8] flex flex-col items-center justify-center overflow-hidden">
          {/* Laser scanning beam line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#20A66A] animate-pulse z-10"></div>

          {!hasCameraError ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="text-center z-10">
              <AlertCircle className="w-7 h-7 text-amber-500 mx-auto mb-1" />
              <p className="text-[11px] text-[#5E7A70]">Camera access inactive (Hardware laser active)</p>
            </div>
          )}

          {!hasCameraError && (
            <div className="z-10 flex flex-col items-center pointer-events-none mt-8">
               <Camera className="w-9 h-9 text-[#5E7A70]/40" />
               <p className="text-[11px] text-[#5E7A70] font-mono mt-2 bg-white/80 px-2 py-0.5 rounded border border-[#E3ECE8]">Align medication barcode inside frame</p>
            </div>
          )}
        </div>

        {/* Quick Test Barcode Picks */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#5E7A70] uppercase tracking-wider block">Quick Scan Sample Drugs:</label>
          <div className="grid grid-cols-2 gap-2">
            {drugs.slice(0, 4).map((d) => (
              <button
                key={d.id}
                onClick={() => handleSimulateScan(d)}
                className="p-2 rounded-xl bg-[#F8FBFA] hover:bg-emerald-50 border border-[#E3ECE8] hover:border-emerald-300 text-left cursor-pointer transition-all"
              >
                <p className="text-xs font-bold text-[#263B33] truncate">{d.brandName}</p>
                <p className="text-[10px] font-mono text-[#5E7A70]">{d.barcode}</p>
              </button>
            ))}
          </div>
        </div>

        {scannedDrug && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Item Identified
              </span>
              <span className="font-mono text-emerald-900 font-bold">UGX {scannedDrug.sellingPrice}</span>
            </div>
            <p className="font-bold text-[#263B33] text-sm">{scannedDrug.brandName}</p>
            <p className="text-[#5E7A70] italic">{scannedDrug.genericName}</p>
            <button
              onClick={() => {
                onScanResult(scannedDrug);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-[#20A66A] hover:bg-[#1B8E5A] text-white font-bold text-xs uppercase tracking-wider cursor-pointer mt-1 shadow-xs transition"
            >
              Add to POS Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
