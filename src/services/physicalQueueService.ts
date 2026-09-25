/**
 * physicalQueueService.ts — ZenithRx Physical Pharmacy Appointment & Smart Queue Management Engine
 * 
 * Generates live queue tickets (e.g. Queue #A023), dynamic Estimated Waiting Time (EWT),
 * digital lounge announcer boards, and connects physical walk-in patients directly
 * to licensed pharmacist clinical consultation workspaces.
 */

export type TicketStatus = 
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type CheckInChannel = 
  | 'WALK_IN_KIOSK'
  | 'PATIENT_APP'
  | 'RECEPTION_DESK'
  | 'QR_SCAN';

export type PriorityLevel = 
  | 'STANDARD'
  | 'PRIORITY_ELDERLY'
  | 'PRIORITY_PEDIATRIC'
  | 'EMERGENCY_TRIAGE';

export interface PharmacyQueueCategory {
  id: string;
  tenantId: string;
  categoryName: string;
  prefix: string; // e.g. 'A', 'C', 'V', 'S', 'E'
  averageDurationMinutes: number;
  targetCounterRoom: string;
  isActive: boolean;
}

export interface QueueTicket {
  id: string;
  tenantId: string;
  ticketNumber: string; // e.g. 'A023'
  queueDate: string;
  sequenceNumber: number;
  categoryId: string;
  categoryName: string;
  consultationType: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  checkInChannel: CheckInChannel;
  patientNotes?: string;
  priorityLevel: PriorityLevel;
  estimatedWaitMinutes: number;
  patientsAheadCount: number;
  checkInTime: string;
  calledTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
  actualWaitMinutes?: number;
  actualConsultationMinutes?: number;
  ticketStatus: TicketStatus;
  assignedCounter?: string;
  assignedPharmacistId?: string;
  assignedPharmacistName?: string;
  assignedPharmacistLicense?: string;
  clinicalNotes?: string;
  prescriptionsGenerated?: string[];
  referralMade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueSummaryMetrics {
  currentlyServing: QueueTicket | null;
  nextInLine: QueueTicket | null;
  totalWaiting: number;
  totalInConsultation: number;
  completedTodayCount: number;
  averageWaitTimeMinutes: number;
  activeConsultationRoomsCount: number;
}

const STORAGE_KEY_QUEUE_TICKETS = 'zenithrx_pharmacy_queue_tickets_v1';
const STORAGE_KEY_QUEUE_CATEGORIES = 'zenithrx_pharmacy_queue_categories_v1';

export const INITIAL_QUEUE_CATEGORIES: PharmacyQueueCategory[] = [
  {
    id: 'cat-gen-consult',
    tenantId: 'client-001',
    categoryName: 'General Pharmacist Consultation',
    prefix: 'A',
    averageDurationMinutes: 15,
    targetCounterRoom: 'Consultation Room 1',
    isActive: true
  },
  {
    id: 'cat-chronic-mtm',
    tenantId: 'client-001',
    categoryName: 'Chronic Care & Polypharmacy MTM',
    prefix: 'C',
    averageDurationMinutes: 25,
    targetCounterRoom: 'Clinical MTM Suite',
    isActive: true
  },
  {
    id: 'cat-vaccination',
    tenantId: 'client-001',
    categoryName: 'Vaccination & Injection Clinic',
    prefix: 'V',
    averageDurationMinutes: 10,
    targetCounterRoom: 'Immunization Bay',
    isActive: true
  },
  {
    id: 'cat-screening',
    tenantId: 'client-001',
    categoryName: 'Health Screening (BP / Glucose / Lipids)',
    prefix: 'S',
    averageDurationMinutes: 12,
    targetCounterRoom: 'Screening Counter',
    isActive: true
  },
  {
    id: 'cat-express-otc',
    tenantId: 'client-001',
    categoryName: 'Express OTC & Minor Ailments Advice',
    prefix: 'E',
    averageDurationMinutes: 8,
    targetCounterRoom: 'Express Counter 2',
    isActive: true
  }
];

export const INITIAL_QUEUE_TICKETS: QueueTicket[] = [
  {
    id: 'tkt-001',
    tenantId: 'client-001',
    ticketNumber: 'A021',
    queueDate: new Date().toISOString().split('T')[0],
    sequenceNumber: 21,
    categoryId: 'cat-gen-consult',
    categoryName: 'General Pharmacist Consultation',
    consultationType: 'Medication Review & Dosage Clarification',
    patientName: 'Kato Emmanuel',
    patientPhone: '+256 704 556677',
    checkInChannel: 'WALK_IN_KIOSK',
    patientNotes: 'Questions on taking new blood pressure tablets with morning breakfast.',
    priorityLevel: 'STANDARD',
    estimatedWaitMinutes: 0,
    patientsAheadCount: 0,
    checkInTime: new Date(Date.now() - 15 * 60000).toISOString(),
    calledTime: new Date(Date.now() - 12 * 60000).toISOString(),
    consultationStartTime: new Date(Date.now() - 10 * 60000).toISOString(),
    ticketStatus: 'IN_CONSULTATION',
    assignedCounter: 'Consultation Room 1',
    assignedPharmacistName: 'Dr. Arthur Ssenabulya (Supervising Pharmacist)',
    assignedPharmacistLicense: 'NDA/PHARM/2019/0411',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString()
  },
  {
    id: 'tkt-002',
    tenantId: 'client-001',
    ticketNumber: 'A022',
    queueDate: new Date().toISOString().split('T')[0],
    sequenceNumber: 22,
    categoryId: 'cat-gen-consult',
    categoryName: 'General Pharmacist Consultation',
    consultationType: 'Antibiotic Rash Triage',
    patientName: 'Aisha Namaganda',
    patientPhone: '+256 752 112233',
    checkInChannel: 'PATIENT_APP',
    patientNotes: 'Developed mild itching rash after starting amoxicillin yesterday.',
    priorityLevel: 'STANDARD',
    estimatedWaitMinutes: 3,
    patientsAheadCount: 0,
    checkInTime: new Date(Date.now() - 8 * 60000).toISOString(),
    calledTime: new Date(Date.now() - 2 * 60000).toISOString(),
    ticketStatus: 'CALLED',
    assignedCounter: 'Consultation Room 1',
    assignedPharmacistName: 'Dr. Arthur Ssenabulya (Supervising Pharmacist)',
    assignedPharmacistLicense: 'NDA/PHARM/2019/0411',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString()
  },
  {
    id: 'tkt-003',
    tenantId: 'client-001',
    ticketNumber: 'A023',
    queueDate: new Date().toISOString().split('T')[0],
    sequenceNumber: 23,
    categoryId: 'cat-gen-consult',
    categoryName: 'General Pharmacist Consultation',
    consultationType: 'Clinical Consultation & Medication Guidance',
    patientName: 'Robert Mukasa',
    patientPhone: '+256 782 443322',
    checkInChannel: 'WALK_IN_KIOSK',
    patientNotes: 'Patient requested: "I want to consult a pharmacist regarding my diabetes medication schedule."',
    priorityLevel: 'STANDARD',
    estimatedWaitMinutes: 15,
    patientsAheadCount: 1,
    checkInTime: new Date(Date.now() - 3 * 60000).toISOString(),
    ticketStatus: 'WAITING',
    assignedCounter: 'Consultation Room 1',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60000).toISOString()
  },
  {
    id: 'tkt-004',
    tenantId: 'client-001',
    ticketNumber: 'C014',
    queueDate: new Date().toISOString().split('T')[0],
    sequenceNumber: 14,
    categoryId: 'cat-chronic-mtm',
    categoryName: 'Chronic Care & Polypharmacy MTM',
    consultationType: 'Comprehensive Polypharmacy Audit',
    patientName: 'Sarah Nalubega',
    patientPhone: '+256 772 998877',
    checkInChannel: 'QR_SCAN',
    patientNotes: 'Taking 7 concurrent medications. Needs drug-interaction review.',
    priorityLevel: 'PRIORITY_ELDERLY',
    estimatedWaitMinutes: 25,
    patientsAheadCount: 2,
    checkInTime: new Date(Date.now() - 1 * 60000).toISOString(),
    ticketStatus: 'WAITING',
    assignedCounter: 'Clinical MTM Suite',
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60000).toISOString()
  }
];

