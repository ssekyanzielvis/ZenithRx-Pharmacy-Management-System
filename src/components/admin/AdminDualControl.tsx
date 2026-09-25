import React, { useState, useEffect } from 'react';
import {
  getDualControlRequests,
  requestDualControlAction,
  approveDualControlAction,
} from '../../services/adminGovernanceService';
import { DualControlActionRequest } from '../../types';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Plus,
  Lock,
} from 'lucide-react';

export const AdminDualControl: React.FC = () => {
  const [requests, setRequests] = useState<DualControlActionRequest[]>([]);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [actionType, setActionType] = useState<DualControlActionRequest['actionType']>('TIER_DELETION');
  const [description, setDescription] = useState('');
  const [targetEntityId, setTargetEntityId] = useState('');

  useEffect(() => {
    setRequests(getDualControlRequests());
  }, []);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !targetEntityId) return;

    const newReq = requestDualControlAction({
      actionType,
      description,
      targetEntityId,
      initiatedByUserId: 'eng-001',
      initiatedByUserName: 'Arthur Ssenabulya (Lead Systems Architect)',
      initiatedByIp: '102.218.45.12',
    });

    setRequests([newReq, ...requests]);
    setIsModalOpen(false);
    setDescription('');
    setTargetEntityId('');
  };

  const handleApprove = (reqId: string) => {
    const res = approveDualControlAction(reqId, 'eng-002', 'Elvis Sekyanzi (Principal Security Officer)');
    setFeedback(res);
    setRequests(getDualControlRequests());
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              Two-Person Rule Invariant (§4.3)
            </span>
            <span className="text-xs font-semibold text-slate-500">Dual-Control Administrative Sign-Off</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Dual-Control High-Risk Action Approvals
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Destructive actions (tier deletions, database purge, global feature revocation) strictly require two distinct Quantum Networks systems engineers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate High-Risk Action</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.success
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Requests Queue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {requests.map((req) => (
          <div
            key={req.id}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  [{req.actionType}]
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    req.status === 'APPROVED_AND_EXECUTED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                  }`}
                >
                  {req.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">Entity: {req.targetEntityId}</span>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{req.description}</p>

              <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                <span>Initiated By: <strong>{req.initiatedByUserName}</strong></span>
                <span>IP: {req.initiatedByIp}</span>
                <span>Timestamp: {new Date(req.initiatedAt).toLocaleString()}</span>
              </div>

              {req.approvedByUserName && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Second Signatory: {req.approvedByUserName} ({new Date(req.approvedAt!).toLocaleString()})
                </div>
              )}
            </div>

            <div className="shrink-0">
              {req.status === 'PENDING_SECOND_APPROVAL' ? (
                <button
                  onClick={() => handleApprove(req.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Provide 2nd Signatory Approval</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Executed Under Dual Control
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Initiate Dual-Control Action</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="TIER_DELETION">TIER DELETION</option>
                  <option value="DATABASE_PURGE">DATABASE PURGE</option>
                  <option value="GLOBAL_FEATURE_REVOCATION">GLOBAL FEATURE REVOCATION</option>
                  <option value="EMERGENCY_PRICE_OVERRIDE">EMERGENCY PRICE OVERRIDE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Target Entity Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tier-enterprise or schema-public"
                  value={targetEntityId}
                  onChange={(e) => setTargetEntityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Technical Rationale *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed engineering justification for this high-impact mutation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm">
                  Broadcast for Second Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
