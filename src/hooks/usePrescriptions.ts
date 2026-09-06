/**
 * usePrescriptions.ts — ZenithRx Prescription Application Hook
 * Encapsulates prescription queue filtering, status management, and Rx generation.
 * Clean Architecture: Application Layer
 */

import { useState, useMemo } from 'react';
import { Prescription } from '../types';

export type RxStatusFilter = 'All' | 'Pending' | 'Dispensed' | 'Partially Dispensed' | 'Cancelled';

export function usePrescriptions(prescriptions: Prescription[]) {
  const [statusFilter, setStatusFilter] = useState<RxStatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  /** Filtered prescription list */
  const filteredPrescriptions = useMemo<Prescription[]>(() => {
    return prescriptions.filter((rx) => {
      const matchesStatus = statusFilter === 'All' || rx.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        rx.patientName.toLowerCase().includes(query) ||
        rx.rxNumber.toLowerCase().includes(query) ||
        rx.doctorName.toLowerCase().includes(query) ||
        rx.hospitalName.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [prescriptions, statusFilter, searchQuery]);

  /** Summary counts */
  const summary = useMemo(() => {
    return {
      total: prescriptions.length,
      pending: prescriptions.filter((rx) => rx.status === 'Pending').length,
      dispensed: prescriptions.filter((rx) => rx.status === 'Dispensed').length,
      partiallyDispensed: prescriptions.filter((rx) => rx.status === 'Partially Dispensed').length,
      cancelled: prescriptions.filter((rx) => rx.status === 'Cancelled').length,
    };
  }, [prescriptions]);

  return {
    filteredPrescriptions,
    summary,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
  };
}
