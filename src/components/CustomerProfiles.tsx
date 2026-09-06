/**
 * CustomerProfiles.tsx — ZenithRx Patient Profiles & WhatsApp Refill Engine
 * Clean Architecture: Presentation Layer
 * Integrates patient EHR demographics, chronic disease cadence tracking,
 * clinical allergy safety warnings, loyalty points, and 1-click WhatsApp refill dispatch.
 */

import React, { useState } from 'react';
import { CustomerProfile } from '../types';
import { useCustomerProfiles } from '../hooks/useCustomerProfiles';
import { formatUGX } from '../services/formatters';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  ShieldAlert,
  Send,
  Calendar,
  HeartPulse,
  CheckCircle2,
  X,
  Award,
  AlertTriangle,
  Clock,
  Pill,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Activity,
  Check,
  CreditCard,
  Building2,
  ChevronRight
} from 'lucide-react';

interface CustomerProfilesProps {
  customers: CustomerProfile[];
  onAddCustomer: (customer: CustomerProfile) => void;
  pharmacyName?: string;
  pharmacyPhone?: string;
}

export const calculateAgeFromDob = (dobString?: string) => {
  if (!dobString) return { years: 0, months: 0, displayText: '0 Yrs' };
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return { years: 0, months: 0, displayText: '0 Yrs' };
  
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);

  if (years === 0) {
    return { years, months, displayText: `${months} ${months === 1 ? 'Month' : 'Months'} Old` };
  }
  
  return { years, months, displayText: `${years} ${years === 1 ? 'Year' : 'Years'} Old` };
};

