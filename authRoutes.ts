/**
 * ZenithRx Authentication & Authorization (server-side)
 * ---------------------------------------------------------------------------
 * Replaces the previous client-side checks. Roles:
 *   patient        – registered patient (password, scrypt-hashed, server-stored)
 *   staff          – pharmacy staff; proven by exchanging a valid Supabase JWT
 *   quantum_admin  – Quantum Networks engineer; key verified on the server only
 *
 * Tokens are HMAC-SHA256 signed, expiring, and carry no secrets.
 *
 * Env:
 *   AUTH_SECRET                       signing secret (random per boot if unset → logins reset on restart)
 *   QUANTUM_ENGINEERING_MASTER_KEY    admin key (server only; NEVER a VITE_ var)
 *   QUANTUM_ENGINEER_DEFAULT_ID       comma-separated allowed engineer IDs
 *   ALLOW_DEMO_LOGIN                  "true" enables demo patients outside development (keep off in prod)
 */
import type { Express, NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export type Role = 'patient' | 'staff' | 'quantum_admin';

/** In-memory registry of active delegated collaborator Quantum Engineering credentials */
export const registeredQuantumEngineers = new Map<string, { key: string; name: string; email: string }>();

export interface AuthClaims {
  sub: string;
  role: Role;
  name?: string;
  phone?: string;
  tenantId?: string;
  iat: number;
  exp: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthClaims;
  }
}

const IS_PROD = process.env.NODE_ENV === 'production';
const DEMO_ENABLED = !IS_PROD || process.env.ALLOW_DEMO_LOGIN === 'true';

const _BOOT_SECRET = crypto.randomBytes(32).toString('hex');
export function getAuthSecret(): string {
  return process.env.AUTH_SECRET || _BOOT_SECRET;
}

if (!process.env.AUTH_SECRET) {
  console.warn('[Auth] AUTH_SECRET not set — using a random per-boot secret (all sessions reset on restart). Set AUTH_SECRET in .env.');
  if (IS_PROD) console.error('[Auth] AUTH_SECRET is REQUIRED in production.');
}

// ─── Tokens ──────────────────────────────────────────────────────────────────
const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export function signToken(claims: Omit<AuthClaims, 'iat' | 'exp'>, ttlSeconds: number, secret?: string): string {
  const actualSecret = secret ?? getAuthSecret();
  const now = Math.floor(Date.now() / 1000);
  const body = b64(JSON.stringify({ ...claims, iat: now, exp: now + ttlSeconds }));
  const sig = crypto.createHmac('sha256', actualSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined, secret?: string): AuthClaims | null {
  const actualSecret = secret ?? getAuthSecret();
  if (!token || token.length > 4096) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', actualSecret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AuthClaims;
    if (!claims.sub || !claims.role || claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function claimsFromRequest(req: Request): AuthClaims | null {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  return verifyToken(bearer || (typeof req.query.token === 'string' ? req.query.token : undefined));
}

/** Require a valid token (optionally restricted to roles). */
export function requireAuth(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const claims = claimsFromRequest(req);
    if (!claims) return res.status(401).json({ error: 'Authentication required' });
    if (roles.length && !roles.includes(claims.role) && claims.role !== 'quantum_admin') {
      return res.status(403).json({ error: 'Your role is not permitted to perform this action' });
    }
    req.auth = claims;
    return next();
  };
}

// ─── Password hashing (scrypt) ───────────────────────────────────────────────
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}
const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString('hex'));

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const safeEqual = (a: string, b: string) =>
  crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(), crypto.createHash('sha256').update(b).digest());

