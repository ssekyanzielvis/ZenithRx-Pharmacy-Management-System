import React, { useState, useEffect } from 'react';
import { DeliveryOrder } from '../types';
import {
  getDeliveryOrders,
  createDeliveryOrder,
  verifyDeliveryOtpAndComplete,
} from '../services/deliveryLogisticsService';
import {
  Truck,
  MapPin,
  ThermometerSnowflake,
  ShieldCheck,
  CheckCircle,
  Clock,
  KeyRound,
  Search,
  Plus,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { formatUGX } from '../services/formatters';

interface DeliveryLogisticsModuleProps {
  tenantId?: string;
  pharmacyName?: string;
}

export const DeliveryLogisticsModule: React.FC<DeliveryLogisticsModuleProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'Kampala City Pharmacy',
}) => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // New Delivery Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [orderAmount, setOrderAmount] = useState(50000);
  const [deliveryFee, setDeliveryFee] = useState(5000);
  const [isColdChain, setIsColdChain] = useState(false);
  const [courierName, setCourierName] = useState('Moses Kigozi (Rider #4)');
  const [courierPhone, setCourierPhone] = useState('+256 700 889900');

  useEffect(() => {
    setDeliveries(getDeliveryOrders(tenantId));
  }, [tenantId]);

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !address || !itemsSummary) return;

    const newOrder = createDeliveryOrder({
      tenantId,
      pharmacyName,
      patientName,
      patientPhone,
      deliveryAddress: address,
      deliveryDistrict: 'Kampala',
      itemsSummary,
      totalOrderAmountUgx: orderAmount,
      deliveryFeeUgx: deliveryFee,
      paymentMethod: 'Mobile Money',
      paymentStatus: 'Paid Online',
      status: 'Out for Delivery',
      isColdChainRequired: isColdChain,
      assignedCourierName: courierName,
      assignedCourierPhone: courierPhone,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString(),
    });

    setDeliveries([newOrder, ...deliveries]);
    setIsNewOrderModalOpen(false);

    setPatientName('');
    setPatientPhone('');
    setAddress('');
    setItemsSummary('');
  };

  const handleVerifyOtp = (orderId: string) => {
    setOtpError('');
    setOtpSuccess('');
    const res = verifyDeliveryOtpAndComplete(orderId, otpInput);
    if (res.success) {
      setOtpSuccess(res.message);
      setDeliveries(getDeliveryOrders(tenantId));
      setSelectedOrder(null);
      setOtpInput('');
    } else {
      setOtpError(res.message);
    }
  };

  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.assignedCourierName && d.assignedCourierName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              Real-Time Courier Dispatch
            </span>
            <span className="text-xs font-semibold text-slate-500">Cold Chain &amp; OTP Secured Delivery</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Order Fulfilment &amp; Delivery Logistics
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Monitor active rider deliveries, track live temperature for cold-chain biologicals, and verify customer delivery with 4-digit SMS OTPs.
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch Delivery Order</span>
        </button>
      </div>

      {/* Deliveries Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-700 dark:text-indigo-300">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {deliveries.filter((d) => d.status === 'Out for Delivery').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Active In Transit / Riders</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-xl text-sky-700 dark:text-sky-300">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {deliveries.filter((d) => d.isColdChainRequired && d.status === 'Out for Delivery').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Cold Chain Logged (2°C-8°C)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {deliveries.filter((d) => d.status === 'Delivered').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Delivered &amp; OTP Confirmed</div>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search order #, patient name, address, or rider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDeliveries.map((order) => (
            <div
              key={order.id}
              className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{order.orderNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 animate-pulse'
                    }`}
                  >
                    {order.status}
                  </span>

                  {order.isColdChainRequired && (
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-sky-200 dark:border-sky-800">
                      <ThermometerSnowflake className="w-3 h-3 text-sky-600" />
                      Cold Chain Active (4.8°C)
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {order.patientName} <span className="text-xs font-normal text-slate-500">({order.patientPhone})</span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{order.deliveryAddress}</span>
                </div>

                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Items:</span> {order.itemsSummary}
                </div>

                {order.assignedCourierName && (
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Courier:</span>
                    <span>{order.assignedCourierName} ({order.courierVehiclePlate})</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatUGX(order.totalOrderAmountUgx + order.deliveryFeeUgx)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">{order.paymentStatus}</div>
                </div>

                {order.status === 'Out for Delivery' ? (
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setOtpInput('');
                      setOtpError('');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Enter Delivery OTP</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Delivered &amp; Confirmed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OTP Confirmation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Customer Delivery OTP</h3>
              <p className="text-xs text-slate-500">
                Ask <span className="font-bold text-slate-700 dark:text-slate-300">{selectedOrder.patientName}</span> for the 4-digit SMS OTP to confirm handover.
              </p>
            </div>

            {/* Test Demo helper hint */}
            <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-[11px] text-slate-500 text-center font-mono">
              [Demo SMS Sent: OTP is <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedOrder.deliveryOtpCode}</span>]
            </div>

            {otpError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold text-center">
                {otpError}
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={4}
                placeholder="• • • •"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full text-center text-2xl font-mono tracking-widest py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerifyOtp(selectedOrder.id)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Delivery Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Dispatch Delivery Order</h3>
              <button onClick={() => setIsNewOrderModalOpen(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Baptist Okello"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Customer Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +256 772 345678"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Delivery Address &amp; Landmarks *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ntinda Complex, Block B, Floor 2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Prescription / Items Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glucophage 500mg (60 tabs), Amlodipine 5mg (30 tabs)"
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Order Amount (UGX)</label>
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Delivery Fee (UGX)</label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <input
                  type="checkbox"
                  id="coldChainCheck"
                  checked={isColdChain}
                  onChange={(e) => setIsColdChain(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="coldChainCheck" className="text-xs font-bold text-sky-900 dark:text-sky-200 cursor-pointer">
                  Requires 2°C - 8°C Cold Chain Transport (Insulin / Vaccine)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Dispatch to Rider &amp; Generate OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