export const CustomerProfiles: React.FC<CustomerProfilesProps> = ({
  customers: initialCustomers,
  onAddCustomer,
  pharmacyName = 'ZenithRx Pharmacy',
  pharmacyPhone = '+256 774 607782',
}) => {
  const {
    customers,
    selectedCustomer,
    setSelectedCustomerId,
    filteredCustomers,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    stats,
    showAddModal,
    setShowAddModal,
    showAddMedModal,
    setShowAddMedModal,
    lastDispatchedInfo,
    generateWhatsAppLink,
    handleDispatchWhatsAppRefill,
    handleMarkMedicationRefilled,
    handleAddChronicMedication,
    handleCreateCustomer,
  } = useCustomerProfiles({
    initialCustomers,
    pharmacyName,
    pharmacyPhone,
    onAddCustomer,
  });

  // Add Patient Form State
  const [formData, setFormData] = useState<Partial<CustomerProfile>>({
    name: '',
    phone: '+256 7',
    email: '',
    dateOfBirth: '1995-05-20',
    age: 31,
    gender: 'Female',
    bloodGroup: 'O+',
    allergies: [],
    chronicConditions: [],
    insuranceProvider: 'Jubilee Health Insurance Uganda',
    policyNumber: 'JUB-0000',
    loyaltyPoints: 100,
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  // Add Medication Form State
  const [medFormData, setMedFormData] = useState({
    drugName: '',
    dosage: '1 tablet',
    frequency: 'Once daily with water',
    daysSupply: 30,
  });

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !formData.allergies?.includes(allergyInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...(prev.allergies || []), allergyInput.trim()],
      }));
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies?.filter((_, i) => i !== idx),
    }));
  };

  const handleAddCondition = () => {
    if (conditionInput.trim() && !formData.chronicConditions?.includes(conditionInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        chronicConditions: [...(prev.chronicConditions || []), conditionInput.trim()],
      }));
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      chronicConditions: prev.chronicConditions?.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmitNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const calculatedAge = formData.dateOfBirth
      ? calculateAgeFromDob(formData.dateOfBirth).years
      : Number(formData.age) || 30;

    const newCust: CustomerProfile = {
      id: `CUST-${Math.floor(Math.random() * 900 + 100)}`,
      name: formData.name,
      phone: formData.phone,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      dateOfBirth: formData.dateOfBirth,
      age: calculatedAge,
      gender: formData.gender as 'Male' | 'Female',
      bloodGroup: formData.bloodGroup || 'O+',
      allergies: formData.allergies || [],
      chronicConditions: formData.chronicConditions || [],
      activePrescriptionsCount: 1,
      totalPurchasesCount: 1,
      totalAmountSpent: 35000,
      loyaltyPoints: Number(formData.loyaltyPoints) || 100,
      lastVisit: new Date().toISOString().split('T')[0],
      insuranceProvider: formData.insuranceProvider,
      policyNumber: formData.policyNumber,
      chronicMedications: [],
    };

    handleCreateCustomer(newCust);
    setFormData({
      name: '',
      phone: '+256 7',
      email: '',
      age: 35,
      gender: 'Female',
      bloodGroup: 'O+',
      allergies: [],
      chronicConditions: [],
      insuranceProvider: 'Jubilee Health Insurance Uganda',
      policyNumber: 'JUB-0000',
      loyaltyPoints: 100,
    });
  };

  const handleSubmitNewMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !medFormData.drugName.trim()) return;

    handleAddChronicMedication(selectedCustomer.id, medFormData);
    setMedFormData({
      drugName: '',
      dosage: '1 tablet',
      frequency: 'Once daily with water',
      daysSupply: 30,
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Banner & Refill Engine Header ───────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0B1E36] via-[#1E3A5F] to-[#0284C7] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Automated Outreach
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> ZenithRewards Loyalty Club
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Dossiers & WhatsApp Refill Engine</h1>
          <p className="text-slate-300 text-sm mt-0.5">
            Monitor chronic medication refill intervals, clinical allergies, loyalty points, and send 1-click WhatsApp alerts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* WhatsApp Dispatch Success Notification */}
      {lastDispatchedInfo && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>
              WhatsApp Refill Notification generated for <b>{lastDispatchedInfo.customerName}</b> ({lastDispatchedInfo.phone}) for <b>{lastDispatchedInfo.drugName}</b>!
            </span>
          </div>
          <span className="bg-emerald-800 text-white px-2 py-0.5 rounded text-[10px]">
            DISPATCH LOGGED
          </span>
        </div>
      )}

      {/* ─── Metric KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Registered Patients
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {stats.totalPatients}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Active pharmacy records</p>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Refills Due Now
            </span>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {stats.refillsDueCount} Patients
            </div>
            <p className="text-xs text-red-600 font-semibold mt-0.5">Ready for WhatsApp outreach</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chronic Care Cohort
            </span>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.totalChronicPatients} Patients
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Continuous therapy tracking</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ZenithPoints Accrued
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.totalLoyaltyPoints.toLocaleString()} Pts
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Active customer loyalty pool</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Master-Detail Layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient Directory & Filters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search and Category Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient name, phone, allergy, condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'all', label: 'All Patients' },
                { id: 'refillsDue', label: '⚠️ Refills Due' },
                { id: 'chronic', label: '🩺 Chronic Cohort' },
                { id: 'loyalty', label: '⭐ VIP Loyalty' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === f.id
                      ? 'bg-[#0B1E36] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">No matching patients</p>
                <p className="mt-1">Try another search or clear the filter.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                const hasRefillDue = cust.chronicMedications?.some((m) => m.status === 'Due');

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 shadow-md ring-2 ring-sky-400/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                            cust.gender === 'Female'
                              ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                              : 'bg-gradient-to-br from-sky-500 to-blue-600'
                          }`}
                        >
                          {cust.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {cust.name}
                            {hasRefillDue && (
                              <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-300 animate-pulse">
                                REFILL DUE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{cust.age} yrs • {cust.gender}</span>
                            <span>•</span>
                            <span className="font-mono">{cust.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Award className="w-3 h-3" /> {cust.loyaltyPoints || 0} pts
                        </span>
                      </div>
                    </div>

                    {/* Chronic badges */}
                    {cust.chronicConditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {cust.chronicConditions.map((cond, i) => (
                          <span
                            key={i}
                            className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded"
                          >
                            {cond}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Patient Comprehensive Dossier */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCustomer ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 text-xs">
              {/* Header profile row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md ${
                      selectedCustomer.gender === 'Female'
                        ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                        : 'bg-gradient-to-br from-sky-500 to-blue-600'
                    }`}
                  >
                    {selectedCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {selectedCustomer.name}
                      <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        {selectedCustomer.id}
                      </span>
                    </h3>
                    <div className="text-slate-500 text-xs mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedCustomer.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedCustomer.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick WhatsApp outreach button for whole patient */}
                <a
                  href={generateWhatsAppLink(selectedCustomer)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Chat</span>
                </a>
              </div>

              {/* Patient Demographics & Insurance Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[11px]">Age & Gender</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedCustomer.age} yrs • {selectedCustomer.gender}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Blood Group</span>
                  <p className="font-bold text-red-600 mt-0.5">
                    {selectedCustomer.bloodGroup || 'O+'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">ZenithPoints Balance</span>
                  <p className="font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> {selectedCustomer.loyaltyPoints || 0} pts
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Insurance Policy</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {selectedCustomer.policyNumber || 'Self-Pay'}
                  </p>
                </div>
              </div>

              {/* Clinical Allergy Warnings */}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-red-600 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Known Clinical Allergies & Contraindications</span>
                </div>
                {selectedCustomer.allergies.length === 0 ? (
                  <p className="text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    No known drug allergies reported.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.allergies.map((al, i) => (
                      <span
                        key={i}
                        className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> {al}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronic Medication Regimen & Cadence Tracker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Pill className="w-4 h-4 text-sky-500" />
                    <span>Chronic Medication Cadence & WhatsApp Refill Engine</span>
                  </div>

                  <button
                    onClick={() => setShowAddMedModal(true)}
                    className="text-xs text-sky-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medication Cadence
                  </button>
                </div>

                {(!selectedCustomer.chronicMedications || selectedCustomer.chronicMedications.length === 0) ? (
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No active refill schedules</p>
                    <p className="text-[11px] mt-0.5">Add a chronic medication to enable automated WhatsApp refill alerts.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCustomer.chronicMedications.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {med.drugName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                med.status === 'Due'
                                  ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
                                  : med.status === 'Upcoming'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              }`}
                            >
                              {med.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {med.dosage} • {med.frequency} • {med.daysSupply} days pack
                          </div>
                          <div className="text-slate-400 text-[10px] mt-0.5 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-sky-500" />
                            Next Refill Date: <b>{med.nextRefillDate}</b>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleDispatchWhatsAppRefill(
                                selectedCustomer,
                                med.drugName,
                                med.nextRefillDate
                              )
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs shadow-sm transition-all"
                            title="Open WhatsApp 1-click refill chat"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp Refill Alert</span>
                          </button>

                          <button
                            onClick={() =>
                              handleMarkMedicationRefilled(selectedCustomer.id, med.drugName)
                            }
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold rounded-lg flex items-center gap-1 text-xs border border-sky-200 dark:border-sky-800"
                            title="Dispense & advance next refill date by 30 days (+50 pts)"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Refilled (+50 Pts)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase History & Financial Lifetime Value */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-slate-500 text-xs">
                <div>
                  <span>Total Purchases: </span>
                  <b className="text-slate-800 dark:text-slate-200">{selectedCustomer.totalPurchasesCount} orders</b>
                </div>
                <div>
                  <span>Lifetime Spend: </span>
                  <b className="text-emerald-600">{formatUGX(selectedCustomer.totalAmountSpent)}</b>
                </div>
                <div>
                  <span>Last Visit: </span>
                  <b className="text-slate-800 dark:text-slate-200">{selectedCustomer.lastVisit}</b>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Select a Patient</h4>
              <p className="text-xs mt-1">Select a patient on the left to view clinical history and dispatch WhatsApp refill links.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Patient Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Plus className="w-5 h-5 text-sky-500" />
                Register New Patient Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPatient} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ronald Mukasa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">WhatsApp Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+256 701 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 p-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="patient@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Date of Birth *</span>
                    <span className="text-[10px] font-bold text-cyan-500">Derives Patient Age</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const { years } = calculateAgeFromDob(dob);
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: dob,
                        age: years,
                      }));
                    }}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Calculated Age</span>
                    <span className="text-[10px] text-emerald-500 font-bold">Auto-derived</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      readOnly
                      value={formData.age ?? 0}
                      className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-black cursor-not-allowed opacity-90"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-sky-600 dark:text-sky-400 font-bold">
                      {calculateAgeFromDob(formData.dateOfBirth).displayText}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Initial Loyalty Points</label>
                  <input
                    type="number"
                    value={formData.loyaltyPoints}
                    onChange={(e) => setFormData({ ...formData, loyaltyPoints: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Insurance Scheme / Policy</label>
                  <input
                    type="text"
                    placeholder="e.g. Jubilee Health - JUB-99120"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Allergies tag builder */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Known Clinical Allergies</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    className="px-3 py-2 bg-red-100 text-red-700 font-bold rounded-lg"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.allergies?.map((al, idx) => (
                    <span key={idx} className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-red-200">
                      {al} <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveAllergy(idx)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Chronic conditions tag builder */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Chronic Conditions</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Diabetes, Asthma"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="px-3 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.chronicConditions?.map((cond, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-indigo-200">
                      {cond} <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveCondition(idx)} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md"
                >
                  Save Patient Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Chronic Medication Modal ──────────────────────────────────── */}
      {showAddMedModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Pill className="w-5 h-5 text-sky-500" />
                Add Chronic Medication Refill Cadence
              </h3>
              <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewMedication} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Medication Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Losartan 50mg"
                  value={medFormData.drugName}
                  onChange={(e) => setMedFormData({ ...medFormData, drugName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Dosage Unit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 tablet"
                  value={medFormData.dosage}
                  onChange={(e) => setMedFormData({ ...medFormData, dosage: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Dosing Frequency *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Once daily in morning"
                  value={medFormData.frequency}
                  onChange={(e) => setMedFormData({ ...medFormData, frequency: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Days Pack Supply (Refill Cadence)</label>
                <input
                  type="number"
                  min={7}
                  max={90}
                  value={medFormData.daysSupply}
                  onChange={(e) => setMedFormData({ ...medFormData, daysSupply: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md"
                >
                  Save Cadence Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
