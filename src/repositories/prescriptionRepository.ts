/**
 * prescriptionRepository.ts — ZenithRx Prescription Repository
 * Prescription queue CRUD, status lifecycle, and item management.
 * Clean Architecture: Infrastructure Layer
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Prescription } from '../types';
import { DbPrescription, DbPrescriptionItem } from '../lib/database.types';
import { INITIAL_PRESCRIPTIONS } from '../data/mockData';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function dbToDomain(
  row: DbPrescription & { prescription_items?: DbPrescriptionItem[] }
): Prescription {
  return {
    id:            row.id,
    rxNumber:      row.rx_number,
    patientName:   row.patient_name,
    patientAge:    row.patient_age ?? 0,
    patientGender: (row.patient_gender === 'female' ? 'Female' : 'Male') as Prescription['patientGender'],
    patientPhone:  row.patient_phone,
    doctorName:    row.doctor_name,
    doctorLicence: row.doctor_licence,
    hospitalName:  row.hospital_name,
    date:          row.date,
    status:        mapStatus(row.status),
    medications:   (row.prescription_items ?? []).map(item => ({
      drugId:       item.drug_id ?? '',
      drugName:     item.drug_name,
      dosage:       item.dosage,
      frequency:    item.frequency,
      duration:     item.duration,
      quantity:     item.quantity,
      unitPrice:    Number(item.unit_price),
      dispensedQty: item.dispensed_qty,
      status:       (item.status === 'dispensed' ? 'Dispensed' : 'Pending') as 'Pending' | 'Dispensed',
    })),
    totalCost:   Number(row.total_cost),
    notes:       row.notes ?? undefined,
  };
}

function mapStatus(s: string): Prescription['status'] {
  switch (s) {
    case 'dispensed':           return 'Dispensed';
    case 'partially_dispensed': return 'Partially Dispensed';
    case 'cancelled':           return 'Cancelled';
    default:                    return 'Pending';
  }
}

function domainStatusToDb(s: Prescription['status']): string {
  switch (s) {
    case 'Dispensed':           return 'dispensed';
    case 'Partially Dispensed': return 'partially_dispensed';
    case 'Cancelled':           return 'cancelled';
    default:                    return 'pending';
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────

export async function getAllPrescriptions(tenantId: string): Promise<Prescription[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_PRESCRIPTIONS;
  }
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*, prescription_items(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[prescriptionRepository.getAll] ${error.message}`);
  return (data ?? []).map(row => dbToDomain(row as any));
}

export async function getPendingPrescriptions(tenantId: string): Promise<Prescription[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_PRESCRIPTIONS.filter(rx => rx.status === 'Pending');
  }
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*, prescription_items(*)')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('date', { ascending: true });

  if (error) throw new Error(`[prescriptionRepository.getPending] ${error.message}`);
  return (data ?? []).map(row => dbToDomain(row as any));
}

export async function createPrescription(
  rx: Omit<Prescription, 'id'>,
  tenantId: string,
  createdBy: string
): Promise<Prescription> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');

  const { data: inserted, error } = await (supabase
    .from('prescriptions') as any)
    .insert({
      tenant_id:      tenantId,
      rx_number:      rx.rxNumber,
      patient_name:   rx.patientName,
      patient_age:    rx.patientAge,
      patient_gender: rx.patientGender ? rx.patientGender.toLowerCase() : null,
      patient_phone:  rx.patientPhone,
      doctor_name:    rx.doctorName,
      doctor_licence: rx.doctorLicence,
      hospital_name:  rx.hospitalName,
      date:           rx.date,
      status:         domainStatusToDb(rx.status),
      total_cost:     rx.totalCost,
      notes:          rx.notes || null,
      created_by:     createdBy,
    })
    .select()
    .single();

  if (error) throw new Error(`[prescriptionRepository.create] ${error.message}`);
  if (!inserted?.id) throw new Error('Failed to create prescription header');

  // Insert medication items
  if (rx.medications.length > 0) {
    const items = rx.medications.map(med => ({
      prescription_id: inserted.id,
      tenant_id:       tenantId,
      drug_id:         med.drugId || null,
      drug_name:       med.drugName,
      dosage:          med.dosage,
      frequency:       med.frequency,
      duration:        med.duration,
      quantity:        med.quantity,
      unit_price:      med.unitPrice,
      dispensed_qty:   0,
      status:          med.status ? med.status.toLowerCase() : 'pending',
    }));
    const { error: itemErr } = await (supabase.from('prescription_items') as any).insert(items);
    if (itemErr) throw new Error(`[prescriptionRepository.createItems] ${itemErr.message}`);
  }

  const all = await getAllPrescriptions(tenantId);
  return all.find(p => p.id === inserted.id) ?? dbToDomain(inserted as any);
}

export async function updatePrescriptionStatus(
  id: string,
  status: Prescription['status']
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  const { error } = await (supabase
    .from('prescriptions') as any)
    .update({ status: domainStatusToDb(status) })
    .eq('id', id);
  if (error) throw new Error(`[prescriptionRepository.updateStatus] ${error.message}`);
}
