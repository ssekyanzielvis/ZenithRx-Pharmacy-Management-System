import React, { useState } from 'react';
import { CustomerProfile } from '../types';
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
  X
} from 'lucide-react';

interface CustomerProfilesProps {
  customers: CustomerProfile[];
  onAddCustomer: (customer: CustomerProfile) => void;
}

export const CustomerProfiles: React.FC<CustomerProfilesProps> = ({
  customers,
  onAddCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(customers[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sentReminder, setSentReminder] = useState(false);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState<Partial<CustomerProfile>>({
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
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const handleSendRefillReminder = () => {
    setSentReminder(true);
    setTimeout(() => setSentReminder(false), 3500);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newCust: CustomerProfile = {
      id: `CUST-${Math.floor(Math.random() * 900 + 100)}`,
      name: formData.name,
      phone: formData.phone,
      email: formData.email || `${formData.name.toLowerCase().replace(' ', '.')}@gmail.com`,
      age: Number(formData.age) || 30,
      gender: formData.gender as 'Male' | 'Female',
      bloodGroup: formData.bloodGroup || 'O+',
      allergies: formData.allergies || [],
      chronicConditions: formData.chronicConditions || [],
      activePrescriptionsCount: 1,
      totalPurchasesCount: 1,
      totalAmountSpent: 2500,
      lastVisit: '2026-07-22',
      insuranceProvider: formData.insuranceProvider,
      policyNumber: formData.policyNumber,
    };

    onAddCustomer(newCust);
    setSelectedCustomer(newCust);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-400" />
            Customer Medication Profiles
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            Complete patient medical history, chronic disease management, allergy warnings, and WhatsApp refill dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Customer Search & Queue Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient name, phone number, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none text-slate-800"
            />
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-900">{cust.name}</p>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                      {cust.bloodGroup}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{cust.phone}</span>
                    <span className="font-semibold text-slate-700">
                      {cust.activePrescriptionsCount} Active Rx
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Detail Profile Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedCustomer ? (
            <div className="space-y-6">
              
              {/* Header profile info */}
              <div className="flex flex-wrap items-start justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedCustomer.age} Yrs • {selectedCustomer.gender} • Blood Group: {selectedCustomer.bloodGroup}
                  </p>
                </div>

                <button
                  onClick={handleSendRefillReminder}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Refill WhatsApp Alert</span>
                </button>
              </div>

              {sentReminder && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Automated refill notification sent to {selectedCustomer.phone} via Quantum WhatsApp Gateway!
                </div>
              )}

              {/* Patient Contact & Insurance Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Contact Details
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{selectedCustomer.phone}</p>
                  <p className="text-xs text-slate-600">{selectedCustomer.email}</p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5" /> Insurance Scheme
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {selectedCustomer.insuranceProvider || 'Self-Pay / Cash'}
                  </p>
                  <p className="text-xs text-slate-600">Policy #: {selectedCustomer.policyNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Known Allergies & Chronic Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Allergies Box */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <span className="text-xs font-black text-rose-900 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> Known Drug Allergies
                  </span>
                  {selectedCustomer.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCustomer.allergies.map((alg, i) => (
                        <span key={i} className="bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {alg}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No known drug allergies reported.</p>
                  )}
                </div>

                {/* Chronic Conditions Box */}
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
                  <span className="text-xs font-black text-sky-900 uppercase flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-sky-600" /> Chronic Conditions
                  </span>
                  {selectedCustomer.chronicConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCustomer.chronicConditions.map((cond, i) => (
                        <span key={i} className="bg-sky-100 text-sky-900 border border-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No chronic medical conditions listed.</p>
                  )}
                </div>

              </div>

              {/* Purchase & Refill Stats */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pharmacy Visits</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{selectedCustomer.totalPurchasesCount} Visits</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Spend Value</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">
                    UGX {selectedCustomer.totalAmountSpent.toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Last Visit Date</p>
                  <p className="text-lg font-black text-sky-900 mt-0.5">{selectedCustomer.lastVisit}</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a patient profile</div>
          )}
        </div>

      </div>

      {/* Register Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Register New Patient Profile</h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Full Patient Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Phone Number (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Insurance Provider</label>
                  <input
                    type="text"
                    value={formData.insuranceProvider}
                    onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block">Policy Number</label>
                  <input
                    type="text"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer mt-2"
              >
                Save Patient Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
