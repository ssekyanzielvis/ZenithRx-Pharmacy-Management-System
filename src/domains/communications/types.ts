/**
 * Bounded Context: Notifications & Communications
 * Complies with technical.md §11.6 & §11.19
 */

export interface RefillReminderDto {
  patientId: string;
  patientName: string;
  phoneNumber: string;
  drugName: string;
  daysRemaining: number;
  refillDueDate: string;
  pharmacyName: string;
  pharmacyPhone: string;
}

export interface WhatsAppRefillMessageDto {
  targetPhone: string;
  directWebUrl: string;
  messageText: string;
}
