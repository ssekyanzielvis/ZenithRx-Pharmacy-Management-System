/**
 * useExpiryAlerts.ts — ZenithRx Expiry Risk & Markdown Engine Hook
 * Clean Architecture: Application Layer
 * Calculates FEFO expiry risk buckets, automated clearance markdowns,
 * quarantine isolation protocol, and NDA destruction certificates.
 */

import { useState, useMemo, useCallback } from 'react';
import { DrugItem, ExpiryReportItem } from '../types';

export interface UseExpiryAlertsProps {
  drugs: DrugItem[];
  onApplyClearanceDiscount?: (drugId: string, markdownPercent?: number) => void;
  onQuarantineStock?: (drugId: string) => void;
  pharmacyName?: string;
  ndaLicenseNo?: string;
  supervisingPharmacist?: string;
}

export function useExpiryAlerts({
  drugs,
  onApplyClearanceDiscount,
  onQuarantineStock,
  pharmacyName = 'ZenithRx Pharmacy',
  ndaLicenseNo = 'NDA/LIC/PHA/2026/0182',
  supervisingPharmacist = 'Pharm. Moses Musoke (PSU/REG/2021/1042)',
}: UseExpiryAlertsProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Expired' | 'Critical' | 'Warning'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [quarantinedDrugIds, setQuarantinedDrugIds] = useState<Set<string>>(new Set());
  const [discountedDrugIds, setDiscountedDrugIds] = useState<Set<string>>(new Set());
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Today reference date for FEFO computation
  const today = useMemo(() => new Date(), []);

  // ─── Compute Expiry Items ──────────────────────────────────────────────────
  const allExpiryItems: ExpiryReportItem[] = useMemo(() => {
    return drugs.map((drug) => {
      const expDate = new Date(drug.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let riskStatus: 'Expired' | 'Critical (<30 days)' | 'Warning (<90 days)' = 'Warning (<90 days)';
      if (daysRemaining <= 0) {
        riskStatus = 'Expired';
      } else if (daysRemaining <= 30) {
        riskStatus = 'Critical (<30 days)';
      }

      return { drug, daysRemaining, riskStatus };
    });
  }, [drugs, today]);

  // Filter for items at risk (<= 90 days)
  const atRiskExpiryItems = useMemo(() => {
    return allExpiryItems.filter((i) => i.daysRemaining <= 90);
  }, [allExpiryItems]);

  // Filtered by active tab and search
  const filteredExpiryItems = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return atRiskExpiryItems.filter((item) => {
      const matchesSearch =
        item.drug.brandName.toLowerCase().includes(q) ||
        item.drug.genericName.toLowerCase().includes(q) ||
        item.drug.batchNumber.toLowerCase().includes(q) ||
        item.drug.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'Expired') return item.riskStatus === 'Expired';
      if (activeFilter === 'Critical') return item.riskStatus === 'Critical (<30 days)';
      if (activeFilter === 'Warning') return item.riskStatus === 'Warning (<90 days)';

      return true;
    });
  }, [atRiskExpiryItems, searchTerm, activeFilter]);

  // ─── Financial & Risk Valuation Metrics ────────────────────────────────────
  const metrics = useMemo(() => {
    const expiredList = atRiskExpiryItems.filter((i) => i.riskStatus === 'Expired');
    const criticalList = atRiskExpiryItems.filter((i) => i.riskStatus === 'Critical (<30 days)');
    const warningList = atRiskExpiryItems.filter((i) => i.riskStatus === 'Warning (<90 days)');

    const expiredCostValue = expiredList.reduce(
      (sum, i) => sum + i.drug.costPrice * i.drug.stockQty,
      0
    );

    const criticalCostValue = criticalList.reduce(
      (sum, i) => sum + i.drug.costPrice * i.drug.stockQty,
      0
    );

    const warningCostValue = warningList.reduce(
      (sum, i) => sum + i.drug.costPrice * i.drug.stockQty,
      0
    );

    const totalAtRiskCost = expiredCostValue + criticalCostValue + warningCostValue;

    // Potential recoverable revenue if 30% discount applied to critical/warning
    const recoverableRetail = criticalList.concat(warningList).reduce((sum, i) => {
      const discountedPrice = Math.round(i.drug.sellingPrice * 0.7);
      return sum + discountedPrice * i.drug.stockQty;
    }, 0);

    return {
      expiredCount: expiredList.length,
      expiredCostValue,
      criticalCount: criticalList.length,
      criticalCostValue,
      warningCount: warningList.length,
      warningCostValue,
      totalAtRiskCost,
      recoverableRetail,
    };
  }, [atRiskExpiryItems]);

  // ─── Recommended Clearance Discount Calculator ─────────────────────────────
  const getRecommendedDiscount = useCallback((daysRemaining: number) => {
    if (daysRemaining <= 0) return { percent: 0, label: 'Expired (Quarantine)' };
    if (daysRemaining <= 15) return { percent: 50, label: '50% Flash Markdown' };
    if (daysRemaining <= 45) return { percent: 30, label: '30% Clearance' };
    if (daysRemaining <= 90) return { percent: 15, label: '15% Early Markdown' };
    return { percent: 0, label: 'Standard Price' };
  }, []);

  // ─── Apply Clearance Markdown ──────────────────────────────────────────────
  const handleApplyMarkdown = useCallback(
    (drugId: string, discountPercent: number) => {
      setDiscountedDrugIds((prev) => new Set([...prev, drugId]));
      if (onApplyClearanceDiscount) {
        onApplyClearanceDiscount(drugId, discountPercent);
      }
      setNotification({
        message: `Clearance discount of ${discountPercent}% applied! POS and inventory selling prices updated.`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    [onApplyClearanceDiscount]
  );

  // ─── Apply Bulk Clearance Markdown to All Critical Batches ─────────────────
  const handleBulkMarkdownCritical = useCallback(() => {
    const critical = atRiskExpiryItems.filter((i) => i.riskStatus === 'Critical (<30 days)');
    critical.forEach((item) => {
      setDiscountedDrugIds((prev) => new Set([...prev, item.drug.id]));
      if (onApplyClearanceDiscount) {
        onApplyClearanceDiscount(item.drug.id, 30);
      }
    });

    setNotification({
      message: `Bulk 30% clearance markdown applied across ${critical.length} critical batch items!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  }, [atRiskExpiryItems, onApplyClearanceDiscount]);

  // ─── Quarantine Stock Protocol ─────────────────────────────────────────────
  const handleQuarantine = useCallback(
    (drugId: string) => {
      setQuarantinedDrugIds((prev) => new Set([...prev, drugId]));
      if (onQuarantineStock) {
        onQuarantineStock(drugId);
      }
      setNotification({
        message: `Batch moved to QUARANTINE-LOCKDOWN! Item blocked from POS and dispensing.`,
        type: 'warning',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    [onQuarantineStock]
  );

  // ─── Print Official NDA Destruction Certificate ────────────────────────────
  const handlePrintDestructionCertificate = useCallback(() => {
    const expired = atRiskExpiryItems.filter(
      (i) => i.riskStatus === 'Expired' || quarantinedDrugIds.has(i.drug.id)
    );
    const certNumber = `NDA-DEST-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Official Pharmaceutical Destruction Certificate - ${certNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; color: #0f172a; line-height: 1.4; }
            .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-bottom: 6px; }
            .title { font-size: 22px; font-weight: bold; margin: 4px 0; color: #0f172a; }
            .sub { font-size: 13px; color: #475569; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 7px 10px; }
            td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
            .totals { margin-top: 20px; text-align: right; font-size: 13px; }
            .signatures { margin-top: 45px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 25px; font-size: 11px; text-align: center; }
            .sig-line { border-top: 1px solid #000; padding-top: 6px; margin-top: 55px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">REPUBLIC OF UGANDA • NATIONAL DRUG AUTHORITY COMPLIANT</span>
            <h1 class="title">OFFICIAL PHARMACEUTICAL DESTRUCTION & DISPOSAL CERTIFICATE</h1>
            <div class="sub">Form NDA/GMP/DISP-2026 • Certificate Ref: <b>${certNumber}</b></div>
          </div>

          <div class="meta-grid">
            <div>
              <div><b>Licensed Pharmacy:</b> ${pharmacyName}</div>
              <div><b>NDA Operating License:</b> ${ndaLicenseNo}</div>
              <div><b>Supervising Pharmacist:</b> ${supervisingPharmacist}</div>
            </div>
            <div>
              <div><b>Date of Condemnation:</b> ${todayStr}</div>
              <div><b>Disposal Method:</b> High-Temp Incineration / Secure Neutralization</div>
              <div><b>Quarantine Protocol:</b> Level 4 Biohazard Sealed Storage</div>
            </div>
          </div>

          <div style="font-weight: bold; font-size: 12px; margin-top: 10px;">Itemized Condemned / Expired Stock Schedule:</div>
          <table>
            <thead>
              <tr>
                <th>Drug Item & Formulation</th>
                <th>Batch Number</th>
                <th>Manufacturer</th>
                <th>Expiry Date</th>
                <th style="text-align: center;">Quarantined Qty</th>
                <th style="text-align: right;">Unit Cost (UGX)</th>
                <th style="text-align: right;">Total Loss (UGX)</th>
              </tr>
            </thead>
            <tbody>
              ${expired.map((i) => `
                <tr>
                  <td><b>${i.drug.brandName}</b> (${i.drug.genericName})</td>
                  <td style="font-family: monospace;">${i.drug.batchNumber}</td>
                  <td>${i.drug.manufacturer}</td>
                  <td style="color: #dc2626; font-weight: bold;">${i.drug.expiryDate}</td>
                  <td style="text-align: center; font-weight: bold;">${i.drug.stockQty}</td>
                  <td style="text-align: right;">${i.drug.costPrice.toLocaleString()}</td>
                  <td style="text-align: right; font-weight: bold;">${(i.drug.costPrice * i.drug.stockQty).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>Total Expired Units Condemned: <b>${expired.reduce((sum, i) => sum + i.drug.stockQty, 0)} units</b></div>
            <div style="font-size: 15px; color: #dc2626; margin-top: 4px;">
              Total Pharmaceutical Financial Loss: <b>UGX ${expired.reduce((sum, i) => sum + i.drug.costPrice * i.drug.stockQty, 0).toLocaleString()}</b>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">Supervising Pharmacist Signature & Stamp</div>
            </div>
            <div>
              <div class="sig-line">Internal Quality Witness Signature</div>
            </div>
            <div>
              <div class="sig-line">NDA Authorized Inspector Stamp</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [atRiskExpiryItems, quarantinedDrugIds, pharmacyName, ndaLicenseNo, supervisingPharmacist]);

  return {
    activeFilter,
    setActiveFilter,
    searchTerm,
    setSearchTerm,
    atRiskExpiryItems,
    filteredExpiryItems,
    metrics,
    quarantinedDrugIds,
    discountedDrugIds,
    showCertificateModal,
    setShowCertificateModal,
    notification,
    getRecommendedDiscount,
    handleApplyMarkdown,
    handleBulkMarkdownCritical,
    handleQuarantine,
    handlePrintDestructionCertificate,
  };
}
