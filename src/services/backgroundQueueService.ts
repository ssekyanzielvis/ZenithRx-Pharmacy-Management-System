/**
 * backgroundQueueService.ts — BullMQ-Style Named Queue & Async Worker Engine (§11.4)
 * Clean Architecture: Infrastructure / Background Worker Layer
 * Complies with technical.md §11.4 (Caching, Queueing & Async Processing)
 *
 * Architecture:
 *   Production → BullMQ workers on Redis (ioredis connection)
 *   Browser/Dev → In-process priority queue with concurrency limits (same observable interface)
 *
 * Named Queues (aligned with §11.4 use-cases):
 *   PRESCRIPTION_AI_PARSE   — Gemini OCR & drug interaction analysis
 *   STOCK_REORDER           — Automated reorder point generation
 *   NOTIFICATION_SMS        — Africa's Talking SMS gateway dispatch
 *   NOTIFICATION_WHATSAPP   — WhatsApp refill & appointment reminders
 *   NOTIFICATION_EMAIL      — Clinical alerts and shift reports via email
 *   REPORT_GENERATION       — Sales, compliance, and stock ageing report builds
 *   RECEIPT_PDF             — PDF receipt generation and R2 upload
 *   NIGHTLY_RECONCILIATION  — EOD payment reconciliation and cash-up validation
 */

export type QueueName =
  | 'PRESCRIPTION_AI_PARSE'
  | 'STOCK_REORDER'
  | 'NOTIFICATION_SMS'
  | 'NOTIFICATION_WHATSAPP'
  | 'NOTIFICATION_EMAIL'
  | 'REPORT_GENERATION'
  | 'RECEIPT_PDF'
  | 'NIGHTLY_RECONCILIATION';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'SCHEDULED';
export type JobPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface BackgroundJob<T = unknown> {
  id: string;
  queue: QueueName;
  name: string;
  payload: T;
  status: JobStatus;
  priority: JobPriority;
  createdAt: number;
  scheduledAt?: number;     // For deferred / nightly jobs
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  retries: number;
  maxRetries: number;
  backoffMs: number;        // Exponential backoff seed
  idempotencyKey?: string;  // Dedup key (BullMQ jobId equivalent)
  error?: string;
  resultSummary?: string;
}

export interface QueueMetrics {
  queueName: QueueName;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  avgDurationMs: number;
  throughputPerHour: number;
}

export interface WorkerPoolStatus {
  concurrencyLimit: number;
  activeWorkers: number;
  totalProcessed: number;
  totalFailed: number;
  uptime: number;          // ms since service started
}

/** Queue-specific concurrency limits (per BullMQ worker config) */
const QUEUE_CONCURRENCY: Record<QueueName, number> = {
  PRESCRIPTION_AI_PARSE:   2,   // AI calls are expensive — limit concurrency
  STOCK_REORDER:           3,
  NOTIFICATION_SMS:        5,
  NOTIFICATION_WHATSAPP:   5,
  NOTIFICATION_EMAIL:      3,
  REPORT_GENERATION:       2,   // CPU-intensive; low concurrency
  RECEIPT_PDF:             4,
  NIGHTLY_RECONCILIATION:  1,   // Serialised — must not run in parallel
};

/** Priority numeric weights for sorting (higher = earlier processing) */
const PRIORITY_WEIGHT: Record<JobPriority, number> = {
  CRITICAL: 4,
  HIGH:     3,
  NORMAL:   2,
  LOW:      1,
};

type JobHandler<T = any> = (payload: T) => Promise<{ summary?: string }>;

class BullMQCompatibleQueueService {
  private queues: Map<QueueName, BackgroundJob[]> = new Map();
  private handlers: Map<QueueName, JobHandler> = new Map();
  private activeWorkers = 0;
  private totalProcessed = 0;
  private totalFailed = 0;
  private startedAt = Date.now();
  private seenIdempotencyKeys: Set<string> = new Set();

  constructor() {
    // Initialise named queues
    const allQueues: QueueName[] = [
      'PRESCRIPTION_AI_PARSE',
      'STOCK_REORDER',
      'NOTIFICATION_SMS',
      'NOTIFICATION_WHATSAPP',
      'NOTIFICATION_EMAIL',
      'REPORT_GENERATION',
      'RECEIPT_PDF',
      'NIGHTLY_RECONCILIATION',
    ];
    for (const q of allQueues) {
      this.queues.set(q, []);
    }
  }

  /**
   * Register a handler for a named queue
   */
  registerHandler<T>(queue: QueueName, handler: JobHandler<T>): void {
    this.handlers.set(queue, handler as JobHandler);
  }

