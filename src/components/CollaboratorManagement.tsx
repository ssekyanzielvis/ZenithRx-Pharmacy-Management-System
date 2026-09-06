import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Key,
  Lock,
  X,
  RefreshCw,
  Award,
  Table,
  Calendar,
  Clock,
  Check,
  Minus
} from 'lucide-react';
import {
  Collaborator,
  SystemRole,
  getCollaborators,
  inviteCollaborator,
  updateCollaboratorStatus,
  TECHNICAL_MD_11_22_3_ROLE_MATRIX,
  RoleMatrixEntry
} from '../services/collaboratorService';

interface CollaboratorManagementProps {
  tenantId?: string;
  tenantName?: string;
  onClose?: () => void;
}

export const CollaboratorManagement: React.FC<CollaboratorManagementProps> = ({
  tenantId = 'CLIENT-001',
  tenantName = 'Mulago Care Pharmacy',
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'collaborators' | 'matrix'>('collaborators');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<SystemRole>('Supervisor / Pharmacist');
  const [tenantScope, setTenantScope] = useState(`Own tenant (${tenantName})`);
  const [expiresAt, setExpiresAt] = useState('');
  const [psuNo, setPsuNo] = useState('');
  const [ndaNo, setNdaNo] = useState('');
  const [permissions, setPermissions] = useState({
    canDispense: true,
    canOverrideStock: true,
    canQuarantine: true,
    canManagePricing: false,
    canViewFinancials: false,
    canInviteUsers: false,
    canExportData: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCollaborators(tenantId);
      setCollaborators(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleRoleChange = (newRole: SystemRole) => {
    setRole(newRole);
    if (newRole === 'Super Admin' || newRole === 'Tenant Admin') {
      setTenantScope(newRole === 'Super Admin' ? 'All tenants' : `Own tenant (${tenantName})`);
      setPermissions({
        canDispense: true,
        canOverrideStock: true,
        canQuarantine: true,
        canManagePricing: true,
        canViewFinancials: true,
        canInviteUsers: true,
        canExportData: true,
      });
    } else if (newRole === 'Supervisor / Pharmacist') {
      setTenantScope(`Own tenant (${tenantName})`);
      setPermissions({
        canDispense: true,
        canOverrideStock: true,
        canQuarantine: true,
        canManagePricing: false,
        canViewFinancials: false,
        canInviteUsers: false,
        canExportData: true,
      });
    } else if (newRole === 'Inventory Manager') {
      setTenantScope(`Own tenant (${tenantName})`);
      setPermissions({
        canDispense: false,
        canOverrideStock: true,
        canQuarantine: true,
        canManagePricing: false,
        canViewFinancials: false,
        canInviteUsers: false,
        canExportData: true,
      });
    } else if (newRole === 'Cashier / Dispenser') {
      setTenantScope(`Own tenant (${tenantName})`);
      setPermissions({
        canDispense: true,
        canOverrideStock: false,
        canQuarantine: false,
        canManagePricing: false,
        canViewFinancials: true,
        canInviteUsers: false,
        canExportData: false,
      });
    } else if (newRole === 'Finance Officer') {
      setTenantScope(`Own tenant (${tenantName})`);
      setPermissions({
        canDispense: false,
        canOverrideStock: false,
        canQuarantine: false,
        canManagePricing: true,
        canViewFinancials: true,
        canInviteUsers: false,
        canExportData: true,
      });
    } else {
      setTenantScope('Regulatory Scope');
      setPermissions({
        canDispense: false,
        canOverrideStock: false,
        canQuarantine: false,
        canManagePricing: false,
        canViewFinancials: false,
        canInviteUsers: false,
        canExportData: true,
      });
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    await inviteCollaborator({
      tenantId,
      tenantScope,
      fullName,
      email,
      phone,
      role,
      psuRegistrationNo: psuNo || undefined,
      ndaLicenseNo: ndaNo || undefined,
      expiresAt: expiresAt || undefined,
      permissions,
    });

    setFullName('');
    setEmail('');
    setPhone('');
    setPsuNo('');
    setNdaNo('');
    setExpiresAt('');
    setIsInviteOpen(false);
    loadData();
  };

  const handleToggleStatus = async (collab: Collaborator) => {
    const nextStatus = collab.status === 'Active' ? 'Suspended' : 'Active';
    await updateCollaboratorStatus(collab.id, nextStatus);
    loadData();
  };

  const renderPrivilegeBadge = (val: string) => {
    switch (val) {
      case 'Full':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
            Full
          </span>
        );
      case 'Configurable':
        return (
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[11px] border border-sky-500/30">
            Configurable
          </span>
        );
      case 'Limited':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
            Limited
          </span>
        );
      case 'Tenant only':
        return (
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[11px] border border-indigo-500/30">
            Tenant only
          </span>
        );
      case 'Read-only':
        return (
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[11px] border border-blue-500/30">
            Read-only
          </span>
        );
      case 'No':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[11px] font-semibold">
            No
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                Admin &amp; Delegated Collaborator Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> technical.md §11.22.3 Compliant
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Manage clinical dispensers, inventory managers, cashiers, delegated admin collaborators, and review the official role matrix for {tenantName}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('collaborators')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'collaborators'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Collaborators ({collaborators.length})
            </button>
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'matrix'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Role Matrix §11.22.3
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-sky-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Invite Collaborator
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Subtab 1: Collaborators List */}
      {activeSubTab === 'collaborators' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Assigned Scope</th>
                  <th className="py-3 px-4">Accreditation</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Access Term</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {collaborators.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{c.fullName}</span>
                      <span className="text-xs text-slate-400">ID: {c.id} • Active {c.lastActive}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20 whitespace-nowrap">
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                      {c.tenantScope || c.tenantId}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.psuRegistrationNo ? (
                        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> {c.psuRegistrationNo}
                        </span>
                      ) : c.ndaLicenseNo ? (
                        <span className="text-xs text-purple-400 font-mono flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> {c.ndaLicenseNo}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">Standard Staff</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> {c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {c.expiresAt ? (
                        <span className="flex items-center gap-1 text-amber-400 font-mono">
                          <Clock className="w-3.5 h-3.5" /> {c.expiresAt}
                        </span>
                      ) : (
                        <span className="text-slate-500">Indefinite</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.status === 'Invited'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          c.status === 'Active'
                            ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/20'
                        }`}
                      >
                        {c.status === 'Active' ? 'Revoke / Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Complete 11.22.3 Admin and Collaborator Role Matrix Table */}
      {activeSubTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                Technical.md §11.22.3 Admin &amp; Collaborator Role Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Privilege model supporting full admin control, multi-tenant isolation, and delegated collaborator access with revocable scopes.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Legend:</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold">Full</span>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded font-semibold">Configurable</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold">Limited</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded font-semibold">No</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Tenant Scope</th>
                  <th className="py-3 px-3">User Mgmt</th>
                  <th className="py-3 px-3">Inventory</th>
                  <th className="py-3 px-3">Prescriptions</th>
                  <th className="py-3 px-3">POS</th>
                  <th className="py-3 px-3">Payments</th>
                  <th className="py-3 px-3">Claims</th>
                  <th className="py-3 px-3">Reports</th>
                  <th className="py-3 px-3">CSV Export</th>
                  <th className="py-3 px-3">Collaborator Grants</th>
                  <th className="py-3 px-3">System Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {TECHNICAL_MD_11_22_3_ROLE_MATRIX.map((entry) => (
                  <tr key={entry.role} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      {entry.role}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {entry.tenantScope}
                    </td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.userMgmt)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.inventory)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.prescriptions)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.pos)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.payments)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.claims)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.reports)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.csvExport)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.collaboratorGrants)}</td>
                    <td className="py-3 px-3">{renderPrivilegeBadge(entry.systemSettings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Collaborator Governance Rules Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Collaborator Governance Rules (§11.22.3)
            </span>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong className="text-slate-200">Grant Authority:</strong> A collaborator is granted by a super admin or tenant admin with explicit authority to do so.</li>
              <li><strong className="text-slate-200">Explicit &amp; Revocable Scope:</strong> Collaborator scope must be explicit and revocable at any time.</li>
              <li><strong className="text-slate-200">Sensitive Actions:</strong> High-risk operations (dispense overrides, stock write-offs) enforce dual-authorization workflows.</li>
              <li><strong className="text-slate-200">Time-Bound Access:</strong> Delegated admin access is logged to the NDA audit trail and supports time-bound expiration dates.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Invite Delegated Collaborator</h3>
                  <p className="text-xs text-slate-400">Grant scoped, time-bound system privileges (§11.22.3)</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pharm. Brenda Namubiru"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="brenda@mulagocare.ug"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+256 772 000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">11.22.3 System Role *</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as SystemRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Super Admin">Super Admin (All Tenants)</option>
                    <option value="Admin Collaborator">Admin Collaborator (Configurable)</option>
                    <option value="Tenant Admin">Tenant Admin (Full Tenant)</option>
                    <option value="Supervisor / Pharmacist">Supervisor / Pharmacist</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Cashier / Dispenser">Cashier / Dispenser</option>
                    <option value="Finance Officer">Finance Officer</option>
                    <option value="External Auditor (NDA)">External Auditor (NDA)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Explicit Assigned Scope *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Own tenant (Mulago Care)"
                    value={tenantScope}
                    onChange={(e) => setTenantScope(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">PSU / NDA License No.</label>
                  <input
                    type="text"
                    placeholder="PSU/REG/2024/..."
                    value={psuNo}
                    onChange={(e) => setPsuNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Access Expiration (Time-Bound)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Granular Permissions */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Fine-Grained Permissions
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDispense}
                      onChange={(e) => setPermissions({ ...permissions, canDispense: e.target.checked })}
                      className="rounded border-slate-700 text-sky-500"
                    />
                    Prescription Dispensing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canQuarantine}
                      onChange={(e) => setPermissions({ ...permissions, canQuarantine: e.target.checked })}
                      className="rounded border-slate-700 text-sky-500"
                    />
                    Stock Quarantine Control
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canOverrideStock}
                      onChange={(e) => setPermissions({ ...permissions, canOverrideStock: e.target.checked })}
                      className="rounded border-slate-700 text-sky-500"
                    />
                    Clinical Dispense Overrides
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewFinancials}
                      onChange={(e) => setPermissions({ ...permissions, canViewFinancials: e.target.checked })}
                      className="rounded border-slate-700 text-sky-500"
                    />
                    Financials &amp; Cash-Up
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-600/20"
                >
                  Grant Collaborator Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CollaboratorManagement;
