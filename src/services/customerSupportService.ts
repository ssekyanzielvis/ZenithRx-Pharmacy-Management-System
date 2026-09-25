// ============================================================================
// Customer Support & Complaints Domain Service
// Handles patient complaints, service inquiries, delivery issues, billing disputes,
// and threaded resolution workflows separate from clinical consultation.
// ============================================================================

export type TicketCategory =
  | 'order_delivery_delay'
  | 'billing_payment_dispute'
  | 'medicine_quality_packaging'
  | 'refill_processing'
  | 'staff_conduct'
  | 'app_technical_glitch'
  | 'general_inquiry';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical_urgent';

export type TicketStatus =
  | 'open'
  | 'in_review'
  | 'escalated'
  | 'pending_patient_response'
  | 'resolved'
  | 'closed';

export type TicketResolutionAction =
  | 'refund_processed'
  | 'replacement_dispatched'
  | 'staff_coached'
  | 'delivery_expedited'
  | 'guidance_provided'
  | 'no_fault_found';

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  senderType: 'patient' | 'staff' | 'system';
  senderId?: string;
  senderName: string;
  senderRole?: string;
  message: string;
  isInternalNote: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  tenantId: string;
  pharmacyId: string;
  
  // Patient Details
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  
  // Classification
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Assignment
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffRole?: string;
  
  // Resolution
  resolutionSummary?: string;
  resolutionActionTaken?: TicketResolutionAction;
  resolutionReference?: string;
  closedAt?: string;
  slaDeadline: string;
  
  // CSAT Rating
  satisfactionRating?: number;
  satisfactionFeedback?: string;
  
  // Threaded Responses & Attachments
  attachments: TicketAttachment[];
  responses: TicketResponse[];
  
  createdAt: string;
  updatedAt: string;
}

export interface CategoryMeta {
  category: TicketCategory;
  label: string;
  iconName: string;
  defaultPriority: TicketPriority;
  slaHours: number;
  badgeClass: string;
}

export const TICKET_CATEGORIES: CategoryMeta[] = [
  {
    category: 'order_delivery_delay',
    label: 'Order & Delivery Delay',
    iconName: 'Truck',
    defaultPriority: 'high',
    slaHours: 2,
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200',
  },
  {
    category: 'billing_payment_dispute',
    label: 'Billing & MoMo Dispute',
    iconName: 'DollarSign',
    defaultPriority: 'high',
    slaHours: 4,
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
  },
  {
    category: 'medicine_quality_packaging',
    label: 'Medicine Packaging / Quality',
    iconName: 'PackageX',
    defaultPriority: 'high',
    slaHours: 3,
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200',
  },
  {
    category: 'refill_processing',
    label: 'Refill & Prescription Issue',
    iconName: 'RefreshCw',
    defaultPriority: 'medium',
    slaHours: 6,
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200',
  },
  {
    category: 'staff_conduct',
    label: 'Staff Conduct & Service',
    iconName: 'UserX',
    defaultPriority: 'medium',
    slaHours: 12,
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200',
  },
  {
    category: 'app_technical_glitch',
    label: 'Portal / App Technical Issue',
    iconName: 'AlertTriangle',
    defaultPriority: 'low',
    slaHours: 24,
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
  },
  {
    category: 'general_inquiry',
    label: 'General Customer Inquiry',
    iconName: 'HelpCircle',
    defaultPriority: 'low',
    slaHours: 24,
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
  },
];

