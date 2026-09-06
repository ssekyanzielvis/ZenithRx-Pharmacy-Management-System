/**
 * useStockInventory.ts — ZenithRx Stock Inventory & FEFO Batch Control Application Hook
 * Clean Architecture: Application Layer
 * Manages inventory state, FEFO expiry risk triage, financial metrics, CSV import/export, and stock adjustments.
 */

import { useState, useMemo, useCallback } from 'react';
import { DrugItem } from '../types';
import { exportInventoryCSV } from '../services/exportService';
import { executePolicyCompliantExport } from '../services/csvExportPolicyService';

export type FefoRiskLevel = 'expired' | 'critical' | 'warning' | 'healthy';

export interface DrugWithFefo extends DrugItem {
  daysUntilExpiry: number;
  fefoRisk: FefoRiskLevel;
  isLowStock: boolean;
  profitMarginPercent: number;
  totalCostValue: number;
  totalSellingValue: number;
}

export interface UseStockInventoryProps {
  drugs: DrugItem[];
  onAddDrug: (drug: DrugItem) => void;
  onUpdateDrug: (drug: DrugItem) => void;
  onBulkAddDrugs?: (drugs: DrugItem[]) => void;
}

export function useStockInventory({
  drugs,
  onAddDrug,
  onUpdateDrug,
  onBulkAddDrugs,
}: UseStockInventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusTab, setStatusTab] = useState<'all' | 'lowStock' | 'fefoRisk' | 'rxOnly'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'expiry' | 'value'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<DrugItem | null>(null);
  const [adjustingDrug, setAdjustingDrug] = useState<DrugItem | null>(null);

  // ─── FEFO & Metric Computation ─────────────────────────────────────────────
  const enrichedDrugs = useMemo((): DrugWithFefo[] => {
    const today = new Date();

    return drugs.map((drug) => {
      const expDate = new Date(drug.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let fefoRisk: FefoRiskLevel = 'healthy';
      if (daysUntilExpiry <= 0) fefoRisk = 'expired';
      else if (daysUntilExpiry <= 30) fefoRisk = 'critical';
      else if (daysUntilExpiry <= 90) fefoRisk = 'warning';

      const isLowStock = drug.stockQty <= drug.reorderLevel;
      const profitMarginPercent =
        drug.sellingPrice > 0
          ? Math.round(((drug.sellingPrice - drug.costPrice) / drug.sellingPrice) * 100)
          : 0;

      return {
        ...drug,
        daysUntilExpiry,
        fefoRisk,
        isLowStock,
        profitMarginPercent,
        totalCostValue: drug.costPrice * drug.stockQty,
        totalSellingValue: drug.sellingPrice * drug.stockQty,
      };
    });
  }, [drugs]);

  // ─── Filtered & Sorted Inventory ───────────────────────────────────────────
  const filteredDrugs = useMemo(() => {
    const q = searchTerm.toLowerCase();

    return enrichedDrugs
      .filter((d) => {
        const matchesSearch =
          d.brandName.toLowerCase().includes(q) ||
          d.genericName.toLowerCase().includes(q) ||
          d.batchNumber.toLowerCase().includes(q) ||
          d.barcode.includes(q) ||
          d.manufacturer.toLowerCase().includes(q);

        const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;

        let matchesTab = true;
        if (statusTab === 'lowStock') matchesTab = d.isLowStock;
        else if (statusTab === 'fefoRisk') matchesTab = d.fefoRisk !== 'healthy';
        else if (statusTab === 'rxOnly') matchesTab = d.prescriptionRequired;

        return matchesSearch && matchesCategory && matchesTab;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.brandName.localeCompare(b.brandName);
        else if (sortBy === 'stock') cmp = a.stockQty - b.stockQty;
        else if (sortBy === 'expiry') cmp = a.daysUntilExpiry - b.daysUntilExpiry;
        else if (sortBy === 'value') cmp = a.totalCostValue - b.totalCostValue;
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [enrichedDrugs, searchTerm, selectedCategory, statusTab, sortBy, sortOrder]);

  // ─── Summary Financial & Safety Metrics ────────────────────────────────────
  const metrics = useMemo(() => {
    const totalCostVal = enrichedDrugs.reduce((sum, d) => sum + d.totalCostValue, 0);
    const totalSellingVal = enrichedDrugs.reduce((sum, d) => sum + d.totalSellingValue, 0);
    const potentialProfit = totalSellingVal - totalCostVal;
    const overallMargin = totalSellingVal > 0 ? Math.round((potentialProfit / totalSellingVal) * 100) : 0;
    const lowStockCount = enrichedDrugs.filter((d) => d.isLowStock).length;
    const fefoCriticalCount = enrichedDrugs.filter((d) => d.fefoRisk === 'critical' || d.fefoRisk === 'expired').length;
    const fefoWarningCount = enrichedDrugs.filter((d) => d.fefoRisk === 'warning').length;

    return {
      totalStockItems: enrichedDrugs.length,
      totalCostVal,
      totalSellingVal,
      potentialProfit,
      overallMargin,
      lowStockCount,
      fefoCriticalCount,
      fefoWarningCount,
    };
  }, [enrichedDrugs]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(async () => {
    await executePolicyCompliantExport(
      {
        userId: 'USR-001',
        userFullName: 'Pharm. Moses Musoke',
        userRole: 'Supervising Pharmacist',
        tenantId: 'CLIENT-001',
        tenantName: 'Mulago Care Pharmacy',
        isSuperAdmin: false,
        permissions: ['EXPORT_TENANT_DATA'],
      },
      {
        dataset: 'INVENTORY',
        format: 'CSV',
      },
      async () => {
        return enrichedDrugs.map((d) => ({
          drugId: d.id,
          brandName: d.brandName,
          genericName: d.genericName,
          barcode: d.barcode,
          batchNumber: d.batchNumber,
          category: d.category,
          shelfLocation: d.shelfLocation,
          costPriceUGX: d.costPrice,
          sellingPriceUGX: d.sellingPrice,
          grossMarginPercent: `${d.profitMarginPercent}%`,
          currentStock: d.stockQty,
          reorderLevel: d.reorderLevel,
          stockValuationUGX: d.totalCostValue,
          expiryDate: d.expiryDate,
          daysToExpiry: d.daysUntilExpiry,
          fefoStatus: d.fefoRisk.toUpperCase(),
          manufacturer: d.manufacturer,
          rxRequired: d.prescriptionRequired ? 'YES' : 'NO',
          unit: d.unit,
        }));
      }
    );
  }, [enrichedDrugs]);

  const handleQuickStockAdjust = useCallback((drug: DrugItem, newQty: number) => {
    const updated: DrugItem = {
      ...drug,
      stockQty: Math.max(0, newQty),
    };
    onUpdateDrug(updated);
  }, [onUpdateDrug]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    statusTab,
    setStatusTab,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredDrugs,
    metrics,
    showAddModal,
    setShowAddModal,
    showImportModal,
    setShowImportModal,
    showAdjustModal,
    setShowAdjustModal,
    editingDrug,
    setEditingDrug,
    adjustingDrug,
    setAdjustingDrug,
    handleExportCSV,
    handleQuickStockAdjust,
  };
}
