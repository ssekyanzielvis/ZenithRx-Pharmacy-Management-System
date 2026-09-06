/**
 * Bounded Context: Point of Sale & Billing
 * Complies with technical.md §11.6 & §11.18
 */

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Credit Card' | 'Insurance' | 'Deferred Voucher';

export interface PosLineItemDto {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPriceUgx: number;
  discountPercentage: number;
  lineTotalUgx: number;
  batchNumber?: string;
}

export interface SaleCheckoutRequestDto {
  tenantId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  items: PosLineItemDto[];
  subtotalUgx: number;
  discountUgx: number;
  totalPayableUgx: number;
  paymentMethod: PaymentMethod;
  momoPhoneNumber?: string;
  momoProvider?: 'MTN' | 'Airtel';
  insuranceMemberNo?: string;
  insuranceProviderId?: string;
}