export const getQueueCategories = (tenantId?: string): PharmacyQueueCategory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_QUEUE_CATEGORIES, JSON.stringify(INITIAL_QUEUE_CATEGORIES));
      return tenantId ? INITIAL_QUEUE_CATEGORIES.filter(c => c.tenantId === tenantId) : INITIAL_QUEUE_CATEGORIES;
    }
    const all: PharmacyQueueCategory[] = JSON.parse(raw);
    return tenantId ? all.filter(c => c.tenantId === tenantId) : all;
  } catch {
    return INITIAL_QUEUE_CATEGORIES;
  }
};

export const getQueueTickets = (tenantId?: string): QueueTicket[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE_TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_QUEUE_TICKETS, JSON.stringify(INITIAL_QUEUE_TICKETS));
      return tenantId ? INITIAL_QUEUE_TICKETS.filter(t => t.tenantId === tenantId) : INITIAL_QUEUE_TICKETS;
    }
    const all: QueueTicket[] = JSON.parse(raw);
    return tenantId ? all.filter(t => t.tenantId === tenantId) : all;
  } catch {
    return INITIAL_QUEUE_TICKETS;
  }
};

/**
 * Issue new Queue Ticket (Walk-in, Kiosk, or PWA)
 * Automatically calculates dynamic Estimated Wait Time (EWT)
 */
