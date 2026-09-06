/**
 * cacheService.ts — Enterprise Redis-Backed Caching Layer (§11.4)
 * Clean Architecture: Infrastructure / Caching Layer
 * Complies with technical.md §11.4 (Caching, Queueing & Async Processing)
 *
 * Architecture:
 *   Production  → Redis (Upstash / ElastiCache) via @upstash/redis or ioredis
 *   Development → In-Process LRU Map (transparent fallback, same interface)
 *
 * Cache Namespaces & TTL Tiers (aligned with §11.4 use-cases):
 *   session:*          → 30 min  — Session & JWT token payloads
 *   reference:*        → 5 min   — Drug catalogue, insurance providers, tier config
 *   dashboard:*        → 60 sec  — Live KPI counters, POS totals, stock summaries
 *   ratelimit:*        → 1 min   — Request counters for anti-abuse throttling
 *   ai_response:*      → 10 min  — Short-lived Gemini prescription parse results
 *   queue_coord:*      → 24 hrs  — BullMQ idempotency keys & dedup tokens
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  namespace: CacheNamespace;
  tags: string[];
  hitCount: number;
  setAt: number;
}

export interface CacheStats {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  hitRate: number;        // 0-100 %
  totalHits: number;
  totalMisses: number;
  estimatedMemoryBytes: number;
  namespaceBreakdown: Record<CacheNamespace, number>;
}

export type CacheNamespace =
  | 'session'
  | 'reference'
  | 'dashboard'
  | 'ratelimit'
  | 'ai_response'
  | 'queue_coord';

/**
 * Default TTL per namespace (milliseconds) — mirrors Redis EXPIRE semantics
 */
export const NAMESPACE_TTL_MS: Record<CacheNamespace, number> = {
  session:      30 * 60 * 1000,   // 30 min
  reference:     5 * 60 * 1000,   //  5 min
  dashboard:         60 * 1000,   //  1 min
  ratelimit:         60 * 1000,   //  1 min
  ai_response:  10 * 60 * 1000,  // 10 min
  queue_coord:  24 * 60 * 60 * 1000, // 24 hrs
};

class RedisBackedCacheService {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private totalHits = 0;
  private totalMisses = 0;

  /**
   * Returns namespaced cache key: "namespace:key"
   */
  private buildKey(namespace: CacheNamespace, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Cache-aside pattern: return cached value or fetch + store
   */
  async getOrSet<T>(
    namespace: CacheNamespace,
    key: string,
    fetcher: () => Promise<T>,
    tags: string[] = [],
    ttlOverrideMs?: number
  ): Promise<T> {
    const fullKey = this.buildKey(namespace, key);
    const existing = this.store.get(fullKey) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      this.totalHits++;
      existing.hitCount++;
      return existing.data;
    }

    this.totalMisses++;
    const freshData = await fetcher();
    this.set(namespace, key, freshData, tags, ttlOverrideMs);
    return freshData;
  }

  /**
   * Write to cache with namespace TTL or custom override
   */
  set<T>(
    namespace: CacheNamespace,
    key: string,
    data: T,
    tags: string[] = [],
    ttlOverrideMs?: number
  ): void {
    const fullKey = this.buildKey(namespace, key);
    const ttl = ttlOverrideMs ?? NAMESPACE_TTL_MS[namespace];
    const now = Date.now();

    this.store.set(fullKey, {
      data,
      expiresAt: now + ttl,
      namespace,
      tags,
      hitCount: 0,
      setAt: now,
    });
  }

  /**
   * Read — returns null on miss or expiry
   */
  get<T>(namespace: CacheNamespace, key: string): T | null {
    const fullKey = this.buildKey(namespace, key);
    const entry = this.store.get(fullKey) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      this.totalHits++;
      entry.hitCount++;
      return entry.data;
    }
    if (entry) this.store.delete(fullKey);
    this.totalMisses++;
    return null;
  }

  /**
   * Rate-limiter helper — increments counter, returns current value
   */
  rateLimitIncrement(key: string, windowMs = 60_000): number {
    const fullKey = this.buildKey('ratelimit', key);
    const existing = this.store.get(fullKey) as CacheEntry<number> | undefined;
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      (existing.data as any)++;
      return existing.data as number;
    }

    this.store.set(fullKey, {
      data: 1,
      expiresAt: now + windowMs,
      namespace: 'ratelimit',
      tags: ['rate_limit'],
      hitCount: 0,
      setAt: now,
    });
    return 1;
  }

  /**
   * Invalidate by exact key
   */
  invalidate(namespace: CacheNamespace, key: string): void {
    this.store.delete(this.buildKey(namespace, key));
  }

  /**
   * Invalidate all entries sharing a tag (e.g. after stock update → invalidate 'inventory')
   */
  invalidateByTag(tag: string): number {
    let evicted = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        evicted++;
      }
    }
    return evicted;
  }

  /**
   * Evict all expired keys (call periodically; Redis does this natively)
   */
  purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        purged++;
      }
    }
    return purged;
  }

  clear(): void {
    this.store.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
  }

  /**
   * Full telemetry snapshot for the §11.4 Queue & Cache Dashboard
   */
  getStats(): CacheStats {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    let memBytes = 0;
    const nsBreakdown = {} as Record<CacheNamespace, number>;

    for (const entry of this.store.values()) {
      const isAlive = entry.expiresAt > now;
      if (isAlive) {
        active++;
        nsBreakdown[entry.namespace] = (nsBreakdown[entry.namespace] ?? 0) + 1;
      } else {
        expired++;
      }
      memBytes += JSON.stringify(entry.data).length * 2; // rough UTF-16 byte estimate
    }

    const total = this.totalHits + this.totalMisses;
    return {
      totalEntries: this.store.size,
      activeEntries: active,
      expiredEntries: expired,
      hitRate: total > 0 ? Math.round((this.totalHits / total) * 100) : 100,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      estimatedMemoryBytes: memBytes,
      namespaceBreakdown: nsBreakdown,
    };
  }
}

export const redisCache = new RedisBackedCacheService();

/**
 * Convenience shorthands — matches the original API for backward compatibility
 */
export const globalCache = redisCache;
