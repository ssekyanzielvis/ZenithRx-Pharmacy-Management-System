/**
 * ZenithRx Sync Bridge (client)
 * ---------------------------------------------------------------------------
 * Mirrors allow-listed `zenithrx_*` localStorage keys through the server sync hub
 * so the Patient Web App, Pharmacy PMS and Admin console see the same data in
 * real time. Existing services keep reading/writing localStorage unchanged.
 *
 *  - Local writes are intercepted and pushed (debounced, retried when offline)
 *  - Remote changes arrive via Server-Sent Events (poll fallback)
 *  - Remote changes are applied and a `storage` event is dispatched so components
 *    that already listen for storage updates refresh automatically
 */

import { AUTH_CHANGE_EVENT, getAuthToken } from './authSession';

export type SyncState = 'idle' | 'connecting' | 'live' | 'offline' | 'signed-out';

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';
const VERSIONS_KEY = 'zenithrx__sync_versions';
const CLIENT_KEY = 'zenithrx__sync_client_id';
const DENY_PATTERNS = [/session/i, /theme/i, /night_shift/i, /token/i, /password/i, /patient_accounts/i, /^zenithrx__/i];

export const SYNC_EVENT = 'zenithrx:sync-update';

let started = false;
let state: SyncState = 'idle';
const listeners = new Set<(s: SyncState) => void>();
const dirty = new Set<string>();
const rejected = new Set<string>();
const timers = new Map<string, number>();
let applyingRemote = false;
let versions: Record<string, number> = {};
let eventSource: EventSource | null = null;
let pollTimer: number | null = null;

const nativeSet = Storage.prototype.setItem;
const nativeGet = Storage.prototype.getItem;

function isShared(key: string): boolean {
  return /^zenithrx_[\w\-.:]{1,120}$/.test(key) && !DENY_PATTERNS.some((p) => p.test(key));
}

function clientId(): string {
  let id = sessionStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = `c_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    sessionStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function setState(next: SyncState) {
  if (state === next) return;
  state = next;
  listeners.forEach((l) => l(next));
}

export function getSyncState(): SyncState {
  return state;
}

export function subscribeSyncState(fn: (s: SyncState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

function saveVersions() {
  nativeSet.call(localStorage, VERSIONS_KEY, JSON.stringify(versions));
}

function applyRemote(key: string, value: string, version: number) {
  if ((versions[key] ?? 0) >= version) return;
  versions[key] = version;
  saveVersions();
  if (nativeGet.call(localStorage, key) === value) return;
  applyingRemote = true;
  try {
    nativeSet.call(localStorage, key, value);
  } finally {
    applyingRemote = false;
  }
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: value, storageArea: localStorage }));
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
}

async function push(key: string): Promise<void> {
  const value = nativeGet.call(localStorage, key);
  if (value === null) {
    dirty.delete(key);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/sync/key/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ value, baseVersion: versions[key] ?? 0, clientId: clientId() }),
    });
    if (!res.ok) {
      // 4xx = permanent rejection (forbidden / not shareable / too large); don't retry forever.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        dirty.delete(key);
        if (res.status === 403) rejected.add(key);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    dirty.delete(key);
    versions[key] = data.version;
    saveVersions();
    // Server merged concurrent edits: adopt the merged result locally.
    if (data.merged && data.value !== value) {
      versions[key] = data.version - 1;
      applyRemote(key, data.value, data.version);
    }
    setState('live');
  } catch {
    setState('offline');
  }
}

function schedulePush(key: string) {
  dirty.add(key);
  window.clearTimeout(timers.get(key));
  timers.set(
    key,
    window.setTimeout(() => {
      timers.delete(key);
      void push(key);
    }, 300),
  );
}

async function pullSnapshot() {
  if (!getAuthToken()) throw new Error('signed-out');
  const res = await fetch(`${API_BASE}/api/sync/snapshot`, { headers: headers() });
  if (!res.ok) throw new Error(`snapshot HTTP ${res.status}`);
  const { keys } = (await res.json()) as { keys: Record<string, { value: string; version: number }> };

  for (const [key, entry] of Object.entries(keys)) {
    if (!isShared(key)) continue;
    if (nativeGet.call(localStorage, key) !== null && (versions[key] ?? 0) === 0) {
      // First contact with data on both sides: push local so the server can merge.
      schedulePush(key);
    } else {
      applyRemote(key, entry.value, entry.version);
    }
  }
  // Seed server with keys that only exist locally (skipping ones this role may not write).
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isShared(key) && !(key in keys) && !rejected.has(key)) schedulePush(key);
  }
}

function closeStream() {
  eventSource?.close();
  eventSource = null;
}

function openStream() {
  closeStream();
  const token = getAuthToken();
  if (!token) return setState('signed-out');
  eventSource = new EventSource(`${API_BASE}/api/sync/stream?token=${encodeURIComponent(token)}`);
  eventSource.onopen = () => {
    setState('live');
    dirty.forEach((k) => schedulePush(k));
    void pullSnapshot().catch(() => undefined);
  };
  eventSource.addEventListener('change', (ev) => {
    try {
      const msg = JSON.parse((ev as MessageEvent).data) as { key: string; value: string; version: number; origin: string };
      if (msg.origin === clientId() || !isShared(msg.key)) return;
      applyRemote(msg.key, msg.value, msg.version);
    } catch {
      /* ignore malformed frame */
    }
  });
  eventSource.onerror = () => {
    // The server ends the stream when a token expires; reconnect only if still signed in.
    if (!getAuthToken()) {
      closeStream();
      setState('signed-out');
    } else setState('offline');
  };
}

/** (Re)connect according to the current auth session. */
function connect() {
  closeStream();
  if (!getAuthToken()) return setState('signed-out');
  setState('connecting');
  pullSnapshot()
    .then(openStream)
    .catch(() => {
      setState('offline');
      openStream(); // EventSource auto-retries until the server is reachable
    });
}

/** Start the bridge once per page. Safe to call multiple times. */
export function startSyncBridge() {
  if (started || typeof window === 'undefined') return;
  started = true;

  try {
    versions = JSON.parse(nativeGet.call(localStorage, VERSIONS_KEY) || '{}');
  } catch {
    versions = {};
  }

  // Intercept writes to shared keys.
  Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
    nativeSet.call(this, key, value);
    if (this === localStorage && !applyingRemote && isShared(key) && getAuthToken()) schedulePush(key);
  };

  connect();

  // Sign-in / sign-out / user switch: reset per-session knowledge and reconnect.
  window.addEventListener(AUTH_CHANGE_EVENT, () => {
    versions = {};
    saveVersions();
    rejected.clear();
    connect();
  });

  // Safety-net poll in case SSE is blocked by a proxy.
  pollTimer = window.setInterval(() => {
    if (state !== 'live' && getAuthToken()) void pullSnapshot().catch(() => undefined);
  }, 15000);

  window.addEventListener('online', () => {
    if (getAuthToken()) {
      openStream();
      dirty.forEach((k) => schedulePush(k));
    }
  });
}

export function stopSyncBridge() {
  closeStream();
  if (pollTimer) window.clearInterval(pollTimer);
  Storage.prototype.setItem = nativeSet;
  started = false;
}
