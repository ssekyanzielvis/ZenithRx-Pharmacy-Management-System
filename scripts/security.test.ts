import express from 'express';
import { signToken, registerAuthRoutes, requireAuth } from '../authRoutes';
import { registerSyncRoutes } from '../syncRoutes';

process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-123';
process.env.QUANTUM_ENGINEERING_MASTER_KEY = process.env.QUANTUM_ENGINEERING_MASTER_KEY || 'test-master-key-9876';
process.env.QUANTUM_ENGINEER_DEFAULT_ID = process.env.QUANTUM_ENGINEER_DEFAULT_ID || 'QN-ENG-8801';

const PORT = 3055;
const BASE = process.env.BASE || `http://127.0.0.1:${PORT}`;
const SECRET = process.env.AUTH_SECRET;
const MASTER = process.env.QUANTUM_ENGINEERING_MASTER_KEY;

let failures = 0;
const check = (name: string, ok: boolean, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${extra}`}`);
  if (!ok) failures++;
};

type Opts = { token?: string; body?: unknown; method?: string };
async function api(path: string, { token, body, method }: Opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  return { status: res.status, data };
}
const put = (key: string, value: unknown, token?: string, baseVersion = 0) =>
  api(`/api/sync/key/${key}`, { method: 'PUT', token, body: { value: JSON.stringify(value), baseVersion, clientId: 'test' } });
const snapshot = (token: string) => api('/api/sync/snapshot', { token });
const parse = (s: any, k: string) => (s.data.keys?.[k] ? JSON.parse(s.data.keys[k].value) : undefined);

const ORDERS = 'zenithrx_patient_online_orders_v1';
const INBOX = 'zenithrx_notification_inbox_v1';
const SUPPLIERS = 'zenithrx_suppliers_v1';
const REGISTRY = 'zenithrx_certified_pharmacies_v1';

async function ensureServer() {
  try {
    const res = await fetch(`${BASE}/api/health`);
    if (res.ok) return;
  } catch {
    // start local express
  }
  const app = express();
  app.use(express.json());
  registerAuthRoutes(app);
  registerSyncRoutes(app);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.post('/api/ai/counseling', requireAuth(), (_req, res) => res.json({ ok: true }));
  app.post('/api/patient/orders', requireAuth(), (_req, res) => res.json({ ok: true }));
  app.post('/api/files/upload-url', requireAuth(), (_req, res) => res.json({ ok: true }));
  app.post('/api/payments/initiate', requireAuth(), (_req, res) => res.json({ ok: true }));
  app.post('/api/payments/webhook/flutterwave', (_req, res) => res.json({ received: true }));
  app.get('/api/patient/orders/:patientId', requireAuth(), (req, res) => {
    const user = (req as any).auth;
    if (user && user.role === 'patient' && user.sub !== req.params.patientId) {
      return res.status(403).json({ error: 'Access denied: cannot access another patient data' });
    }
    return res.json({ orders: [] });
  });
  await new Promise<void>((resolve) => {
    app.listen(PORT, '127.0.0.1', () => resolve());
  });
}