export const issueNewQueueTicket = (
  categoryId: string,
  patientName: string,
  patientPhone: string,
  checkInChannel: CheckInChannel = 'WALK_IN_KIOSK',
  patientNotes?: string,
  priorityLevel: PriorityLevel = 'STANDARD',
  tenantId: string = 'client-001'
): QueueTicket => {
  const categories = getQueueCategories(tenantId);
  const selectedCat = categories.find(c => c.id === categoryId) || categories[0];
  const allTickets = getQueueTickets(tenantId);
  
  // Find highest sequence number for this category prefix today
  const categoryTickets = allTickets.filter(t => t.ticketNumber.startsWith(selectedCat.prefix));
  const nextSeq = categoryTickets.length > 0 
    ? Math.max(...categoryTickets.map(t => t.sequenceNumber)) + 1 
    : 20; // Start comfortably around 20 for realism

  const ticketNumber = `${selectedCat.prefix}${String(nextSeq).padStart(3, '0')}`; // e.g. A023

  // Calculate waiting count and estimated wait minutes
  const activeAheadTickets = allTickets.filter(
    t => t.ticketStatus === 'WAITING' || t.ticketStatus === 'CALLED'
  );
  const patientsAheadCount = activeAheadTickets.length;
  
  // EWT Formula: (Patients Ahead + 1) * Avg Duration / Active Rooms (Default: 1 active room)
  const avgDuration = selectedCat.averageDurationMinutes || 15;
  const estimatedWaitMinutes = Math.max(5, patientsAheadCount * avgDuration);

  const newTicket: QueueTicket = {
    id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenantId,
    ticketNumber,
    queueDate: new Date().toISOString().split('T')[0],
    sequenceNumber: nextSeq,
    categoryId: selectedCat.id,
    categoryName: selectedCat.categoryName,
    consultationType: selectedCat.categoryName,
    patientName,
    patientPhone,
    checkInChannel,
    patientNotes: patientNotes || 'Patient requested: "I want to consult a pharmacist."',
    priorityLevel,
    estimatedWaitMinutes,
    patientsAheadCount,
    checkInTime: new Date().toISOString(),
    ticketStatus: 'WAITING',
    assignedCounter: selectedCat.targetCounterRoom,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedTickets = [...allTickets, newTicket];
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE_TICKETS, JSON.stringify(updatedTickets));
  } catch (e) {
    console.error('Failed to issue queue ticket', e);
  }

  return newTicket;
};

/**
 * Call Next Patient to Consultation Room / Pharmacist Counter
 */
export const callQueueTicket = (
  ticketId: string,
  counterRoom: string,
  pharmacistName: string,
  pharmacistLicense: string
): QueueTicket | null => {
  const all = getQueueTickets();
  const target = all.find(t => t.id === ticketId);
  if (!target) return null;

  const now = new Date().toISOString();
  const waitMs = new Date(now).getTime() - new Date(target.checkInTime).getTime();
  const actualWaitMinutes = Number((waitMs / 60000).toFixed(1));

  const updatedTarget: QueueTicket = {
    ...target,
    ticketStatus: 'CALLED',
    calledTime: now,
    assignedCounter: counterRoom,
    assignedPharmacistName: pharmacistName,
    assignedPharmacistLicense: pharmacistLicense,
    actualWaitMinutes,
    updatedAt: now
  };

  const updatedAll = all.map(t => t.id === ticketId ? updatedTarget : t);
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE_TICKETS, JSON.stringify(updatedAll));
  } catch (e) {
    console.error('Failed to call ticket', e);
  }

  return updatedTarget;
};

