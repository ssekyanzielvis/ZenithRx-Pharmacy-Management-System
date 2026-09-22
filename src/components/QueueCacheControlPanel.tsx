import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Database,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  RefreshCw,
  Play,
  Server,
  Archive,
  MessageSquare,
  FileText,
  Receipt,
  BarChart3,
  Moon,
  Cpu,
  Package,
  Hash,
  ArrowRight,
} from 'lucide-react';
import {
  bullMQ,
  QueueName,
  BackgroundJob,
  QueueMetrics,
  WorkerPoolStatus,
} from '../services/backgroundQueueService';
import {
  redisCache,
  CacheStats,
  NAMESPACE_TTL_MS,
  CacheNamespace,
} from '../services/cacheService';

// ── Queue Icon Map ─────────────────────────────────────────────────────────────
const QUEUE_ICONS: Record<QueueName, React.ReactNode> = {
  PRESCRIPTION_AI_PARSE:   <Cpu className="w-4 h-4 text-purple-500" />,
  STOCK_REORDER:           <Package className="w-4 h-4 text-amber-500" />,
  NOTIFICATION_SMS:        <MessageSquare className="w-4 h-4 text-sky-500" />,
  NOTIFICATION_WHATSAPP:   <MessageSquare className="w-4 h-4 text-emerald-500" />,
  NOTIFICATION_EMAIL:      <MessageSquare className="w-4 h-4 text-blue-400" />,
  REPORT_GENERATION:       <BarChart3 className="w-4 h-4 text-cyan-500" />,
  RECEIPT_PDF:             <Receipt className="w-4 h-4 text-rose-500" />,
  NIGHTLY_RECONCILIATION:  <Moon className="w-4 h-4 text-indigo-500" />,
};

const QUEUE_DESCRIPTIONS: Record<QueueName, string> = {
  PRESCRIPTION_AI_PARSE:   'Gemini OCR & drug interaction analysis',
  STOCK_REORDER:           'Automated reorder point generation',
  NOTIFICATION_SMS:        "Africa's Talking SMS dispatch",
  NOTIFICATION_WHATSAPP:   'WhatsApp refill reminders',
  NOTIFICATION_EMAIL:      'Clinical alerts & shift reports',
  REPORT_GENERATION:       'Sales, compliance & stock ageing builds',
  RECEIPT_PDF:             'PDF receipt generation & R2 upload',
  NIGHTLY_RECONCILIATION:  'EOD payment reconciliation (serialised)',
};

const STATUS_COLORS: Record<BackgroundJob['status'], string> = {
  QUEUED:    'bg-slate-100 text-slate-700 border border-slate-200',
  RUNNING:   'bg-sky-100 text-sky-800 border border-sky-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  FAILED:    'bg-red-100 text-red-800 border border-red-200',
  RETRYING:  'bg-amber-100 text-amber-800 border border-amber-200',
  SCHEDULED: 'bg-purple-100 text-purple-800 border border-purple-200',
};

const NS_COLORS: Record<CacheNamespace, string> = {
  session:      'bg-sky-500',
  reference:    'bg-emerald-500',
  dashboard:    'bg-amber-500',
  ratelimit:    'bg-rose-500',
  ai_response:  'bg-purple-500',
  queue_coord:  'bg-indigo-500',
};

// ── Helper ─────────────────────────────────────────────────────────────────────
function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatTtl(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h >= 1) return `${h}h`;
  if (m >= 1) return `${m}m`;
  return `${s}s`;
}

// ── Main Component ─────────────────────────────────────────────────────────────
type CQTab = 'queues' | 'jobs' | 'cache' | 'schedule';

