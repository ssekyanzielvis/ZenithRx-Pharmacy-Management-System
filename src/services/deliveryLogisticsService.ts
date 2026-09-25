/**
 * deliveryLogisticsService.ts — Order Fulfilment & Delivery Logistics (§11, §24)
 * Temperature-controlled cold chain logging, rider dispatch, and OTP delivery confirmation.
 */

import { DeliveryOrder } from '../types';
export type { DeliveryOrder };

const STORAGE_KEY_DELIVERIES = 'zenithrx_delivery_orders_v1';

export const INITIAL_DELIVERIES: DeliveryOrder[] = [
  {
    id: 'del-001',
    orderNumber: 'ORD-2026-09121',
    tenantId: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    patientName: 'John Baptist Okello',
    patientPhone: '+256 772 345678',
    deliveryAddress: 'Ntinda Complex, Block B, Floor 2, Kampala',
    deliveryDistrict: 'Kampala',
    itemsSummary: 'Glucophage 500mg (60 tabs), Amlodipine 5mg (30 tabs)',
    totalOrderAmountUgx: 72000,
    deliveryFeeUgx: 5000,
    paymentMethod: 'MTN Mobile Money',
    paymentStatus: 'Paid Online',
    status: 'Out for Delivery',
    isColdChainRequired: false,
    assignedCourierName: 'Moses Kigozi (ZenithRx Rider #4)',
    assignedCourierPhone: '+256 700 889900',
    courierVehiclePlate: 'UDL 892K (Bajaj Boxer)',
    estimatedDeliveryTime: '2026-08-05T14:45:00Z',
    deliveryOtpCode: '8914',
    deliveryOtpConfirmed: false,
    createdAt: '2026-08-05T11:00:00Z',
  },
  {
    id: 'del-002',
    orderNumber: 'ORD-2026-09122',
    tenantId: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    patientName: 'Grace Nakato',
    patientPhone: '+256 701 234567',
    deliveryAddress: 'Plot 14, Acacia Avenue, Kololo',
    deliveryDistrict: 'Kampala',
    itemsSummary: 'Lantus SoloStar 100 IU/ml (2 pens), Blood Glucose Strips (50s)',
    totalOrderAmountUgx: 165000,
    deliveryFeeUgx: 7000,
    paymentMethod: 'Airtel Money',
    paymentStatus: 'Paid Online',
    status: 'Out for Delivery',
    isColdChainRequired: true,
    coldChainLogs: [
      { timestamp: '2026-08-05T11:30:00Z', temperatureCelsius: 4.2, isWithinSafeRange: true, recordedByDeviceId: 'IOT-COOLBOX-08' },
      { timestamp: '2026-08-05T12:00:00Z', temperatureCelsius: 4.8, isWithinSafeRange: true, recordedByDeviceId: 'IOT-COOLBOX-08' },
      { timestamp: '2026-08-05T12:30:00Z', temperatureCelsius: 5.1, isWithinSafeRange: true, recordedByDeviceId: 'IOT-COOLBOX-08' },
    ],
    assignedCourierName: 'Patrick Otim (Cold-Chain Specialist)',
    assignedCourierPhone: '+256 788 123456',
    courierVehiclePlate: 'UEA 441P (Insulated Box Van)',
    estimatedDeliveryTime: '2026-08-05T14:15:00Z',
    deliveryOtpCode: '3319',
    deliveryOtpConfirmed: false,
    createdAt: '2026-08-05T11:15:00Z',
  },
  {
    id: 'del-003',
    orderNumber: 'ORD-2026-09120',
    tenantId: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    patientName: 'Mary Alupo',
    patientPhone: '+256 750 998877',
    deliveryAddress: 'Bugolobi Village Mall Area',
    deliveryDistrict: 'Kampala',
    itemsSummary: 'Panadol Extra (20 tabs), Vitamin C 1000mg Effervescent',
    totalOrderAmountUgx: 28000,
    deliveryFeeUgx: 4000,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Cash on Delivery',
    status: 'Delivered',
    isColdChainRequired: false,
    assignedCourierName: 'Moses Kigozi (ZenithRx Rider #4)',
    assignedCourierPhone: '+256 700 889900',
    courierVehiclePlate: 'UDL 892K',
    deliveryOtpCode: '7721',
    deliveryOtpConfirmed: true,
    deliveredAt: '2026-08-05T10:45:00Z',
    createdAt: '2026-08-05T09:00:00Z',
  }
];

export const getDeliveryOrders = (tenantId?: string): DeliveryOrder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELIVERIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DELIVERIES, JSON.stringify(INITIAL_DELIVERIES));
      return tenantId ? INITIAL_DELIVERIES.filter(d => d.tenantId === tenantId) : INITIAL_DELIVERIES;
    }
    const all: DeliveryOrder[] = JSON.parse(raw);
    return tenantId ? all.filter(d => d.tenantId === tenantId) : all;
  } catch {
    return INITIAL_DELIVERIES;
  }
};

export const createDeliveryOrder = (
  order: Omit<DeliveryOrder, 'id' | 'orderNumber' | 'createdAt' | 'deliveryOtpCode' | 'deliveryOtpConfirmed'>
): DeliveryOrder => {
  const all = getDeliveryOrders();
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(all.length + 121).padStart(5, '0')}`;
  const otp = String(Math.floor(1000 + Math.random() * 9000));

  const newOrder: DeliveryOrder = {
    ...order,
    id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderNumber,
    deliveryOtpCode: otp,
    deliveryOtpConfirmed: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newOrder, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_DELIVERIES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to create delivery order', e);
  }
  return newOrder;
};

export const verifyDeliveryOtpAndComplete = (orderId: string, enteredOtp: string): { success: boolean; message: string } => {
  const all = getDeliveryOrders();
  const target = all.find(d => d.id === orderId);
  if (!target) return { success: false, message: 'Delivery order not found.' };

  if (target.deliveryOtpCode !== enteredOtp.trim()) {
    return { success: false, message: 'Invalid OTP code. Please request the customer to provide the 4-digit SMS OTP.' };
  }

  const updatedTarget: DeliveryOrder = {
    ...target,
    status: 'Delivered',
    deliveryOtpConfirmed: true,
    deliveredAt: new Date().toISOString(),
  };

  const updated = all.map(d => d.id === orderId ? updatedTarget : d);
  try {
    localStorage.setItem(STORAGE_KEY_DELIVERIES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save delivery confirmation', e);
  }

  return { success: true, message: 'Delivery confirmed successfully with customer digital OTP.' };
};