(async () => {
  await ensureServer();
  console.log('\n— Unauthenticated access —');
  check('GET /api/health is public', (await api('/api/health')).status === 200);
  for (const [name, p, b] of [
    ['sync snapshot', '/api/sync/snapshot', undefined],
    ['AI counseling', '/api/ai/counseling', {}],
    ['patient orders', '/api/patient/orders', {}],
    ['file upload-url', '/api/files/upload-url', {}],
    ['payment initiate', '/api/payments/initiate', {}],
  ] as const) {
    check(`${name} requires auth (401)`, (await api(p, { body: b as any })).status === 401);
  }
  const wh = await api('/api/payments/webhook/flutterwave', { body: {} });
  check('payment webhook is NOT blocked by token auth', !JSON.stringify(wh.data).includes('Authentication required'), JSON.stringify(wh.data));

  console.log('\n— Token integrity —');
  const good = signToken({ sub: 'x', role: 'staff' }, 60, SECRET);
  check('valid staff token accepted', (await snapshot(good)).status === 200);
  check('token signed with wrong secret rejected', (await snapshot(signToken({ sub: 'x', role: 'staff' }, 60, 'wrong'))).status === 401);
  check('expired token rejected', (await snapshot(signToken({ sub: 'x', role: 'staff' }, -10, SECRET))).status === 401);
  const [body, sig] = good.split('.');
  const forgedBody = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), role: 'quantum_admin' })).toString('base64url');
  check('role-escalated payload (bad signature) rejected', (await snapshot(`${forgedBody}.${sig}`)).status === 401);
  check('garbage token rejected', (await snapshot('not.a.token')).status === 401);

  console.log('\n— Patient accounts —');
  const phoneA = `+25670${Math.floor(1000000 + Math.random() * 8999999)}`;
  const phoneB = `+25675${Math.floor(1000000 + Math.random() * 8999999)}`;
  const weak = await api('/api/auth/patient/register', { body: { fullName: 'Weak Pw', phone: phoneA, password: 'short' } });
  check('weak password rejected (400)', weak.status === 400);
  const regA = await api('/api/auth/patient/register', { body: { fullName: 'Alice Test', phone: phoneA, email: `a${Date.now()}@t.ug`, password: 'Passw0rd!x', district: 'Kampala' } });
  check('register patient A returns token', regA.status === 200 && !!regA.data.token);
  const regB = await api('/api/auth/patient/register', { body: { fullName: 'Bob Test', phone: phoneB, password: 'Passw0rd!y', district: 'Jinja' } });
  check('register patient B returns token', regB.status === 200 && !!regB.data.token);
  check('duplicate phone rejected (409)', (await api('/api/auth/patient/register', { body: { fullName: 'Dup', phone: phoneA, password: 'Passw0rd!z' } })).status === 409);
  check('password is never returned', !JSON.stringify(regA.data).includes('Passw0rd'));
  check('correct login works', (await api('/api/auth/patient/login', { body: { identifier: phoneA, password: 'Passw0rd!x' } })).status === 200);
  check('wrong password rejected (401)', (await api('/api/auth/patient/login', { body: { identifier: phoneA, password: 'nope-nope-1' } })).status === 401);
  check('passwordless login to demo account rejected', (await api('/api/auth/patient/login', { body: { identifier: 'grace.nakato@gmail.com', password: 'anything1' } })).status === 401);
  check('empty password rejected', (await api('/api/auth/patient/login', { body: { identifier: phoneA, password: '' } })).status === 401);
  let last = 0;
  for (let i = 0; i < 6; i++) last = (await api('/api/auth/patient/login', { body: { identifier: phoneB, password: `bad-guess-${i}` } })).status;
  check('brute force locks the account (429)', last === 429);
  check('lockout also blocks the correct password', (await api('/api/auth/patient/login', { body: { identifier: phoneB, password: 'Passw0rd!y' } })).status === 429);

  const A = regA.data.token as string;
  const B = regB.data.token as string;
  const idA = regA.data.patient.id as string;
  const idB = regB.data.patient.id as string;

  console.log('\n— Quantum admin —');
  check('admin login with wrong key rejected', (await api('/api/auth/admin/login', { body: { employeeId: 'QN-ENG-8801', key: 'admin' } })).status === 401);
  check('legacy hardcoded keys rejected', (await api('/api/auth/admin/login', { body: { employeeId: 'QN-ENG-8801', key: 'QUANTUM-SYS-2026' } })).status === 401);
  check('right key + wrong engineer id rejected', (await api('/api/auth/admin/login', { body: { employeeId: 'HACKER-1', key: MASTER } })).status === 401);
  const adm = await api('/api/auth/admin/login', { body: { employeeId: 'QN-ENG-8801', key: MASTER } });
  check('admin login with correct credentials', adm.status === 200 && !!adm.data.token);
  const ADMIN = adm.data.token as string;
  const staff = signToken({ sub: 'staff-1', role: 'staff', tenantId: 't1' }, 300, SECRET);

  console.log('\n— Role-based access to shared data —');
  check('staff can write order queue', (await put(ORDERS, [{ id: 'o1', patient_id: idA, status: 'Placed' }, { id: 'o2', patient_id: idB, status: 'Placed' }], staff)).status === 200);
  check('staff can write supplier data', (await put(SUPPLIERS, [{ id: 's1', name: 'Acme' }], staff)).status === 200);
  check('staff CANNOT write registry (admin-only)', (await put(REGISTRY, [{ id: 'r1' }], staff)).status === 403);
  check('admin can write registry', (await put(REGISTRY, [{ id: 'r1', name: 'Test Pharmacy' }], ADMIN)).status === 200);
  check('patient CANNOT write staff data (403)', (await put(SUPPLIERS, [{ id: 'evil' }], A)).status === 403);
  check('patient CANNOT write admin data (403)', (await put(REGISTRY, [{ id: 'evil' }], A)).status === 403);
  const snapA = await snapshot(A);
  check('patient snapshot hides staff-only keys', snapA.data.keys[SUPPLIERS] === undefined);
  check('patient can read public registry', snapA.data.keys[REGISTRY] !== undefined);

  console.log('\n— Patient data isolation —');
  const ordersA = parse(snapA, ORDERS) as any[];
  check('patient A sees only own orders', ordersA.length === 1 && ordersA[0].id === 'o1');
  const ordersB = parse(await snapshot(B), ORDERS) as any[];
  check('patient B sees only own orders', ordersB.length === 1 && ordersB[0].id === 'o2');

  await put(ORDERS, [{ id: 'o1', patient_id: idA, status: 'HACKED-BY-PATIENT' }, { id: 'o9', patient_id: idB, status: 'Injected' }, { id: 'o3', item: 'Amoxil' }], A);
  const staffView = parse(await snapshot(staff), ORDERS) as any[];
  const byId = Object.fromEntries(staffView.map((o) => [o.id, o]));
  check('patient cannot overwrite staff-controlled status', byId.o1?.status === 'Placed', JSON.stringify(byId.o1));
  check('patient cannot inject records for another patient', byId.o9 === undefined);
  check('patient CAN add own new order, stamped with their id', byId.o3?.patient_id === idA);
  check("patient's write did not touch other patient's order", byId.o2?.status === 'Placed');
  await put(ORDERS, [], A);
  check('patient cannot delete orders by submitting an empty list', (parse(await snapshot(staff), ORDERS) as any[]).length === 3);

  await put(INBOX, [{ id: 'n1', patient_id: idA, read: false }], staff);
  await put(INBOX, [{ id: 'n1', patient_id: idA, read: true }], A);
  check('patient can mark own notification read', (parse(await snapshot(staff), INBOX) as any[])[0].read === true);
  await put(INBOX, [{ id: 'n1', patient_id: idA, read: false }], B);
  check('another patient cannot modify it', (parse(await snapshot(staff), INBOX) as any[])[0].read === true);

  console.log('\n— Patient API identity binding —');
  check("patient cannot read another patient's orders (403)", (await api(`/api/patient/orders/${idB}`, { token: A })).status === 403);

  console.log('\n— Live stream isolation —');
  const events: Record<string, string> = { A: '', B: '', staff: '' };
  const ctl = new AbortController();
  const listen = (label: string, token: string) =>
    fetch(`${BASE}/api/sync/stream?token=${encodeURIComponent(token)}`, { signal: ctl.signal })
      .then(async (r) => {
        const rd = r.body!.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { value, done } = await rd.read();
          if (done) break;
          events[label] += dec.decode(value);
        }
      })
      .catch(() => undefined);
  const noTok = await fetch(`${BASE}/api/sync/stream`);
  check('stream without token rejected (401)', noTok.status === 401);
  void listen('A', A);
  void listen('B', B);
  void listen('staff', staff);
  await new Promise((r) => setTimeout(r, 600));
  await put(ORDERS, [{ id: 'o1', patient_id: idA, status: 'Dispensed' }, { id: 'o2', patient_id: idB, status: 'Placed' }], staff, 999);
  await new Promise((r) => setTimeout(r, 600));
  check('staff stream receives live update', events.staff.includes('Dispensed'));
  check('patient A receives only their own update', events.A.includes('Dispensed') && !events.A.includes(idB));
  check("patient B's stream never contains A's data", !events.B.includes('Dispensed') && !events.B.includes(idA));
  ctl.abort();

  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
})();
