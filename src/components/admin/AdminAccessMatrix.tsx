import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, XCircle, Info } from 'lucide-react';

const MODULES = [
  { key: 'pos', name: 'POS Counter & Cash-Up' },
  { key: 'prescriptions', name: 'Prescription Queue' },
  { key: 'dispensingRegister', name: 'NDA Dispensing Register' },
  { key: 'inventory', name: 'Stock & Batches' },
  { key: 'expiry', name: 'FEFO Expiry Management' },
  { key: 'reordering', name: 'Purchase Orders' },
  { key: 'supplierManagement', name: 'Supplier Procurement' },
  { key: 'adrReporting', name: 'ADR Pharmacovigilance' },
  { key: 'insurance', name: 'Insurance Claims' },
  { key: 'reports', name: 'Financial & Sales P&L' },
  { key: 'collaborators', name: 'Staff Account Provisioning' },
  { key: 'ownerDashboard', name: 'Multi-Branch Owner Hub' },
  { key: 'adminControlPlane', name: 'Quantum Admin Control Plane' },
];

const ROLES = [
  'Super Admin',
  'Supervising Pharmacist',
  'Assistant Pharmacist',
  'Pharmacy Technician',
  'POS Cashier / Dispenser',
  'Store & Inventory Manager',
  'Finance & Claims Officer',
  'Pharmacy Owner',
  'Patient',
];

// PoLP matrix lookup
const MATRIX: Record<string, Record<string, boolean>> = {
  pos: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': true,
    'Pharmacy Technician': true,
    'POS Cashier / Dispenser': true,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  prescriptions: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': true,
    'Pharmacy Technician': true,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': false,
    'Patient': false,
  },
  dispensingRegister: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': true,
    'Pharmacy Technician': true,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  inventory: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': true,
    'Pharmacy Technician': true,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': true,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  expiry: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': true,
    'Pharmacy Technician': true,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': true,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  reordering: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': false,
    'Pharmacy Technician': false,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': true,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  supplierManagement: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': false,
    'Pharmacy Technician': false,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': true,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  adrReporting: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': true,
    'Pharmacy Technician': true,
    'POS Cashier / Dispenser': true,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': true,
  },
  insurance: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': true,
    'Pharmacy Technician': false,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': true,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  reports: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': false,
    'Pharmacy Technician': false,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': true,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  collaborators: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': false,
    'Pharmacy Technician': false,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  ownerDashboard: {
    'Super Admin': true,
    'Supervising Pharmacist': true,
    'Assistant Pharmacist': false,
    'Pharmacy Technician': false,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': true,
    'Patient': false,
  },
  adminControlPlane: {
    'Super Admin': true,
    'Supervising Pharmacist': false,
    'Assistant Pharmacist': false,
    'Pharmacy Technician': false,
    'POS Cashier / Dispenser': false,
    'Store & Inventory Manager': false,
    'Finance & Claims Officer': false,
    'Pharmacy Owner': false,
    'Patient': false,
  },
};

export const AdminAccessMatrix: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Principle of Least Privilege (PoLP) Matrix (§4.5)
            </span>
            <span className="text-xs font-semibold text-slate-500">Zero-Trust Role Verification</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Access Matrix &amp; RBAC Inspector
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Cryptographically audited entitlement matrix mapping platform roles against all statutory and financial modules.
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-50 dark:bg-slate-800/80 z-10">Module / Capability</th>
                {ROLES.map((r, i) => (
                  <th key={i} className="px-3 py-3 text-center min-w-[100px]">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {MODULES.map((mod) => (
                <tr key={mod.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                    {mod.name}
                  </td>
                  {ROLES.map((r, i) => {
                    const isAllowed = MATRIX[mod.key]?.[r];
                    return (
                      <td key={i} className="px-3 py-3 text-center">
                        {isAllowed ? (
                          <span className="inline-flex p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
                            <XCircle className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
