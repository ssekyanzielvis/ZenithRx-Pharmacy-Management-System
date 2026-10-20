import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Pill,
  Clock,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Edit3,
  Download,
  Share2,
  Trash2,
  CheckCircle,
  Plus,
  X,
  Printer,
  Calendar,
  Sparkles,
  ChevronRight,
  LogOut,
  Building2,
  Activity,
  AlertCircle,
  BadgeAlert,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
} from 'lucide-react';
import { PatientProfile, patientAuthService } from '../../services/patientAuthService';
import { StockReservation, advancedStockService } from '../../services/advancedStockAndScanningService';

interface PatientProfilePageProps {
  patient: PatientProfile;
  reservations?: StockReservation[];
  onNavigateTab: (tab: string, payload?: any) => void;
  onRefreshReservations?: () => void;
  onSignOut?: () => void;
  onGoBack?: () => void;
}

export const PatientProfilePage: React.FC<PatientProfilePageProps> = ({
  patient,
  reservations = [],
  onNavigateTab,
  onRefreshReservations,
  onSignOut,
  onGoBack,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState(patient.fullName);
  const [editDistrict, setEditDistrict] = useState(patient.district || 'Kampala (Central)');
  const [editAddress, setEditAddress] = useState(patient.address || '');
  const [editNin, setEditNin] = useState(patient.nin || '');
  const [editDob, setEditDob] = useState(patient.dateOfBirth || '');
  const [editGender, setEditGender] = useState<'Female' | 'Male' | 'Other'>(patient.gender || 'Female');
  const [editAllergies, setEditAllergies] = useState<string[]>(patient.allergies || []);
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [editConditions, setEditConditions] = useState<string[]>(patient.chronicConditions || []);
  const [newConditionInput, setNewConditionInput] = useState('');

  // Emergency specs
  const [emergencyContactName, setEmergencyContactName] = useState('Dr. Joshua Mukasa (Physician)');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+256 701 999 888');
  const [bloodGroup, setBloodGroup] = useState('O+ Positive');

  const handleAddAllergy = () => {
    if (!newAllergyInput.trim()) return;
    if (!editAllergies.includes(newAllergyInput.trim())) {
      setEditAllergies([...editAllergies, newAllergyInput.trim()]);
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (item: string) => {
    setEditAllergies(editAllergies.filter((a) => a !== item));
  };

  const handleAddCondition = () => {
    if (!newConditionInput.trim()) return;
    if (!editConditions.includes(newConditionInput.trim())) {
      setEditConditions([...editConditions, newConditionInput.trim()]);
    }
    setNewConditionInput('');
  };

  const handleRemoveCondition = (item: string) => {
    setEditConditions(editConditions.filter((c) => c !== item));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    patientAuthService.updateProfile({
      fullName: editFullName.trim(),
      district: editDistrict,
      address: editAddress.trim(),
      nin: editNin.trim() || undefined,
      dateOfBirth: editDob || undefined,
      gender: editGender,
      allergies: editAllergies,
      chronicConditions: editConditions,
    });

    setIsEditModalOpen(false);
    setSaveSuccessMsg('Clinical health profile updated successfully.');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleCancelReservation = (resId: string) => {
    if (window.confirm('Cancel this 24-hour medication counter reservation?')) {
      advancedStockService.cancelReservation(resId);
      if (onRefreshReservations) onRefreshReservations();
    }
  };

  const formatExpiryTime = (dateInput: any) => {
    if (!dateInput) return '24 hours from hold';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return 'Within 24 hours';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today';
    } catch {
      return 'Within 24 hours';
    }
  };

  const activeReservations = reservations.filter((r) => r.status === 'active');

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-300 pb-16" style={{ display: 'flex', flexDirection: 'column', gap: '0.8cm' }}>
      
      {/* ── 1. Page Header (Spacious, Clear & Professional with >=0.6cm Gutter) ── */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800"
        style={{ paddingTop: '0.3cm', paddingBottom: '0.8cm', marginBottom: '0.2cm' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35cm' }}>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Personal EHR &amp; Digital Passport
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NDA Verified</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Patient Health Passport
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed pt-0.5">
            Your centralized medical identity, clinical safety baselines, active pharmacy counter holds, and verified digital prescription records.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3.5 shrink-0 pt-2 md:pt-0">
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
            onClick={() => onNavigateTab('passport')}
            className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black text-xs sm:text-sm flex items-center gap-2.5 border border-emerald-300/80 dark:border-emerald-800/80 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
          >
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Digital Health Passport &amp; ID Card</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => {
              if (onSignOut) {
                onSignOut();
              } else {
                patientAuthService.logout();
              }
            }}
            className="px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 2. Main Grid Layout (Calculated, Spacious 12-Column Grid) ── */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-12 items-start"
        style={{ gap: '0.8cm' }}
      >
        
        {/* ── Left Column: Primary Health Passport & Clinical Baseline (8 Cols) ── */}
        <div 
          className="lg:col-span-8"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.7cm' }}
        >
          
          {/* Card A: Patient Identity & Contact Details */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '0.8cm', marginBottom: '0.2cm' }}
          >
            <div 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.5cm', marginBottom: '0.5cm' }}
            >
              <div className="flex items-center gap-5">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shadow-emerald-600/20 shrink-0 select-none">
                  {patient.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'PT'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {patient.fullName}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Patient ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{patient.id}</span>
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 self-start sm:self-center">
                <span>NIN:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{patient.nin || 'NOT DOCUMENTED'}</span>
              </div>
            </div>

            {/* Profile Field Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{patient.phone}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">District / Region</span>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{patient.district}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registered Date</span>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{patient.registeredAt || '2026 Active'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Documented Allergies & Hard Safety Invariants */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '0.8cm', marginBottom: '0.2cm' }}
          >
            <div 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.5cm', marginBottom: '0.5cm' }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <BadgeAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Known Allergies &amp; Cross-Sensitivities
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hard safety checks automatically block dispensing of contraindicated medicines.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Allergy</span>
              </button>
            </div>

            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="space-y-4 pt-1">
                <div className="flex flex-wrap gap-3">
                  {patient.allergies.map((allergy, idx) => (
                    <div
                      key={idx}
                      className="px-4.5 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{allergy}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Pharmacists and dispensing algorithms will receive high-severity invariant warnings if any order contains these allergens.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No severe drug or food allergies documented on your profile.</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full shrink-0 self-start sm:self-center">
                  Safety Clearance Active
                </span>
              </div>
            )}
          </div>

          {/* Card C: Chronic Conditions & Treatment Plans */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '0.8cm', marginBottom: '0.2cm' }}
          >
            <div 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.5cm', marginBottom: '0.5cm' }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Chronic Medical Conditions
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Used for automated refill reminders and clinical interaction monitoring.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Condition</span>
              </button>
            </div>

            {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
              <div className="space-y-4 pt-1">
                <div className="flex flex-wrap gap-3">
                  {patient.chronicConditions.map((condition, idx) => (
                    <div
                      key={idx}
                      className="px-4.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xs"
                    >
                      <HeartPulse className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{condition}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => onNavigateTab('refills')}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Scheduled Refill Reminders</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-500">
                No chronic conditions currently registered. You can add conditions like Hypertension, Asthma, or Diabetes for automated adherence tracking.
              </div>
            )}
          </div>

          {/* Card D: Active 24-Hour Pharmacy Counter Reservations */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '0.8cm' }}
          >
            <div 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.5cm', marginBottom: '0.5cm' }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Active Counter Reservations ({activeReservations.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Physical stock held at partner pharmacy counters for your 24h pickup.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('search')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer self-start sm:self-center"
              >
                <span>Browse Formulary</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeReservations.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activeReservations.map((res) => (
                  <div
                    key={res.id}
                    className="py-5.5 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          {res.quantityReserved}x {res.brandName}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Hold Active
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{res.pharmacyName}</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          Expires: {formatExpiryTime(res.expiresAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs select-all">
                        PIN: {res.reservationPin}
                      </div>

                      <button
                        onClick={() => handleCancelReservation(res.id)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Cancel reservation"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                <Pill className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No active 24h counter reservations
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  When medicines are running low, you can place a physical hold at any verified pharmacy branch without paying in advance.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigateTab('search')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>Search &amp; Reserve Medicines</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Right Column: Emergency Medical Specs & Quick Actions (4 Cols) ── */}
        <div 
          className="lg:col-span-4"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.7cm' }}
        >
          
          {/* Card E: Emergency Medical Specs Tile (Spacious, Calculative & Clear) */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '0.8cm', marginBottom: '0.2cm' }}
          >
            <div 
              className="flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.5cm', marginBottom: '0.6cm' }}
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Emergency Medical Specs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">First-responder triage parameters</p>
              </div>
            </div>

            {/* Structured Medical Vitals Rows with Explicit 0.45cm Vertical Gaps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45cm' }}>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blood Group</span>
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
                  {bloodGroup}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gender</span>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{patient.gender || 'Not specified'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date of Birth</span>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{patient.dateOfBirth || 'Not specified'}</span>
              </div>

              <div className="py-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Emergency Physician Contact
                </span>
                <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">{emergencyContactName}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">{emergencyContactPhone}</span>
                </div>
              </div>

              {/* Triage Notice Banner */}
              <div 
                className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200/90 leading-relaxed flex items-start gap-2.5 shadow-xs"
                style={{ marginTop: '0.2cm' }}
              >
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Emergency responders scan your Digital ID to access critical drug safety parameters during an emergency triage.</span>
              </div>
            </div>

            <div style={{ marginTop: '0.6cm' }}>
              <button
                onClick={() => onNavigateTab('passport')}
                className="w-full py-4.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-98"
              >
                <QrCode className="w-4.5 h-4.5 text-white" />
                <span>Open Digital Health Passport</span>
              </button>
            </div>
          </div>

          {/* Card F: Health Record Quick Actions (Un-carded, Clean & Spacious List) */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '0.8cm' }}
          >
            <div 
              className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.4cm', marginBottom: '0.5cm' }}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Health Record Quick Actions
                </h3>
                <p className="text-[11px] text-slate-400">Direct shortcuts to medical services</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Action 1: Prescriptions & OCR */}
              <button
                onClick={() => onNavigateTab('prescriptions')}
                className="w-full py-4.5 px-2 flex items-center justify-between text-left group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-pointer first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-sm text-slate-900 dark:text-white block tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      Prescriptions &amp; OCR
                    </span>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5 truncate">
                      View &amp; upload doctor validation slips
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950 transition-all shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Action 2: Refill & Adherence */}
              <button
                onClick={() => onNavigateTab('refills')}
                className="w-full py-4.5 px-2 flex items-center justify-between text-left group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-pointer first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-sm text-slate-900 dark:text-white block tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      Refill &amp; Adherence
                    </span>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5 truncate">
                      Track routine medication timings
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950 transition-all shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Action 3: Report Adverse Reaction */}
              <button
                onClick={() => onNavigateTab('adr')}
                className="w-full py-4.5 px-2 flex items-center justify-between text-left group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-pointer first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-sm text-slate-900 dark:text-white block tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                      Report Side Effect (ADR)
                    </span>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5 truncate">
                      Direct escalation to NDA safety desk
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:bg-rose-50 dark:group-hover:bg-rose-950 transition-all shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Back Navigation Bar ── */}
      {onGoBack && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Previous Page</span>
          </button>
        </div>
      )}

      {/* ── Modal: Edit Profile & Clinical Baseline ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#0B131F] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Update Clinical Profile
                  </h3>
                  <p className="text-xs text-slate-400">Keep your safety baselines up-to-date.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    District / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    National ID (NIN)
                  </label>
                  <input
                    type="text"
                    value={editNin}
                    onChange={(e) => setEditNin(e.target.value)}
                    placeholder="e.g. CM0303110KW57F"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Known Allergies Tag Editor */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Known Drug &amp; Food Allergies
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllergyInput}
                    onChange={(e) => setNewAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllergy();
                      }
                    }}
                    placeholder="e.g. Penicillin, Sulfa, NSAIDs, Aspirin"
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer active:scale-98"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {editAllergies.map((allergy, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="hover:text-rose-900 dark:hover:text-white cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Chronic Conditions Tag Editor */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chronic Medical Conditions
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newConditionInput}
                    onChange={(e) => setNewConditionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCondition();
                      }
                    }}
                    placeholder="e.g. Hypertension, Asthma, Type 2 Diabetes"
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer active:scale-98"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {editConditions.map((cond, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2"
                    >
                      {cond}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(cond)}
                        className="hover:text-emerald-900 dark:hover:text-white cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3">
                <button
                  type="submit"
                  className="w-full py-4.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-98"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