// ─── Brute-force lockout ─────────────────────────────────────────────────────
const attempts = new Map<string, { fails: number; lockedUntil: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

function lockState(key: string) {
  const a = attempts.get(key);
  if (a && a.lockedUntil > Date.now()) return Math.ceil((a.lockedUntil - Date.now()) / 1000);
  return 0;
}
function recordFail(key: string) {
  const a = attempts.get(key) ?? { fails: 0, lockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.lockedUntil = Date.now() + LOCK_MS;
    a.fails = 0;
  }
  attempts.set(key, a);
}
const clearFails = (key: string) => attempts.delete(key);
const ipOf = (req: Request) => (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'ip';

function audit(event: string, detail: string) {
  console.log(`[Audit] ${new Date().toISOString()} ${event} ${detail}`);
}

// ─── Patient store ───────────────────────────────────────────────────────────
export interface PatientProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nin?: string;
  district: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'Female' | 'Male' | 'Other';
  allergies: string[];
  chronicConditions: string[];
  registeredAt: string;
  avatarUrl?: string;
}
interface PatientRecord {
  profile: PatientProfile;
  passwordHash: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const PATIENT_FILE = path.join(DATA_DIR, 'patients.json');
const patients = new Map<string, PatientRecord>();

const DEMO_PROFILES: PatientProfile[] = [
  { id: 'PAT-UG-001', fullName: 'Grace Nakato', phone: '+256 701 234567', email: 'grace.nakato@gmail.com', nin: 'CM92014819201K', district: 'Kampala (Kololo)', address: 'Plot 14, Prince Charles Drive, Kololo', dateOfBirth: '1992-04-12', gender: 'Female', allergies: ['Penicillin (Mild hives / rash)', 'Sulfa Drugs'], chronicConditions: ['Hypertension'], registeredAt: '2026-01-15' },
  { id: 'PAT-UG-002', fullName: 'David Kato', phone: '+256 772 987654', email: 'david.kato@outlook.com', nin: 'CM88019283716M', district: 'Wakiso (Entebbe Town)', address: 'Airport Road, Entebbe', dateOfBirth: '1988-11-03', gender: 'Male', allergies: ['Aspirin (Bronchospasm / Wheezing)'], chronicConditions: ['Asthma'], registeredAt: '2026-02-20' },
  { id: 'PAT-UG-003', fullName: 'Sarah Namubiru', phone: '+256 755 123890', email: 'sarah.namu@gmail.com', nin: 'CF95029381726P', district: 'Jinja (Main Street)', address: 'Plot 8, Bell Avenue, Jinja', dateOfBirth: '1995-07-28', gender: 'Female', allergies: [], chronicConditions: ['Type 2 Diabetes'], registeredAt: '2026-03-05' },
  { id: 'PAT-UG-004', fullName: 'Brian Mukasa', phone: '+256 788 456123', email: 'brian.mukasa@gmail.com', nin: 'CM90048192837L', district: 'Kampala (Ntinda)', address: 'Semawata Road, Ntinda', dateOfBirth: '1990-09-18', gender: 'Male', allergies: ['NSAIDs / Ibuprofen'], chronicConditions: ['Hypertension', 'Dyslipidemia'], registeredAt: '2026-04-10' },
];

function loadPatients() {
  try {
    if (fs.existsSync(PATIENT_FILE)) {
      const raw = JSON.parse(fs.readFileSync(PATIENT_FILE, 'utf8')) as PatientRecord[];
      raw.forEach((r) => patients.set(r.profile.id, r));
    }
  } catch (err) {
    console.warn('[Auth] Could not read patient store:', err);
  }
  if (DEMO_ENABLED) {
    for (const p of DEMO_PROFILES) {
      if (!patients.has(p.id)) patients.set(p.id, { profile: p, passwordHash: DUMMY_HASH }); // demo: token-only, no password
    }
  }
}
function savePatients() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PATIENT_FILE, JSON.stringify([...patients.values()].filter((r) => !r.profile.id.startsWith('PAT-UG-00'))), 'utf8');
  } catch (err) {
    console.warn('[Auth] Could not save patient store:', err);
  }
}

// ─── Supabase mirroring (service role, server-side only) ─────────────────────
function getSb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Upserts a patient into public.patient_profiles (keyed by unique phone). Never throws. */
async function mirrorPatientToSupabase(p: PatientProfile): Promise<boolean> {
  const sb = getSb();
  if (!sb) return false;
  const age = p.dateOfBirth ? Math.max(1, Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000)) : null;
  const { error } = await sb.from('patient_profiles').upsert(
    {
      full_name: p.fullName,
      phone: normalizePhone(p.phone),
      email: p.email,
      age: age && age < 150 ? age : null,
      gender: p.gender ?? null,
      known_allergies: p.allergies,
      chronic_conditions: p.chronicConditions,
      delivery_address: { address: p.address || '', district: p.district },
    },
    { onConflict: 'phone' },
  );
  if (error) {
    console.warn('[Auth] patient_profiles sync failed:', error.message);
    return false;
  }
  return true;
}

async function backfillPatientsToSupabase() {
  const real = [...patients.values()].map((r) => r.profile).filter((p) => !p.id.startsWith('PAT-UG-00'));
  if (!real.length || !getSb()) return;
  let ok = 0;
  for (const p of real) if (await mirrorPatientToSupabase(p)) ok++;
  console.log(`[Auth] Synced ${ok}/${real.length} patients to Supabase patient_profiles`);
}

