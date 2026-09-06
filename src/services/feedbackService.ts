import { PharmacyFeedbackTicket } from '../types';

// In-memory persistent store for feedback tickets (seeded with initial realistic tickets)
const INITIAL_FEEDBACK_TICKETS: PharmacyFeedbackTicket[] = [
  {
    id: 'FDB-2026-0801',
    clientId: 'client-1',
    clientName: 'Nakasero Pharmacy Branch',
    contactEmail: 'nakasero@pharmsync.online',
    contactPhone: '+256 774 607782',
    category: 'Feature Request',
    urgency: 'Normal',
    subject: 'WhatsApp Automatic Prescription Refill Reminder Integration',
    message: 'Could the development team add an automated WhatsApp message dispatch feature directly when a chronic patient’s refill date is within 3 days?',
    status: 'Resolved',
    dateSubmitted: '2026-08-01 10:14 AM',
    adminReply: {
      repliedBy: 'Dr. Arthur Ssenabulya (Superadmin)',
      replyMessage: 'Hello Nakasero Pharmacy team, this feature has been queued for our v3.3 release. In the meantime, you can trigger SMS/WhatsApp refill alerts directly from Patient Directory!',
      dateReplied: '2026-08-01 02:30 PM',
    },
  },
  {
    id: 'FDB-2026-0804',
    clientId: 'client-2',
    clientName: 'Ecopharm Nakasero',
    contactEmail: 'ecopharm@pharmsync.online',
    contactPhone: '+256 700 112233',
    category: 'NDA Compliance',
    urgency: 'High Priority',
    subject: 'Request for NDA Annual Premises License Auto-Renewal Audit Log Export',
    message: 'Our supervising pharmacist requires a quarterly export of NDA audit logs containing verified PSU registration numbers for regulatory inspection.',
    status: 'Pending Admin Review',
    dateSubmitted: '2026-08-04 09:30 AM',
  },
  {
    id: 'FDB-2026-0806',
    clientId: 'client-3',
    clientName: 'Mbarara City Pharmacy',
    contactEmail: 'mbarara@pharmsync.online',
    contactPhone: '+256 752 445566',
    category: 'Bug Report',
    urgency: 'Critical',
    subject: 'Thermal Receipt Printer Margin Spacing Adjustment',
    message: 'The POS receipt footer is clipping the total VAT breakdown on 80mm thermal printers during peak cashier hours.',
    status: 'In Progress',
    dateSubmitted: '2026-08-06 04:15 PM',
    adminReply: {
      repliedBy: 'Engineering Lead (Quantum Networks)',
      replyMessage: 'We have identified the thermal CSS margin offset and deployed a patch to server.ts. Please verify print output on next transaction.',
      dateReplied: '2026-08-06 05:00 PM',
    },
  },
];

const LOCAL_STORAGE_KEY = 'zenithrx_feedback_tickets';

const getStoredTickets = (): PharmacyFeedbackTicket[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse feedback tickets from localStorage:', err);
  }
  return INITIAL_FEEDBACK_TICKETS;
};

const saveTicketsToStorage = (tickets: PharmacyFeedbackTicket[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.error('Failed to save feedback tickets to localStorage:', err);
  }
};

export const getFeedbackTickets = (): PharmacyFeedbackTicket[] => {
  return getStoredTickets();
};

export const getTicketsForClient = (clientId: string): PharmacyFeedbackTicket[] => {
  const all = getStoredTickets();
  return all.filter((t) => t.clientId === clientId || t.clientId === 'client-1');
};

export const submitPharmacyFeedback = (
  ticketData: Omit<PharmacyFeedbackTicket, 'id' | 'status' | 'dateSubmitted'>
): PharmacyFeedbackTicket => {
  const current = getStoredTickets();
  const newTicket: PharmacyFeedbackTicket = {
    ...ticketData,
    id: `FDB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Pending Admin Review',
    dateSubmitted: new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  const updated = [newTicket, ...current];
  saveTicketsToStorage(updated);
  return newTicket;
};

export const replyToPharmacyFeedback = (
  ticketId: string,
  replyMessage: string,
  repliedBy: string = 'System Administrator',
  newStatus: 'In Progress' | 'Resolved' = 'Resolved'
): PharmacyFeedbackTicket | null => {
  const current = getStoredTickets();
  let updatedTicket: PharmacyFeedbackTicket | null = null;

  const updated = current.map((t) => {
    if (t.id === ticketId) {
      updatedTicket = {
        ...t,
        status: newStatus,
        adminReply: {
          repliedBy,
          replyMessage,
          dateReplied: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      };
      return updatedTicket;
    }
    return t;
  });

  if (updatedTicket) {
    saveTicketsToStorage(updated);
  }
  return updatedTicket;
};
