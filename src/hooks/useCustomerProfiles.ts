/**
 * useCustomerProfiles.ts — ZenithRx Patient Profiles & WhatsApp Refill Engine Hook
 * Clean Architecture: Application Layer
 * Manages patient demographics, chronic medication cadence tracking, refill due alerts,
 * customer loyalty point accrual, and 1-click WhatsApp refill dispatch.
 */

import { useState, useMemo, useCallback } from 'react';
import { CustomerProfile } from '../types';

export interface UseCustomerProfilesProps {
  initialCustomers: CustomerProfile[];
  pharmacyName?: string;
  pharmacyPhone?: string;
  onAddCustomer?: (customer: CustomerProfile) => void;
}

export function useCustomerProfiles({
  initialCustomers,
  pharmacyName = 'ZenithRx Pharmacy',
  pharmacyPhone = '+256 774 607782',
  onAddCustomer,
}: UseCustomerProfilesProps) {
  const [customers, setCustomers] = useState<CustomerProfile[]>(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomers[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'refillsDue' | 'chronic' | 'loyalty'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [lastDispatchedInfo, setLastDispatchedInfo] = useState<{
    customerName: string;
    phone: string;
    drugName: string;
  } | null>(null);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // ─── Filtered Customers ───────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(q) ||
        customer.phone.includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.chronicConditions.some((c) => c.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (activeFilter === 'refillsDue') {
        return (
          customer.chronicMedications &&
          customer.chronicMedications.some((m) => m.status === 'Due')
        );
      }

      if (activeFilter === 'chronic') {
        return customer.chronicConditions.length > 0;
      }

      if (activeFilter === 'loyalty') {
        return (customer.loyaltyPoints || 0) > 200;
      }

      return true;
    });
  }, [customers, searchTerm, activeFilter]);

  // ─── Summary Statistics ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalPatients = customers.length;
    const totalChronicPatients = customers.filter((c) => c.chronicConditions.length > 0).length;
    const refillsDueCount = customers.filter((c) =>
      c.chronicMedications?.some((m) => m.status === 'Due')
    ).length;
    const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

    return {
      totalPatients,
      totalChronicPatients,
      refillsDueCount,
      totalLoyaltyPoints,
    };
  }, [customers]);

  // ─── WhatsApp Refill Link Generator ────────────────────────────────────────
  const generateWhatsAppLink = useCallback(
    (customer: CustomerProfile, drugName?: string, nextRefillDate?: string, quantity?: number, posology?: string) => {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      const medicationText = drugName ? `*${drugName}*` : 'your routine prescription refill';
      
      let countdownNotice = '🔔 Your routine medication supply is reaching its estimated depletion date.';
      if (nextRefillDate) {
        const today = new Date('2026-09-25');
        const target = new Date(nextRefillDate);
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          countdownNotice = `⚠️ *Alert:* Your routine supply ran out *${Math.abs(diffDays)} days ago*. To prevent missed doses, please refill immediately.`;
        } else if (diffDays === 0) {
          countdownNotice = `🔔 *Alert:* Your supply *runs out today* (${nextRefillDate}).`;
        } else if (diffDays === 1) {
          countdownNotice = `🔔 *Refill Notice:* Your supply *runs out tomorrow* (1 day remaining).`;
        } else {
          countdownNotice = `🔔 *Refill Notice:* *Refill due in ${diffDays} days* (Estimated Depletion: *${nextRefillDate}*).`;
        }
      }

      const message =
        `Hello *${customer.name}*! 👋\n\n` +
        `This is *${pharmacyName}* with your precision refill reminder regarding ${medicationText}.\n\n` +
        `${countdownNotice}\n\n` +
        (posology ? `📋 *Prescribed Posology:* ${posology}\n` : '') +
        (quantity ? `📦 *Original Pack Dispensed:* ${quantity} units\n` : '') +
        `✅ Your refill has been verified in-stock by our supervising pharmacist.\n\n` +
        `⭐ *Loyalty Balance:* You have *${customer.loyaltyPoints || 0} ZenithPoints* available for instant discounts!\n\n` +
        `Reply *REFILL* to reserve for fast-track pharmacy pickup or confirm doorstep courier delivery.\n\n` +
        `📞 Call/WhatsApp us directly at ${pharmacyPhone} for any pharmacist counseling.`;

      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    },
    [pharmacyName, pharmacyPhone]
  );

  // ─── Trigger WhatsApp Refill Dispatch ─────────────────────────────────────
  const handleDispatchWhatsAppRefill = useCallback(
    (customer: CustomerProfile, drugName?: string, nextRefillDate?: string) => {
      const link = generateWhatsAppLink(customer, drugName, nextRefillDate);
      window.open(link, '_blank');

      const nowStr = new Date().toISOString().split('T')[0];

      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customer.id) {
            return {
              ...c,
              lastRefillReminderSent: nowStr,
            };
          }
          return c;
        })
      );

      setLastDispatchedInfo({
        customerName: customer.name,
        phone: customer.phone,
        drugName: drugName || 'Routine Regimen',
      });

      setTimeout(() => setLastDispatchedInfo(null), 5000);
    },
    [generateWhatsAppLink]
  );

  // ─── Mark Medication as Refilled ──────────────────────────────────────────
  const handleMarkMedicationRefilled = useCallback(
    (customerId: string, drugName: string) => {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customerId && c.chronicMedications) {
            const updatedMeds = c.chronicMedications.map((m) => {
              if (m.drugName === drugName) {
                return {
                  ...m,
                  status: 'Refilled' as const,
                  nextRefillDate: nextDateStr,
                };
              }
              return m;
            });
            return {
              ...c,
              loyaltyPoints: (c.loyaltyPoints || 0) + 50,
              totalPurchasesCount: c.totalPurchasesCount + 1,
              lastVisit: new Date().toISOString().split('T')[0],
              chronicMedications: updatedMeds,
            };
          }
          return c;
        })
      );
    },
    []
  );

  // ─── Add New Chronic Medication to Patient ─────────────────────────────────
  const handleAddChronicMedication = useCallback(
    (customerId: string, medication: { drugName: string; dosage: string; frequency: string; daysSupply: number }) => {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + medication.daysSupply);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customerId) {
            const currentMeds = c.chronicMedications || [];
            return {
              ...c,
              chronicMedications: [
                ...currentMeds,
                {
                  drugName: medication.drugName,
                  dosage: medication.dosage,
                  frequency: medication.frequency,
                  daysSupply: medication.daysSupply,
                  nextRefillDate: nextDateStr,
                  status: 'Upcoming' as const,
                },
              ],
            };
          }
          return c;
        })
      );
      setShowAddMedModal(false);
    },
    []
  );

  // ─── Add New Patient Profile ───────────────────────────────────────────────
  const handleCreateCustomer = useCallback(
    (newCust: CustomerProfile) => {
      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomerId(newCust.id);
      setShowAddModal(false);
      if (onAddCustomer) {
        onAddCustomer(newCust);
      }
    },
    [onAddCustomer]
  );

  return {
    customers,
    selectedCustomer,
    setSelectedCustomerId,
    filteredCustomers,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    stats,
    showAddModal,
    setShowAddModal,
    showAddMedModal,
    setShowAddMedModal,
    lastDispatchedInfo,
    generateWhatsAppLink,
    handleDispatchWhatsAppRefill,
    handleMarkMedicationRefilled,
    handleAddChronicMedication,
    handleCreateCustomer,
  };
}
