/**
 * Bounded Context: Procurement & Supplier Management
 * Complies with technical.md §11.6
 */

export interface PurchaseOrderItemDto {
  drugId: string;
  drugName: string;
  quantityOrdered: number;
  unitCostUgx: number;
  totalCostUgx: number;
}

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  status: 'Draft' | 'Sent' | 'Delivered' | 'Cancelled';
  items: PurchaseOrderItemDto[];
  totalAmountUgx: number;
  createdAt: string;
  expectedDeliveryDate?: string;
}
