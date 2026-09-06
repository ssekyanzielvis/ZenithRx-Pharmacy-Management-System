/**
 * Bounded Context: Notifications & Communications Service Layer
 * Complies with technical.md §11.6 & §11.19
 */

import { RefillReminderDto, WhatsAppRefillMessageDto } from './types';

export class CommunicationService {
  /**
   * Generates a 1-click WhatsApp web refill reminder link
   */
  static generateWhatsAppRefillLink(reminder: RefillReminderDto): WhatsAppRefillMessageDto {
    const cleanPhone = reminder.phoneNumber.replace(/[^0-9]/g, '');
    const message = `Hello ${reminder.patientName}, this is ${reminder.pharmacyName}. Your prescription for ${reminder.drugName} is due for refill on ${reminder.refillDueDate}. Reply 'YES' to prepare your package for pickup, or call ${reminder.pharmacyPhone}.`;
    
    const encodedMessage = encodeURIComponent(message);
    const directWebUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    return {
      targetPhone: cleanPhone,
      directWebUrl,
      messageText: message,
    };
  }
}
