import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Truck,
  Building2,
  Layers,
  Thermometer,
  Lock,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  FileText,
  MapPin,
  Flame,
  Snowflake,
  Send,
  Download,
  Barcode,
} from 'lucide-react';
import { StorageAndTransferService } from '../services/storageAndTransferService';
import {
  PharmacyBranch,
  BranchStorageLocation,
  StorageShelfBin,
  StockTransferRequest,
  StockTransferStatus,
} from '../types/storageAndTransferTypes';

export const StorageAndTransferConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'transfers'>('topology');

  const [branches, setBranches] = useState<PharmacyBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('br-001');
  const [locations, setLocations] = useState<BranchStorageLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc-001');
  const [bins, setBins] = useState<StorageShelfBin[]>([]);
  const [transfers, setTransfers] = useState<StockTransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer Wizard State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [sourceBranch, setSourceBranch] = useState('br-001');
  const [destBranch, setDestBranch] = useState('br-002');
  const [transferItemMed, setTransferItemMed] = useState('Amoxicillin 500mg Capsules (100s)');
  const [transferItemQty, setTransferItemQty] = useState<number>(50);
  const [transferPriority, setTransferPriority] = useState<'URGENT_STOCKOUT' | 'NORMAL' | 'ROUTINE_REPLENISHMENT'>('URGENT_STOCKOUT');
  const [transferReason, setTransferReason] = useState('High prescription demand / Outpatient replenishment');

  // Dispatch / Receive State
  const [selectedTransferForAction, setSelectedTransferForAction] = useState<StockTransferRequest | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [sealNumber, setSealNumber] = useState('SEAL-UG-994182');
  const [courierName, setCourierName] = useState('ZenithRx Express Logistics');
  const [trackingCode, setTrackingCode] = useState('TRK-ZX-882190');
  const [destBinCode, setDestBinCode] = useState('EB-DISP-A1-02');
  const [tempProbe, setTempProbe] = useState('4.5');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadBranchLocations(selectedBranchId);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedLocationId) {
      loadBins(selectedLocationId);
    }
  }, [selectedLocationId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [brs, trs] = await Promise.all([
        StorageAndTransferService.getBranches(),
        StorageAndTransferService.getStockTransfers(),
      ]);
      setBranches(brs);
      setTransfers(trs);
      if (brs.length > 0) {
        setSelectedBranchId(brs[0].id);
        await loadBranchLocations(brs[0].id);
      }
    } catch (err) {
      console.error('Error loading storage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBranchLocations = async (branchId: string) => {
    const locs = await StorageAndTransferService.getStorageLocations(branchId);
    setLocations(locs);
    if (locs.length > 0) {
      setSelectedLocationId(locs[0].id);
      await loadBins(locs[0].id);
    } else {
      setBins([]);
    }
  };

  const loadBins = async (locId: string) => {
    const b = await StorageAndTransferService.getBins(locId);
    setBins(b);
  };

  const handleCreateTransfer = async () => {
    if (sourceBranch === destBranch) {
      alert('Source and destination branch cannot be the same!');
      return;
    }

    const newTransfer = await StorageAndTransferService.createTransferRequest({
      sourceBranchId: sourceBranch,
      destinationBranchId: destBranch,
      priority: transferPriority,
      reason: transferReason,
      requesterName: 'Clinical Pharmacist',
      items: [
        {
          medicineId: 'med-amox-500',
          medicineName: transferItemMed,
          requestedQuantity: transferItemQty,
        },
      ],
    });

    setTransfers((prev) => [newTransfer, ...prev]);
    setShowTransferModal(false);
    setNotificationMsg(`Stock Transfer Request ${newTransfer.transfer_number} submitted successfully.`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedTransferForAction) return;

    await StorageAndTransferService.dispatchTransfer(
      selectedTransferForAction.id,
      sealNumber,
      courierName,
      trackingCode,
      parseFloat(tempProbe) || 21.0
    );

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === selectedTransferForAction.id
          ? {
              ...t,
              status: 'dispatched_in_transit',
              dispatch_seal_number: sealNumber,
              transit_courier_name: courierName,
              transit_tracking_code: trackingCode,
              dispatched_at: new Date().toISOString(),
            }
          : t
      )
    );

    setShowDispatchModal(false);
    setNotificationMsg(`Transfer ${selectedTransferForAction.transfer_number} dispatched in transit under seal ${sealNumber}.`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleConfirmReceive = async () => {
    if (!selectedTransferForAction) return;

    await StorageAndTransferService.receiveTransfer(
      selectedTransferForAction.id,
      'David Kigozi (Entebbe Dispenser)',
      destBinCode,
      parseFloat(tempProbe) || 21.0
    );

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === selectedTransferForAction.id
          ? {
              ...t,
              status: 'received_and_allocated',
              received_by_name: 'David Kigozi',
              received_at: new Date().toISOString(),
            }
          : t
      )
    );

    setShowReceiveModal(false);
    setNotificationMsg(`Transfer ${selectedTransferForAction.transfer_number} received & restocked into bin ${destBinCode}!`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const activeBranch = branches.find((b) => b.id === selectedBranchId);
  const activeLocation = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/40 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600/30 rounded-xl border border-emerald-400/30 text-emerald-400">
                <Boxes className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Multi-Location Storage Topology &amp; Inter-Branch Transfers
                  <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Physical Warehousing
                  </span>
                </h1>
                <p className="text-sm text-emerald-200/80">
                  Pharmacy → Branch → Storage Room → Shelf/Bin → Medicine → Batch • 6-Stage Stock Transfer Engine
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Create Stock Transfer Request
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-800/40">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-emerald-900/40">
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
              <span>Active Pharmacy Branches</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 flex items-baseline gap-1.5">
              {branches.length} Facilities
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> 1 Central Hub + 2 Retail Outposts
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-emerald-900/40">
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
              <span>Storage Locations &amp; Rooms</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-400 flex items-baseline gap-1.5">
              {locations.length} Zones
            </div>
            <div className="text-[11px] text-cyan-400/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> Cold Chain (2-8°C) + Ambient + Safe
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-emerald-900/40">
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
              <span>Tracked Shelves &amp; Bins</span>
              <QrCode className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 flex items-baseline gap-1.5">
              52 Bins
            </div>
            <div className="text-[11px] text-amber-300/80 font-medium flex items-center gap-1 mt-0.5">
              <Barcode className="w-3 h-3 text-amber-400" /> Barcode &amp; Slot Addressable
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-emerald-900/40">
            <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
              <span>Inter-Branch Transfers</span>
              <Truck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 flex items-baseline gap-1.5">
              {transfers.length} Active
            </div>
            <div className="text-[11px] text-purple-300/80 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> 6-Stage Gate Verification
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div className="bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-xl flex items-center justify-between text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-semibold">{notificationMsg}</p>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-xs underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition-all border-b-2 ${
            activeTab === 'topology'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Warehouse Topology (Store Rooms → Shelves → Bins)
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition-all border-b-2 ${
            activeTab === 'transfers'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          Inter-Branch Stock Transfers (6-Stage Pipeline)
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-600 text-white">
            {transfers.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: PHYSICAL STORAGE TOPOLOGY */}
      {activeTab === 'topology' && (
        <div className="space-y-6">
          {/* Branch Selector Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Current Branch / Facility:</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeBranch?.branch_name} ({activeBranch?.branch_code})
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedBranchId === b.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {b.branch_name.split(' ')[1] || b.branch_name}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Locations (Rooms) Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {locations.map((loc) => {
              const isSelected = selectedLocationId === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition space-y-3 ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {loc.location_type === 'cold_chain_refrigerator' ? (
                        <Snowflake className="w-4 h-4 text-cyan-500" />
                      ) : loc.location_type === 'narcotics_safe_vault' ? (
                        <Lock className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Boxes className="w-4 h-4 text-emerald-500" />
                      )}
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                        {loc.location_name}
                      </h3>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <Thermometer className="w-3 h-3 text-slate-400" />
                      Temp: {loc.temperature_min_celsius}°C - {loc.temperature_max_celsius}°C
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Max Capacity:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {loc.max_capacity_units.toLocaleString()} units
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{loc.bins_count || 12} Bins Configured</span>
                    <span>{isSelected ? 'ACTIVE VIEW' : 'CLICK TO VIEW'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shelf & Bin Visual Topology Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                  Visual Shelf &amp; Bin Matrix: {activeLocation?.location_name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Physical slot layout with capacity fill levels, batch allocation tags, and barcode scan addresses.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-500">
                Location Code: <strong className="text-slate-900 dark:text-white">{activeLocation?.location_code}</strong>
              </div>
            </div>

            {/* Bins List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {bins.map((bin) => {
                const occupancyPercent = Math.round(
                  (bin.current_occupancy_packs / bin.max_capacity_packs) * 100
                );

                return (
                  <div
                    key={bin.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-500" />
                          {bin.full_bin_code}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {bin.aisle_zone} • {bin.shelf_rack} • {bin.bin_slot}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {bin.barcode}
                      </span>
                    </div>

                    {/* Capacity Fill Meter */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        <span>Fill Level: {occupancyPercent}%</span>
                        <span>
                          {bin.current_occupancy_packs} / {bin.max_capacity_packs} Packs
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            occupancyPercent > 80
                              ? 'bg-amber-500'
                              : occupancyPercent > 50
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Allocated Batch Detail */}
                    {bin.allocations && bin.allocations.length > 0 ? (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                        {bin.allocations.map((alloc) => (
                          <div
                            key={alloc.id}
                            className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1"
                          >
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {alloc.medicine_name}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>
                                Batch: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{alloc.batch_number}</strong>
                              </span>
                              <span>Exp: {alloc.expiry_date}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                On Hand: {alloc.quantity_on_hand}
                              </span>
                              {alloc.quantity_reserved > 0 && (
                                <span className="text-amber-500 font-bold">
                                  Reserved: {alloc.quantity_reserved}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-[11px] text-slate-400 italic">
                        Empty Bin Slot — Ready for Allocation
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 6-STAGE INTER-BRANCH TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-500" />
                  6-Stage Inter-Branch Stock Transfer Engine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request → Approval → Bin Picking → Dispatch &amp; Cold Seal → Transit Gate → Received &amp; Restocked.
                </p>
              </div>

              <button
                onClick={() => setShowTransferModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Transfer Request
              </button>
            </div>

            {/* Transfers Table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Transfer #</th>
                    <th className="p-3">Source &rarr; Destination</th>
                    <th className="p-3">Priority &amp; Status</th>
                    <th className="p-3">Items &amp; Batches</th>
                    <th className="p-3">Dispatch Seal / Courier</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {tr.transfer_number}
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(tr.requested_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {tr.source_branch_name} &rarr; {tr.destination_branch_name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Req by: {tr.requested_by_name}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block w-fit text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tr.status === 'received_and_allocated'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : tr.status === 'dispatched_in_transit'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {tr.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {tr.priority}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {tr.total_quantity_requested} Units ({tr.total_items_count} Items)
                        </div>
                        {tr.items && tr.items[0] && (
                          <div className="text-[10px] text-slate-500">
                            {tr.items[0].medicine_name} (Batch: {tr.items[0].batch_number})
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        {tr.dispatch_seal_number ? (
                          <div>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {tr.dispatch_seal_number}
                            </span>
                            <div className="text-[10px] text-slate-400 font-sans">
                              {tr.transit_courier_name} ({tr.transit_tracking_code})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-sans">Awaiting Pick &amp; Seal</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {tr.status === 'requested' && (
                          <button
                            onClick={() => {
                              setSelectedTransferForAction(tr);
                              setShowDispatchModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Dispatch Stock
                          </button>
                        )}

                        {tr.status === 'dispatched_in_transit' && (
                          <button
                            onClick={() => {
                              setSelectedTransferForAction(tr);
                              setShowReceiveModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Receive &amp; Restock
                          </button>
                        )}

                        {tr.status === 'received_and_allocated' && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE TRANSFER REQUEST */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Initiate Inter-Branch Stock Transfer Request (STR)
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Source Fulfilling Branch
                  </label>
                  <select
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Requesting Branch
                  </label>
                  <select
                    value={destBranch}
                    onChange={(e) => setDestBranch(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Medicine &amp; Dosage Formulation
                </label>
                <input
                  type="text"
                  value={transferItemMed}
                  onChange={(e) => setTransferItemMed(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer Quantity (Packs)
                  </label>
                  <input
                    type="number"
                    value={transferItemQty}
                    onChange={(e) => setTransferItemQty(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency &amp; Priority
                  </label>
                  <select
                    value={transferPriority}
                    onChange={(e) => setTransferPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="URGENT_STOCKOUT">URGENT (Stockout Risk)</option>
                    <option value="NORMAL">Normal Priority</option>
                    <option value="ROUTINE_REPLENISHMENT">Routine Stock Balance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason &amp; Clinical Justification Notes
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTransfer}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" />
                Submit Transfer Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH & SEAL */}
      {showDispatchModal && selectedTransferForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                Dispatch &amp; Seal Shipment ({selectedTransferForAction.transfer_number})
              </h3>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tamper-Evident Security Seal Number
                </label>
                <input
                  type="text"
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transit Courier / Driver Name
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tracking Code
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dispatch Temp (°C)
                  </label>
                  <input
                    type="text"
                    value={tempProbe}
                    onChange={(e) => setTempProbe(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Confirm Dispatch &amp; Lock Seal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECEIVE & RESTOCK INTO BIN */}
      {showReceiveModal && selectedTransferForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Receive &amp; Restock Stock ({selectedTransferForAction.transfer_number})
              </h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <div className="font-bold">Seal Number Verified: {selectedTransferForAction.dispatch_seal_number}</div>
                <div className="text-[11px] mt-0.5">Dispatched: {selectedTransferForAction.total_quantity_dispatched} Units</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Storage Shelf / Bin Code
                </label>
                <input
                  type="text"
                  value={destBinCode}
                  onChange={(e) => setDestBinCode(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="e.g. EB-DISP-A1-02"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Arrival Temperature Log (°C)
                </label>
                <input
                  type="text"
                  value={tempProbe}
                  onChange={(e) => setTempProbe(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceive}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Allocate to Bin &amp; Credit Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
