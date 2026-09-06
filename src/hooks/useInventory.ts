/**
 * useInventory.ts — ZenithRx Inventory Application Hook
 * Encapsulates all inventory business logic: FEFO, filtering, expiry classification.
 * Clean Architecture: Application Layer
 */

import { useState, useMemo } from 'react';
import { DrugItem } from '../types';
import { computeDaysRemaining, classifyExpiryRisk, ExpiryRisk } from '../services/formatters';

export interface DrugWithRisk extends DrugItem {
  daysRemaining: number;
  expiryRisk: ExpiryRisk;
  isLowStock: boolean;
}

export type CategoryFilter =
  | 'All'
  | 'Antibiotics'
  | 'Analgesics'
  | 'Cardiovascular'
  | 'Diabetes'
  | 'Respiratory'
  | 'OTC & Supplements'
  | 'Gastrointestinal'
  | 'Dermatology';

export function useInventory(drugs: DrugItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  /** Enrich each drug with computed FEFO risk data */
  const enrichedDrugs = useMemo<DrugWithRisk[]>(() => {
    return drugs.map((drug) => {
      const daysRemaining = computeDaysRemaining(drug.expiryDate);
      return {
        ...drug,
        daysRemaining,
        expiryRisk: classifyExpiryRisk(daysRemaining),
        isLowStock: drug.stockQty <= drug.reorderLevel,
      };
    });
  }, [drugs]);

  /** Filtered list based on search, category, and risk toggles */
  const filteredDrugs = useMemo<DrugWithRisk[]>(() => {
    return enrichedDrugs.filter((drug) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        drug.brandName.toLowerCase().includes(query) ||
        drug.genericName.toLowerCase().includes(query) ||
        drug.barcode.includes(query) ||
        drug.batchNumber.toLowerCase().includes(query) ||
        drug.shelfLocation.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === 'All' || drug.category === categoryFilter;

      const matchesLowStock = !showLowStockOnly || drug.isLowStock;
      const matchesExpiring =
        !showExpiringOnly || drug.expiryRisk === 'Expired' || drug.expiryRisk === 'Critical' || drug.expiryRisk === 'Warning';

      return matchesSearch && matchesCategory && matchesLowStock && matchesExpiring;
    });
  }, [enrichedDrugs, searchQuery, categoryFilter, showLowStockOnly, showExpiringOnly]);

  /** Summary counters */
  const summary = useMemo(() => {
    const total = enrichedDrugs.length;
    const lowStock = enrichedDrugs.filter((d) => d.isLowStock).length;
    const expired = enrichedDrugs.filter((d) => d.expiryRisk === 'Expired').length;
    const critical = enrichedDrugs.filter((d) => d.expiryRisk === 'Critical').length;
    const warning = enrichedDrugs.filter((d) => d.expiryRisk === 'Warning').length;
    const totalValue = enrichedDrugs.reduce(
      (acc, d) => acc + d.sellingPrice * d.stockQty,
      0
    );
    return { total, lowStock, expired, critical, warning, totalValue };
  }, [enrichedDrugs]);

  /** FEFO-sorted list (earliest expiry first) */
  const fefoSortedDrugs = useMemo<DrugWithRisk[]>(() => {
    return [...enrichedDrugs].sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [enrichedDrugs]);

  /** Drugs that need reordering */
  const reorderDrugs = useMemo<DrugWithRisk[]>(() => {
    return enrichedDrugs.filter((d) => d.stockQty <= d.reorderLevel);
  }, [enrichedDrugs]);

  return {
    enrichedDrugs,
    filteredDrugs,
    fefoSortedDrugs,
    reorderDrugs,
    summary,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    showLowStockOnly,
    setShowLowStockOnly,
    showExpiringOnly,
    setShowExpiringOnly,
  };
}
