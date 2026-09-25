import React, { useState, useMemo, useCallback } from 'react';
import {
  ThreeWayMatchSession,
  ThreeWayMatchLineDetail,
  ThreeWayMatchDispute,
  MatchToleranceConfig,
} from '../types/v2Types';
import {
  getAllMatchSessions,
  getMatchSessionById,
  getDisputesBySession,
  getAllDisputes,
  getToleranceConfig,
  updateToleranceConfig,
  raiseMatchDispute,
  recordCreditNote,
  resolveDispute,
  overrideMatchSession,
  generateMatchReportText,
  executeThreeWayMatch,
  registerInvoiceLineItems,
} from '../services/invoiceMatchingService';
import { formatUGX } from '../services/formatters';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Shield,
  Search,
  Filter,
  Settings,
  Eye,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Package,
  Receipt,
  Truck,
  AlertCircle,
  Clock,
  DollarSign,
  FileCheck,
  Ban,
  ThumbsUp,
  RotateCcw,
  Printer,
  MessageSquare,
} from 'lucide-react';

interface InvoiceReconciliationConsoleProps {
  tenantId?: string;
  currentUser?: {
    name?: string;
    role?: string;
  };
}

export const InvoiceReconciliationConsole: React.FC<InvoiceReconciliationConsoleProps> = ({
  tenantId = 'client-001',
  currentUser = { name: 'Kigozi Jonathan', role: 'Finance & Accounts Officer' },
}) => {
  const [sessions, setSessions] = useState<ThreeWayMatchSession[]>(() => getAllMatchSessions(tenantId));
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessions[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'disputes' | 'settings'>('sessions');
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState<string | null>(null);
  const [toleranceConfig, setToleranceConfig] = useState<MatchToleranceConfig>(() => getToleranceConfig(tenantId));

  const selectedSession = useMemo(
    () => (selectedSessionId ? getMatchSessionById(selectedSessionId) : null),
    [selectedSessionId, sessions]
  );
  const disputes = useMemo(
    () => (selectedSessionId ? getDisputesBySession(selectedSessionId) : []),
    [selectedSessionId, sessions]
  );
  const allDisputes = useMemo(() => getAllDisputes(tenantId), [sessions]);

  const refreshData = useCallback(() => {
    setSessions(getAllMatchSessions(tenantId));
  }, [tenantId]);

  const toggleLineExpand = (lineId: string) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const getVerdictColor = (verdict: string): string => {
    if (verdict.includes('full_match') || verdict.includes('exact_match')) return '#10b981';
    if (verdict.includes('within_tolerance') || verdict.includes('partial')) return '#f59e0b';
    if (verdict.includes('blocked') || verdict.includes('mismatch') || verdict.includes('missing') || verdict === 'unmatched') return '#ef4444';
    if (verdict.includes('dispute')) return '#8b5cf6';
    if (verdict.includes('override')) return '#06b6d4';
    return '#6b7280';
  };

  const getVerdictBadge = (verdict: string) => {
    const color = getVerdictColor(verdict);
    const label = verdict.replace(/_/g, ' ').toUpperCase();
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.03em',
          color: '#fff',
          background: color,
        }}
      >
        {verdict.includes('full_match') || verdict.includes('exact_match') ? (
          <CheckCircle2 size={12} />
        ) : verdict.includes('blocked') || verdict.includes('mismatch') ? (
          <XCircle size={12} />
        ) : verdict.includes('within_tolerance') || verdict.includes('partial') ? (
          <AlertTriangle size={12} />
        ) : (
          <AlertCircle size={12} />
        )}
        {label}
      </span>
    );
  };

  const handleExportReport = () => {
    if (!selectedSessionId) return;
    const report = generateMatchReportText(selectedSessionId);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3way-match-report-${selectedSession?.matchSessionReference || 'report'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRaiseDispute = () => {
    if (!selectedSession) return;
    const flaggedLines = selectedSession.lineDetails.filter((l) => l.isFlagged);
    const totalDisputedAmt = flaggedLines.reduce((s, l) => s + Math.abs(l.valueVarianceUgx), 0);
    const narrative = flaggedLines
      .map(
        (l) =>
          `${l.genericName}: ${l.flagReason}. PO Qty: ${l.poOrderedQuantity}, GRN Qty: ${l.grnDeliveredQuantity}, Invoice Qty: ${l.invoiceBilledQuantity}. Price: PO @ UGX ${l.poUnitCostUgx.toLocaleString()} vs Invoice @ UGX ${l.invoiceUnitCostUgx.toLocaleString()}.`
      )
      .join(' | ');

    const hasQty = flaggedLines.some((l) => l.lineVerdict.includes('quantity'));
    const hasPrice = flaggedLines.some((l) => l.lineVerdict.includes('price'));
    const disputeType: ThreeWayMatchDispute['disputeType'] = hasQty && hasPrice ? 'both' : hasQty ? 'quantity_shortage' : 'price_overcharge';

    raiseMatchDispute({
      tenantId,
      matchSessionId: selectedSession.id,
      invoiceId: selectedSession.invoiceId,
      invoiceNumber: selectedSession.invoiceNumber,
      supplierName: selectedSession.supplierName,
      disputeType,
      totalDisputedAmountUgx: totalDisputedAmt,
      disputedLineCount: flaggedLines.length,
      disputeNarrative: narrative,
      raisedByName: currentUser.name || 'Finance Officer',
      raisedByRole: currentUser.role || 'Finance',
    });

    setShowDisputeForm(false);
    refreshData();
  };

  const handleOverride = (reason: string) => {
    if (!selectedSession) return;
    overrideMatchSession(selectedSession.id, {
      approvedByName: currentUser.name || 'Approver',
      approvedByRole: currentUser.role || 'Senior Management',
      overrideReason: reason,
    });
    setShowOverrideModal(false);
    refreshData();
  };

  // ─── Styles ─────────────────────────────────────────────────────────────
  const styles = {
    container: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      minHeight: '100vh',
      color: '#e2e8f0',
    } as React.CSSProperties,
    header: {
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
      padding: '20px 28px',
    } as React.CSSProperties,
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: '-0.03em',
      background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    } as React.CSSProperties,
    tabs: {
      display: 'flex',
      gap: 4,
      marginTop: 16,
    } as React.CSSProperties,
    tab: (active: boolean) =>
      ({
        padding: '8px 20px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        background: active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
        color: active ? '#38bdf8' : '#94a3b8',
        border: active ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
        transition: 'all 0.2s',
      } as React.CSSProperties),
    content: {
      display: 'grid',
      gridTemplateColumns: '340px 1fr',
      gap: 0,
      height: 'calc(100vh - 130px)',
    } as React.CSSProperties,
    sidebar: {
      borderRight: '1px solid rgba(100, 116, 139, 0.15)',
      overflowY: 'auto' as const,
      padding: 16,
    } as React.CSSProperties,
    sessionCard: (isActive: boolean) =>
      ({
        padding: 14,
        borderRadius: 10,
        cursor: 'pointer',
        marginBottom: 8,
        background: isActive ? 'rgba(56, 189, 248, 0.08)' : 'rgba(30, 41, 59, 0.5)',
        border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(100, 116, 139, 0.15)',
        transition: 'all 0.2s',
      } as React.CSSProperties),
    main: {
      overflowY: 'auto' as const,
      padding: 24,
    } as React.CSSProperties,
    card: {
      background: 'rgba(30, 41, 59, 0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(100, 116, 139, 0.15)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    } as React.CSSProperties,
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    } as React.CSSProperties,
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 15,
      fontWeight: 700,
      color: '#f1f5f9',
    } as React.CSSProperties,
    comparisonGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
    } as React.CSSProperties,
    comparisonColumn: (type: 'po' | 'grn' | 'invoice') =>
      ({
        background:
          type === 'po'
            ? 'rgba(56, 189, 248, 0.06)'
            : type === 'grn'
            ? 'rgba(16, 185, 129, 0.06)'
            : 'rgba(245, 158, 11, 0.06)',
        border: `1px solid ${type === 'po' ? 'rgba(56, 189, 248, 0.2)' : type === 'grn' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
        borderRadius: 10,
        padding: 16,
      } as React.CSSProperties),
    colHeader: (color: string) =>
      ({
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
        color,
        marginBottom: 12,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
      } as React.CSSProperties),
    statValue: {
      fontSize: 20,
      fontWeight: 800,
      color: '#f1f5f9',
      letterSpacing: '-0.02em',
    } as React.CSSProperties,
    statLabel: {
      fontSize: 11,
      color: '#94a3b8',
      marginTop: 2,
    } as React.CSSProperties,
    lineRow: (isFlagged: boolean) =>
      ({
        background: isFlagged ? 'rgba(239, 68, 68, 0.06)' : 'rgba(30, 41, 59, 0.3)',
        border: `1px solid ${isFlagged ? 'rgba(239, 68, 68, 0.25)' : 'rgba(100, 116, 139, 0.1)'}`,
        borderRadius: 10,
        padding: 14,
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.2s',
      } as React.CSSProperties),
    varianceChip: (value: number) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        color: value === 0 ? '#10b981' : value > 0 ? '#ef4444' : '#f59e0b',
        background: value === 0 ? 'rgba(16, 185, 129, 0.1)' : value > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      } as React.CSSProperties),
    button: (variant: 'primary' | 'danger' | 'ghost' | 'success') =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s',
        background:
          variant === 'primary'
            ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
            : variant === 'danger'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : variant === 'success'
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'rgba(100, 116, 139, 0.2)',
        color: variant === 'ghost' ? '#94a3b8' : '#fff',
      } as React.CSSProperties),
    modal: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
    } as React.CSSProperties,
    modalContent: {
      background: '#1e293b',
      border: '1px solid rgba(100, 116, 139, 0.3)',
      borderRadius: 16,
      padding: 28,
      maxWidth: 520,
      width: '100%',
    } as React.CSSProperties,
  };

  // ─── Render: Session Sidebar ──────────────────────────────────────────
  const renderSessionSidebar = () => (
    <div style={styles.sidebar}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 32px',
              borderRadius: 8,
              border: '1px solid rgba(100,116,139,0.2)',
              background: 'rgba(15,23,42,0.5)',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {sessions
        .filter(
          (s) =>
            !searchQuery ||
            s.matchSessionReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.poNumber.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((session) => (
          <div
            key={session.id}
            style={styles.sessionCard(selectedSessionId === session.id)}
            onClick={() => setSelectedSessionId(session.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{session.matchSessionReference}</div>
              {getVerdictBadge(session.sessionVerdict)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{session.supplierName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
              PO: {session.poNumber} • GRN: {session.grnNumber}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {session.linesExactMatched}/{session.totalLineItems} exact
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: session.netFinancialVarianceUgx === 0 ? '#10b981' : '#ef4444',
                }}
              >
                {session.netFinancialVarianceUgx === 0
                  ? '✓ Balanced'
                  : `${session.netFinancialVarianceUgx > 0 ? '+' : ''}UGX ${session.netFinancialVarianceUgx.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
    </div>
  );

  // ─── Render: Header Comparison ────────────────────────────────────────
  const renderHeaderComparison = () => {
    if (!selectedSession) return null;
    const s = selectedSession;

    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>
            <Scale size={18} style={{ color: '#38bdf8' }} />
            3-Way Document Comparison
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.button('ghost')} onClick={handleExportReport}>
              <Download size={14} /> Export Report
            </button>
            <button style={styles.button('ghost')} onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        <div style={styles.comparisonGrid}>
          {/* Purchase Order Column */}
          <div style={styles.comparisonColumn('po')}>
            <div style={styles.colHeader('#38bdf8')}>
              <FileText size={14} /> Purchase Order
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{s.poNumber}</div>
            <div style={styles.statValue}>{formatUGX(s.poTotalAuthorizedUgx)}</div>
            <div style={styles.statLabel}>Authorized Amount</div>
          </div>

          {/* GRN Column */}
          <div style={styles.comparisonColumn('grn')}>
            <div style={styles.colHeader('#10b981')}>
              <Truck size={14} /> Goods Received
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{s.grnNumber}</div>
            <div style={styles.statValue}>{formatUGX(s.grnTotalAcceptedUgx)}</div>
            <div style={styles.statLabel}>Accepted Value</div>
          </div>

          {/* Invoice Column */}
          <div style={styles.comparisonColumn('invoice')}>
            <div style={styles.colHeader('#f59e0b')}>
              <Receipt size={14} /> Supplier Invoice
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{s.invoiceNumber}</div>
            <div style={styles.statValue}>{formatUGX(s.invoiceTotalBilledUgx)}</div>
            <div style={styles.statLabel}>Billed Amount</div>
          </div>
        </div>

        {/* Variance Summary Bar */}
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 10,
            background:
              s.netFinancialVarianceUgx === 0
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${s.netFinancialVarianceUgx === 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>Net Financial Variance</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Qty Variance (PO→GRN): {s.poVsGrnQtyVarianceTotal >= 0 ? '+' : ''}{s.poVsGrnQtyVarianceTotal} units •
              Qty Variance (GRN→Inv): {s.grnVsInvoiceQtyVarianceTotal >= 0 ? '+' : ''}{s.grnVsInvoiceQtyVarianceTotal} units
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: s.netFinancialVarianceUgx === 0 ? '#10b981' : '#ef4444',
              letterSpacing: '-0.02em',
            }}
          >
            {s.netFinancialVarianceUgx === 0 ? '✓ UGX 0' : `${s.netFinancialVarianceUgx > 0 ? '+' : ''}${formatUGX(s.netFinancialVarianceUgx)}`}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Line-by-Line Matrix ──────────────────────────────────────
  const renderLineMatrix = () => {
    if (!selectedSession) return null;

    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>
            <Package size={18} style={{ color: '#818cf8' }} />
            Line-by-Line Matching Matrix ({selectedSession.totalLineItems} items)
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            <span style={{ color: '#10b981' }}>✅ {selectedSession.linesExactMatched} Exact</span>
            <span style={{ color: '#f59e0b' }}>✓ {selectedSession.linesWithinTolerance} Tolerance</span>
            <span style={{ color: '#ef4444' }}>⚠ {selectedSession.linesQtyMismatch + selectedSession.linesPriceMismatch} Flagged</span>
          </div>
        </div>

        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.5)',
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          }}
        >
          <div>Medicine</div>
          <div style={{ textAlign: 'center', color: '#38bdf8' }}>PO Ordered</div>
          <div style={{ textAlign: 'center', color: '#10b981' }}>GRN Received</div>
          <div style={{ textAlign: 'center', color: '#f59e0b' }}>Invoice Billed</div>
          <div style={{ textAlign: 'center' }}>Value Variance</div>
          <div style={{ textAlign: 'center' }}>Verdict</div>
        </div>

        {selectedSession.lineDetails.map((line) => {
          const isExpanded = expandedLines.has(line.id);
          return (
            <div key={line.id}>
              <div
                style={styles.lineRow(line.isFlagged)}
                onClick={() => toggleLineExpand(line.id)}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  {/* Medicine Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{line.genericName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{line.brandName || 'Generic'} • {line.unitOfMeasure}</div>
                    </div>
                  </div>

                  {/* PO Quantity */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8' }}>{line.poOrderedQuantity}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>@ {formatUGX(line.poUnitCostUgx)}</div>
                  </div>

                  {/* GRN Quantity */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>{line.grnDeliveredQuantity}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Batch: {line.grnBatchNumber || 'N/A'}</div>
                  </div>

                  {/* Invoice Quantity */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>{line.invoiceBilledQuantity}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>@ {formatUGX(line.invoiceUnitCostUgx)}</div>
                  </div>

                  {/* Value Variance */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={styles.varianceChip(line.valueVarianceUgx)}>
                      {line.valueVarianceUgx === 0
                        ? '✓ UGX 0'
                        : `${line.valueVarianceUgx > 0 ? '+' : ''}${formatUGX(line.valueVarianceUgx)}`}
                    </span>
                  </div>

                  {/* Verdict */}
                  <div style={{ textAlign: 'center' }}>{getVerdictBadge(line.lineVerdict)}</div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div
                  style={{
                    marginLeft: 22,
                    marginBottom: 10,
                    padding: 16,
                    borderRadius: 8,
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(100, 116, 139, 0.1)',
                    fontSize: 12,
                    lineHeight: 1.8,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Variance Analysis</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <span style={{ color: '#64748b' }}>PO → GRN Qty: </span>
                      <span style={{ ...styles.varianceChip(line.qtyVariancePoVsGrn), marginLeft: 4 }}>
                        {line.qtyVariancePoVsGrn >= 0 ? '+' : ''}{line.qtyVariancePoVsGrn} units
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>GRN → Invoice Qty: </span>
                      <span style={{ ...styles.varianceChip(line.qtyVarianceGrnVsInvoice), marginLeft: 4 }}>
                        {line.qtyVarianceGrnVsInvoice >= 0 ? '+' : ''}{line.qtyVarianceGrnVsInvoice} units
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Unit Price Variance: </span>
                      <span style={{ ...styles.varianceChip(line.priceVariancePoVsInvoiceUgx), marginLeft: 4 }}>
                        {line.priceVariancePoVsInvoiceUgx >= 0 ? '+' : ''}{formatUGX(line.priceVariancePoVsInvoiceUgx)}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      background: line.isFlagged ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                      border: `1px solid ${line.isFlagged ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
                      color: '#cbd5e1',
                    }}
                  >
                    {line.varianceExplanation}
                  </div>
                  {line.flagReason && (
                    <div style={{ marginTop: 8, color: '#ef4444', fontWeight: 600 }}>
                      🚩 Flag: {line.flagReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render: Session Verdict & Actions ────────────────────────────────
  const renderVerdictPanel = () => {
    if (!selectedSession) return null;
    const s = selectedSession;
    const isBlocked = s.sessionVerdict.includes('blocked');
    const isDisputeRaised = s.sessionVerdict === 'dispute_raised';
    const isApproved = s.sessionVerdict === 'full_match' || s.sessionVerdict === 'override_approved';

    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>
            <Shield size={18} style={{ color: getVerdictColor(s.sessionVerdict) }} />
            Session Verdict & Financial Controls
          </div>
          {getVerdictBadge(s.sessionVerdict)}
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background:
              isApproved
                ? 'rgba(16, 185, 129, 0.06)'
                : isBlocked
                ? 'rgba(239, 68, 68, 0.06)'
                : 'rgba(245, 158, 11, 0.06)',
            border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.2)' : isBlocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>{s.verdictSummary}</div>
          {s.financialRiskAssessment && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
              <strong>Risk:</strong> {s.financialRiskAssessment}
            </div>
          )}
          {s.recommendedAction && (
            <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
              <strong>Action:</strong> {s.recommendedAction}
            </div>
          )}
        </div>

        {/* Workflow Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Executed By</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{s.executedByName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.executedByRole}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Reviewed By</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{s.reviewedByName || '—'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.reviewedByRole || 'Pending'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Approved By</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{s.approvedByName || '—'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.approvedByRole || 'Pending'}</div>
          </div>
        </div>

        {s.overrideReason && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.06)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              fontSize: 12,
              color: '#67e8f9',
              marginBottom: 16,
            }}
          >
            <strong>Override Reason:</strong> {s.overrideReason}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isBlocked && !isDisputeRaised && (
            <button style={styles.button('danger')} onClick={() => setShowDisputeForm(true)}>
              <AlertTriangle size={14} /> Raise Dispute
            </button>
          )}
          {(isBlocked || isDisputeRaised) && (
            <button style={styles.button('primary')} onClick={() => setShowOverrideModal(true)}>
              <ThumbsUp size={14} /> Override & Approve
            </button>
          )}
          {isApproved && (
            <button style={styles.button('success')} disabled>
              <CheckCircle2 size={14} /> Approved for Payment
            </button>
          )}
          <button style={styles.button('ghost')} onClick={handleExportReport}>
            <FileCheck size={14} /> Download Full Report
          </button>
        </div>
      </div>
    );
  };

  // ─── Render: Disputes Section ─────────────────────────────────────────
  const renderDisputes = () => {
    const displayDisputes = activeTab === 'disputes' ? allDisputes : disputes;

    if (displayDisputes.length === 0) {
      return (
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <MessageSquare size={18} style={{ color: '#8b5cf6' }} />
            {activeTab === 'disputes' ? 'All Disputes' : 'Session Disputes'}
          </div>
          <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            No disputes raised for {activeTab === 'disputes' ? 'this pharmacy' : 'this match session'}.
          </div>
        </div>
      );
    }

    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>
            <MessageSquare size={18} style={{ color: '#8b5cf6' }} />
            {activeTab === 'disputes' ? `All Disputes (${displayDisputes.length})` : `Session Disputes (${displayDisputes.length})`}
          </div>
        </div>

        {displayDisputes.map((d) => (
          <div
            key={d.id}
            style={{
              padding: 14,
              borderRadius: 10,
              background: 'rgba(139, 92, 246, 0.04)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{d.disputeReference}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {d.supplierName} • {d.invoiceNumber}
                </div>
              </div>
              {getVerdictBadge(d.status)}
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 8, lineHeight: 1.6 }}>{d.disputeNarrative}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Disputed: <strong style={{ color: '#ef4444' }}>{formatUGX(d.totalDisputedAmountUgx)}</strong> •
                Lines: {d.disputedLineCount} •
                Raised by: {d.raisedByName}
              </div>
              {d.status === 'credit_note_requested' && (
                <button
                  style={styles.button('primary')}
                  onClick={() => setShowCreditNoteModal(d.id)}
                >
                  <Receipt size={14} /> Record Credit Note
                </button>
              )}
              {d.creditNoteNumber && (
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                  Credit Note: {d.creditNoteNumber} ({formatUGX(d.creditNoteAmountUgx || 0)})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Render: Settings Tab ─────────────────────────────────────────────
  const renderSettings = () => (
    <div style={{ padding: 24 }}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <Settings size={18} style={{ color: '#f59e0b' }} />
          <span style={{ marginLeft: 4 }}>Matching Tolerance Configuration</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
          Configure the thresholds that determine whether variances are accepted automatically,
          flagged for review, or blocked pending dispute resolution.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Quantity Tolerance (%)', key: 'quantityTolerancePercent', value: toleranceConfig.quantityTolerancePercent, suffix: '%' },
            { label: 'Quantity Tolerance (Abs Units)', key: 'quantityToleranceAbsoluteUnits', value: toleranceConfig.quantityToleranceAbsoluteUnits, suffix: ' units' },
            { label: 'Price Tolerance (%)', key: 'priceTolerancePercent', value: toleranceConfig.priceTolerancePercent, suffix: '%' },
            { label: 'Price Tolerance (Abs UGX)', key: 'priceToleranceAbsoluteUgx', value: toleranceConfig.priceToleranceAbsoluteUgx, suffix: ' UGX' },
            { label: 'Total Value Tolerance (UGX)', key: 'totalValueToleranceUgx', value: toleranceConfig.totalValueToleranceUgx, suffix: ' UGX' },
            { label: 'Dual Auth Threshold (UGX)', key: 'requireDualAuthorizationAboveUgx', value: toleranceConfig.requireDualAuthorizationAboveUgx, suffix: ' UGX' },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{field.label}</label>
              <input
                type="number"
                value={field.value}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const updated = updateToleranceConfig(
                    tenantId,
                    { [field.key]: val },
                    currentUser.name || 'Admin',
                    currentUser.role || 'Admin'
                  );
                  setToleranceConfig(updated);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(100,116,139,0.2)',
                  background: 'rgba(15,23,42,0.5)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          {[
            { label: 'Auto-approve Exact Match', key: 'autoApproveExactMatch', value: toleranceConfig.autoApproveExactMatch },
            { label: 'Auto-approve Within Tolerance', key: 'autoApproveWithinTolerance', value: toleranceConfig.autoApproveWithinTolerance },
          ].map((toggle) => (
            <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={toggle.value}
                onChange={(e) => {
                  const updated = updateToleranceConfig(
                    tenantId,
                    { [toggle.key]: e.target.checked },
                    currentUser.name || 'Admin',
                    currentUser.role || 'Admin'
                  );
                  setToleranceConfig(updated);
                }}
                style={{ accentColor: '#38bdf8' }}
              />
              {toggle.label}
            </label>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: '#64748b' }}>
          Last configured by: {toleranceConfig.configuredByName} ({toleranceConfig.configuredByRole})
        </div>
      </div>
    </div>
  );

  // ─── Render: Override Modal ───────────────────────────────────────────
  const renderOverrideModal = () => {
    if (!showOverrideModal) return null;
    const [reason, setReason] = React.useState('');

    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
            ⚠ Override Match Verdict
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            You are overriding a blocked match verdict. This will approve the invoice for payment
            despite detected discrepancies. This action is audited.
          </p>
          <textarea
            placeholder="Enter override justification (required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              minHeight: 100,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(100,116,139,0.3)',
              background: 'rgba(15,23,42,0.5)',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              resize: 'vertical',
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={styles.button('ghost')} onClick={() => setShowOverrideModal(false)}>
              Cancel
            </button>
            <button
              style={styles.button('primary')}
              onClick={() => {
                if (reason.trim()) handleOverride(reason);
              }}
              disabled={!reason.trim()}
            >
              <ThumbsUp size={14} /> Confirm Override
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Dispute Confirmation Modal ───────────────────────────────
  const renderDisputeConfirmation = () => {
    if (!showDisputeForm || !selectedSession) return null;
    const flaggedLines = selectedSession.lineDetails.filter((l) => l.isFlagged);
    const totalAmt = flaggedLines.reduce((s, l) => s + Math.abs(l.valueVarianceUgx), 0);

    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
            🚩 Raise Supplier Dispute
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            Dispute against <strong>{selectedSession.supplierName}</strong> for invoice{' '}
            <strong>{selectedSession.invoiceNumber}</strong>.
          </p>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>
              {flaggedLines.length} Flagged Line Item(s) — Total Disputed: {formatUGX(totalAmt)}
            </div>
            {flaggedLines.map((l) => (
              <div key={l.id} style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                • {l.genericName}: {l.flagReason}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={styles.button('ghost')} onClick={() => setShowDisputeForm(false)}>
              Cancel
            </button>
            <button style={styles.button('danger')} onClick={handleRaiseDispute}>
              <AlertTriangle size={14} /> Confirm & Raise Dispute
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Scale size={24} />
          3-Way Invoice Matching & Reconciliation
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          Purchase Order × Goods Received × Supplier Invoice — Financial Controls Engine
        </div>
        <div style={styles.tabs}>
          <div style={styles.tab(activeTab === 'sessions')} onClick={() => setActiveTab('sessions')}>
            <Scale size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Match Sessions
          </div>
          <div style={styles.tab(activeTab === 'disputes')} onClick={() => setActiveTab('disputes')}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Disputes ({allDisputes.length})
          </div>
          <div style={styles.tab(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
            <Settings size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Tolerance Config
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'settings' ? (
        renderSettings()
      ) : (
        <div style={styles.content}>
          {renderSessionSidebar()}
          <div style={styles.main}>
            {selectedSession ? (
              <>
                {renderHeaderComparison()}
                {renderVerdictPanel()}
                {renderLineMatrix()}
                {renderDisputes()}
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#64748b',
                }}
              >
                <Scale size={48} />
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>Select a match session to view details</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {renderOverrideModal()}
      {renderDisputeConfirmation()}
    </div>
  );
};
