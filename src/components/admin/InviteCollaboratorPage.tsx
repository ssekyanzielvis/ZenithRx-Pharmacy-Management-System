import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  ArrowLeft,
  Clock,
  Sparkles,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Check,
  X,
  Layers,
  FileCheck2
} from 'lucide-react';
import {
  DelegatedCollaborator,
  createDelegatedCollaborator,
  generateCollaboratorEmailContent,
  getCollaboratorAcceptanceUrl,
  CollaboratorEmailContent
} from '../../services/adminControlPlaneService';

interface InviteCollaboratorPageProps {
  currentSuperAdminName?: string;
  onBack?: () => void;
  onSuccess?: (collaborator: DelegatedCollaborator) => void;
}

export const InviteCollaboratorPage: React.FC<InviteCollaboratorPageProps> = ({
  currentSuperAdminName = 'Dr. Arthur Ssenabulya',
  onBack,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Domain Admin' | 'Admin Collaborator'>('Domain Admin');
  const [domainScope, setDomainScope] = useState<DelegatedCollaborator['domainScope']>('CLINICAL_OVERSIGHT');
  const [expiryDays, setExpiryDays] = useState<number>(90);

  const [permissions, setPermissions] = useState({
    dispensingOverrides: true,
    policyConfiguration: true,
    aiSafetyControls: true,
    tenantOnboarding: false,
    tierManagement: false,
    posSettings: false,
    complianceExport: true,
    collaboratorManagement: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdCollaborator, setCreatedCollaborator] = useState<DelegatedCollaborator | null>(null);
  const [emailPreview, setEmailPreview] = useState<CollaboratorEmailContent | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-tune permissions when role or scope changes
  const handleScopeChange = (newScope: DelegatedCollaborator['domainScope'], newRole: 'Domain Admin' | 'Admin Collaborator') => {
    setDomainScope(newScope);
    setPermissions({
      dispensingOverrides: newScope === 'CLINICAL_OVERSIGHT' || newScope === 'FULL_PLATFORM',
      policyConfiguration: true,
      aiSafetyControls: newScope === 'CLINICAL_OVERSIGHT' || newScope === 'FULL_PLATFORM',
      tenantOnboarding: newRole === 'Admin Collaborator' || newScope === 'FULL_PLATFORM',
      tierManagement: newScope === 'FINANCE' || newScope === 'FULL_PLATFORM',
      posSettings: newScope === 'FINANCE' || newScope === 'FULL_PLATFORM',
      complianceExport: true,
      collaboratorManagement: newScope === 'FULL_PLATFORM',
    });
  };

  const handleRoleChange = (newRole: 'Domain Admin' | 'Admin Collaborator') => {
    setRole(newRole);
    handleScopeChange(domainScope, newRole);
  };

  const handleTogglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter the collaborator’s full name and title.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }

    setSubmitting(true);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      const result = await createDelegatedCollaborator(
        {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || '+256 700 000000',
          role,
          domainScope,
          assignedTenants: ['ALL'],
          grantedBy: currentSuperAdminName,
          expiresAt,
          permissions,
        },
        currentSuperAdminName
      );

      if (result.success && result.collaborator) {
        setCreatedCollaborator(result.collaborator);
        setEmailPreview(result.emailContent);
        if (onSuccess) {
          onSuccess(result.collaborator);
        }
      } else {
        setErrorMessage('Failed to issue collaborator invitation. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while creating the invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateExpiryDateString = () => {
    const d = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString();
  };

  const activePermissionsCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E3ECE8] p-5 sm:p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-[#F8FBFA] hover:bg-[#E8F7F0] text-[#5E7A70] hover:text-[#1E744F] border border-[#E3ECE8] transition cursor-pointer"
              title="Return to Delegated Collaborator Matrix"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#20A66A]" />
                SUPERUSER GOVERNANCE §11.17
              </span>
              <span className="text-[10px] text-[#5E7A70] font-semibold bg-[#F8FBFA] px-2 py-0.5 rounded-full border border-[#E3ECE8]">
                Authorizing Super Admin: {currentSuperAdminName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#263B33] tracking-tight flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-[#20A66A]" />
              Invite Delegated Collaborator
            </h2>
            <p className="text-xs text-[#5E7A70] mt-0.5 leading-relaxed">
              Designate scoped administrative privileges, define operational authority, and issue official statutory invitation credentials.
            </p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-bold text-[#5E7A70] hover:text-[#263B33] bg-[#F8FBFA] hover:bg-[#F0F5F3] border border-[#E3ECE8] rounded-xl transition cursor-pointer self-start sm:self-auto"
          >
            ← Back to Matrix
          </button>
        )}
      </div>

      {/* Main Page Body: Form or Success Confirmation */}
      {createdCollaborator && emailPreview ? (
        /* Invitation Dispatched Confirmation Card */
        <div className="bg-white border border-[#E3ECE8] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3 border-b border-[#E3ECE8] pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F7F0] border border-[#20A66A]/30 flex items-center justify-center text-[#20A66A]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#20A66A] block">
                INVITATION DISPATCHED &amp; RECORDED
              </span>
              <h3 className="text-lg font-black text-[#263B33]">
                Official Appointment Dispatched to {createdCollaborator.fullName}
              </h3>
              <p className="text-xs text-[#5E7A70] mt-0.5">
                Status is now <strong className="text-amber-700">INVITATION PENDING</strong> in the Superuser Authority Matrix until credentials are created.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#F8FBFA] border border-[#E3ECE8] p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-[#5E7A70] uppercase tracking-wider block">
                Appointment Summary
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Collaborator:</span>
                <strong className="text-[#263B33]">{createdCollaborator.fullName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Official Email:</span>
                <span className="font-mono text-[#263B33]">{createdCollaborator.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Role &amp; Scope:</span>
                <span className="text-[#20A66A] font-bold">{createdCollaborator.role} ({createdCollaborator.domainScope})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Time-Bound Expiry:</span>
                <span className="text-[#263B33]">{new Date(createdCollaborator.expiresAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Invitation Token:</span>
                <span className="font-mono text-[#5E7A70] bg-white px-2 py-0.5 rounded border border-[#E3ECE8] text-[10px]">
                  {createdCollaborator.invitationToken}
                </span>
              </div>
            </div>

            <div className="bg-[#E8F7F0] border border-[#20A66A]/30 p-4 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold text-[#1E744F] uppercase tracking-wider block">
                Direct Acceptance Link
              </span>
              <p className="text-[11px] text-[#263B33] leading-relaxed">
                The invitee receives this secure link to review their level of access rights and configure their custom password on the dedicated acceptance portal:
              </p>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getCollaboratorAcceptanceUrl(createdCollaborator.invitationToken || '')}
                  className="w-full px-3 py-2 bg-white border border-[#20A66A]/30 rounded-xl font-mono text-[10px] text-[#263B33]"
                />
                <button
                  onClick={() => handleCopy(getCollaboratorAcceptanceUrl(createdCollaborator.invitationToken || ''))}
                  className="px-3.5 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-[10px] rounded-xl flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <a
                  href={getCollaboratorAcceptanceUrl(createdCollaborator.invitationToken || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#20A66A] hover:text-[#1E744F] font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Invitee Dedicated Acceptance Page</span>
                </a>
              </div>
            </div>
          </div>

          {/* Outbound Delivery Status Banner & 1-Click Dispatch */}
          <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
            createdCollaborator.emailDeliveryStatus === 'SENT'
              ? 'bg-[#E8F7F0] border-[#20A66A]/40 text-[#1E744F]'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-start gap-2.5">
                {createdCollaborator.emailDeliveryStatus === 'SENT' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#20A66A] shrink-0 mt-0.5" />
                ) : (
                  <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {createdCollaborator.emailDeliveryStatus === 'SENT'
                      ? `Automated Email Successfully Transmitted via SMTP!`
                      : `Automated Background Mailer Status: Pending SMTP in .env`}
                  </h4>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {createdCollaborator.emailDeliveryStatus === 'SENT'
                      ? `An official appointment invitation was dispatched over the wire directly to ${createdCollaborator.email}.`
                      : `ZenithRx running on local development does not yet have outbound SMTP credentials (e.g. Gmail App Password) configured in your .env file. You can dispatch the invitation to ${createdCollaborator.email} immediately in 1 click using the buttons below:`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <a
                  href={`mailto:${createdCollaborator.email}?subject=${encodeURIComponent(emailPreview.subject)}&body=${encodeURIComponent(
                    `Dear ${createdCollaborator.fullName},\n\nYou have been officially appointed as ${createdCollaborator.role} (${createdCollaborator.domainScope}) on the ZenithRx Enterprise Pharmacy Management System by ${createdCollaborator.grantedBy}.\n\nPlease accept your invitation and configure your password here:\n${getCollaboratorAcceptanceUrl(createdCollaborator.invitationToken || '')}\n\nSecurity Token: ${createdCollaborator.invitationToken}\nAppointment Expiry: ${new Date(createdCollaborator.expiresAt).toLocaleDateString()}\n\nAuthorized Controls & Powers:\n${emailPreview.accessRightsDescription.join('\n')}\n\nNational Drug Authority (NDA) Uganda Statutory Compliance Notice.`
                  )}`}
                  className="px-4 py-2 bg-[#2F80C9] hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs w-full sm:w-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send in Gmail / Mail App</span>
                </a>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `Subject: ${emailPreview.subject}\n\nDear ${createdCollaborator.fullName},\n\nYou have been officially appointed as ${createdCollaborator.role} (${createdCollaborator.domainScope}) on ZenithRx by ${createdCollaborator.grantedBy}.\n\nAccept your appointment and set your password here:\n${getCollaboratorAcceptanceUrl(createdCollaborator.invitationToken || '')}\n\nToken: ${createdCollaborator.invitationToken}\nValid Until: ${new Date(createdCollaborator.expiresAt).toLocaleDateString()}\n\nAuthorized Powers:\n${emailPreview.accessRightsDescription.join('\n')}`
                    )
                  }
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Email Text</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3ECE8]">
            <button
              onClick={() => {
                setCreatedCollaborator(null);
                setEmailPreview(null);
                setFullName('');
                setEmail('');
                setPhone('');
              }}
              className="px-4 py-2 text-xs font-bold text-[#20A66A] hover:bg-[#E8F7F0] border border-[#20A66A]/30 rounded-xl transition cursor-pointer"
            >
              + Invite Another Collaborator
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="px-5 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Return to Authority Matrix</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Dedicated Invitation Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left 7 Columns: Form Controls */}
          <div className="lg:col-span-7 bg-white border border-[#E3ECE8] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            
            {/* Protocol Notice */}
            <div className="p-3.5 bg-[#F0F7F4] border border-[#20A66A]/20 rounded-2xl text-[11px] text-[#1E744F] leading-relaxed">
              <strong>Invitation Protocol:</strong> An official email with an immutable token and detailed access rights will be generated. The invitee must review what they can control and create their secure password to activate administrative authority.
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#D64545] rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Full Name & Title */}
              <div>
                <label className="block text-[#263B33] font-bold mb-1">Full Name &amp; Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Pharm. Brenda Namatovu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A]"
                  required
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#263B33] font-bold mb-1">Official Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. brenda.namatovu@zenithrx.ug"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#263B33] font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+256 700 123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A]"
                  />
                </div>
              </div>

              {/* Role & Domain Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#263B33] font-bold mb-1">Collaborator Role</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs font-semibold focus:outline-none focus:border-[#20A66A] cursor-pointer"
                  >
                    <option value="Domain Admin">Domain Admin</option>
                    <option value="Admin Collaborator">Admin Collaborator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#263B33] font-bold mb-1">Domain Scope</label>
                  <select
                    value={domainScope}
                    onChange={(e) => handleScopeChange(e.target.value as any, role)}
                    className="w-full px-3 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs font-semibold focus:outline-none focus:border-[#20A66A] cursor-pointer"
                  >
                    <option value="CLINICAL_OVERSIGHT">Clinical Oversight</option>
                    <option value="FINANCE">Finance &amp; Billing</option>
                    <option value="INVENTORY">Inventory Master</option>
                    <option value="SECURITY_COMPLIANCE">Security &amp; NDA</option>
                    <option value="FULL_PLATFORM">Full Platform</option>
                  </select>
                </div>
              </div>

              {/* Time-Bound Validity */}
              <div>
                <label className="block text-[#263B33] font-bold mb-1">Time-Bound Validity (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs font-bold focus:outline-none focus:border-[#20A66A]"
                />
              </div>

              {/* Access Rights & System Controls (§11.17) Checklist */}
              <div className="border border-[#E3ECE8] rounded-2xl p-4 bg-[#F8FBFA] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#263B33] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#20A66A]" />
                    ACCESS RIGHTS &amp; SYSTEM CONTROLS (§11.17)
                  </span>
                  <span className="text-[10px] text-[#5E7A70] font-medium">Visible in Invitee Email</span>
                </div>
                <p className="text-[10px] text-[#5E7A70] leading-snug">
                  Select which administrative powers this collaborator will control upon accepting their invitation:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  {[
                    { key: 'dispensingOverrides' as const, label: 'Clinical Dispensing & Opiate Overrides' },
                    { key: 'policyConfiguration' as const, label: 'Global Safety Policies & FEFO Rules' },
                    { key: 'aiSafetyControls' as const, label: 'AI Clinical Safety & Prompt Redaction' },
                    { key: 'tenantOnboarding' as const, label: 'Pharmacy Tenant Provisioning' },
                    { key: 'tierManagement' as const, label: 'SaaS Billing Tiers & Payer Tariffs' },
                    { key: 'posSettings' as const, label: 'POS Registers & Cashier Governance' },
                    { key: 'complianceExport' as const, label: 'NDA Regulatory & Audit Exports' },
                    { key: 'collaboratorManagement' as const, label: 'Collaborator Elevation Control' },
                  ].map((p) => {
                    const isChecked = permissions[p.key];
                    return (
                      <label
                        key={p.key}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-[#E8F7F0] border-[#20A66A]/40 text-[#1E744F] font-semibold shadow-xs'
                            : 'bg-white border-[#E3ECE8] text-[#5E7A70] hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(p.key)}
                          className="rounded text-[#20A66A] w-4 h-4 cursor-pointer"
                        />
                        <span className="line-clamp-1">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3ECE8]">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2.5 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Invitation Email &amp; Issue Token</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right 5 Columns: Live Real-Time Invitation Preview */}
          <div className="lg:col-span-5 space-y-4 sticky top-20">
            <div className="bg-white border border-[#E3ECE8] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-xs">
              <div className="border-b border-[#E3ECE8] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#20A66A] block">
                    LIVE DISPATCH PREVIEW
                  </span>
                  <h4 className="text-sm font-bold text-[#263B33]">
                    Invitee Experience Preview
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#E8F7F0] text-[#1E744F] font-bold text-[10px] border border-[#20A66A]/20">
                  {activePermissionsCount} of 8 Powers
                </span>
              </div>

              {/* Simulated Card Preview */}
              <div className="bg-[#F8FBFA] border border-[#E3ECE8] rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#5E7A70] block">Designated Invitee:</span>
                    <strong className="text-sm text-[#263B33] block">
                      {fullName || 'Pharm. Brenda Namatovu'}
                    </strong>
                    <span className="text-[11px] font-mono text-[#5E7A70]">
                      {email || 'brenda.namatovu@zenithrx.ug'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20">
                    {role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E3ECE8] text-[11px]">
                  <div>
                    <span className="text-[#5E7A70] text-[10px] block">DOMAIN SCOPE</span>
                    <strong className="text-[#263B33]">{domainScope.replace(/_/g, ' ')}</strong>
                  </div>
                  <div>
                    <span className="text-[#5E7A70] text-[10px] block">EXPIRES</span>
                    <strong className="text-[#263B33]">{calculateExpiryDateString()}</strong>
                  </div>
                </div>
              </div>

              {/* What the invitee will see */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#5E7A70] uppercase tracking-wider block">
                  Permissions Granted in Email:
                </span>
                <div className="space-y-1">
                  {[
                    { key: 'dispensingOverrides', label: 'Clinical Dispensing & Opiate Overrides' },
                    { key: 'policyConfiguration', label: 'Global Safety Policies & FEFO Rules' },
                    { key: 'aiSafetyControls', label: 'AI Clinical Safety & Prompt Redaction' },
                    { key: 'tenantOnboarding', label: 'Pharmacy Tenant Provisioning' },
                    { key: 'tierManagement', label: 'SaaS Billing Tiers & Payer Tariffs' },
                    { key: 'posSettings', label: 'POS Registers & Cashier Governance' },
                    { key: 'complianceExport', label: 'NDA Regulatory & Audit Exports' },
                    { key: 'collaboratorManagement', label: 'Collaborator Elevation Control' },
                  ].map((p) => {
                    const granted = (permissions as any)[p.key];
                    return (
                      <div
                        key={p.key}
                        className={`flex items-center gap-1.5 text-[10px] py-0.5 ${
                          granted ? 'text-[#1E744F] font-semibold' : 'text-slate-400 line-through'
                        }`}
                      >
                        {granted ? (
                          <Check className="w-3 h-3 text-[#20A66A] flex-shrink-0" />
                        ) : (
                          <X className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        )}
                        <span>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-[#5E7A70] leading-relaxed">
                National Drug Authority (NDA) statutory regulations require dual-control sign-off and mutual identity verification before elevated clinical privileges become active.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InviteCollaboratorPage;