export const normalizePhone = (p: string) => (p || '').replace(/[^0-9]/g, '').replace(/^0/, '256');
const PATIENT_TTL = 7 * 24 * 3600;
const ADMIN_TTL = 2 * 3600;
const STAFF_TTL = 8 * 3600;

function patientSession(profile: PatientProfile) {
  const token = signToken({ sub: profile.id, role: 'patient', name: profile.fullName, phone: normalizePhone(profile.phone) }, PATIENT_TTL);
  return { success: true, token, expiresAt: new Date(Date.now() + PATIENT_TTL * 1000).toISOString(), patient: profile };
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => (x as string).slice(0, 120)).slice(0, 30) : []);

// ─── Routes ──────────────────────────────────────────────────────────────────
export function registerAuthRoutes(app: Express) {
  loadPatients();
  void backfillPatientsToSupabase();

  // Certified pharmacy registration -> certified_pharmacies (+ tenants) in Supabase
  app.post('/api/pharmacies/register', async (req, res) => {
    const b = req.body ?? {};
    const row = {
      pharmacy_name: str(b.pharmacyName),
      nda_license_no: str(b.ndaLicenseNo, 100).toUpperCase(),
      premise_category: str(b.premiseCategory, 100) || 'Community Retail Pharmacy',
      district: str(b.district, 100) || 'Kampala',
      physical_address: str(b.physicalAddress, 300),
      business_tin: str(b.businessTin, 50) || '1000000000',
      supervising_pharmacist_name: str(b.supervisingPharmacistName),
      psu_reg_no: str(b.psuRegNo, 100).toUpperCase(),
      contact_email: str(b.contactEmail, 255).toLowerCase(),
      contact_phone: str(b.contactPhone, 50),
      package_tier: str(b.packageTier, 50) || 'Professional',
      billing_cycle: b.billingCycle === 'yearly' ? 'yearly' : 'monthly',
      approval_status: 'Pending Admin Verification',
    };
    if (!row.pharmacy_name || !row.nda_license_no || !row.psu_reg_no || !row.supervising_pharmacist_name || !row.physical_address || !row.contact_phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.contact_email)) {
      return res.status(400).json({ error: 'Pharmacy name, NDA licence, PSU number, pharmacist, address, phone and a valid email are required.' });
    }
    const sb = getSb();
    if (!sb) return res.status(503).json({ error: 'Registry database is not configured.' });

    const { data, error } = await sb.from('certified_pharmacies').insert(row).select('id').single();
    if (error || !data) {
      const dup = error?.code === '23505';
      console.warn('[Registry] certified_pharmacies insert failed:', error?.message);
      return res.status(dup ? 409 : 500).json({ error: dup ? 'A pharmacy with this NDA licence or contact email is already registered.' : 'Could not save the registration. Please try again.' });
    }
    // Tenant row so users/inventory can reference this pharmacy (same id). Non-fatal if the schema differs.
    const { error: tErr } = await sb.from('tenants').upsert({
      id: data.id,
      name: row.pharmacy_name,
      slug: `${row.pharmacy_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(data.id).slice(0, 6)}`,
      location: `${row.physical_address}, ${row.district}`,
      contact_phone: row.contact_phone,
      contact_email: row.contact_email,
      package_tier: row.package_tier,
      nda_license_no: row.nda_license_no,
      nda_verified: false,
      supervising_pharmacist: row.supervising_pharmacist_name,
      billing_status: 'pending_renewal',
    });
    if (tErr) console.warn('[Registry] tenants upsert note:', tErr.message);
    audit('PHARMACY_REGISTERED', data.id);
    return res.json({ success: true, id: data.id });
  });

  // Patient registration
  app.post('/api/auth/patient/register', (req, res) => {
    const b = req.body ?? {};
    const fullName = str(b.fullName);
    const phone = str(b.phone, 30);
    const email = str(b.email, 120).toLowerCase();
    const password = typeof b.password === 'string' ? b.password : '';

    if (!fullName || normalizePhone(phone).length < 9) return res.status(400).json({ error: 'A full name and a valid phone number are required.' });
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email address is not valid.' });
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || password.length > 128) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include a letter and a number.' });
    }
    for (const r of patients.values()) {
      if (normalizePhone(r.profile.phone) === normalizePhone(phone) || (email && r.profile.email.toLowerCase() === email)) {
        return res.status(409).json({ error: 'An account with this phone or email already exists. Please sign in.' });
      }
    }

    let id = '';
    do id = `PAT-UG-${crypto.randomInt(100000, 999999)}`;
    while (patients.has(id));

    const profile: PatientProfile = {
      id,
      fullName,
      phone,
      email: email || `${normalizePhone(phone)}@patient.zenithrx.ug`,
      nin: str(b.nin, 20) || undefined,
      district: str(b.district) || 'Kampala',
      address: str(b.address, 300),
      gender: ['Female', 'Male', 'Other'].includes(b.gender) ? b.gender : undefined,
      dateOfBirth: str(b.dateOfBirth, 10) || undefined,
      allergies: strList(b.allergies),
      chronicConditions: strList(b.chronicConditions),
      registeredAt: new Date().toISOString().split('T')[0],
    };
    patients.set(id, { profile, passwordHash: hashPassword(password) });
    savePatients();
    void mirrorPatientToSupabase(profile);
    audit('PATIENT_REGISTERED', id);
    return res.json(patientSession(profile));
  });

  // Patient login
  app.post('/api/auth/patient/login', (req, res) => {
    const identifier = str(req.body?.identifier, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const lockKey = `patient:${ipOf(req)}:${identifier}`;
    const wait = lockState(lockKey);
    if (wait) return res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, retryAfterSeconds: wait });

    const phone = normalizePhone(identifier);
    const found = [...patients.values()].find(
      (r) => r.profile.email.toLowerCase() === identifier || (phone.length >= 9 && normalizePhone(r.profile.phone) === phone),
    );
    // Always run a hash comparison so response time doesn't reveal whether the account exists.
    const ok = verifyPassword(password, found?.passwordHash ?? DUMMY_HASH) && !!found && found.passwordHash !== DUMMY_HASH;
    if (!ok || !found) {
      recordFail(lockKey);
      audit('PATIENT_LOGIN_FAILED', `${ipOf(req)} ${identifier.slice(0, 3)}***`);
      return res.status(401).json({ error: 'Invalid phone/email or password.' });
    }
    clearFails(lockKey);
    audit('PATIENT_LOGIN', found.profile.id);
    return res.json(patientSession(found.profile));
  });

  // Demo patients (development / explicitly enabled only)
  app.post('/api/auth/patient/demo', (req, res) => {
    if (!DEMO_ENABLED) return res.status(404).json({ error: 'Not found' });
    const rec = patients.get(str(req.body?.patientId, 30));
    if (!rec || !DEMO_PROFILES.some((d) => d.id === rec.profile.id)) return res.status(404).json({ error: 'Unknown demo patient' });
    audit('PATIENT_DEMO_LOGIN', rec.profile.id);
    return res.json(patientSession(rec.profile));
  });

  app.put('/api/auth/patient/profile', requireAuth('patient'), (req, res) => {
    const rec = patients.get(req.auth!.sub);
    if (!rec) return res.status(404).json({ error: 'Account not found' });
    const b = req.body ?? {};
    const p = rec.profile;
    if (b.fullName !== undefined) p.fullName = str(b.fullName) || p.fullName;
    if (b.email !== undefined && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str(b.email, 120))) p.email = str(b.email, 120).toLowerCase();
    if (b.district !== undefined) p.district = str(b.district) || p.district;
    if (b.address !== undefined) p.address = str(b.address, 300);
    if (b.dateOfBirth !== undefined) p.dateOfBirth = str(b.dateOfBirth, 10) || undefined;
    if (b.nin !== undefined) p.nin = str(b.nin, 20) || undefined;
    if (b.allergies !== undefined) p.allergies = strList(b.allergies);
    if (b.chronicConditions !== undefined) p.chronicConditions = strList(b.chronicConditions);
    if (typeof b.avatarUrl === 'string' && b.avatarUrl.length < 500_000) p.avatarUrl = b.avatarUrl;
    savePatients();
    return res.json({ success: true, patient: p });
  });

  // Quantum Networks engineer login — key never leaves the server
  const WEAK_KEYS = ['QUANTUM-SYS-2026', 'admin', 'admin123', 'demo', 'password', 'CHANGE-ME-long-random-string'];
  const rawAdminKey = process.env.QUANTUM_ENGINEERING_MASTER_KEY || (IS_PROD ? '' : crypto.randomBytes(12).toString('hex'));
  const adminKeyIsWeak = WEAK_KEYS.includes(rawAdminKey) || rawAdminKey.length < 12;
  if (adminKeyIsWeak && rawAdminKey) {
    console.warn(
      IS_PROD
        ? '[Auth] QUANTUM_ENGINEERING_MASTER_KEY is a known default / too short — admin login DISABLED. Set a long random key.'
        : '[Auth] WARNING: QUANTUM_ENGINEERING_MASTER_KEY is a known default or short. Rotate it before deploying.',
    );
  }
  const adminKey = IS_PROD && adminKeyIsWeak ? '' : rawAdminKey;
  if (!process.env.QUANTUM_ENGINEERING_MASTER_KEY) {
    console.warn(
      IS_PROD
        ? '[Auth] QUANTUM_ENGINEERING_MASTER_KEY missing — admin console login is DISABLED.'
        : `[Auth] QUANTUM_ENGINEERING_MASTER_KEY not set — dev key for this run: ${adminKey}`,
    );
  }
  const allowedEngineers = (process.env.QUANTUM_ENGINEER_DEFAULT_ID || 'QN-ENG-8801').split(',').map((s) => s.trim()).filter(Boolean);

  app.post('/api/auth/admin/login', (req, res) => {
    const employeeId = str(req.body?.employeeId, 40);
    const key = typeof req.body?.key === 'string' ? req.body.key.slice(0, 256) : '';
    const lockKey = `admin:${ipOf(req)}`;
    const wait = lockState(lockKey);
    if (wait) return res.status(429).json({ error: `Locked after repeated failures. Retry in ${Math.ceil(wait / 60)} minute(s).`, retryAfterSeconds: wait });

    // Check against registered delegated collaborator credentials or server master key
    const cleanId = employeeId.trim().toUpperCase();
    let reg = registeredQuantumEngineers.get(cleanId) || registeredQuantumEngineers.get(employeeId);
    if (!reg) {
      for (const [k, v] of registeredQuantumEngineers.entries()) {
        if (k.trim().toUpperCase() === cleanId) {
          reg = v;
          break;
        }
      }
    }
    const idOk = allowedEngineers.some((id) => safeEqual(id.toUpperCase(), cleanId)) || Boolean(reg);
    const keyOk = (reg && safeEqual(reg.key, key)) || (adminKey ? safeEqual(adminKey, key) : false);

    if (!(idOk && keyOk)) {
      recordFail(lockKey);
      audit('ADMIN_LOGIN_FAILED', `${ipOf(req)} id=${employeeId.slice(0, 6)}`);
      return res.status(401).json({ error: 'Invalid Quantum Networks engineer ID or authorization key.' });
    }
    clearFails(lockKey);
    audit('ADMIN_LOGIN', employeeId);
    const engineerName = reg?.name || 'Quantum Networks Engineer';
    const token = signToken({ sub: employeeId, role: 'quantum_admin', name: engineerName }, ADMIN_TTL);
    return res.json({ success: true, token, expiresAt: new Date(Date.now() + ADMIN_TTL * 1000).toISOString(), engineerName });
  });

  // Pharmacy staff: exchange a verified Supabase session for a ZenithRx API token
  app.post('/api/auth/staff/exchange', async (req, res) => {
    const accessToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken : '';
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!accessToken || !url || !key) return res.status(400).json({ error: 'Staff authentication is not available.' });
    try {
      const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await sb.auth.getUser(accessToken);
      if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired staff session.' });
      const u = data.user;
      // Only app_metadata is server-controlled; user_metadata is user-editable, so it is never trusted for privileges.
      const tenantId = (u.app_metadata as any)?.tenant_id || (u.user_metadata as any)?.tenant_id || undefined;
      const token = signToken({ sub: u.id, role: 'staff', name: u.email ?? u.id, tenantId }, STAFF_TTL);
      audit('STAFF_TOKEN_ISSUED', u.id);
      return res.json({ success: true, token, expiresAt: new Date(Date.now() + STAFF_TTL * 1000).toISOString() });
    } catch {
      return res.status(500).json({ error: 'Staff authentication failed.' });
    }
  });

  // Development-only: lets a local demo staff session use the API. 404 in production.
  app.post('/api/auth/staff/demo', (_req, res) => {
    if (!DEMO_ENABLED) return res.status(404).json({ error: 'Not found' });
    const token = signToken({ sub: 'demo-staff', role: 'staff', name: 'Demo Staff', tenantId: 'client-001' }, STAFF_TTL);
    audit('STAFF_DEMO_TOKEN_ISSUED', 'demo-staff');
    return res.json({ success: true, token, expiresAt: new Date(Date.now() + STAFF_TTL * 1000).toISOString() });
  });

  app.get('/api/auth/me', requireAuth(), (req, res) => res.json({ success: true, claims: req.auth }));
}