const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'TKT-2026-0891',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    patientId: 'pat-001',
    patientName: 'Harriet Nakato',
    patientPhone: '+256 701 234 567',
    patientEmail: 'harriet.nakato@gmail.com',
    category: 'order_delivery_delay',
    subject: 'Express delivery to Kololo delayed by over 45 minutes',
    description: 'I ordered Ventolin Inhaler and Panadol Extra for express delivery. Order confirmation said 30 mins, but it has now been 1 hour 15 mins. Rider phone went unanswered.',
    priority: 'high',
    status: 'resolved',
    assignedStaffId: 'stf-004',
    assignedStaffName: 'Dennis Ochieng',
    assignedStaffRole: 'Logistics & Courier Lead',
    resolutionSummary: 'Contacted dispatch rider (Boda #UFE-231P) who was delayed by heavy downpour on Jinja Road. Delivery completed at 10:45 AM. Issued UGX 5,000 delivery fee coupon for next order.',
    resolutionActionTaken: 'delivery_expedited',
    resolutionReference: 'REF-COUPON-8821',
    closedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() - 4 * 3600000).toISOString(),
    satisfactionRating: 5,
    satisfactionFeedback: 'Dennis was very courteous and called me immediately to explain the rain delay. Thank you!',
    attachments: [
      {
        id: 'att-001',
        ticketId: 'tkt-001',
        fileName: 'order_receipt_ORD7712.pdf',
        fileType: 'application/pdf',
        fileUrl: '#',
        fileSizeBytes: 245000,
        uploadedBy: 'Harriet Nakato',
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      },
    ],
    responses: [
      {
        id: 'resp-001',
        ticketId: 'tkt-001',
        senderType: 'patient',
        senderId: 'pat-001',
        senderName: 'Harriet Nakato',
        senderRole: 'Patient',
        message: 'Please assist urgently, I need the inhaler for my daughter.',
        isInternalNote: false,
        createdAt: new Date(Date.now() - 5.8 * 3600000).toISOString(),
      },
      {
        id: 'resp-002',
        ticketId: 'tkt-001',
        senderType: 'staff',
        senderId: 'stf-004',
        senderName: 'Dennis Ochieng',
        senderRole: 'Logistics & Courier Lead',
        message: 'Hello Harriet, sincere apologies for the delay. Rider Joseph is 500 meters away from your gate. He had taken shelter due to sudden rainfall. He is arriving right now.',
        isInternalNote: false,
        createdAt: new Date(Date.now() - 5.3 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'tkt-002',
    ticketNumber: 'TKT-2026-0892',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    patientId: 'pat-002',
    patientName: 'Moses Kigozi',
    patientPhone: '+256 772 987 654',
    patientEmail: 'm.kigozi@yahoo.com',
    category: 'billing_payment_dispute',
    subject: 'MTN Mobile Money double charge on order #ORD-7721',
    description: 'When completing checkout on the patient portal, the first prompt timed out so I entered PIN again. My MTN statement shows two deductions of UGX 45,000.',
    priority: 'high',
    status: 'in_review',
    assignedStaffId: 'stf-002',
    assignedStaffName: 'Sarah Namubiru',
    assignedStaffRole: 'Customer Support & Billing Agent',
    slaDeadline: new Date(Date.now() + 2 * 3600000).toISOString(),
    attachments: [
      {
        id: 'att-002',
        ticketId: 'tkt-002',
        fileName: 'momo_sms_screenshot.png',
        fileType: 'image/png',
        fileUrl: '#',
        fileSizeBytes: 512000,
        uploadedBy: 'Moses Kigozi',
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ],
    responses: [
      {
        id: 'resp-003',
        ticketId: 'tkt-002',
        senderType: 'staff',
        senderId: 'stf-002',
        senderName: 'Sarah Namubiru',
        senderRole: 'Customer Support & Billing Agent',
        message: 'INTERNAL NOTE: Checked Beyonic / MTN MoMo transaction ledger. Duplicate transaction #MM-UGX-90123 confirmed pending settlement. Initiating reversal via API.',
        isInternalNote: true,
        createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
      },
      {
        id: 'resp-004',
        ticketId: 'tkt-002',
        senderType: 'staff',
        senderId: 'stf-002',
        senderName: 'Sarah Namubiru',
        senderRole: 'Customer Support & Billing Agent',
        message: 'Hello Moses, we have verified the duplicate MoMo transaction on our payment gateway ledger. We have submitted a direct refund request of UGX 45,000 back to your phone number. It will reflect within 1–2 hours.',
        isInternalNote: false,
        createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 'tkt-003',
    ticketNumber: 'TKT-2026-0893',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    patientId: 'pat-003',
    patientName: 'Grace Akello',
    patientPhone: '+256 752 443 211',
    patientEmail: 'grace.akello@outlook.com',
    category: 'medicine_quality_packaging',
    subject: 'Outer seal on Cetirizine syrup was dented during transit',
    description: 'The package arrived in the courier pouch, but the outer paper box was crushed. The inner glass bottle safety ring appears intact, but I would like confirmation that it is safe to administer to my child.',
    priority: 'medium',
    status: 'open',
    assignedStaffId: 'stf-001',
    assignedStaffName: 'Dr. Arthur Ssenabulya',
    assignedStaffRole: 'Supervising Pharmacist',
    slaDeadline: new Date(Date.now() + 5 * 3600000).toISOString(),
    attachments: [
      {
        id: 'att-003',
        ticketId: 'tkt-003',
        fileName: 'damaged_box_photo.jpg',
        fileType: 'image/jpeg',
        fileUrl: '#',
        fileSizeBytes: 890000,
        uploadedBy: 'Grace Akello',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
    ],
    responses: [],
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
];

const STORAGE_KEY = 'zenithrx_customer_support_tickets_v1';

function getStoredTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading customer support tickets:', e);
  }
  return INITIAL_SUPPORT_TICKETS;
}

function saveStoredTickets(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Error saving customer support tickets:', e);
  }
}

export const customerSupportService = {
  /**
   * Get all tickets with optional filtering.
   */
  getAllTickets(params?: {
    pharmacyId?: string;
    category?: TicketCategory;
    status?: TicketStatus;
    priority?: TicketPriority;
    query?: string;
  }): SupportTicket[] {
    let list = getStoredTickets();

    if (params?.pharmacyId && params.pharmacyId !== 'all') {
      list = list.filter((t) => t.pharmacyId === params.pharmacyId);
    }

    if (params?.category) {
      list = list.filter((t) => t.category === params.category);
    }

    if (params?.status) {
      list = list.filter((t) => t.status === params.status);
    }

    if (params?.priority) {
      list = list.filter((t) => t.priority === params.priority);
    }

    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.patientName.toLowerCase().includes(q) ||
          t.patientPhone.includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get tickets belonging to a specific patient.
   */
  getTicketsForPatient(patientPhoneOrId: string): SupportTicket[] {
    const list = getStoredTickets();
    return list.filter(
      (t) =>
        t.patientPhone === patientPhoneOrId ||
        t.patientId === patientPhoneOrId ||
        (t.patientEmail && t.patientEmail.toLowerCase() === patientPhoneOrId.toLowerCase())
    );
  },

  /**
   * Get ticket by ID.
   */
  getTicketById(ticketId: string): SupportTicket | undefined {
    return getStoredTickets().find((t) => t.id === ticketId);
  },

  /**
   * Create a new patient support ticket.
   */
  createTicket(input: {
    pharmacyId?: string;
    patientId?: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    category: TicketCategory;
    subject: string;
    description: string;
    priority?: TicketPriority;
    attachmentFileNames?: string[];
  }): SupportTicket {
    const tickets = getStoredTickets();
    const catMeta = TICKET_CATEGORIES.find((c) => c.category === input.category);
    const priority = input.priority || catMeta?.defaultPriority || 'medium';
    const slaHours = catMeta?.slaHours || 12;

    const ticketNumber = `TKT-2026-${(tickets.length + 894).toString().padStart(4, '0')}`;
    const newId = `tkt-${Date.now()}`;

    const attachments: TicketAttachment[] = (input.attachmentFileNames || []).map((name, i) => ({
      id: `att-${newId}-${i}`,
      ticketId: newId,
      fileName: name,
      fileType: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      fileUrl: '#',
      fileSizeBytes: 420000,
      uploadedBy: input.patientName,
      createdAt: new Date().toISOString(),
    }));

    const newTicket: SupportTicket = {
      id: newId,
      ticketNumber,
      tenantId: input.pharmacyId || 'client-001',
      pharmacyId: input.pharmacyId || 'client-001',
      patientId: input.patientId,
      patientName: input.patientName,
      patientPhone: input.patientPhone,
      patientEmail: input.patientEmail,
      category: input.category,
      subject: input.subject,
      description: input.description,
      priority,
      status: 'open',
      slaDeadline: new Date(Date.now() + slaHours * 3600000).toISOString(),
      attachments,
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    saveStoredTickets(tickets);
    return newTicket;
  },

  /**
   * Add a threaded response or internal note to a ticket.
   */
  addResponse(
    ticketId: string,
    input: {
      senderType: 'patient' | 'staff' | 'system';
      senderId?: string;
      senderName: string;
      senderRole?: string;
      message: string;
      isInternalNote: boolean;
      updateStatus?: TicketStatus;
    }
  ): TicketResponse | null {
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const response: TicketResponse = {
      id: `resp-${Date.now()}`,
      ticketId,
      senderType: input.senderType,
      senderId: input.senderId,
      senderName: input.senderName,
      senderRole: input.senderRole,
      message: input.message,
      isInternalNote: input.isInternalNote,
      createdAt: new Date().toISOString(),
    };

    ticket.responses.push(response);
    ticket.updatedAt = new Date().toISOString();

    if (input.updateStatus) {
      ticket.status = input.updateStatus;
    } else if (input.senderType === 'staff' && !input.isInternalNote && ticket.status === 'open') {
      ticket.status = 'in_review';
    } else if (input.senderType === 'patient' && ticket.status === 'pending_patient_response') {
      ticket.status = 'in_review';
    }

    saveStoredTickets(tickets);
    return response;
  },

  /**
   * Assign ticket to a staff member.
   */
  assignStaff(
    ticketId: string,
    staff: { id: string; name: string; role: string }
  ): boolean {
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;

    ticket.assignedStaffId = staff.id;
    ticket.assignedStaffName = staff.name;
    ticket.assignedStaffRole = staff.role;
    ticket.updatedAt = new Date().toISOString();

    // Auto add system note
    ticket.responses.push({
      id: `resp-sys-${Date.now()}`,
      ticketId,
      senderType: 'system',
      senderName: 'System Bot',
      message: `Ticket reassigned to ${staff.name} (${staff.role}).`,
      isInternalNote: true,
      createdAt: new Date().toISOString(),
    });

    saveStoredTickets(tickets);
    return true;
  },

  /**
   * Update ticket status.
   */
  updateStatus(ticketId: string, status: TicketStatus, staffName?: string): boolean {
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    if (status === 'closed' && !ticket.closedAt) {
      ticket.closedAt = new Date().toISOString();
    }

    if (staffName) {
      ticket.responses.push({
        id: `resp-sys-${Date.now()}`,
        ticketId,
        senderType: 'system',
        senderName: 'System Bot',
        message: `Status updated to "${status.toUpperCase()}" by ${staffName}.`,
        isInternalNote: true,
        createdAt: new Date().toISOString(),
      });
    }

    saveStoredTickets(tickets);
    return true;
  },

  /**
   * Update priority.
   */
  updatePriority(ticketId: string, priority: TicketPriority): boolean {
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;

    ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();
    saveStoredTickets(tickets);
    return true;
  },

  /**
   * Resolve a ticket with formal action and reference code.
   */
  resolveTicket(
    ticketId: string,
    input: {
      resolutionSummary: string;
      resolutionActionTaken: TicketResolutionAction;
      resolutionReference?: string;
      staffName: string;
      staffRole: string;
      notifyPatientMessage?: string;
    }
  ): boolean {
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;

    ticket.status = 'resolved';
    ticket.resolutionSummary = input.resolutionSummary;
    ticket.resolutionActionTaken = input.resolutionActionTaken;
    ticket.resolutionReference = input.resolutionReference;
    ticket.closedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    if (input.notifyPatientMessage) {
      ticket.responses.push({
        id: `resp-${Date.now()}`,
        ticketId,
        senderType: 'staff',
        senderName: input.staffName,
        senderRole: input.staffRole,
        message: input.notifyPatientMessage,
        isInternalNote: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveStoredTickets(tickets);
    return true;
  },

  /**
   * Submit patient CSAT rating.
   */
  submitSatisfactionRating(ticketId: string, rating: number, feedback?: string): boolean {
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;

    ticket.satisfactionRating = rating;
    ticket.satisfactionFeedback = feedback;
    ticket.updatedAt = new Date().toISOString();
    saveStoredTickets(tickets);
    return true;
  },

  /**
   * Get summary analytics for customer support.
   */
  getAnalytics(pharmacyId?: string) {
    const tickets = this.getAllTickets({ pharmacyId });
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open' || t.status === 'in_review').length;
    const escalated = tickets.filter((t) => t.status === 'escalated').length;
    const resolved = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

    const ratedTickets = tickets.filter((t) => t.satisfactionRating !== undefined);
    const avgCsat = ratedTickets.length
      ? +(ratedTickets.reduce((acc, t) => acc + (t.satisfactionRating || 0), 0) / ratedTickets.length).toFixed(1)
      : 4.8;

    const breachedSla = tickets.filter(
      (t) =>
        (t.status === 'open' || t.status === 'in_review' || t.status === 'escalated') &&
        new Date(t.slaDeadline).getTime() < Date.now()
    ).length;

    return {
      total,
      open,
      escalated,
      resolved,
      avgCsat,
      breachedSla,
    };
  },
};
