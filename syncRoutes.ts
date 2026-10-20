/**
 * ZenithRx Cross-App Sync Hub (authenticated, role-scoped)
 * ---------------------------------------------------------------------------
 *   GET  /api/sync/snapshot        -> shared keys visible to the caller's role
 *   PUT  /api/sync/key/:key        -> write a key (role + ownership enforced)
 *   GET  /api/sync/stream?token=   -> Server-Sent Events, filtered per caller
 *
 * Access model
 *   quantum_admin : read/write everything shareable
 *   staff         : read/write everything except admin-only keys (write)
 *   patient       : only patient-facing keys.
 *                   "Personal" collections are filtered to the patient's own records
 *                   on read, and on write a patient may only ADD their own records
 *                   (notifications/feedback may also be edited). Staff-controlled
 *                   fields such as order status can never be overwritten by a patient.
 */
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthClaims, claimsFromRequest, normalizePhone } from './authRoutes';

interface SyncEntry {
  value: string;
  version: number;
  updatedAt: string;
  origin: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'sync-store.json');
const MAX_VALUE_BYTES = 2 * 1024 * 1024;
const MAX_KEYS = 500;

const store = new Map<string, SyncEntry>();
interface Stream {
  res: Response;
  claims: AuthClaims;
}
const streams = new Set<Stream>();

/** Keys that must stay on the device: sessions, themes, credentials, bridge internals. */
const DENY_PATTERNS = [/session/i, /theme/i, /night_shift/i, /token/i, /password/i, /patient_accounts/i, /^zenithrx__/i];

export function isSharedKey(key: string): boolean {
  if (!/^zenithrx_[a-zA-Z0-9_\-.:]{1,120}$/.test(key)) return false;
  return !DENY_PATTERNS.some((p) => p.test(key));
}

// ─── Access policy ───────────────────────────────────────────────────────────
/** Collections that contain per-patient records. Patients only ever see their own. */
const PATIENT_PERSONAL = new Set([
  'zenithrx_patient_online_orders_v1',
  'zenithrx_notification_inbox_v1',
  'zenithrx_teleconsultation_sessions_v1',
  'zenithrx_feedback_tickets',
  'zenithrx_refill_eligibility_records_v1',
  'zenithrx_prescriptions_lifecycle',
  'zenithrx_ocr_verification_queue_v1',
  'zenithrx_pharmacy_queue_tickets_v1',
]);
/** Personal collections a patient may also modify (own records only). Others are add-only. */
const PATIENT_EDITABLE = new Set(['zenithrx_notification_inbox_v1', 'zenithrx_feedback_tickets']);
/** Non-personal data patients may read (never write). */
const PATIENT_READ_ONLY = new Set([
  'zenithrx_health_articles_v1',
  'zenithrx_pharmacy_services_store_v1',
  'zenithrx_certified_pharmacies_v1',
  'zenithrx_master_medicines_v2',
  'zenithrx_pharmacy_queue_categories_v1',
]);
/** Only the platform engineers may write these. */
const ADMIN_WRITE_ONLY = new Set([
  'zenithrx_certified_pharmacies_v1',
  'zenithrx_subscription_ledger_v1',
  'zenithrx_plan_enforcement_events',
]);

const ownerFields = (r: any) => ({
  id: r?.patient_id ?? r?.patientId ?? r?.patientID,
  phone: r?.patient_phone ?? r?.patientPhone,
});
function ownedBy(r: any, c: AuthClaims): boolean {
  const o = ownerFields(r);
  if (o.id !== undefined && String(o.id) === c.sub) return true;
  return !!o.phone && !!c.phone && normalizePhone(String(o.phone)) === c.phone;
}
const hasOwner = (r: any) => {
  const o = ownerFields(r);
  return o.id !== undefined || !!o.phone;
};

function canRead(c: AuthClaims, key: string): boolean {
  if (c.role !== 'patient') return true;
  return PATIENT_PERSONAL.has(key) || PATIENT_READ_ONLY.has(key);
}
function canWrite(c: AuthClaims, key: string): boolean {
  if (c.role === 'quantum_admin') return true;
  if (ADMIN_WRITE_ONLY.has(key)) return false;
  if (c.role === 'staff') return true;
  return PATIENT_PERSONAL.has(key); // patient
}

/** What this caller is allowed to see of a stored value. null = nothing. */
function viewFor(c: AuthClaims, key: string, value: string): string | null {
  if (!canRead(c, key)) return null;
  if (c.role === 'patient' && PATIENT_PERSONAL.has(key)) {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? JSON.stringify(arr.filter((r) => ownedBy(r, c))) : null;
    } catch {
      return null;
    }
  }
  return value;
}

function loadStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) as Record<string, SyncEntry>;
    for (const [k, v] of Object.entries(raw)) if (isSharedKey(k)) store.set(k, v);
    console.log(`[Sync] Restored ${store.size} shared keys from disk`);
  } catch (err) {
    console.warn('[Sync] Could not restore store:', err);
  }
}

let persistTimer: NodeJS.Timeout | null = null;
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify(Object.fromEntries(store)), 'utf8');
    } catch (err) {
      console.warn('[Sync] Persist failed:', err);
    }
  }, 500);
}

