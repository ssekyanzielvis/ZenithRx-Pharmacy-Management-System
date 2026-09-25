import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  MapPin,
  User,
  Pill,
  CreditCard,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  XCircle,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrderItem {
  drug_name: string;
  dosage: string;
  quantity: number;
  unit_price_ugx: number;
  total_ugx: number;
}

interface PatientOnlineOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_phone: string;
  items: OrderItem[];
  total_amount_ugx: number;
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  payment_method: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'CASH_ON_DELIVERY';
  payment_ref?: string;
  fulfillment_status: 'Processing' | 'Verified' | 'Dispatched' | 'Delivered' | 'Cancelled';
  delivery_type: 'Delivery' | 'Pharmacy Pickup';
  delivery_address: string;
  rider_name?: string;
  rider_phone?: string;
  has_prescription: boolean;
  prescription_status?: string;
  estimated_delivery_at?: string;
  delivered_at?: string;
  created_at: string;
}

// ─── Mock patient online orders (would come from API in production) ──────────
const MOCK_ONLINE_ORDERS: PatientOnlineOrder[] = [
  {
    id: 'ord-001',
    order_number: 'ZPWO-2026-0091',
    patient_name: 'Aisha Namukasa',
    patient_phone: '+256 772 841 220',
    items: [
      { drug_name: 'Augmentin 625mg', dosage: '1 tab twice daily', quantity: 14, unit_price_ugx: 2800, total_ugx: 39200 },
      { drug_name: 'Panadol Extra 500mg', dosage: '2 tabs every 6hrs', quantity: 20, unit_price_ugx: 350, total_ugx: 7000 },
    ],
    total_amount_ugx: 49700,
    payment_status: 'Paid',
    payment_method: 'MTN_MOMO',
    payment_ref: 'MTN-TXN-20261201-991',
    fulfillment_status: 'Processing',
    delivery_type: 'Delivery',
    delivery_address: 'Plot 14, Kira Road, Kamwokya, Kampala',
    has_prescription: true,
    prescription_status: 'Verified by Pharmacist',
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'ord-002',
    order_number: 'ZPWO-2026-0092',
    patient_name: 'Peter Ssebulime',
    patient_phone: '+256 700 334 891',
    items: [
      { drug_name: 'Metformin 500mg', dosage: '1 tab with meals', quantity: 60, unit_price_ugx: 480, total_ugx: 28800 },
      { drug_name: 'Amlodipine 5mg', dosage: '1 tab daily', quantity: 30, unit_price_ugx: 650, total_ugx: 19500 },
    ],
    total_amount_ugx: 51800,
    payment_status: 'Paid',
    payment_method: 'AIRTEL_MONEY',
    payment_ref: 'AIRTEL-TXN-20261201-228',
    fulfillment_status: 'Verified',
    delivery_type: 'Delivery',
    delivery_address: 'Ntinda Trading Centre, Ntinda, Kampala',
    has_prescription: true,
    prescription_status: 'Verified by Pharmacist',
    rider_name: 'John Kawooya',
    rider_phone: '+256 756 100 200',
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 'ord-003',
    order_number: 'ZPWO-2026-0093',
    patient_name: 'Grace Akello',
    patient_phone: '+256 774 607 782',
    items: [
      { drug_name: 'ORS Sachet (Oral Rehydration)', dosage: 'Dissolve 1 sachet in 200ml water', quantity: 5, unit_price_ugx: 800, total_ugx: 4000 },
      { drug_name: 'Zinc 20mg Dispersible', dosage: '1 tab daily for 10 days', quantity: 10, unit_price_ugx: 600, total_ugx: 6000 },
    ],
    total_amount_ugx: 13500,
    payment_status: 'Pending',
    payment_method: 'CASH_ON_DELIVERY',
    fulfillment_status: 'Processing',
    delivery_type: 'Pharmacy Pickup',
    delivery_address: 'Pharmacy Pickup — ZenithRx Kampala City Branch',
    has_prescription: false,
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'ord-004',
    order_number: 'ZPWO-2026-0090',
    patient_name: 'David Muwonge',
    patient_phone: '+256 782 004 561',
    items: [
      { drug_name: 'Artemether-Lumefantrine 80/480mg', dosage: 'Follow course per kg weight', quantity: 6, unit_price_ugx: 4500, total_ugx: 27000 },
    ],
    total_amount_ugx: 30500,
    payment_status: 'Paid',
    payment_method: 'MTN_MOMO',
    payment_ref: 'MTN-TXN-20261201-780',
    fulfillment_status: 'Dispatched',
    delivery_type: 'Delivery',
    delivery_address: 'Entebbe Road, Near Total Petrol, Kampala',
    rider_name: 'Moses Sekanjako',
    rider_phone: '+256 775 444 909',
    has_prescription: true,
    prescription_status: 'Verified by Pharmacist',
    estimated_delivery_at: new Date(Date.now() + 25 * 60000).toISOString(),
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: 'ord-005',
    order_number: 'ZPWO-2026-0088',
    patient_name: 'Ruth Kabanda',
    patient_phone: '+256 752 219 003',
    items: [
      { drug_name: 'Folic Acid 5mg', dosage: '1 tab daily', quantity: 30, unit_price_ugx: 300, total_ugx: 9000 },
      { drug_name: 'Ferrous Sulphate 200mg', dosage: '1 tab twice daily', quantity: 60, unit_price_ugx: 400, total_ugx: 24000 },
    ],
    total_amount_ugx: 36500,
    payment_status: 'Paid',
    payment_method: 'MTN_MOMO',
    payment_ref: 'MTN-TXN-20261130-511',
    fulfillment_status: 'Delivered',
    delivery_type: 'Delivery',
    delivery_address: 'Kawempe Division, near Mulago Hospital, Kampala',
    rider_name: 'Isaac Tumusiime',
    rider_phone: '+256 701 884 223',
    has_prescription: false,
    delivered_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatUGX = (n: number) => `UGX ${n.toLocaleString()}`;
const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const STATUS_STYLES: Record<string, string> = {
  Processing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Verified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Dispatched: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  Delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Refunded: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
};

const FULFILLMENT_NEXT: Record<string, string> = {
  Processing: 'Verified',
  Verified: 'Dispatched',
  Dispatched: 'Delivered',
};

// ─── Component ───────────────────────────────────────────────────────────────
export const PatientOnlineOrdersQueue: React.FC = () => {
  const [orders, setOrders] = useState<PatientOnlineOrder[]>(MOCK_ONLINE_ORDERS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(q) ||
      o.patient_name.toLowerCase().includes(q) ||
      o.patient_phone.includes(q) ||
      o.items.some((i) => i.drug_name.toLowerCase().includes(q));
    const matchesStatus = filterStatus === 'all' || o.fulfillment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const processing = orders.filter((o) => o.fulfillment_status === 'Processing').length;
  const verified = orders.filter((o) => o.fulfillment_status === 'Verified').length;
  const dispatched = orders.filter((o) => o.fulfillment_status === 'Dispatched').length;
  const today = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const handleAdvanceStatus = (orderId: string) => {
    setUpdatingId(orderId);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const next = FULFILLMENT_NEXT[o.fulfillment_status];
          if (!next) return o;
          return { ...o, fulfillment_status: next as PatientOnlineOrder['fulfillment_status'] };
        })
      );
      setUpdatingId(null);
    }, 800);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, fulfillment_status: 'Cancelled' } : o))
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Patient Online Orders
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live queue of orders placed via the ZenithRx Patient PWA
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's Orders", value: today, icon: <ShoppingBag className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Awaiting Processing', value: processing, icon: <Clock className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Verified (Ready)', value: verified, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Dispatched', value: dispatched, icon: <Truck className="w-4 h-4" />, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.bg} border border-slate-200/60 dark:border-slate-700/50`}>
            <div className={`flex items-center gap-2 mb-1 ${stat.color} font-semibold text-xs`}>
              {stat.icon} {stat.label}
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="Search by order #, patient name, phone or medicine…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Processing">Processing</option>
          <option value="Verified">Verified</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Order Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No orders match your filters</p>
          </div>
        )}

        {filtered.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all"
          >
            {/* Order Header */}
            <div
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Status Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  order.fulfillment_status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                  order.fulfillment_status === 'Dispatched' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
                  order.fulfillment_status === 'Verified'   ? 'bg-blue-100 dark:bg-blue-900/30' :
                  order.fulfillment_status === 'Cancelled'  ? 'bg-red-100 dark:bg-red-900/30' :
                  'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  {order.delivery_type === 'Pharmacy Pickup'
                    ? <ShoppingBag className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    : <Truck className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  }
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{order.order_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[order.fulfillment_status]}`}>
                      {order.fulfillment_status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[order.payment_status]}`}>
                      {order.payment_status}
                    </span>
                    {order.has_prescription && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Rx
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.patient_name}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.patient_phone}</span>
                    <span>{formatTime(order.created_at)}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatUGX(order.total_amount_ugx)}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
                    {order.delivery_type} • {order.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0">
                {FULFILLMENT_NEXT[order.fulfillment_status] && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(order.id); }}
                    disabled={updatingId === order.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {updatingId === order.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Mark {FULFILLMENT_NEXT[order.fulfillment_status]}
                  </button>
                )}
                {(order.fulfillment_status === 'Processing' || order.fulfillment_status === 'Verified') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                <div className="text-slate-400">
                  {expandedId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === order.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                {/* Items */}
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Order Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <Pill className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.drug_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.dosage}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{formatUGX(item.total_ugx)}</p>
                          <p className="text-xs text-slate-400">×{item.quantity} @ {formatUGX(item.unit_price_ugx)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Delivery Fee</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {order.delivery_type === 'Delivery' ? formatUGX(3500) : 'FREE (Pickup)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Grand Total</span>
                    <span className="text-sm font-extrabold text-emerald-600">{formatUGX(order.total_amount_ugx)}</span>
                  </div>
                </div>

                {/* Delivery / Pickup info */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      {order.delivery_type === 'Delivery' ? 'Delivery Address' : 'Pickup Location'}
                    </p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      {order.delivery_address}
                    </p>
                    {order.rider_name && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Rider Assigned</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {order.rider_name} · <span className="text-emerald-600">{order.rider_phone}</span>
                        </p>
                      </div>
                    )}
                    {order.estimated_delivery_at && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ETA: {formatTime(order.estimated_delivery_at)}
                      </p>
                    )}
                    {order.delivered_at && (
                      <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Delivered {formatTime(order.delivered_at)}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      Payment Details
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Method</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {order.payment_method.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Status</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${STATUS_STYLES[order.payment_status]}`}>
                          {order.payment_status}
                        </span>
                      </div>
                      {order.payment_ref && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Reference</span>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{order.payment_ref}</span>
                        </div>
                      )}
                    </div>
                    {order.has_prescription && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Prescription</p>
                        <p className={`text-xs font-bold ${
                          order.prescription_status === 'Verified by Pharmacist' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {order.prescription_status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Triage hint for Dispatched */}
                {order.fulfillment_status === 'Processing' && order.has_prescription && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                    <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                    <p className="text-xs text-violet-700 dark:text-violet-300">
                      <strong>RxAI Safety Check:</strong> This order includes prescription medicines. Ensure prescription status is "Verified by Pharmacist" before marking as Verified.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
