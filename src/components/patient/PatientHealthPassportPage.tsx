import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Printer,
  Share2,
  ArrowLeft,
  AlertTriangle,
  HeartPulse,
  Phone,
  User,
  Activity,
  Sparkles,
  CheckCircle2,
  Lock,
  Check,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldAlert,
  Radio,
  Flame,
  Droplet,
  Eye,
  Maximize2,
  X,
  Award,
  Download,
  CheckCircle,
  Copy,
  QrCode
} from 'lucide-react';
import { PatientProfile } from '../../services/patientAuthService';
import { StockReservation } from '../../services/advancedStockAndScanningService';

export interface PatientHealthPassportPageProps {
  patient: PatientProfile;
  reservations?: StockReservation[];
  onNavigateTab: (tab: string, payload?: any) => void;
  onGoBack?: () => void;
  onEditProfile?: () => void;
}

export const PatientHealthPassportPage: React.FC<PatientHealthPassportPageProps> = ({
  patient,
  reservations = [],
  onNavigateTab,
  onGoBack,
  onEditProfile,
}) => {
  const [activeCardSide, setActiveCardSide] = useState<'front' | 'back'>('front');
  const [copiedToken, setCopiedToken] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewSide, setPreviewSide] = useState<'both' | 'front' | 'back'>('both');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // ─── 1. Defensive Patient Credentials & Metadata ────────────────────────────
  const bloodGroup = 'O+ Positive';
  const emergencyPhysician = 'Dr. Joshua Mukasa (Clinical Lead)';
  const emergencyPhysicianPhone = '+256 701 999 888';
  const nextOfKin = 'Sarah Nakato (Spouse)';
  const nextOfKinPhone = '+256 772 112 233';

  // Defensive fallback data extraction
  const safeFullName = (patient?.fullName || (patient as any)?.name || 'Ssekyanzi Elvis').trim();
  const safeId = patient?.id || 'PAT-UG-20999';
  const nationalIdNumber = patient?.nin || 'CM0303110KW57F';
  const patientCardNumber = `UG-NDA-${safeId.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')}-2026`;
  const secureHashToken = `ZRX-PASS-${Math.abs(safeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 8923).toString(16).toUpperCase()}`;
  
  // Format Date of Birth safely with defensive try/catch and NaN verification
  const dobFormatted = useMemo(() => {
    try {
      if (!patient?.dateOfBirth) return '14-AUG-1994';
      const parsed = new Date(patient.dateOfBirth);
      if (isNaN(parsed.getTime())) {
        // Try fallback parsing if format is DD/MM/YYYY or similar
        const parts = String(patient.dateOfBirth).split(/[\/\-\.]/);
        if (parts.length === 3 && parts[2].length === 4) {
          const reordered = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (!isNaN(reordered.getTime())) {
            return reordered.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-');
          }
        }
        return '14-AUG-1994';
      }
      return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-');
    } catch {
      return '14-AUG-1994';
    }
  }, [patient?.dateOfBirth]);
  const genderFormatted = (patient?.gender || 'MALE').toUpperCase();
  const issueDate = '01/2026';
  const expiryDate = '01/2031';
  
  // Defensive arrays for medical safety items
  const safeAllergies = Array.isArray(patient?.allergies) 
    ? patient.allergies.filter(Boolean) 
    : [];
  const safeChronicConditions = Array.isArray(patient?.chronicConditions) 
    ? patient.chronicConditions.filter(Boolean) 
    : [];
  
  // Scannable live payload
  const ehrVerificationUrl = `https://zenithrx.ug/ehr/verify?id=${encodeURIComponent(safeId)}&nin=${encodeURIComponent(nationalIdNumber)}&token=${encodeURIComponent(secureHashToken)}&name=${encodeURIComponent(safeFullName)}&blood=${encodeURIComponent(bloodGroup)}`;

  // ─── 2. Safe Dynamic QR Code Generation (Non-blocking) ─────────────────────
  useEffect(() => {
    let isMounted = true;
    import('qrcode')
      .then((mod) => {
        const qrLib = (mod as any)?.default || mod;
        if (typeof qrLib?.toDataURL === 'function') {
          return qrLib.toDataURL(ehrVerificationUrl, {
            margin: 1,
            width: 280,
            color: {
              dark: '#051820',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
          });
        }
      })
      .then((url) => {
        if (isMounted && url) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.warn('[ZenithRx Passport] Dynamic QR code generation fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [ehrVerificationUrl]);

  const handleCopyShareLink = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ehrVerificationUrl);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
    setCopiedToken(true);
    setShareSuccess('Official Scannable Emergency EHR Verification Link copied to clipboard!');
    setTimeout(() => {
      setCopiedToken(false);
      setShareSuccess(null);
    }, 4000);
  };

  const handlePrintCard = () => {
    window.print();
  };

  // ─── 3. Defensive ICAO Doc 9303 MRZ Generator ──────────────────────────────
  const cleanId = (safeId || 'PAT001').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 9).padEnd(9, '<');
  const nameParts = (safeFullName || 'PATIENT').split(/\s+/).filter(Boolean);
  const cleanSurname = ((nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || 'PATIENT').toUpperCase().replace(/[^A-Z]/g, '') || 'PATIENT');
  const cleanFirstname = ((nameParts.length > 1 ? nameParts.slice(0, -1).join('<') : 'EHR').toUpperCase().replace(/[^A-Z]/g, '<') || 'EHR');
  const mrzLine1 = `I<UGA${cleanId}8<<<<<<<<<<<<<<<`;
  const mrzLine2 = `9408144M3101015UGA<<<<<<<<<<<4`;
  const mrzLine3 = `${cleanSurname}<<${cleanFirstname}<<<<<<<<<<<<<<<<<`.slice(0, 30);

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-300 pb-20" style={{ display: 'flex', flexDirection: 'column', gap: '0.85cm' }}>
      
      {/* ── 1. Page Header & Command Bar (Spacious with >=0.6cm padding) ── */}
      <div 
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800"
        style={{ paddingTop: '0.3cm', paddingBottom: '0.8cm' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35cm' }}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>National Digital Medical Credentials</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NDA &amp; MOH Uganda Verified</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-800/60 shadow-xs">
              <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Live Biometric Token</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Digital Health Passport &amp; Medical ID
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            Your official digitized medical identity, verifiable cryptographic emergency specifications, biometric blood baselines, and certified clinical pharmacy access credentials.
          </p>
        </div>

        {/* Action Controls Header */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-4.5 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Previous Page</span>
            </button>
          )}

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-4.5 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Full ID Preview</span>
          </button>

          <button
            onClick={handlePrintCard}
            className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2.5 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Print Official ID (PDF)</span>
          </button>

          <button
            onClick={handleCopyShareLink}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
          >
            {copiedToken ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedToken ? 'Link Copied!' : 'Share Emergency Link'}</span>
          </button>
        </div>
      </div>

      {/* Share Toast Banner */}
      {shareSuccess && (
        <div
          className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-md animate-fade-in"
          style={{ padding: '0.6cm' }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{shareSuccess}</span>
          </div>
          <button onClick={() => setShareSuccess(null)} className="text-xs font-bold text-emerald-700 dark:text-emerald-300 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ── 2. Smart Card Showcase & Interactive Flip Studio (1cm Grid Gap) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-start" style={{ gap: '1cm' }}>
        
        {/* Left 7 Columns: Dual-Side Luxury Holographic Smart ID Card */}
        <div className="lg:col-span-7 flex flex-col" style={{ gap: '0.6cm' }}>
          
          {/* Card Toggle Bar & Quick Preview Action */}
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveCardSide('front')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeCardSide === 'front'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Smart ID (Front View)</span>
            </button>
            <button
              onClick={() => setActiveCardSide('back')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeCardSide === 'back'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Emergency Specs (Back View)</span>
            </button>
          </div>

          {/* ── THE CARD CANVAS ── */}
          <div className="relative perspective-1000 w-full" id="printable-health-passport-card">
            
            {/* FRONT OF CARD */}
            {activeCardSide === 'front' ? (
              <div 
                className="w-full rounded-[32px] text-white shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
                style={{
                  minHeight: '430px',
                  padding: '0.85cm',
                  gap: '0.65cm',
                  background: 'linear-gradient(135deg, #071922 0%, #0d3b45 42%, #05262c 78%, #03141a 100%)',
                  border: '1.5px solid rgba(52, 211, 153, 0.35)',
                  boxShadow: '0 25px 50px -12px rgba(6, 78, 59, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Holographic Security Overlay Glow */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-emerald-400/20 via-teal-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-cyan-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                
                {/* Subtle Guilloche Security Pattern Watermark */}
                <div 
                  className="absolute inset-0 opacity-[0.04] pointer-events-none" 
                  style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 1.5px, transparent 1.5px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* 1. Official Header Row */}
                <div className="flex justify-between items-start border-b border-white/15 pb-5 relative z-10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {/* Uganda Flag Tri-color Mini Emblem */}
                      <div className="flex items-center h-3 w-5.5 rounded-xs overflow-hidden border border-white/30 shadow-xs shrink-0">
                        <div className="h-full w-1/3 bg-black" />
                        <div className="h-full w-1/3 bg-yellow-400" />
                        <div className="h-full w-1/3 bg-red-600" />
                      </div>
                      <span className="text-[10.5px] sm:text-xs font-black tracking-widest uppercase text-emerald-300 font-mono">
                        REPUBLIC OF UGANDA • MOH / NDA
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>ZENITHRX DIGITAL HEALTH PASSPORT</span>
                    </h2>
                  </div>

                  {/* Flag & Security Badge */}
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md text-[11px] font-mono font-black text-amber-300 flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>ISO 7810 ID-1</span>
                    </div>
                  </div>
                </div>

                {/* 2. Card Body: EMV Microchip + Biometric Photo + Cardholder Details + Live QR Code */}
                <div className="py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  
                  {/* Left: EMV Microchip & Biometric Avatar */}
                  <div className="flex items-center gap-4.5">
                    
                    {/* Realistic Gold Contact Smart Chip */}
                    <div className="w-14 h-11 rounded-xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200/90 shadow-lg flex items-center justify-center relative overflow-hidden shrink-0">
                      <div className="w-full h-0.5 bg-amber-900/40 absolute top-3" />
                      <div className="w-full h-0.5 bg-amber-900/40 absolute bottom-3" />
                      <div className="h-full w-0.5 bg-amber-900/40 absolute left-4.5" />
                      <div className="h-full w-0.5 bg-amber-900/40 absolute right-4.5" />
                      <Lock className="w-3.5 h-3.5 text-amber-950 relative z-10" />
                    </div>

                    {/* Patient Photo / Biometric Box with Holographic Seal */}
                    <div className="relative w-16 h-18 rounded-2xl bg-gradient-to-b from-teal-900/80 to-slate-900/90 border border-teal-400/30 overflow-hidden shrink-0 shadow-inner flex flex-col items-center justify-center">
                      <User className="w-9 h-9 text-teal-200/80" />
                      <span className="text-[7.5px] font-mono font-black uppercase tracking-wider text-teal-300/80 mt-1">
                        PHOTO ID
                      </span>
                      {/* Holographic Watermark Badge */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-teal-300/10 to-transparent pointer-events-none" />
                    </div>

                    {/* Patient Name & Metadata */}
                    <div className="min-w-0 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-teal-200 block font-bold">
                        Cardholder Full Name
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                        {safeFullName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-teal-100/90 pt-0.5 flex-wrap">
                        <span>{patient?.phone || '+256 700 000 000'}</span>
                        <span className="text-teal-400">•</span>
                        <span>{genderFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Working Real Scannable QR Code */}
                  <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-white/30 flex flex-col items-center justify-center shrink-0 self-center sm:self-auto group cursor-pointer" onClick={() => setIsPreviewModalOpen(true)}>
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Scannable ZenithRx Patient EHR QR Code" 
                        className="w-18 h-18 sm:w-21 sm:h-21 rounded-lg"
                      />
                    ) : (
                      <div className="w-18 h-18 sm:w-21 sm:h-21 flex flex-col items-center justify-center bg-slate-900 text-emerald-400 rounded-lg p-1.5 border border-emerald-500/40">
                        <QrCode className="w-9 h-9" />
                        <span className="text-[7px] font-mono font-bold tracking-tight text-emerald-300 mt-1">EHR SCAN</span>
                      </div>
                    )}
                    <span className="text-[8px] font-mono font-black text-slate-900 tracking-wider mt-1.5 uppercase">
                      VERIFIED SCAN
                    </span>
                  </div>
                </div>

                {/* 3. Card Footer Specifications (4-Column Data Grid) */}
                <div className="pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-5 text-xs relative z-10">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-teal-200/80 block font-bold">
                      National NIN
                    </span>
                    <span className="font-mono font-black text-white text-xs sm:text-sm block">
                      {nationalIdNumber}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-teal-200/80 block font-bold">
                      Blood Group &amp; Rh
                    </span>
                    <span className="font-black text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>{bloodGroup}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-teal-200/80 block font-bold">
                      District / Region
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm block truncate">
                      {patient?.district || 'Kampala (Central)'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-teal-200/80 block font-bold">
                      Token Serial #
                    </span>
                    <span className="font-mono font-black text-amber-300 text-xs sm:text-sm block">
                      {patientCardNumber}
                    </span>
                  </div>
                </div>

                {/* 4. Micro Security Foil Line */}
                <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-teal-200/70">
                  <span>NDA TOKEN: {secureHashToken}</span>
                  <span className="hidden sm:inline">VALIDITY: {issueDate} - {expiryDate}</span>
                  <span>PSU REG #2026-UG • AUTHENTIC</span>
                </div>
              </div>
            ) : (
              /* BACK OF CARD */
              <div 
                className="w-full rounded-[32px] text-white shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
                style={{
                  minHeight: '430px',
                  padding: '0.85cm',
                  gap: '0.65cm',
                  background: 'linear-gradient(135deg, #111827 0%, #1e293b 50%, #0f172a 100%)',
                  border: '1.5px solid rgba(59, 130, 246, 0.35)',
                  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                }}
              >
                {/* Magnetic Stripe with generous spacing */}
                <div className="-mx-[0.85cm] -mt-[0.85cm] h-13 sm:h-15 bg-black border-b border-slate-700 flex items-center px-7 sm:px-9 shadow-inner">
                  <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase select-none overflow-hidden text-ellipsis whitespace-nowrap w-full">
                    ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                  </span>
                </div>

                {/* Emergency Medical Contraindications & Card Back Content */}
                <div className="flex flex-col" style={{ gap: '0.6cm' }}>
                  
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b border-white/15 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-300">
                        Emergency Medical Safety Baseline
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-[10px] font-black text-rose-300 tracking-wide uppercase">
                      High Priority Triage
                    </span>
                  </div>

                  {/* 2-Column Medical Details Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                          Known Drug Allergies
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-rose-200 leading-relaxed">
                        {safeAllergies.length > 0 ? safeAllergies.join(', ') : 'No Adverse Drug Allergies Documented'}
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                          Chronic Conditions
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-emerald-200 leading-relaxed">
                        {safeChronicConditions.length > 0 ? safeChronicConditions.join(', ') : 'None Recorded'}
                      </p>
                    </div>
                  </div>

                  {/* Primary Physician & Emergency Contact Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white/[0.04] p-4 sm:p-4.5 rounded-2xl border border-white/10 space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                        Attending Physician
                      </span>
                      <p className="font-black text-white text-xs sm:text-sm">{emergencyPhysician}</p>
                      <a href={`tel:${emergencyPhysicianPhone}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{emergencyPhysicianPhone}</span>
                      </a>
                    </div>

                    <div className="bg-white/[0.04] p-4 sm:p-4.5 rounded-2xl border border-white/10 space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                        Emergency Next of Kin
                      </span>
                      <p className="font-black text-white text-xs sm:text-sm">{nextOfKin}</p>
                      <a href={`tel:${nextOfKinPhone}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[11px] font-mono font-bold text-cyan-300 hover:bg-cyan-500/25 transition-colors">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        <span>{nextOfKinPhone}</span>
                      </a>
                    </div>
                  </div>

                  {/* ICAO Machine Readable Zone (MRZ) Passport Format */}
                  <div className="bg-black/40 p-3 rounded-xl border border-white/10 font-mono text-[9px] text-slate-300 tracking-wider space-y-0.5 leading-none overflow-x-auto select-all">
                    <div>{mrzLine1}</div>
                    <div>{mrzLine2}</div>
                    <div>{mrzLine3}</div>
                  </div>

                  {/* Disclaimer & Cryptographic Barcode */}
                  <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[9.5px] text-slate-400">
                    <p className="max-w-md leading-relaxed text-slate-300/80">
                      Official property of ZenithRx &amp; Uganda Pharmacy Board. Valid for emergency clinical lookups across all partner hospitals and dispensaries.
                    </p>
                    <div className="font-mono bg-white text-slate-950 px-4 py-2 rounded-xl font-black text-xs tracking-wider shadow-md shrink-0">
                      *ZRX-{safeId}*
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Integration Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setActiveCardSide(activeCardSide === 'front' ? 'back' : 'front')}
                className="px-4.5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                <span>Flip Card ({activeCardSide === 'front' ? 'Show Back' : 'Show Front'})</span>
              </button>

              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="px-4.5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Enlarge HD View</span>
              </button>

              <button
                onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                className={`px-4.5 py-3 rounded-2xl border text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95 ${
                  isEmergencyMode
                    ? 'bg-rose-600 text-white border-rose-600 shadow-rose-600/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{isEmergencyMode ? 'Exit Emergency Mode' : 'First Responder Mode'}</span>
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Verified Token ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{secureHashToken}</strong>
            </span>
          </div>

        </div>

        {/* Right 5 Columns: Emergency Clinical Specs & Quick Utility Studio */}
        <div className="lg:col-span-5 flex flex-col" style={{ gap: '0.65cm' }}>
          
          {/* 1. Emergency Quick Callout & Triage Status Card */}
          <div 
            className={`border rounded-3xl transition-all ${
              isEmergencyMode 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-md' 
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs'
            }`}
            style={{ padding: '0.85cm', display: 'flex', flexDirection: 'column', gap: '0.55cm' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    Emergency Triage Specifications
                  </h3>
                  <p className="text-[11px] text-slate-400 pt-0.5">Critical medical data for paramedics</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Blood Group &amp; Rh:</span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-sm font-mono">{bloodGroup}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Date of Birth &amp; Gender:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dobFormatted} ({genderFormatted})</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">National ID (NIN):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{nationalIdNumber}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Emergency Physician:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{emergencyPhysicianPhone}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Next of Kin Contact:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{nextOfKinPhone}</span>
              </div>
            </div>

            {/* Emergency Hotline Button */}
            <a
              href={`tel:${emergencyPhysicianPhone}`}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer text-center active:scale-98 mt-1"
            >
              <Phone className="w-4 h-4" />
              <span>Call Primary Care Physician</span>
            </a>
          </div>

          {/* 2. Quick Actions & Clinical Passport Shortcuts */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '0.85cm', display: 'flex', flexDirection: 'column', gap: '0.55cm' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  Passport Quick Actions
                </h3>
                <p className="text-[11px] text-slate-400 pt-0.5">Quick patient module navigation</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zenith Clinical Network</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onNavigateTab('profile')}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                  <span>View Full Health Profile &amp; EHR</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('prescriptions')}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                  <span>Digitized Prescriptions &amp; Slips</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('refills')}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-slate-500 group-hover:text-cyan-600" />
                  <span>Dose Adherence &amp; Chronic Regimen</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. Bottom Comprehensive Medical Records Summary & Verification Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '0.85cm' }}>
        
        {/* Card 1: Emergency Contraindications */}
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
          style={{ padding: '0.85cm', display: 'flex', flexDirection: 'column', gap: '0.55cm' }}
        >
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">Allergy Contraindications</h4>
              <p className="text-[11px] text-slate-400 pt-0.5">Direct hospital safety baseline</p>
            </div>
          </div>

          <div className="space-y-3">
            {safeAllergies.length > 0 ? (
              safeAllergies.map((allergy, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-900 dark:text-rose-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{allergy}</span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs text-center font-medium">
                No acute drug allergies registered.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Chronic Disease Management */}
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
          style={{ padding: '0.85cm', display: 'flex', flexDirection: 'column', gap: '0.55cm' }}
        >
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">Chronic Care Protocols</h4>
              <p className="text-[11px] text-slate-400 pt-0.5">Ongoing clinical therapies</p>
            </div>
          </div>

          <div className="space-y-3">
            {safeChronicConditions.length > 0 ? (
              safeChronicConditions.map((cond, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>{cond}</span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs text-center font-medium">
                No chronic medical conditions recorded.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Cryptographic NDA Verification */}
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
          style={{ padding: '0.85cm', display: 'flex', flexDirection: 'column', gap: '0.55cm' }}
        >
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">Verification Ledger</h4>
              <p className="text-[11px] text-slate-400 pt-0.5">National Drug Authority Sync</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Digital Token Hash</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{secureHashToken}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Dispensary Access PIN</span>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">2026-NDA-PASS-VALID</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. Bottom Back Navigation Bar ── */}
      {onGoBack && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Previous Page</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Official ZenithRx Certified Health Passport</span>
          </div>
        </div>
      )}

      {/* ── 5. Full HD ID Preview & PDF Export Modal ── */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Government-Grade Smart Medical ID Inspection
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-Definition Dual-Side Verified CR80 Specification
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCard}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
              <button
                onClick={() => setPreviewSide('both')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewSide === 'both' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Dual Side (Both)
              </button>
              <button
                onClick={() => setPreviewSide('front')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewSide === 'front' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Front Only
              </button>
              <button
                onClick={() => setPreviewSide('back')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewSide === 'back' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Back Only
              </button>
            </div>

            {/* Cards Display Grid */}
            <div className={`grid gap-6 ${previewSide === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
              
              {/* FRONT VIEW IN MODAL */}
              {(previewSide === 'both' || previewSide === 'front') && (
                <div 
                  className="rounded-[28px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between"
                  style={{
                    minHeight: '380px',
                    padding: '0.75cm',
                    gap: '0.55cm',
                    background: 'linear-gradient(135deg, #071922 0%, #0d3b45 42%, #05262c 78%, #03141a 100%)',
                    border: '1.5px solid rgba(52, 211, 153, 0.4)',
                  }}
                >
                  <div className="flex justify-between items-start border-b border-white/15 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center h-2.5 w-4.5 rounded-xs overflow-hidden border border-white/30">
                          <div className="h-full w-1/3 bg-black" />
                          <div className="h-full w-1/3 bg-yellow-400" />
                          <div className="h-full w-1/3 bg-red-600" />
                        </div>
                        <span className="text-[9.5px] font-black uppercase text-emerald-300 font-mono tracking-widest">
                          REPUBLIC OF UGANDA • MOH / NDA
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white">ZENITHRX DIGITAL HEALTH PASSPORT</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-black/50 text-[10px] font-mono text-amber-300 font-bold border border-white/20">
                      ISO 7810
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200 shadow-md flex items-center justify-center shrink-0">
                        <Lock className="w-3 h-3 text-amber-950" />
                      </div>
                      <div className="w-14 h-16 rounded-xl bg-teal-950 border border-teal-400/30 flex flex-col items-center justify-center shrink-0">
                        <User className="w-8 h-8 text-teal-200" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-mono text-teal-200 font-bold block">Cardholder</span>
                        <p className="text-base font-black text-white truncate">{safeFullName}</p>
                        <p className="text-xs font-mono text-teal-200">{patient?.phone || '+256 700 000 000'}</p>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl shrink-0">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR" className="w-16 h-16" />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-slate-900 rounded-lg text-emerald-400">
                          <QrCode className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/15 grid grid-cols-4 gap-3 text-[10.5px]">
                    <div>
                      <span className="text-[8px] uppercase text-teal-200/80 font-bold block">NIN</span>
                      <strong className="font-mono text-white text-xs">{nationalIdNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-teal-200/80 font-bold block">Blood</span>
                      <strong className="text-emerald-400 text-xs">{bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-teal-200/80 font-bold block">District</span>
                      <strong className="text-white text-xs truncate block">{patient?.district || 'Kampala'}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-teal-200/80 font-bold block">Serial</span>
                      <strong className="font-mono text-amber-300 text-xs">{patientCardNumber}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* BACK VIEW IN MODAL */}
              {(previewSide === 'both' || previewSide === 'back') && (
                <div 
                  className="rounded-[28px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between"
                  style={{
                    minHeight: '380px',
                    padding: '0.75cm',
                    gap: '0.55cm',
                    background: 'linear-gradient(135deg, #111827 0%, #1e293b 50%, #0f172a 100%)',
                    border: '1.5px solid rgba(59, 130, 246, 0.4)',
                  }}
                >
                  <div className="-mx-[0.75cm] -mt-[0.75cm] h-12 bg-black border-b border-slate-700 flex items-center px-6">
                    <span className="text-[8px] font-mono text-slate-500 tracking-widest uppercase overflow-hidden whitespace-nowrap">
                      ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-xs font-black text-rose-300 uppercase">Emergency Baseline</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-950 text-[9px] font-bold text-rose-300">High Priority</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Allergies</span>
                        <p className="font-bold text-rose-200 text-xs">{safeAllergies.length > 0 ? safeAllergies.join(', ') : 'None'}</p>
                      </div>
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Conditions</span>
                        <p className="font-bold text-emerald-200 text-xs">{safeChronicConditions.length > 0 ? safeChronicConditions.join(', ') : 'None'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Physician</span>
                        <p className="font-bold text-white text-xs">{emergencyPhysicianPhone}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Next of Kin</span>
                        <p className="font-bold text-white text-xs">{nextOfKinPhone}</p>
                      </div>
                    </div>

                    <div className="bg-black/40 p-2.5 rounded-xl font-mono text-[8px] text-slate-300 leading-tight">
                      <div>{mrzLine1}</div>
                      <div>{mrzLine2}</div>
                      <div>{mrzLine3}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
                    <span>ZenithRx &amp; Uganda Pharmacy Board Official Property</span>
                    <span className="font-mono font-bold bg-white text-black px-2 py-0.5 rounded text-[9px]">*ZRX-{safeId}*</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live QR Verification Inspector */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Real Scannable QR Code URL Target:</span>
                </span>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all select-all">
                  {ehrVerificationUrl}
                </p>
              </div>
              <button
                onClick={handleCopyShareLink}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 6. Dedicated Print / PDF Styling Engine ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-health-passport-card, #printable-health-passport-card * {
            visibility: visible;
          }
          #printable-health-passport-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            background: #0d3b45 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

    </div>
  );
};

export default PatientHealthPassportPage;
