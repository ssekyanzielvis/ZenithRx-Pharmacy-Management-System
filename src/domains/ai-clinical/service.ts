/**
 * Bounded Context: AI Services & Document Processing Service Layer
 * Complies with technical.md §11.6 & §11.20
 */

import { PrescriptionOcrRequestDto, PrescriptionOcrResponseDto } from './types';

export class AiClinicalService {
  /**
   * Validates OCR payload structure before dispatching to LLM
   */
  static validateOcrInput(request: PrescriptionOcrRequestDto): { isValid: boolean; error?: string } {
    if (!request.imageBase64 && !request.textContent) {
      return {
        isValid: false,
        error: 'Either an image upload or clinical text notes must be provided for AI analysis.',
      };
    }
    return { isValid: true };
  }
}