  /**
   * Enqueue a job into a named queue.
   * Returns the job ID. Deduplicates via idempotencyKey if provided.
   */
  enqueue<T>(
    queue: QueueName,
    payload: T,
    options: {
      priority?: JobPriority;
      maxRetries?: number;
      idempotencyKey?: string;
      delayMs?: number;
    } = {}
  ): string | null {
    // Idempotency guard — prevents duplicate jobs (BullMQ jobId dedup)
    if (options.idempotencyKey && this.seenIdempotencyKeys.has(options.idempotencyKey)) {
      return null; // Silently deduplicated
    }
    if (options.idempotencyKey) {
      this.seenIdempotencyKeys.add(options.idempotencyKey);
    }

    const job: BackgroundJob<T> = {
      id: `${queue}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      queue,
      name: queue,
      payload,
      status: options.delayMs ? 'SCHEDULED' : 'QUEUED',
      priority: options.priority ?? 'NORMAL',
      createdAt: Date.now(),
      scheduledAt: options.delayMs ? Date.now() + options.delayMs : undefined,
      retries: 0,
      maxRetries: options.maxRetries ?? 3,
      backoffMs: 1000,
      idempotencyKey: options.idempotencyKey,
    };

    const queueList = this.queues.get(queue)!;
    queueList.push(job);

    // Sort queue by priority weight (descending)
    queueList.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);

    // Trigger processing asynchronously
    if (!options.delayMs) {
      setTimeout(() => this.processQueue(queue), 0);
    } else {
      setTimeout(() => {
        job.status = 'QUEUED';
        this.processQueue(queue);
      }, options.delayMs);
    }

    return job.id;
  }

  /**
   * Process next available job in a specific named queue
   */
  private async processQueue(queue: QueueName): Promise<void> {
    const limit = QUEUE_CONCURRENCY[queue];
    const queueList = this.queues.get(queue)!;
    const running = queueList.filter((j) => j.status === 'RUNNING').length;
    if (running >= limit) return;

    const nextJob = queueList.find((j) => j.status === 'QUEUED');
    if (!nextJob) return;

    const handler = this.handlers.get(queue);
    if (!handler) {
      nextJob.status = 'FAILED';
      nextJob.error = `No registered handler for queue "${queue}"`;
      this.totalFailed++;
      return;
    }

    nextJob.status = 'RUNNING';
    nextJob.startedAt = Date.now();
    this.activeWorkers++;

    try {
      const result = await handler(nextJob.payload);
      nextJob.status = 'COMPLETED';
      nextJob.completedAt = Date.now();
      nextJob.durationMs = nextJob.completedAt - (nextJob.startedAt ?? nextJob.completedAt);
      nextJob.resultSummary = result?.summary;
      this.totalProcessed++;
    } catch (err: any) {
      nextJob.retries++;
      nextJob.error = err?.message ?? 'Unhandled worker error';

      if (nextJob.retries < nextJob.maxRetries) {
        nextJob.status = 'RETRYING';
        const backoff = nextJob.backoffMs * Math.pow(2, nextJob.retries); // Exponential backoff
        setTimeout(() => {
          nextJob.status = 'QUEUED';
          this.processQueue(queue);
        }, backoff);
      } else {
        nextJob.status = 'FAILED';
        this.totalFailed++;
      }
    } finally {
      this.activeWorkers--;
      // Continue draining the queue
      this.processQueue(queue);
    }
  }

  /**
   * Schedule a nightly reconciliation job at a fixed time
   */
  scheduleNightlyReconciliation(tenantId: string, runAtHour = 0): string | null {
    const now = new Date();
    const target = new Date(now);
    target.setHours(runAtHour, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delayMs = target.getTime() - now.getTime();

    return this.enqueue(
      'NIGHTLY_RECONCILIATION',
      { tenantId, scheduledDate: target.toISOString() },
      {
        priority: 'NORMAL',
        maxRetries: 1,
        delayMs,
        idempotencyKey: `recon:${tenantId}:${target.toDateString()}`,
      }
    );
  }

  /**
   * Returns per-queue metrics for dashboard display
   */
  getQueueMetrics(): QueueMetrics[] {
    return Array.from(this.queues.entries()).map(([queueName, jobs]) => {
      const completed = jobs.filter((j) => j.status === 'COMPLETED');
      const avgDuration =
        completed.length > 0
          ? Math.round(completed.reduce((s, j) => s + (j.durationMs ?? 0), 0) / completed.length)
          : 0;

      return {
        queueName,
        queued: jobs.filter((j) => j.status === 'QUEUED').length,
        running: jobs.filter((j) => j.status === 'RUNNING').length,
        completed: completed.length,
        failed: jobs.filter((j) => j.status === 'FAILED').length,
        avgDurationMs: avgDuration,
        throughputPerHour: completed.filter(
          (j) => j.completedAt && Date.now() - j.completedAt < 3_600_000
        ).length,
      };
    });
  }

  /**
   * Returns worker pool status
   */
  getWorkerPoolStatus(): WorkerPoolStatus {
    return {
      concurrencyLimit: Object.values(QUEUE_CONCURRENCY).reduce((s, v) => s + v, 0),
      activeWorkers: this.activeWorkers,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      uptime: Date.now() - this.startedAt,
    };
  }

  /**
   * Returns recent jobs across all queues
   */
  getAllRecentJobs(limit = 20): BackgroundJob[] {
    const all: BackgroundJob[] = [];
    for (const jobs of this.queues.values()) {
      all.push(...jobs);
    }
    return all
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get jobs for a specific queue
   */
  getQueueJobs(queue: QueueName): BackgroundJob[] {
    return this.queues.get(queue) ?? [];
  }
}

export const bullMQ = new BullMQCompatibleQueueService();

/**
 * Backward-compatible alias for existing code
 */
export const backgroundQueue = bullMQ;