export const QueueCacheControlPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CQTab>('queues');
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics[]>([]);
  const [workerStatus, setWorkerStatus] = useState<WorkerPoolStatus | null>(null);
  const [recentJobs, setRecentJobs] = useState<BackgroundJob[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isEnqueuing, setIsEnqueuing] = useState<QueueName | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refresh = () => {
    setQueueMetrics(bullMQ.getQueueMetrics());
    setWorkerStatus(bullMQ.getWorkerPoolStatus());
    setRecentJobs(bullMQ.getAllRecentJobs(25));
    setCacheStats(redisCache.getStats());
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    // Register demo handlers so the queue can actually process
    bullMQ.registerHandler('PRESCRIPTION_AI_PARSE', async (payload: any) => {
      await new Promise(r => setTimeout(r, 120 + Math.random() * 80));
      return { summary: `Parsed Rx for patient ${payload?.patientName ?? 'Unknown'}` };
    });
    bullMQ.registerHandler('STOCK_REORDER', async (payload: any) => {
      await new Promise(r => setTimeout(r, 60 + Math.random() * 40));
      return { summary: `Reorder generated for ${payload?.skuCount ?? 0} SKUs` };
    });
    bullMQ.registerHandler('NOTIFICATION_SMS', async (payload: any) => {
      await new Promise(r => setTimeout(r, 30 + Math.random() * 20));
      return { summary: `SMS dispatched to ${payload?.phone ?? 'N/A'}` };
    });
    bullMQ.registerHandler('NOTIFICATION_WHATSAPP', async (payload: any) => {
      await new Promise(r => setTimeout(r, 35 + Math.random() * 25));
      return { summary: `WhatsApp refill sent to ${payload?.phone ?? 'N/A'}` };
    });
    bullMQ.registerHandler('NOTIFICATION_EMAIL', async (payload: any) => {
      await new Promise(r => setTimeout(r, 45 + Math.random() * 30));
      return { summary: `Email report dispatched to ${payload?.email ?? 'N/A'}` };
    });
    bullMQ.registerHandler('REPORT_GENERATION', async (payload: any) => {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 150));
      return { summary: `${payload?.reportType ?? 'Report'} generated (${payload?.rowCount ?? 0} rows)` };
    });
    bullMQ.registerHandler('RECEIPT_PDF', async (payload: any) => {
      await new Promise(r => setTimeout(r, 80 + Math.random() * 60));
      return { summary: `Receipt PDF for Tx#${payload?.txId ?? 'N/A'} uploaded to R2` };
    });
    bullMQ.registerHandler('NIGHTLY_RECONCILIATION', async (payload: any) => {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 200));
      return { summary: `Reconciliation for ${payload?.tenantId} completed` };
    });

    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const enqueueDemo = async (queue: QueueName) => {
    setIsEnqueuing(queue);
    const demoPayloads: Partial<Record<QueueName, object>> = {
      PRESCRIPTION_AI_PARSE:   { patientName: 'Nalweyiso Grace', drugs: 2 },
      STOCK_REORDER:           { skuCount: 14, threshold: 'MIN_QTY' },
      NOTIFICATION_SMS:        { phone: '+256701234567', message: 'Refill due' },
      NOTIFICATION_WHATSAPP:   { phone: '+256772345678', template: 'REFILL_REMINDER' },
      NOTIFICATION_EMAIL:      { email: 'pharmacist@demo.ug', reportType: 'SHIFT_SUMMARY' },
      REPORT_GENERATION:       { reportType: 'DAILY_SALES', rowCount: 340 },
      RECEIPT_PDF:             { txId: `TX-${Date.now()}`, totalUgx: 125000 },
      NIGHTLY_RECONCILIATION:  { tenantId: 'TEN-0001', scheduledDate: new Date().toISOString() },
    };
    const jobId = bullMQ.enqueue(queue, demoPayloads[queue] ?? {}, { priority: 'NORMAL' });
    showToast(`Job ${jobId?.slice(0, 20)}... added to queue: ${queue}`);
    await new Promise(r => setTimeout(r, 200));
    refresh();
    setIsEnqueuing(null);
  };

  const totalActive = queueMetrics.reduce((s, q) => s + q.running + q.queued, 0);
  const totalCompleted = queueMetrics.reduce((s, q) => s + q.completed, 0);
  const totalFailed = queueMetrics.reduce((s, q) => s + q.failed, 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-sky-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-700">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                BullMQ / Redis Queue &amp; Cache Control Panel
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                §11.4
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              8 named queues with concurrency limits, exponential backoff, idempotency keys, nightly job scheduling, and in-process Redis-compatible caching.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-500">
            Refreshed: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 border border-slate-200 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Worker Pool KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Workers</span>
          <div className="text-2xl font-black text-sky-600 font-mono mt-1">{workerStatus?.activeWorkers ?? 0}</div>
          <span className="text-[11px] text-slate-400">of {workerStatus?.concurrencyLimit ?? 0} total slots</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active / Queued</span>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">{totalActive}</div>
          <span className="text-[11px] text-slate-400">jobs pending processing</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{totalCompleted}</div>
          <span className="text-[11px] text-slate-400">successfully processed</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Worker Uptime</span>
          <div className="text-2xl font-black text-purple-600 font-mono mt-1">
            {workerStatus ? formatUptime(workerStatus.uptime) : '—'}
          </div>
          <span className="text-[11px] text-slate-400">{totalFailed} failed / retried</span>
        </div>
      </div>

      {/* Queue & Cache Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            {
              id: 'queues',
              label: '8 Named Queues',
              desc: 'High-throughput Redis streams for EDI claims, receipts, audit writes, and SMS push.',
              icon: <Layers className="w-5 h-5" />,
              badge: `${queueMetrics.length} Queues`,
            },
            {
              id: 'jobs',
              label: 'Job Activity Log',
              desc: 'Live execution telemetry, DLQ dead-letter queue inspection, and backoff retries.',
              icon: <Activity className="w-5 h-5" />,
              badge: 'Real-time',
            },
            {
              id: 'cache',
              label: 'Redis Cache Namespaces',
              desc: 'Sub-millisecond formulary cache, session tokens, and warm memory query buffers.',
              icon: <Database className="w-5 h-5" />,
              badge: 'Sub-ms TTL',
            },
            {
              id: 'schedule',
              label: 'Nightly Job Scheduler',
              desc: 'Cron workers for FEFO batch markdown, NDA ledger archives, and stock snapshots.',
              icon: <Moon className="w-5 h-5" />,
              badge: 'Cron Workers',
            },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CQTab)}
              className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40 border-blue-500 scale-[1.01]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600 border border-slate-200'}`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isActive ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {tab.badge}
                  </span>
                </div>
                <h3 className={`text-xs font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {tab.label}
                </h3>
                <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isActive ? 'text-blue-100' : 'text-slate-600'}`}>
                  {tab.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-[10px]">
                <span className={isActive ? 'text-white font-bold' : 'text-slate-500 font-medium'}>
                  {isActive ? '← Current view' : 'Go to section →'}
                </span>
                <span className={isActive ? 'text-blue-200' : 'text-slate-400'}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB: NAMED QUEUES */}
      {activeTab === 'queues' && (
        <div className="space-y-3">
          {queueMetrics.map((q) => {
            const totalJobs = q.queued + q.running + q.completed + q.failed;
            const completedPct = totalJobs > 0 ? Math.round((q.completed / totalJobs) * 100) : 0;

            return (
              <div
                key={q.queueName}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-sky-200 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                      {QUEUE_ICONS[q.queueName]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black font-mono text-slate-900">{q.queueName}</span>
                        {q.running > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                            {q.running} running
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{QUEUE_DESCRIPTIONS[q.queueName]}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex gap-2 text-[11px] font-mono">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold">{q.queued} queued</span>
                      <span className="px-2 py-1 bg-emerald-100 rounded-lg text-emerald-700 font-bold">{q.completed} done</span>
                      {q.failed > 0 && (
                        <span className="px-2 py-1 bg-red-100 rounded-lg text-red-700 font-bold">{q.failed} failed</span>
                      )}
                    </div>

                    <button
                      onClick={() => enqueueDemo(q.queueName)}
                      disabled={isEnqueuing === q.queueName}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      {isEnqueuing === q.queueName ? 'Dispatching...' : 'Test Dispatch'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Completion rate: <strong className="text-slate-700">{completedPct}%</strong></span>
                    {q.avgDurationMs > 0 && <span>Avg duration: {q.avgDurationMs}ms</span>}
                    {q.throughputPerHour > 0 && <span>{q.throughputPerHour} jobs/hr</span>}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${completedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: JOB ACTIVITY LOG */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Job Activity Log ({recentJobs.length} recent)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Auto-refreshes every 3s</span>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              No jobs processed yet. Use "Test Dispatch" buttons to enqueue jobs.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {recentJobs.map((job) => (
                <div key={job.id} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                      {QUEUE_ICONS[job.queue]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black font-mono text-slate-900 truncate">{job.id.slice(0, 32)}…</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        Queue: {job.queue}
                        {job.resultSummary && ` • ${job.resultSummary}`}
                        {job.error && ` • Error: ${job.error}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {job.durationMs !== undefined ? (
                      <span className="text-[10px] font-mono font-bold text-slate-600">{job.durationMs}ms</span>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-mono">—</span>
                    )}
                    <span className="text-[9px] text-slate-400 block">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: REDIS CACHE NAMESPACES */}
      {activeTab === 'cache' && cacheStats && (
        <div className="space-y-6">
          {/* Cache KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cache Hit Rate</span>
              <div className={`text-2xl font-black font-mono mt-1 ${cacheStats.hitRate >= 80 ? 'text-emerald-600' : cacheStats.hitRate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                {cacheStats.hitRate}%
              </div>
              <span className="text-[11px] text-slate-400">{cacheStats.totalHits} hits / {cacheStats.totalMisses} misses</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Entries</span>
              <div className="text-2xl font-black text-sky-600 font-mono mt-1">{cacheStats.activeEntries}</div>
              <span className="text-[11px] text-slate-400">{cacheStats.expiredEntries} expired / evictable</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory (Est.)</span>
              <div className="text-2xl font-black text-purple-600 font-mono mt-1">
                {cacheStats.estimatedMemoryBytes > 1024
                  ? `${(cacheStats.estimatedMemoryBytes / 1024).toFixed(1)} KB`
                  : `${cacheStats.estimatedMemoryBytes} B`}
              </div>
              <span className="text-[11px] text-slate-400">in-process store size</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Entries</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">{cacheStats.totalEntries}</div>
              <span className="text-[11px] text-slate-400">across all namespaces</span>
            </div>
          </div>

          {/* Namespace TTL Configuration Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Cache Namespace TTL Configuration (Redis EXPIRE Policy)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Each namespace maps to a Redis keyspace with a dedicated eviction TTL. Tags allow surgical bulk invalidation.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {(Object.keys(NAMESPACE_TTL_MS) as CacheNamespace[]).map((ns) => {
                const count = cacheStats.namespaceBreakdown[ns] ?? 0;
                const maxCount = Math.max(...(Object.values(cacheStats.namespaceBreakdown) as number[]), 1);

                return (
                  <div key={ns} className="p-4 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${NS_COLORS[ns]}`} />
                        <div>
                          <span className="text-xs font-black font-mono text-slate-900">{ns}:*</span>
                          <div className="text-[10px] text-slate-400 mt-0.5 space-x-3">
                            <span>TTL: <strong className="text-slate-700">{formatTtl(NAMESPACE_TTL_MS[ns])}</strong></span>
                            <span>Active keys: <strong className="text-slate-700">{count}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${NS_COLORS[ns]}`}
                            style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                          />
                        </div>

                        <button
                          onClick={() => {
                            redisCache.invalidateByTag(ns);
                            refresh();
                            showToast(`Cache namespace "${ns}:*" flushed.`);
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        >
                          Flush
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cache Use-Case Legend */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
              §11.4 Cache Use-Case Mapping
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { ns: 'session',     use: 'JWT/OAuth token payloads & session hydration' },
                { ns: 'reference',   use: 'Drug catalogue, insurance providers, tier config' },
                { ns: 'dashboard',   use: 'Live POS KPI counters & stock summary aggregates' },
                { ns: 'ratelimit',   use: 'Per-endpoint request throttle counters (sliding window)' },
                { ns: 'ai_response', use: 'Short-lived Gemini prescription parse results' },
                { ns: 'queue_coord', use: 'BullMQ idempotency keys & job deduplication tokens' },
              ].map((item) => (
                <div key={item.ns} className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${NS_COLORS[item.ns as CacheNamespace]}`} />
                  <div>
                    <span className="font-black text-slate-800 font-mono">{item.ns}:</span>
                    <span className="text-slate-500 ml-1">{item.use}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: NIGHTLY SCHEDULER */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                Nightly Job Scheduler (BullMQ Cron / Delayed Jobs)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Jobs scheduled with millisecond-accurate delays using BullMQ's built-in `delay` option. Idempotency keys prevent duplicate scheduling.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                {
                  name: 'Nightly Payment Reconciliation',
                  queue: 'NIGHTLY_RECONCILIATION',
                  cron: 'Daily @ 00:00 EAT',
                  next: 'Tonight 00:00',
                  priority: 'NORMAL',
                  concurrency: 1,
                  description: 'Serialised EOD ledger reconciliation vs. mobile money and bank settlement reports.',
                },
                {
                  name: 'Stock Reorder Assessment',
                  queue: 'STOCK_REORDER',
                  cron: 'Daily @ 06:00 EAT',
                  next: 'Tomorrow 06:00',
                  priority: 'NORMAL',
                  concurrency: 3,
                  description: 'Evaluates minimum quantity thresholds and generates draft purchase orders for review.',
                },
                {
                  name: 'Expiry Alert SMS Batch',
                  queue: 'NOTIFICATION_SMS',
                  cron: 'Daily @ 08:00 EAT',
                  next: 'Tomorrow 08:00',
                  priority: 'NORMAL',
                  concurrency: 5,
                  description: 'Sends expiry batch alerts to patients with chronic medication refill schedules.',
                },
                {
                  name: 'Weekly Sales & Claims Report',
                  queue: 'REPORT_GENERATION',
                  cron: 'Weekly Monday 07:00',
                  next: 'Monday 07:00',
                  priority: 'LOW',
                  concurrency: 2,
                  description: 'Generates PDF/CSV sales summary, insurance claims reconciliation sheet, and stock ageing report.',
                },
              ].map((job) => (
                <div key={job.name} className="p-5 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
                        {QUEUE_ICONS[job.queue as QueueName]}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900">{job.name}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{job.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                          <span><Clock className="w-3 h-3 inline mr-0.5" />{job.cron}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="text-indigo-700 font-bold">Next: {job.next}</span>
                          <span>Concurrency: {job.concurrency}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        bullMQ.enqueue(job.queue as QueueName, { scheduledTrigger: 'MANUAL' }, { priority: 'HIGH' });
                        refresh();
                        showToast(`${job.name} manually triggered and queued with HIGH priority.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 self-start"
                    >
                      <Play className="w-3 h-3" /> Run Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueCacheControlPanel;