/**
 * Conflict merge for staff/admin writers that were behind the server version:
 * union arrays of `{ id }` records (writer wins on same id); else last-writer-wins.
 */
export function mergeValues(serverValue: string, clientValue: string): string {
  try {
    const s = JSON.parse(serverValue);
    const c = JSON.parse(clientValue);
    const isRecords = (a: unknown): a is Array<{ id: unknown }> =>
      Array.isArray(a) && a.every((x) => x && typeof x === 'object' && 'id' in (x as object));
    if (isRecords(s) && isRecords(c)) {
      const seen = new Set(c.map((x) => String(x.id)));
      return JSON.stringify([...c, ...s.filter((x) => !seen.has(String(x.id)))]);
    }
  } catch {
    /* fall through */
  }
  return clientValue;
}

/** Apply a patient's submission to a personal collection without touching other people's data. */
function applyPatientWrite(key: string, existingValue: string | undefined, submitted: string, c: AuthClaims): string | null {
  let incoming: any[];
  let current: any[] = [];
  try {
    incoming = JSON.parse(submitted);
    if (!Array.isArray(incoming)) return null;
    if (existingValue) current = JSON.parse(existingValue);
  } catch {
    return null;
  }
  const editable = PATIENT_EDITABLE.has(key);
  const byId = new Map(current.map((r) => [String(r?.id), r]));
  const additions: any[] = [];

  for (const rec of incoming) {
    if (!rec || typeof rec !== 'object' || rec.id === undefined) continue;
    if (hasOwner(rec) && !ownedBy(rec, c)) continue; // never accept records for someone else
    const stamped = hasOwner(rec) ? rec : { ...rec, patient_id: c.sub };
    const prior = byId.get(String(rec.id));
    if (!prior) additions.push(stamped);
    else if (editable && ownedBy(prior, c)) byId.set(String(rec.id), { ...stamped, patient_id: prior.patient_id ?? c.sub });
    // else: existing record is staff-controlled / owned by someone else → ignore patient's copy
  }
  const updated = current.map((r) => byId.get(String(r?.id)) ?? r);
  return JSON.stringify([...additions, ...updated]);
}

function broadcast(key: string, entry: SyncEntry) {
  for (const s of streams) {
    const view = viewFor(s.claims, key, entry.value);
    if (view === null) continue;
    s.res.write(`event: change\ndata: ${JSON.stringify({ key, value: view, version: entry.version, origin: entry.origin })}\n\n`);
  }
}

export function registerSyncRoutes(app: Express) {
  loadStore();

  const authed = (req: Request, res: Response): AuthClaims | null => {
    const claims = claimsFromRequest(req);
    if (!claims) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }
    return claims;
  };

  app.get('/api/sync/snapshot', (req, res) => {
    const c = authed(req, res);
    if (!c) return;
    const keys: Record<string, { value: string; version: number }> = {};
    for (const [k, v] of store) {
      const view = viewFor(c, k, v.value);
      if (view !== null) keys[k] = { value: view, version: v.version };
    }
    return res.json({ success: true, role: c.role, keys, serverTime: new Date().toISOString() });
  });

  app.put('/api/sync/key/:key', (req, res) => {
    const c = authed(req, res);
    if (!c) return;
    const key = req.params.key;
    if (!isSharedKey(key)) return res.status(403).json({ error: 'Key is not shareable' });
    if (!canWrite(c, key)) return res.status(403).json({ error: 'Your role may not modify this data' });

    const { value, baseVersion = 0, clientId = 'unknown' } = req.body ?? {};
    if (typeof value !== 'string') return res.status(400).json({ error: 'value must be a string' });
    if (Buffer.byteLength(value) > MAX_VALUE_BYTES) return res.status(413).json({ error: 'Value too large' });
    if (!store.has(key) && store.size >= MAX_KEYS) return res.status(429).json({ error: 'Key limit reached' });

    const existing = store.get(key);
    let next = value;
    let merged = false;

    if (c.role === 'patient') {
      const applied = applyPatientWrite(key, existing?.value, value, c);
      if (applied === null) return res.status(400).json({ error: 'Invalid collection payload' });
      next = applied;
      merged = true;
    } else if (existing && Number(baseVersion) < existing.version) {
      next = mergeValues(existing.value, value);
      merged = true;
    }

    if (existing && next === existing.value) {
      return res.json({ success: true, value: viewFor(c, key, existing.value), version: existing.version, merged, unchanged: true });
    }

    const entry: SyncEntry = {
      value: next,
      version: (existing?.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
      origin: String(clientId).slice(0, 64),
    };
    store.set(key, entry);
    schedulePersist();
    broadcast(key, entry);
    return res.json({ success: true, value: viewFor(c, key, entry.value), version: entry.version, merged });
  });

  app.get('/api/sync/stream', (req, res) => {
    const c = authed(req, res);
    if (!c) return;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\n\n');
    const stream: Stream = { res, claims: c };
    streams.add(stream);
    const ping = setInterval(() => {
      if (c.exp * 1000 < Date.now()) {
        res.end(); // token expired → force the client to re-authenticate
        return;
      }
      res.write(': ping\n\n');
    }, 25000);
    req.on('close', () => {
      clearInterval(ping);
      streams.delete(stream);
    });
  });
}