/**
 * Transition called ticket to In-Consultation
 */
export const startConsultationSession = (ticketId: string): QueueTicket | null => {
  const all = getQueueTickets();
  const target = all.find(t => t.id === ticketId);
  if (!target) return null;

  const now = new Date().toISOString();
  const updatedTarget: QueueTicket = {
    ...target,
    ticketStatus: 'IN_CONSULTATION',
    consultationStartTime: now,
    updatedAt: now
  };

  const updatedAll = all.map(t => t.id === ticketId ? updatedTarget : t);
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE_TICKETS, JSON.stringify(updatedAll));
  } catch (e) {
    console.error('Failed to start consultation', e);
  }

  return updatedTarget;
};

/**
 * Complete Pharmacist Consultation & Record SOAP / Clinical Notes
 */
export const completeConsultationSession = (
  ticketId: string,
  clinicalNotes: string,
  prescriptionsGenerated: string[] = [],
  referralMade?: string
): QueueTicket | null => {
  const all = getQueueTickets();
  const target = all.find(t => t.id === ticketId);
  if (!target) return null;

  const now = new Date().toISOString();
  const startMs = target.consultationStartTime ? new Date(target.consultationStartTime).getTime() : new Date(target.checkInTime).getTime();
  const consultMs = new Date(now).getTime() - startMs;
  const actualConsultationMinutes = Number((consultMs / 60000).toFixed(1));

  const updatedTarget: QueueTicket = {
    ...target,
    ticketStatus: 'COMPLETED',
    consultationEndTime: now,
    actualConsultationMinutes,
    clinicalNotes,
    prescriptionsGenerated,
    referralMade,
    updatedAt: now
  };

  const updatedAll = all.map(t => t.id === ticketId ? updatedTarget : t);
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE_TICKETS, JSON.stringify(updatedAll));
  } catch (e) {
    console.error('Failed to complete consultation', e);
  }

  return updatedTarget;
};

/**
 * Mark as No-Show or Cancelled
 */
export const updateTicketStatus = (
  ticketId: string,
  status: 'NO_SHOW' | 'CANCELLED'
): QueueTicket | null => {
  const all = getQueueTickets();
  const target = all.find(t => t.id === ticketId);
  if (!target) return null;

  const now = new Date().toISOString();
  const updatedTarget: QueueTicket = {
    ...target,
    ticketStatus: status,
    updatedAt: now
  };

  const updatedAll = all.map(t => t.id === ticketId ? updatedTarget : t);
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE_TICKETS, JSON.stringify(updatedAll));
  } catch (e) {
    console.error('Failed to cancel ticket', e);
  }

  return updatedTarget;
};

/**
 * Get Real-time Queue Summary KPI Metrics
 */
export const getQueueMetrics = (tenantId?: string): QueueSummaryMetrics => {
  const all = getQueueTickets(tenantId);
  const waitingTickets = all.filter(t => t.ticketStatus === 'WAITING');
  const calledTickets = all.filter(t => t.ticketStatus === 'CALLED');
  const inConsultTickets = all.filter(t => t.ticketStatus === 'IN_CONSULTATION');
  const completedToday = all.filter(t => t.ticketStatus === 'COMPLETED');

  const currentlyServing = inConsultTickets[0] || calledTickets[0] || null;
  const nextInLine = waitingTickets[0] || null;

  const waitTimes = completedToday
    .filter(t => t.actualWaitMinutes !== undefined)
    .map(t => t.actualWaitMinutes as number);
  
  const averageWaitTimeMinutes = waitTimes.length > 0 
    ? Number((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length).toFixed(1))
    : 12.5;

  return {
    currentlyServing,
    nextInLine,
    totalWaiting: waitingTickets.length,
    totalInConsultation: inConsultTickets.length,
    completedTodayCount: completedToday.length,
    averageWaitTimeMinutes,
    activeConsultationRoomsCount: 2
  };
};
