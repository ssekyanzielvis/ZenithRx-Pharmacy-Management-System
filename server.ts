import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { registerSyncRoutes } from './syncRoutes';
import { registerAuthRoutes, requireAuth, registeredQuantumEngineers, signToken } from './authRoutes';
import nodemailer from 'nodemailer';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

// ─── Enterprise Security & Hardening Middleware ────────────────────────────
// In-Memory Rate Limiter & IP Quarantine Engine
interface IPRateBucket {
  count: number;
  firstRequestTime: number;
  failedAuthCount: number;
  quarantinedUntil?: number;
}
const ipBuckets = new Map<string, IPRateBucket>();

// Security Headers (HSTS, CSP, XSS, Clickjacking, MIME-Sniffing)
app.use((_req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' https: data: blob:; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none';"
  );
  next();
});

// CORS Whitelist Handler — Supports local network mobile devices, LAN IP, and Vercel
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    process.env.APP_URL || '',
  ].filter(Boolean);

  const origin = req.headers.origin;
  const isLocalNetwork = origin && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
  const isAllowedHost = origin && (allowedOrigins.includes(origin) || origin.endsWith('.zenithrx.com') || origin.endsWith('.vercel.app') || isLocalNetwork);

  if (origin && isAllowedHost) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Id, X-MFA-Code');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// API Rate Limiting & Authentication Quarantine Engine (Scoped to /api routes only)
app.use('/api', (req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost' || clientIp.includes('127.0.0.1');

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 Minute window
  // Higher limits for local dev and standard API requests; sensitive auth routes still protected
  const maxRequests = isDev && isLocalhost
    ? 5000
    : req.path.startsWith('/auth')
      ? Number(process.env.RATE_LIMIT_AUTH_PER_MIN ?? 60)
      : 1000;

  let bucket = ipBuckets.get(clientIp);
  if (!bucket) {
    bucket = { count: 0, firstRequestTime: now, failedAuthCount: 0 };
    ipBuckets.set(clientIp, bucket);
  }

  // Check if IP is in quarantine (e.g. from excessive failed attempts)
  if (bucket.quarantinedUntil && now < bucket.quarantinedUntil) {
    const retrySecs = Math.ceil((bucket.quarantinedUntil - now) / 1000);
    res.setHeader('Retry-After', retrySecs.toString());
    return res.status(429).json({
      error: 'Security Quarantine: IP temporarily blocked due to excessive authentication failures.',
      retryAfterSeconds: retrySecs,
    });
  }

  // Reset window if expired
  if (now - bucket.firstRequestTime > windowMs) {
    bucket.count = 0;
    bucket.firstRequestTime = now;
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'Too many requests. Rate limit exceeded for this IP address.',
      retryAfterSeconds: 60,
    });
  }

  next();
});

app.use(express.json({ limit: '10mb' }));

// ─── Authentication, Authorization & API guards ──────────────────────────────────
registerAuthRoutes(app);
registerSyncRoutes(app);

// Every remaining /api route requires a valid signed token, except public health/security
// beacons, the payment-provider webhook (verified by its own signature), medicine catalog and auth endpoints.
const PUBLIC_API = [
  /^\/api\/health$/,
  /^\/api\/security\/failed-login$/,
  /^\/api\/auth\//,
  /^\/api\/payments\/webhook\//,
  /^\/api\/medicines/,
  /^\/api\/collaborators/,
];

// Serve static pharmaceutical product shots
app.use('/medicines', express.static(path.join(process.cwd(), 'public', 'medicines')));

app.use('/api', (req, res, next) => {
  const full = `/api${req.path}`;
  if (PUBLIC_API.some((p) => p.test(full))) return next();
  return requireAuth()(req, res, next);
});
// Role gates
app.use('/api/patient', requireAuth('patient', 'staff'));
app.use('/api/files', requireAuth('patient', 'staff'));
app.use('/api/payments', (req, res, next) =>
  req.path.startsWith('/webhook/') ? next() : requireAuth('staff')(req, res, next),
);

/** Patients are always bound to their own identity; staff may act on a supplied patient. */
const resolvePatientId = (req: express.Request, supplied?: string) =>
  req.auth!.role === 'patient' ? req.auth!.sub : supplied;

// ─── Cloudflare R2 Client ─────────────────────────────────────────────────────
function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'zenithrx-files';

// ─── Supabase Admin Client (server-side, service role) ───────────────────────
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Lazy load GoogleGenAI client with proper User-Agent header
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ZenithRx Pharmacy Management System', version: 'v3.2', securityHardened: true });
});

// Security Endpoint: Report & Triage Failed Login Attempt
app.post('/api/security/failed-login', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const { email } = req.body;
  const now = Date.now();

  let bucket = ipBuckets.get(clientIp);
  if (!bucket) {
    bucket = { count: 0, firstRequestTime: now, failedAuthCount: 0 };
    ipBuckets.set(clientIp, bucket);
  }

  bucket.failedAuthCount++;

  // 30 Failed Logins Trigger -> Auto Quarantine for 24 Hours
  if (bucket.failedAuthCount >= 30) {
    bucket.quarantinedUntil = now + 24 * 60 * 60 * 1000;
    console.warn(`[SECURITY ALERT] 30 Failed Logins detected from IP ${clientIp} targeting ${email}. Automated 24h quarantine applied.`);
    return res.status(403).json({
      status: 'QUARANTINED',
      message: 'Security Alert: 30 failed login attempts detected. IP has been quarantined for 24 hours.',
      ip: clientIp,
      quarantinedUntil: new Date(bucket.quarantinedUntil).toISOString(),
    });
  }

  res.json({
    status: 'RECORDED',
    failedAttempts: bucket.failedAuthCount,
    remainingBeforeQuarantine: Math.max(0, 30 - bucket.failedAuthCount),
  });
});

// ─── Outbound Collaborator Invitation Email Dispatch Engine ─────────────────
function getMailTransporter() {
  const host = process.env.SMTP_HOST || (process.env.SMTP_USER?.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || (host === 'smtp.gmail.com' ? 465 : 587));
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function generateInviteEmailHtml(data: {
  recipientName: string;
  recipientEmail: string;
  role: string;
  domainScope: string;
  invitationLink: string;
  invitationToken: string;
  expiresAt: string;
  grantedBy: string;
  permissionsList: string[];
}): string {
  const expiresDateStr = new Date(data.expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const controlsItems = (data.permissionsList || [])
    .map(
      (perm) => `
      <div style="padding: 8px 12px; margin-bottom: 6px; background-color: #F8FBFA; border: 1px solid #E3ECE8; border-radius: 8px; font-size: 11px; color: #263B33;">
        <span style="color: #20A66A; font-weight: bold; margin-right: 6px;">&#10003;</span>
        ${perm}
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ZenithRx Official Delegated Appointment</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #263B33;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F7FB; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #E3ECE8; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color: #0D1A2A; padding: 24px 30px; text-align: left; border-bottom: 2px solid #20A66A;">
              <span style="display: inline-block; background-color: rgba(32,166,106,0.18); border: 1px solid rgba(32,166,106,0.4); color: #20A66A; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px; border-radius: 6px; margin-bottom: 8px;">
                SUPERUSER GOVERNANCE §11.17
              </span>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                ZenithRx Enterprise Pharmacy Management System
              </h1>
              <p style="color: #94A3B8; font-size: 12px; margin: 4px 0 0 0;">
                Official Delegated Administrative Appointment &amp; Credential Setup
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 30px 20px 30px; line-height: 1.6; font-size: 13px; color: #263B33;">
              <p style="margin-top: 0; font-size: 16px; font-weight: 700; color: #0D1A2A;">
                Dear ${data.recipientName},
              </p>
              <p style="color: #4A6359; margin-bottom: 20px; font-size: 13px;">
                You have been officially granted delegated administrative authority on the <strong>ZenithRx Platform</strong> by <strong>${data.grantedBy}</strong> (System Administrator).
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FBFA; border: 1px solid #E3ECE8; border-radius: 14px; margin-bottom: 22px;">
                <tr>
                  <td width="50%" style="padding: 12px 16px; border-bottom: 1px solid #E3ECE8;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #5E7A70; display: block;">Designated Role</span>
                    <strong style="color: #20A66A; font-size: 14px;">${data.role}</strong>
                  </td>
                  <td width="50%" style="padding: 12px 16px; border-bottom: 1px solid #E3ECE8;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #5E7A70; display: block;">Domain Scope</span>
                    <strong style="color: #0D1A2A; font-size: 13px;">${(data.domainScope || 'CLINICAL_OVERSIGHT').replace(/_/g, ' ')}</strong>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 12px 16px;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #5E7A70; display: block;">Invitation Token</span>
                    <span style="font-family: monospace; font-size: 12px; font-weight: bold; color: #0D1A2A;">${data.invitationToken}</span>
                  </td>
                  <td width="50%" style="padding: 12px 16px;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #5E7A70; display: block;">Appointment Validity</span>
                    <strong style="color: #0D1A2A; font-size: 12px;">Until ${expiresDateStr}</strong>
                  </td>
                </tr>
              </table>

              <h3 style="font-size: 12px; font-weight: 800; color: #0D1A2A; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Authorized Level of Access Rights &amp; What You Can Control (§11.17):
              </h3>
              <div style="margin-bottom: 24px;">
                ${controlsItems}
              </div>

              <div style="background-color: #E8F7F0; border: 1px solid rgba(32,166,106,0.3); border-radius: 14px; padding: 18px; text-align: center; margin: 25px 0;">
                <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #1E744F;">
                  Activate Your Administrative Authority &amp; Create Your Password
                </p>
                <a href="${data.invitationLink}" style="display: inline-block; background-color: #20A66A; color: #ffffff; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 10px rgba(32,166,106,0.3);">
                  Accept Appointment &amp; Set Up Password &rarr;
                </a>
              </div>

              <p style="font-size: 11px; color: #5E7A70; line-height: 1.5; margin-top: 15px;">
                Direct URL fallback:<br>
                <a href="${data.invitationLink}" style="color: #20A66A; word-break: break-all;">${data.invitationLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8FBFA; border-top: 1px solid #E3ECE8; padding: 16px 30px; font-size: 10px; color: #87A196; line-height: 1.5; text-align: center;">
              <strong>National Drug Authority (NDA) Uganda Governance Notice:</strong><br>
              This notification contains administrative authority appointment credentials for the recipient ${data.recipientEmail}. If you are not the intended recipient, notify security@zenithrx.ug immediately.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateInviteEmailText(data: {
  recipientName: string;
  recipientEmail: string;
  role: string;
  domainScope: string;
  invitationLink: string;
  invitationToken: string;
  expiresAt: string;
  grantedBy: string;
  permissionsList: string[];
}): string {
  return `ZENITHRX ENTERPRISE PHARMACY MANAGEMENT SYSTEM
OFFICIAL DELEGATED ADMINISTRATIVE APPOINTMENT (§11.17)

Dear ${data.recipientName},

You have been formally appointed with delegated administrative authority on the ZenithRx Platform by ${data.grantedBy}.

APPOINTMENT SUMMARY:
- Role: ${data.role}
- Domain Scope: ${data.domainScope}
- Security Token: ${data.invitationToken}
- Valid Until: ${new Date(data.expiresAt).toLocaleDateString()}

AUTHORIZED CONTROLS & RIGHTS:
${(data.permissionsList || []).map((p) => `- ${p}`).join('\n')}

TO ACTIVATE YOUR APPOINTMENT & CREATE YOUR PASSWORD:
Open the secure link below in your browser:
${data.invitationLink}

National Drug Authority (NDA) Uganda Statutory Compliance Notice.
For assistance, contact: quantumnetworks@gmail.com`;
}

// Check Email Delivery Subsystem Status
app.get('/api/collaborators/email-status', (_req, res) => {
  const host = process.env.SMTP_HOST || (process.env.SMTP_USER?.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const user = process.env.SMTP_USER;
  const isConfigured = !!(host && user && process.env.SMTP_PASS);

  res.json({
    isConfigured,
    smtpHost: host || 'Not set (e.g. smtp.gmail.com)',
    smtpPort: process.env.SMTP_PORT || '465',
    smtpUserMasked: user ? `${user.slice(0, 3)}***@${user.split('@')[1] || 'domain'}` : 'Not set',
    smtpFrom: process.env.SMTP_FROM || 'ZenithRx Enterprise <notifications@zenithrx.ug>',
  });
});

// ─── Persistent Server Store for Delegated Collaborators ─────────────────────
const DATA_DIR_COLLABS = path.join(process.cwd(), '.data');
const COLLABORATORS_FILE = path.join(DATA_DIR_COLLABS, 'collaborators.json');

const serverCollaborators = new Map<string, any>();

function loadServerCollaborators() {
  try {
    if (fs.existsSync(COLLABORATORS_FILE)) {
      const list = JSON.parse(fs.readFileSync(COLLABORATORS_FILE, 'utf8'));
      if (Array.isArray(list)) {
        list.forEach((c) => {
          if (c.invitationToken) serverCollaborators.set(c.invitationToken, c);
          if (c.id) serverCollaborators.set(c.id, c);
          if (c.email) serverCollaborators.set(`email:${c.email.toLowerCase()}`, c);
        });
      }
    }
  } catch (err) {
    console.warn('[Collaborators] Could not read collaborators store:', err);
  }

  // Pre-seed Namuli Eng so invitation token works out of the box in all browsers
  const namuliRecord = {
    id: 'COLLAB-NAMULI',
    fullName: 'Namuli , Eng',
    email: 'namulishakirahfavour@gmail.com',
    phone: '0745193699',
    role: 'Domain Admin',
    domainScope: 'CLINICAL_OVERSIGHT',
    assignedTenants: ['ALL'],
    grantedBy: 'Arthur Ssenabulya (Platform SysAdmin)',
    grantedAt: '2026-10-20T10:00:00.000Z',
    expiresAt: '2027-01-18T23:59:59.000Z',
    status: 'INVITATION_PENDING',
    sessionTokenStatus: 'PENDING_INVITE',
    invitationToken: 'INV-NAMULI-TEST',
    permissions: {
      tenantOnboarding: false,
      tierManagement: false,
      policyConfiguration: true,
      dispensingOverrides: true,
      posSettings: false,
      aiSafetyControls: true,
      collaboratorManagement: false,
      complianceExport: true,
    },
  };
  if (!serverCollaborators.has('INV-NAMULI-TEST') && !serverCollaborators.has('email:namulishakirahfavour@gmail.com')) {
    serverCollaborators.set('INV-NAMULI-TEST', namuliRecord);
    serverCollaborators.set(namuliRecord.id, namuliRecord);
    serverCollaborators.set(`email:${namuliRecord.email.toLowerCase()}`, namuliRecord);
  }

  // Populate Quantum Engineering Registry so QuantumAdminGate accepts them immediately
  for (const c of serverCollaborators.values()) {
    const key = (c.engineeringMasterKey || c.password || 'QUANTUM-SYS-2026').trim();
    const entry = { key, password: c.password ? String(c.password).trim() : undefined, name: c.fullName, email: c.email };
    if (c.engineerId) {
      registeredQuantumEngineers.set(c.engineerId.trim(), entry);
      registeredQuantumEngineers.set(c.engineerId.trim().toUpperCase(), entry);
    }
    if (c.email) {
      registeredQuantumEngineers.set(c.email.trim().toLowerCase(), entry);
    }
  }

  // Pre-register Lead Systems Architect Dr. Arthur Ssenabulya
  registeredQuantumEngineers.set('QN-ENG-8801', {
    key: process.env.QUANTUM_ENGINEERING_MASTER_KEY || 'QUANTUM-SYS-2026',
    name: 'Dr. Arthur Ssenabulya (Lead Systems Architect)',
    email: 'arthur.ssenabulya@quantumnetworks.ug',
  });

  // Pre-register Platform System Administrator Elvis Ssekyanzi
  registeredQuantumEngineers.set('ssekyanzielvis1@gmail.com', {
    key: 'Su4at3#0',
    name: 'Elvis Ssekyanzi (Platform SysAdmin)',
    email: 'ssekyanzielvis1@gmail.com',
  });
}

function saveServerCollaborators() {
  try {
    fs.mkdirSync(DATA_DIR_COLLABS, { recursive: true });
    const unique = Array.from(new Set(serverCollaborators.values()));
    fs.writeFileSync(COLLABORATORS_FILE, JSON.stringify(unique, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Collaborators] Could not save collaborators store:', err);
  }
}

loadServerCollaborators();

// Endpoint: Lookup collaborator by invitation token or ID (enables multi-browser & incognito invite acceptance)
app.get('/api/collaborators/invite/:token', (req, res) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ success: false, error: 'Token required' });

  let found = serverCollaborators.get(token) || serverCollaborators.get(token.toUpperCase());
  if (!found) {
    for (const c of serverCollaborators.values()) {
      if (
        c.invitationToken === token ||
        c.invitationToken?.toLowerCase() === token.toLowerCase() ||
        c.id === token ||
        (token.includes('@') && c.email?.toLowerCase() === token.toLowerCase())
      ) {
        found = c;
        break;
      }
    }
  }

  if (found) {
    return res.json({ success: true, collaborator: found });
  }
  return res.status(404).json({ success: false, message: 'Invitation token not found on server' });
});

// Endpoint: Get all collaborators from server
app.get('/api/collaborators', (_req, res) => {
  const unique = Array.from(new Set(serverCollaborators.values()));
  return res.json({ success: true, collaborators: unique });
});

// ─── Supabase Admin Synchronization Engine ──────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createSupabaseClient(supabaseUrl, supabaseServiceKey) : null;

async function syncCollaboratorToSupabase(collab: any, plainPassword?: string) {
  if (!supabaseAdmin || !collab?.email) return;
  try {
    const email = collab.email.toLowerCase().trim();
    const pwd = plainPassword || collab.password || 'ZenithRx#2026Admin!';
    
    // 1. Try to create or retrieve user in auth.users
    let userId: string | null = null;
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pwd,
      email_confirm: true,
      user_metadata: {
        full_name: collab.fullName || 'Enterprise Administrator',
        role: 'Super Admin',
        is_owner: true,
        is_super_admin: true,
        domain_scope: collab.domainScope || 'FULL_PLATFORM'
      },
      app_metadata: {
        is_super_admin: true
      }
    });

    if (createData?.user?.id) {
      userId = createData.user.id;
    } else if (createError) {
      // If user already exists, retrieve ID from auth.users
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const userList = (listData?.users || []) as any[];
      const existing = userList.find((u) => u.email?.toLowerCase() === email);
      if (existing) {
        userId = existing.id;
        if (plainPassword || collab.password) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: pwd,
            email_confirm: true,
            user_metadata: {
              full_name: collab.fullName || 'Enterprise Administrator',
              role: 'Super Admin',
              is_owner: true,
              is_super_admin: true
            },
            app_metadata: {
              is_super_admin: true
            }
          });
        }
      } else {
        console.warn(`[SupabaseSync] Notice creating auth user (${email}):`, createError.message);
      }
    }

    // 2. Synchronize to public.users table
    if (userId) {
      const { error: profileError } = await supabaseAdmin.from('users').upsert({
        id: userId,
        tenant_id: '00000000-0000-0000-0000-000000000001',
        email,
        full_name: collab.fullName || 'Enterprise Administrator',
        phone: collab.phone || '',
        rank_role: 'Super Admin',
        is_owner: true,
        is_super_admin: true,
        status: 'active',
        subscription_status: 'active',
        billing_cycle: 'monthly',
        selected_tier: 'Professional',
        access_rights: {
          can_access_pos: true,
          can_manage_inventory: true,
          can_process_prescriptions: true,
          can_approve_reorders: true,
          can_view_reports: true,
          can_submit_insurance: true,
          can_use_ai_assistant: true,
          can_manage_staff_accounts: true
        }
      }, { onConflict: 'id' });

      if (profileError) {
        console.warn(`[SupabaseSync] Notice syncing public.users profile (${email}):`, profileError.message);
      } else {
        console.log(`[SupabaseSync] Successfully synced administrator ${email} to auth.users and public.users`);
      }
    }
  } catch (err: any) {
    console.warn(`[SupabaseSync] Background sync exception for ${collab?.email}:`, err?.message || err);
  }
}

// Endpoint: Sync collaborator from client into persistent server store
app.post('/api/collaborators/sync', (req, res) => {
  const { collaborator } = req.body;
  if (collaborator && (collaborator.invitationToken || collaborator.id)) {
    if (collaborator.invitationToken) serverCollaborators.set(collaborator.invitationToken, collaborator);
    if (collaborator.id) serverCollaborators.set(collaborator.id, collaborator);
    if (collaborator.email) serverCollaborators.set(`email:${collaborator.email.toLowerCase()}`, collaborator);
    saveServerCollaborators();

    // Trigger background sync to Supabase auth.users & public.users
    syncCollaboratorToSupabase(collaborator, collaborator.password).catch(() => {});
  }
  return res.json({ success: true });
});

// Endpoint: Authenticate Delegated Administrator by Email & Password (used by AdminLoginPage)
app.post('/api/collaborators/login', (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const password = (req.body?.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  let found = serverCollaborators.get(`email:${email}`);
  if (!found) {
    for (const c of serverCollaborators.values()) {
      if (c.email?.toLowerCase() === email) {
        found = c;
        break;
      }
    }
  }

  if (!found) {
    return res.status(401).json({ success: false, message: 'Invalid administrator email or password.' });
  }

  if (found.status === 'REVOKED') {
    return res.status(403).json({ success: false, message: 'This administrative account has been revoked.' });
  }

  // Check password or master key
  let passwordMatches = false;
  if (found.password) {
    passwordMatches =
      found.password === password ||
      (found.engineeringMasterKey && found.engineeringMasterKey.trim() === password);
  } else {
    // Adopt and lock in the password entered by the administrator
    found.password = password;
    found.passwordSet = true;
    found.status = 'ACTIVE';
    found.sessionTokenStatus = 'VALID';
    saveServerCollaborators();
    passwordMatches = true;
  }

  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid administrator email or password.' });
  }

  // Register in server memory for QuantumAdminGate
  if (found.engineerId && found.engineeringMasterKey) {
    registeredQuantumEngineers.set(found.engineerId.trim(), {
      key: found.engineeringMasterKey.trim(),
      name: found.fullName,
      email: found.email,
    });
    registeredQuantumEngineers.set(found.engineerId.trim().toUpperCase(), {
      key: found.engineeringMasterKey.trim(),
      name: found.fullName,
      email: found.email,
    });
  }

  // Sync administrator profile to Supabase auth.users & public.users
  syncCollaboratorToSupabase(found, password).catch(() => {});

  const token = signToken({ sub: found.id || found.email, role: 'quantum_admin', name: found.fullName }, 12 * 3600);
  return res.json({
    success: true,
    collaborator: found,
    token,
    message: 'Administrator authentication successful.',
  });
});

// Endpoint: Send Collaborator Invite Email via SMTP or format client link
app.post('/api/collaborators/send-invite-email', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName = 'Collaborator',
      role = 'Domain Admin',
      domainScope = 'CLINICAL_OVERSIGHT',
      invitationLink,
      invitationToken,
      expiresAt = new Date(Date.now() + 90 * 86400000).toISOString(),
      grantedBy = 'Dr. Arthur Ssenabulya (Platform SysAdmin)',
      permissionsList = [],
      subject: customSubject,
    } = req.body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid recipientEmail is required' });
    }

    const effectiveInvitationLink = invitationLink || `http://localhost:${PORT}/#accept-invite?token=${invitationToken || 'INV-TOKEN'}`;
    const subject = customSubject || `[ZenithRx Enterprise] Official Appointment: Delegated ${role} (${domainScope})`;

    // Persist this collaborator on the server so ANY browser opening the link finds it immediately
    const collabRecord = {
      id: req.body.id || `COLLAB-${Date.now().toString().slice(-4)}`,
      fullName: recipientName,
      email: recipientEmail,
      phone: req.body.phone || '',
      role,
      domainScope,
      assignedTenants: req.body.assignedTenants || ['ALL'],
      grantedBy,
      grantedAt: req.body.grantedAt || new Date().toISOString(),
      expiresAt,
      status: 'INVITATION_PENDING',
      sessionTokenStatus: 'PENDING_INVITE',
      invitationToken: invitationToken || 'INV-TOKEN',
      invitationSentAt: new Date().toISOString(),
      permissions: req.body.permissions || {},
    };
    if (invitationToken) serverCollaborators.set(invitationToken, collabRecord);
    serverCollaborators.set(collabRecord.id, collabRecord);
    serverCollaborators.set(`email:${recipientEmail.toLowerCase()}`, collabRecord);
    saveServerCollaborators();
    syncCollaboratorToSupabase(collabRecord).catch(() => {});

    const emailHtml = generateInviteEmailHtml({
      recipientName,
      recipientEmail,
      role,
      domainScope,
      invitationLink: effectiveInvitationLink,
      invitationToken: invitationToken || 'INV-SECURE',
      expiresAt,
      grantedBy,
      permissionsList,
    });

    const emailText = generateInviteEmailText({
      recipientName,
      recipientEmail,
      role,
      domainScope,
      invitationLink: effectiveInvitationLink,
      invitationToken: invitationToken || 'INV-SECURE',
      expiresAt,
      grantedBy,
      permissionsList,
    });

    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailText)}`;
    const transporter = getMailTransporter();

    if (!transporter) {
      console.warn(`[Collaborator Email] SMTP credentials not found in .env. Invitation prepared for ${recipientEmail}.`);
      return res.json({
        success: true,
        delivered: false,
        deliveryMethod: 'PENDING_SMTP_CONFIG',
        message: 'SMTP credentials (SMTP_USER, SMTP_PASS) are not yet configured in .env. The invitation is active and ready for 1-click dispatch via your mail client or clipboard.',
        recipientEmail,
        invitationLink: effectiveInvitationLink,
        invitationToken,
        mailtoLink,
        subject,
      });
    }

    const fromAddress = process.env.SMTP_FROM || `"${grantedBy}" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      text: emailText,
      html: emailHtml,
    });

    console.log(`[Collaborator Email] Successfully delivered invitation to ${recipientEmail} via SMTP (MessageId: ${info.messageId})`);

    return res.json({
      success: true,
      delivered: true,
      deliveryMethod: 'SMTP',
      messageId: info.messageId,
      recipientEmail,
      invitationLink: effectiveInvitationLink,
      invitationToken,
      mailtoLink,
      subject,
    });
  } catch (err: any) {
    console.error('[Collaborator Email] SMTP dispatch error:', err);
    const textFallback = req.body?.invitationLink || '';
    const mailto = `mailto:${req.body?.recipientEmail}?subject=${encodeURIComponent('ZenithRx Appointment')}&body=${encodeURIComponent(textFallback)}`;
    return res.json({
      success: false,
      delivered: false,
      deliveryMethod: 'SMTP_FAILED',
      error: err?.message || 'SMTP server connection rejected',
      recipientEmail: req.body?.recipientEmail,
      invitationLink: req.body?.invitationLink,
      mailtoLink: mailto,
    });
  }
});

// ─── Outbound Quantum Networks Level-5 Root Credentials Dispatch ────────────
function generateQuantumCredentialsEmailHtml(data: {
  recipientName: string;
  recipientEmail: string;
  engineerId: string;
  engineeringMasterKey: string;
  role: string;
  domainScope: string;
  consoleUrl: string;
  grantedBy: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quantum Networks System Engineering Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07101B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #07101B; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0C1829; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); max-width: 600px; width: 100%;">
          
          <!-- Quantum Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #07121F 0%, #0E2439 100%); padding: 30px; border-bottom: 1px solid #1E3A5F; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); border-radius: 9999px; font-size: 10px; font-weight: 800; color: #38BDF8; text-transform: uppercase; letter-spacing: 1px;">
                      QUANTUM NETWORKS LTD · LEVEL 5 ROOT
                    </span>
                    <h1 style="margin: 12px 0 4px 0; font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                      System Engineering Console Credentials
                    </h1>
                    <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                      Official Administrative Credentials Issued for <strong>${data.recipientName}</strong>
                    </p>
                  </td>
                  <td align="right" valign="top" style="width: 80px;">
                    <div style="background-color: #0369A1; color: #FFFFFF; font-size: 10px; font-family: monospace; font-weight: bold; padding: 5px 10px; border-radius: 8px; text-align: center;">
                      ROOT_ADMIN
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Statement -->
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <div style="background-color: #0B1E33; border: 1px solid #164E63; border-radius: 12px; padding: 14px 18px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #38BDF8;">
                  Restricted to Authorized System Engineering Personnel
                </p>
                <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94A3B8;">
                  Your password creation was successfully validated. Below are your unique Level-5 Root credentials generated via the <strong>256-Bit CSPRNG Quantum Entropy Engine</strong>. These credentials grant administrative authority to govern multi-tenant pharmacies, approvals, dispensing quotas, and collaborator privileges.
                </p>
              </div>
            </td>
          </tr>

          <!-- Credentials Box -->
          <tr>
            <td style="padding: 15px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050B14; border: 1px solid #1E293B; border-radius: 14px; padding: 20px;">
                
                <!-- Credential 1: Engineer ID -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <span style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      QUANTUM NETWORKS ENGINEER ID
                    </span>
                    <div style="background-color: #0B1523; border: 1px solid #0EA5E9; border-radius: 10px; padding: 12px 16px; font-family: monospace; font-size: 16px; font-weight: 900; color: #38BDF8; letter-spacing: 1.5px;">
                      ${data.engineerId}
                    </div>
                  </td>
                </tr>

                <!-- Credential 2: Master Authorization Key -->
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      ENGINEERING AUTHORIZATION MASTER KEY
                    </span>
                    <div style="background-color: #0B1523; border: 1px solid #10B981; border-radius: 10px; padding: 12px 16px; font-family: monospace; font-size: 14px; font-weight: 800; color: #34D399; letter-spacing: 1px; word-break: break-all;">
                      ${data.engineeringMasterKey}
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 15px 30px 25px 30px; text-align: center;">
              <a href="${data.consoleUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 800; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                Authenticate in System Engineering Console &rarr;
              </a>
              <p style="margin: 14px 0 0 0; font-size: 11px; color: #64748B;">
                Direct Console URL: <span style="font-family: monospace; color: #94A3B8;">${data.consoleUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer Statutory Notice -->
          <tr>
            <td style="background-color: #060D17; border-top: 1px solid #1E293B; padding: 18px 30px; font-size: 10px; color: #64748B; line-height: 1.5; text-align: center;">
              <strong>Confidentiality Notice:</strong> This electronic transmission contains restricted Level-5 Root administrative credentials issued under National Drug Authority (NDA) statutory oversight (§11.17). Unauthorized transmission or possession is strictly prohibited.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateQuantumCredentialsEmailText(data: {
  recipientName: string;
  recipientEmail: string;
  engineerId: string;
  engineeringMasterKey: string;
  role: string;
  domainScope: string;
  consoleUrl: string;
  grantedBy: string;
}): string {
  return `QUANTUM NETWORKS LTD · LEVEL 5 ROOT CLEARANCE
SYSTEM ENGINEERING CONSOLE CREDENTIALS

Recipient: ${data.recipientName} (${data.recipientEmail})
Designated Role: ${data.role} (${data.domainScope})
Granted By: ${data.grantedBy}

Your administrative password creation was successfully validated. Below are your official Quantum Networks System Engineering Console credentials generated via 256-Bit CSPRNG Quantum Entropy:

============================================================
1. QUANTUM NETWORKS ENGINEER ID:
   ${data.engineerId}

2. ENGINEERING AUTHORIZATION MASTER KEY:
   ${data.engineeringMasterKey}
============================================================

TO ENTER THE SYSTEM ENGINEERING CONSOLE:
1. Open the console link in your browser:
   ${data.consoleUrl}
2. Enter your Engineer ID: ${data.engineerId}
3. Enter your Master Authorization Key: ${data.engineeringMasterKey}
4. Click "Authenticate as Quantum Systems Engineer" to access the Root Administrator Control Plane.

National Drug Authority (NDA) Uganda Governance Standard §11.17.
Confidential engineering dispatch by Quantum Networks Ltd.`;
}

// Endpoint: Send Quantum Engineering Console Credentials to Collaborator Email
app.post('/api/collaborators/send-quantum-credentials', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName = 'System Administrator',
      engineerId,
      engineeringMasterKey,
      role = 'Super Admin',
      domainScope = 'FULL_PLATFORM',
      grantedBy = 'Platform Administrator',
      consoleUrl: rawConsoleUrl,
    } = req.body;

    if (!recipientEmail || !engineerId || !engineeringMasterKey) {
      return res.status(400).json({ success: false, error: 'recipientEmail, engineerId, and engineeringMasterKey are required' });
    }

    registeredQuantumEngineers.set(engineerId.trim(), {
      key: engineeringMasterKey.trim(),
      name: recipientName,
      email: recipientEmail,
    });
    registeredQuantumEngineers.set(engineerId.trim().toUpperCase(), {
      key: engineeringMasterKey.trim(),
      name: recipientName,
      email: recipientEmail,
    });

    // Update persistent collaborator record on server
    const existingCollab =
      serverCollaborators.get(engineerId) ||
      serverCollaborators.get(`email:${recipientEmail.toLowerCase()}`);
    if (existingCollab) {
      existingCollab.status = 'ACTIVE';
      existingCollab.sessionTokenStatus = 'VALID';
      existingCollab.engineerId = engineerId.trim();
      existingCollab.engineeringMasterKey = engineeringMasterKey.trim();
      existingCollab.quantumCredentialsGeneratedAt = new Date().toISOString();
      saveServerCollaborators();
    }

    const origin = req.headers.origin || `http://localhost:${PORT}`;
    const consoleUrl = rawConsoleUrl || `${origin}/#admin`;
    const subject = `[RESTRICTED] Quantum Networks System Engineering Credentials — Level 5 Root Access Issued (${engineerId})`;

    const emailHtml = generateQuantumCredentialsEmailHtml({
      recipientName,
      recipientEmail,
      engineerId,
      engineeringMasterKey,
      role,
      domainScope,
      consoleUrl,
      grantedBy,
    });

    const emailText = generateQuantumCredentialsEmailText({
      recipientName,
      recipientEmail,
      engineerId,
      engineeringMasterKey,
      role,
      domainScope,
      consoleUrl,
      grantedBy,
    });

    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailText)}`;
    const transporter = getMailTransporter();

    if (!transporter) {
      console.warn(`[Quantum Credentials Email] SMTP not configured in .env. Credentials registered in server memory for ${recipientEmail} (${engineerId}).`);
      return res.json({
        success: true,
        delivered: false,
        deliveryMethod: 'PENDING_SMTP_CONFIG',
        message: 'Quantum credentials registered in server memory and ready for 1-click mail client dispatch.',
        recipientEmail,
        engineerId,
        engineeringMasterKey,
        consoleUrl,
        mailtoLink,
        subject,
      });
    }

    const fromAddress = process.env.SMTP_FROM || `"${grantedBy}" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      text: emailText,
      html: emailHtml,
    });

    console.log(`[Quantum Credentials Email] Successfully delivered credentials to ${recipientEmail} via SMTP (MessageId: ${info.messageId})`);

    return res.json({
      success: true,
      delivered: true,
      deliveryMethod: 'SMTP',
      messageId: info.messageId,
      recipientEmail,
      engineerId,
      engineeringMasterKey,
      consoleUrl,
      mailtoLink,
      subject,
    });
  } catch (err: any) {
    console.error('[Quantum Credentials Email] SMTP dispatch error:', err);
    return res.json({
      success: false,
      delivered: false,
      deliveryMethod: 'SMTP_FAILED',
      error: err?.message || 'SMTP delivery failed',
    });
  }
});

// AI Endpoint: Parse Prescription (OCR / Image or Text Analysis)
app.post('/api/ai/parse-prescription', async (req, res) => {
  try {
    const { imageBase64, textContent } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
        fallback: true,
      });
    }

    const prompt = `You are Quantum RxAI, an expert clinical pharmacy assistant operating inside the ZenithRx Pharmacy Management System.
Analyze the provided prescription (image or handwritten/typed text notes) and extract structured medication information accurately.
Return JSON with patient info (name, age, gender, phone), doctor info (name, licence, hospital), prescribed medications list (drug name, dosage, frequency, duration, quantity), clinical notes, and any safety warnings.`;

    const parts: any[] = [];
    if (imageBase64) {
      // Remove data url prefix if exists
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    if (textContent) {
      parts.push({ text: `Prescription notes / text: ${textContent}` });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: parts.length === 1 ? parts[0].text : { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName:   { type: Type.STRING },
            patientAge:    { type: Type.STRING },
            patientGender: { type: Type.STRING },   // "Male" | "Female"
            patientPhone:  { type: Type.STRING },
            doctorName:    { type: Type.STRING },
            doctorLicence: { type: Type.STRING },
            hospitalName:  { type: Type.STRING },
            diagnosis:     { type: Type.STRING },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  drugName:            { type: Type.STRING },
                  dosage:              { type: Type.STRING },
                  frequency:           { type: Type.STRING },
                  duration:            { type: Type.STRING },
                  quantity:            { type: Type.INTEGER },
                  instructions:        { type: Type.STRING },
                  substitutionAllowed: { type: Type.BOOLEAN },
                },
                required: ['drugName', 'dosage', 'frequency', 'duration', 'instructions'],
              },
            },
            clinicalNotes: { type: Type.STRING },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['patientName', 'medications'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Prescription parsing error:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse prescription' });
  }
});

// AI Endpoint: Clinical Drug Interaction & Allergy Checker
app.post('/api/ai/drug-check', async (req, res) => {
  try {
    const { medications, patientAllergies, conditions } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API Key missing' });
    }

    const prompt = `Act as Quantum Pharma-Cash Clinical AI Engine. Analyze these medications and patient health factors for potential interactions or risks:
Medications: ${JSON.stringify(medications)}
Patient Known Allergies: ${patientAllergies || 'None listed'}
Medical Conditions: ${conditions || 'None listed'}

Evaluate:
1. Drug-Drug Interactions (Major, Moderate, Minor)
2. Allergy warnings
3. Dosing frequency sanity check
4. Clinical recommendations for dispensing pharmacist`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskLevel: { type: Type.STRING }, // LOW, MEDIUM, HIGH, CRITICAL
            summary: { type: Type.STRING },
            interactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING },
                  drugsInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                  description: { type: Type.STRING },
                  actionRequired: { type: Type.STRING },
                },
              },
            },
            allergyAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['overallRiskLevel', 'summary', 'interactions'],
        },
      },
    });

    const jsonText = response.text || '{}';
    return res.json({ success: true, analysis: JSON.parse(jsonText) });
  } catch (err: any) {
    console.error('Drug check error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// AI Endpoint: Clinical Patient Counseling
app.post('/api/ai/counseling', async (req, res) => {
  try {
    const { drugName, patientName, dosage } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API Key missing' });
    }

    const prompt = `Act as Quantum Pharma-Cash Clinical AI Engine. Provide a patient counseling leaflet for:
Patient: ${patientName || 'Patient'}
Medication: ${drugName || 'Unknown Medication'}
Dosage: ${dosage || 'As directed'}

Format the response as plain text (minimal markdown) with the following sections clearly labeled:
1. How to Take
2. Food & Drink
3. Missed Dose
4. Side Effects to Monitor
5. Storage`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    
    const text = response.text || '';
    return res.json({ success: true, counselingText: text });
  } catch (err: any) {
    console.error('Counseling error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// AI Endpoint: Quantum RxAI Patient Copilot (Triage, Medication Q&A, What to do when stuck)
app.post('/api/ai/patient-copilot', async (req, res) => {
  try {
    const { message, history = [], patientContext = {}, conversationId } = req.body;
    const ai = getAIClient();

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!ai) {
      return res.status(503).json({
        fallback: true,
        reply: "I am currently in offline mode. For urgent clinical assistance or questions about your medicines, please speak directly to your licensed on-duty pharmacist via the Teleconsult tab or visit your nearest pharmacy branch.",
        triageLevel: "ROUTINE",
        immediateAction: "Contact on-duty pharmacist directly.",
        suggestedQuickReplies: ["Book Pharmacist Teleconsult", "Find Nearest Pharmacy", "View Health Articles"]
      });
    }

    const systemInstructions = `You are Quantum RxAI Patient Copilot, the AI Clinical Health Assistant embedded in the ZenithRx Pharmacy Management System in Uganda.
Your primary role is to assist patients when they are confused, stuck, or need guidance on:
1. How and when to take medications (missed doses, food/drink restrictions).
2. Understanding prescription instructions and deciphering medical abbreviations.
3. Checking if medications can be taken together safely or if side effects are expected.
4. Triaging symptoms (distinguishing routine mild effects from urgent medical emergencies).
5. Offering plain English or Luganda phrasing when requested.

CRITICAL CLINICAL BOUNDARIES & SAFETY RULES:
- Never diagnose disease or prescribe controlled substances.
- Always provide clear, compassionate, and step-by-step guidance.
- If symptoms indicate an emergency (e.g., chest pain radiating to arm, anaphylaxis, severe breathing difficulty, sudden facial droop, severe drug overdose), set triageLevel to 'URGENT_EMERGENCY' and instruct the patient to call emergency services or go to the nearest emergency ward immediately.
- If symptoms suggest a drug interaction, allergic rash, or dosage ambiguity, set triageLevel to 'PHARMACIST_CONSULT_RECOMMENDED' and encourage booking a teleconsultation with a licensed pharmacist.
- Otherwise, set triageLevel to 'ROUTINE'.`;

    const contextPrompt = `Patient Context:
- Full Name: ${patientContext.name || 'Patient'}
- Age: ${patientContext.age || 'Not specified'}
- Known Allergies: ${patientContext.allergies?.join(', ') || 'None reported'}
- Active Medications: ${patientContext.activeMedications?.join(', ') || 'None active'}
- Chronic Conditions: ${patientContext.chronicConditions?.join(', ') || 'None'}

Conversation History:
${history.map((h: any) => `${h.sender === 'patient' ? 'Patient' : 'AI'}: ${h.content || h.text}`).join('\n')}

Current Patient Message: "${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${systemInstructions}\n\n${contextPrompt}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            triageLevel: {
              type: Type.STRING,
              description: "Must be 'ROUTINE', 'PHARMACIST_CONSULT_RECOMMENDED', or 'URGENT_EMERGENCY'"
            },
            reply: {
              type: Type.STRING,
              description: "Warm, clinically accurate, and easily understandable guidance for the patient with Markdown support."
            },
            immediateAction: {
              type: Type.STRING,
              description: "Concise 1-2 sentence actionable step the patient should take right now."
            },
            emergencyAlert: {
              type: Type.BOOLEAN,
              description: "True if urgent emergency attention is required."
            },
            suggestedQuickReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 to 4 recommended follow-up questions or action buttons."
            }
          },
          required: ['triageLevel', 'reply', 'immediateAction', 'emergencyAlert', 'suggestedQuickReplies']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');

    // Optionally log into Supabase for clinical audit & continuity
    const sb = getSupabaseAdmin();
    if (sb && patientContext.patientId) {
      try {
        let convId = conversationId;
        if (!convId) {
          const { data: conv } = await sb.from('patient_ai_conversations').insert({
            patient_id: patientContext.patientId,
            session_title: message.slice(0, 50),
            triage_status: parsed.triageLevel || 'ROUTINE',
          }).select('id').single();
          convId = conv?.id;
        }

        if (convId) {
          await sb.from('patient_ai_messages').insert([
            { conversation_id: convId, sender: 'patient', content: message },
            { conversation_id: convId, sender: 'assistant', content: parsed.reply, triage_payload: parsed }
          ]);
        }
      } catch (logErr) {
        console.warn('[AI Log] Failed to persist AI message:', logErr);
      }
    }

    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Patient copilot error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate AI response' });
  }
});

// ─── Master Medicines & High-Fidelity Medicine Cards API ──────────────────────

// Master medicine seed list for instant zero-dependency backend serving & Supabase fallback
const SEED_MASTER_MEDICINES = [
  {
    id: 'med-salb-inh-100',
    brandName: 'Ventolin Evohaler 100mcg',
    genericName: 'Salbutamol',
    genericInnName: 'Salbutamol Sulfate',
    category: 'Respiratory',
    therapeuticClass: 'Short-Acting Beta-2 Adrenergic Agonist (SABA)',
    ndaRegistrationNumber: 'NDA/MAL/0192/2018',
    form: 'Inhaler',
    dosageForm: 'Pressurized Metered Dose Inhaler (pMDI)',
    strength: '100mcg / puff (200 actuations)',
    route: 'Inhalation',
    packageSize: '1 Inhaler Canister in Plastic Actuator with Blue Dust Cap (200 Doses)',
    manufacturer: 'Glaxo Wellcome / GSK',
    countryOfManufacture: 'UK',
    prescriptionStatus: 'POM',
    suggestedRetailPriceUgx: 25000,
    averageWholesalePriceUgx: 18000,
    standardDoseAdult: '1 to 2 inhalations (100-200mcg) every 4-6 hours for acute relief of bronchospasm.',
    adultDosageInstruction: '1 to 2 inhalations (100-200mcg) every 4–6 hours for acute relief of bronchospasm.',
    actuationsOrPackInfo: '100mcg / puff (200 actuations)',
    imageUrl: '/medicines/ventolin_evohaler.jpg',
    highlights: [
      { icon: 'lungs', title: 'Rapid Relief', subtitle: 'for bronchospasm' },
      { icon: 'clock', title: 'Long-Lasting', subtitle: 'up to 4–6 hours' },
      { icon: 'shield', title: 'Trusted Brand', subtitle: 'GSK' },
      { icon: 'device', title: 'Easy to Use', subtitle: 'Metered dose inhaler' },
    ],
    verifiedByNda: true,
    isActive: true,
  },
  {
    id: 'med-para-tab-500',
    brandName: 'Panadol Extra 500mg',
    genericName: 'Paracetamol',
    genericInnName: 'Paracetamol (Acetaminophen)',
    category: 'Analgesics & Antipyretics',
    therapeuticClass: 'Aniline Derivative Analgesic / CNS Stimulant',
    ndaRegistrationNumber: 'NDA/MAL/0411/2020',
    form: 'Film-Coated Tablet',
    dosageForm: 'Film-Coated Tablet',
    strength: '500mg / 65mg',
    route: 'Oral',
    packageSize: 'Box of 100 Tablets (10x10 Blister Pack)',
    manufacturer: 'GlaxoSmithKline (GSK)',
    countryOfManufacture: 'Kenya',
    prescriptionStatus: 'OTC',
    suggestedRetailPriceUgx: 35000,
    averageWholesalePriceUgx: 200,
    standardDoseAdult: '1 to 2 tablets (500mg - 1000mg) every 4-6 hours as needed. Max 4000mg/24h.',
    adultDosageInstruction: '1 to 2 tablets (500mg - 1000mg) every 4-6 hours as needed for pain & fever. Max 4000mg/24h.',
    actuationsOrPackInfo: '500mg / 65mg (Box of 100 Tablets)',
    imageUrl: '/medicines/panadol_extra.jpg',
    highlights: [
      { icon: 'zap', title: 'Rapid Relief', subtitle: 'Targeted extra strength' },
      { icon: 'clock', title: 'Fast Acting', subtitle: 'Starts in 15–30 min' },
      { icon: 'shield', title: 'Trusted Brand', subtitle: 'GSK' },
      { icon: 'pill', title: 'Easy to Swallow', subtitle: 'Film-coated tablets' },
    ],
    verifiedByNda: true,
    isActive: true,
  },
  {
    id: 'med-amox-tab-625',
    brandName: 'Augmentin 625mg',
    genericName: 'Co-Amoxiclav',
    genericInnName: 'Amoxicillin + Clavulanic Acid',
    category: 'Antibiotics',
    therapeuticClass: 'Beta-lactamase inhibitor combination',
    ndaRegistrationNumber: 'NDA/MAL/0891/2021',
    form: 'Film-Coated Tablet',
    dosageForm: 'Oval Film-Coated Tablet',
    strength: '625mg (500mg/125mg)',
    route: 'Oral',
    packageSize: 'Box of 14 Tablets (2x7 Foil Blister)',
    manufacturer: 'SmithKline Beecham / GSK',
    countryOfManufacture: 'UK',
    prescriptionStatus: 'POM',
    suggestedRetailPriceUgx: 35000,
    averageWholesalePriceUgx: 2200,
    standardDoseAdult: '1 tablet (625mg) every 12 hours (BD) or 1 tablet every 8 hours (TDS) for severe infections.',
    adultDosageInstruction: '1 tablet (625mg) every 12 hours (BD) at start of meal for bacterial infections.',
    actuationsOrPackInfo: '625mg (14 Film-Coated Tablets)',
    imageUrl: '/medicines/augmentin_625.jpg',
    highlights: [
      { icon: 'shield', title: 'Broad Spectrum', subtitle: 'Pathogen eradication' },
      { icon: 'zap', title: 'Potent Action', subtitle: 'Beta-lactamase resistant' },
      { icon: 'shield', title: 'Trusted Brand', subtitle: 'GSK' },
      { icon: 'pill', title: 'Protected Foil', subtitle: 'Desiccant moisture seal' },
    ],
    verifiedByNda: true,
    isActive: true,
  },
  {
    id: 'med-para-susp-120',
    brandName: 'Calpol Infant Suspension 120mg/5ml',
    genericName: 'Paracetamol',
    genericInnName: 'Paracetamol (Acetaminophen)',
    category: 'Analgesics & Antipyretics',
    therapeuticClass: 'Aniline Derivative Pediatric Analgesic',
    ndaRegistrationNumber: 'NDA/MAL/0198/2019',
    form: 'Oral Suspension',
    dosageForm: 'Oral Suspension (Strawberry Flavor)',
    strength: '120mg / 5mL',
    route: 'Oral',
    packageSize: '100 mL Amber Glass Bottle with 5mL Double-Ended Syringe',
    manufacturer: 'GlaxoSmithKline (GSK)',
    countryOfManufacture: 'UK',
    prescriptionStatus: 'OTC',
    suggestedRetailPriceUgx: 12000,
    averageWholesalePriceUgx: 8500,
    standardDoseAdult: 'Use tablet formulation for adults.',
    adultDosageInstruction: 'Pediatric formulation: 2.5mL to 10mL based on age/weight with included syringe.',
    actuationsOrPackInfo: '120mg / 5mL (100 mL Bottle)',
    imageUrl: '/medicines/calpol_suspension.jpg',
    highlights: [
      { icon: 'heart', title: 'Gentle on Tummy', subtitle: 'Pediatric formula' },
      { icon: 'clock', title: 'Up to 6 Hours', subtitle: 'Fever & pain control' },
      { icon: 'shield', title: 'Trusted Brand', subtitle: 'GSK / Calpol' },
      { icon: 'device', title: 'Easy to Use', subtitle: 'Measuring syringe' },
    ],
    verifiedByNda: true,
    isActive: true,
  },
  {
    id: 'med-artem-tab-20-120',
    brandName: 'Coartem 20/120mg Dispersible',
    genericName: 'Artemether / Lumefantrine',
    genericInnName: 'Artemether + Lumefantrine',
    category: 'Antimalarials',
    therapeuticClass: 'Artemisinin-based Combination Therapy (ACT)',
    ndaRegistrationNumber: 'NDA/MAL/0710/2019',
    form: 'Tablet',
    dosageForm: 'Sweetened Dispersible Tablet',
    strength: '20mg / 120mg',
    route: 'Oral',
    packageSize: 'Box of 24 Dispersible Tablets (4x6 Blister Pack for 25-35kg)',
    manufacturer: 'Novartis Pharma AG / Cipla Quality Chemicals Uganda',
    countryOfManufacture: 'Uganda',
    prescriptionStatus: 'POM',
    suggestedRetailPriceUgx: 22000,
    averageWholesalePriceUgx: 14000,
    standardDoseAdult: 'Standard 6-dose regimen over 3 days (1-4 tablets per dose based on body weight).',
    adultDosageInstruction: 'Standard 6-dose regimen over 3 days (1-4 tablets per dose based on body weight).',
    actuationsOrPackInfo: '20/120mg (24 Dispersible Tablets)',
    imageUrl: '/medicines/coartem.jpg',
    highlights: [
      { icon: 'zap', title: 'Rapid Action', subtitle: 'Clears malaria parasites' },
      { icon: 'clock', title: '3-Day Course', subtitle: 'Full 6-dose cure' },
      { icon: 'shield', title: 'Gold Standard', subtitle: 'Novartis / CQCL' },
      { icon: 'pill', title: 'Dispersible', subtitle: 'Cherry flavored' },
    ],
    verifiedByNda: true,
    isActive: true,
  },
];

// Query all master medicines with filter support
app.get('/api/medicines', async (req, res) => {
  try {
    const { search, category, limit } = req.query;
    const sb = getSupabaseAdmin();

    let medicines = [...SEED_MASTER_MEDICINES];

    if (sb) {
      try {
        let query = sb.from('master_medicines_v2').select('*');
        if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
          query = query.ilike('therapeutic_category', `%${category}%`);
        }
        if (search && typeof search === 'string') {
          query = query.or(`brand_name.ilike.%${search}%,generic_name.ilike.%${search}%,generic_inn_name.ilike.%${search}%`);
        }
        if (limit) {
          query = query.limit(Number(limit));
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          medicines = data.map((d: any) => ({
            id: d.id,
            brandName: d.brand_name,
            genericName: d.generic_name || d.generic_inn_name,
            genericInnName: d.generic_inn_name,
            category: d.therapeutic_category,
            therapeuticClass: d.therapeutic_class || d.therapeutic_category || 'General Therapeutic',
            ndaRegistrationNumber: d.nda_registration_number,
            form: d.dosage_form || d.form,
            dosageForm: d.dosage_form || d.form || 'Standard Unit',
            strength: d.strength,
            route: d.route_of_administration,
            packageSize: d.package_size,
            manufacturer: d.manufacturer_name,
            countryOfManufacture: d.country_of_manufacture,
            prescriptionStatus: d.prescription_status?.toUpperCase() || 'POM',
            suggestedRetailPriceUgx: Number(d.suggested_retail_price_ugx) || 25000,
            averageWholesalePriceUgx: Number(d.average_wholesale_price_ugx) || 15000,
            standardDoseAdult: d.adult_standard_dose,
            adultDosageInstruction: d.adult_dosage_instruction || d.adult_standard_dose,
            actuationsOrPackInfo: d.actuations_or_pack_info || d.strength,
            imageUrl: d.image_url || '/medicines/ventolin_evohaler.jpg',
            highlights: d.highlights || [],
            verifiedByNda: d.is_nda_verified ?? true,
            isActive: d.status === 'active',
          }));
        }
      } catch (sbErr) {
        console.warn('[DB] Supabase query fallback to in-memory catalogue:', sbErr);
      }
    }

    // Filter in-memory if Supabase was bypassed or fallback
    let filtered = medicines;
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.brandName.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }
    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
      filtered = filtered.filter((m) => m.category.toLowerCase().includes(category.toLowerCase()));
    }

    return res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err: any) {
    console.error('[API] /api/medicines error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch medicines' });
  }
});

// Single medicine endpoint
app.get('/api/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sb = getSupabaseAdmin();

    if (sb) {
      try {
        const { data, error } = await sb.from('master_medicines_v2').select('*').eq('id', id).single();
        if (!error && data) {
          return res.json({
            success: true,
            data: {
              id: data.id,
              brandName: data.brand_name,
              genericName: data.generic_name || data.generic_inn_name,
              category: data.therapeutic_category,
              ndaRegistrationNumber: data.nda_registration_number,
              form: data.dosage_form || data.form,
              strength: data.strength,
              route: data.route_of_administration,
              packageSize: data.package_size,
              manufacturer: data.manufacturer_name,
              suggestedRetailPriceUgx: Number(data.suggested_retail_price_ugx) || 25000,
              standardDoseAdult: data.adult_standard_dose,
              adultDosageInstruction: data.adult_dosage_instruction || data.adult_standard_dose,
              actuationsOrPackInfo: data.actuations_or_pack_info || data.strength,
              imageUrl: data.image_url || '/medicines/ventolin_evohaler.jpg',
              highlights: data.highlights || [],
              verifiedByNda: data.is_nda_verified ?? true,
            },
          });
        }
      } catch (err) {
        // Fallback
      }
    }

    const item = SEED_MASTER_MEDICINES.find((m) => m.id === id || m.brandName.toLowerCase().includes(id.toLowerCase()));
    if (!item) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    return res.json({ success: true, data: item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Live branch availability for a specific medicine
app.get('/api/medicines/:id/branches', async (req, res) => {
  try {
    const { id } = req.params;
    const med = SEED_MASTER_MEDICINES.find((m) => m.id === id || m.brandName.toLowerCase().includes(id.toLowerCase())) || SEED_MASTER_MEDICINES[0];

    const branches = [
      {
        pharmacyId: 'pharma-001',
        pharmacyName: 'Kampala City Pharmacy',
        district: 'Kampala Central',
        address: 'Plot 14 Nakasero Road, Kampala',
        distanceKm: 0.8,
        stockUnits: 142,
        unitPriceUgx: med.suggestedRetailPriceUgx,
        status: 'In Stock',
        canHold: true,
        phone: '+256 700 000001',
      },
      {
        pharmacyId: 'pharma-002',
        pharmacyName: 'Entebbe Airport Gateway Pharmacy',
        district: 'Wakiso / Entebbe',
        address: 'Portal Road Commercial Complex, Entebbe',
        distanceKm: 34.2,
        stockUnits: 48,
        unitPriceUgx: med.suggestedRetailPriceUgx,
        status: 'In Stock',
        canHold: true,
        phone: '+256 700 000002',
      },
      {
        pharmacyId: 'pharma-003',
        pharmacyName: 'Jinja Nile Crest Pharmacy',
        district: 'Jinja',
        address: 'Main Street, Jinja City',
        distanceKm: 81.5,
        stockUnits: 25,
        unitPriceUgx: med.suggestedRetailPriceUgx,
        status: 'In Stock',
        canHold: true,
        phone: '+256 700 000003',
      },
      {
        pharmacyId: 'pharma-004',
        pharmacyName: 'Mbarara High Street Chemist',
        district: 'Mbarara',
        address: 'High Street Commercial Center, Mbarara',
        distanceKm: 268.0,
        stockUnits: 64,
        unitPriceUgx: med.suggestedRetailPriceUgx,
        status: 'In Stock',
        canHold: true,
        phone: '+256 700 000004',
      },
    ];

    return res.json({ success: true, medicine: med.brandName, branches });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Patient Portal REST Endpoints ───────────────────────────────────────────

// Create new patient order from PWA
app.post('/api/patient/orders', async (req, res) => {
  try {
    const { pharmacyId, items, deliveryAddress, paymentMethod, totalUgx } = req.body;
    const patientId = resolvePatientId(req, req.body.patientId);
    const sb = getSupabaseAdmin();

    const orderNumber = `ORD-UG-${Date.now().toString().slice(-6)}`;

    if (sb) {
      const { data: order, error: orderErr } = await sb.from('patient_orders').insert({
        order_number: orderNumber,
        patient_id: patientId || null,
        pharmacy_id: pharmacyId || '00000000-0000-0000-0000-000000000001',
        total_amount_ugx: Number(totalUgx),
        payment_status: 'Paid',
        payment_method: paymentMethod || 'MTN_MOMO',
        fulfillment_status: 'Processing',
        delivery_type: 'Delivery',
        delivery_address: deliveryAddress || 'Kampala, Uganda',
        rider_name: 'Bodawerk Express (Rider: Kateregga D.)',
        rider_phone: '+256 704 881920',
        estimated_delivery_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      }).select().single();

      if (orderErr) {
        console.error('Order creation error:', orderErr);
        return res.status(400).json({ error: orderErr.message });
      }

      if (items && Array.isArray(items)) {
        const orderItems = items.map((it: any) => ({
          order_id: order.id,
          drug_id: it.drugId || null,
          drug_name: it.drugName,
          dosage: it.dosage || 'Standard',
          quantity: it.quantity,
          unit_price_ugx: it.unitPriceUgx,
          total_ugx: it.quantity * it.unitPriceUgx,
        }));
        await sb.from('patient_order_items').insert(orderItems);
      }

      return res.json({ success: true, order });
    }

    // Memory fallback if Supabase not connected
    return res.json({
      success: true,
      order: {
        id: crypto.randomUUID(),
        order_number: orderNumber,
        total_amount_ugx: totalUgx,
        payment_status: 'Paid',
        fulfillment_status: 'Processing',
        rider_name: 'Bodawerk Express (Rider: Kateregga D.)',
        estimated_delivery_at: '45 mins',
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Fetch patient orders
app.get('/api/patient/orders/:patientId', async (req, res) => {
  try {
    const patientId = resolvePatientId(req, req.params.patientId);
    if (req.auth!.role === 'patient' && req.params.patientId !== req.auth!.sub) {
      return res.status(403).json({ error: 'You can only view your own orders' });
    }
    const sb = getSupabaseAdmin();

    if (sb) {
      const { data, error } = await sb
        .from('patient_orders')
        .select(`*, patient_order_items(*)`)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, data });
    }

    return res.json({ success: true, data: [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Book Pharmacist Teleconsultation
app.post('/api/patient/teleconsult/book', async (req, res) => {
  try {
    const { pharmacyId, chiefComplaint, urgency, scheduledAt } = req.body;
    const patientId = resolvePatientId(req, req.body.patientId);
    const sb = getSupabaseAdmin();

    const meetingLink = `https://meet.zenithrx.ug/room-${crypto.randomBytes(4).toString('hex')}`;

    if (sb) {
      const { data, error } = await sb.from('teleconsultations').insert({
        patient_id: patientId || null,
        pharmacy_id: pharmacyId || '00000000-0000-0000-0000-000000000001',
        chief_complaint: chiefComplaint,
        urgency: urgency || 'Routine',
        scheduled_at: scheduledAt || new Date().toISOString(),
        meeting_link: meetingLink,
        status: 'Scheduled',
      }).select().single();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, data });
    }

    return res.json({
      success: true,
      data: {
        id: crypto.randomUUID(),
        meeting_link: meetingLink,
        status: 'Scheduled',
        scheduled_at: scheduledAt || new Date().toISOString()
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Log Medication Dose
app.post('/api/patient/adherence/log-dose', async (req, res) => {
  try {
    const { scheduleId, status, notes } = req.body;
    const patientId = resolvePatientId(req, req.body.patientId);
    const sb = getSupabaseAdmin();

    if (sb) {
      const { data, error } = await sb.from('adherence_logs').insert({
        schedule_id: scheduleId,
        patient_id: patientId,
        scheduled_time: new Date().toISOString(),
        status: status || 'TAKEN',
        notes: notes || null
      }).select().single();

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, data });
    }

    return res.json({ success: true, logged: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare R2 File Storage API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/files/upload-url
 * Returns a signed S3 PUT URL for direct browser → R2 upload.
 * Body: { fileName, mimeType, fileSizeBytes, retentionClass, referenceType?, referenceId?, tenantId, uploadedBy }
 */
app.post('/api/files/upload-url', async (req, res) => {
  try {
    const r2 = getR2Client();
    const sb = getSupabaseAdmin();

    if (!r2) {
      return res.status(503).json({ error: 'Cloudflare R2 is not configured. Add R2_* env vars.' });
    }

    const {
      fileName, mimeType, fileSizeBytes,
      retentionClass = 'general',
      referenceType, referenceId,
      tenantId, uploadedBy,
    } = req.body;

    if (!fileName || !mimeType || !fileSizeBytes || !tenantId) {
      return res.status(400).json({ error: 'fileName, mimeType, fileSizeBytes, and tenantId are required.' });
    }

    // Build a structured R2 key: tenant/retention/year-month/uuid-filename
    const date = new Date();
    const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const uuid = crypto.randomUUID();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const r2Key = `${tenantId}/${retentionClass}/${ym}/${uuid}-${safeFileName}`;

    // Create signed PUT URL (expires in 15 minutes)
    const command = new PutObjectCommand({
      Bucket:        R2_BUCKET,
      Key:           r2Key,
      ContentType:   mimeType,
      ContentLength: fileSizeBytes,
      Metadata: {
        'tenant-id':        tenantId,
        'uploaded-by':      uploadedBy ?? 'unknown',
        'retention-class':  retentionClass,
        'original-name':    fileName,
      },
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    // Pre-register the file in Supabase with status 'pending'
    let fileId = uuid; // fallback if no Supabase
    if (sb) {
      const { data: fileRecord, error: dbErr } = await sb.from('files').insert({
        id:              uuid,
        tenant_id:       tenantId,
        uploaded_by:     uploadedBy ?? null,
        original_name:   fileName,
        r2_key:          r2Key,
        mime_type:       mimeType,
        size_bytes:      fileSizeBytes,
        status:          'pending',
        retention_class: retentionClass,
        reference_type:  referenceType ?? null,
        reference_id:    referenceId   ?? null,
      }).select('id').single();

      if (dbErr) console.error('[R2] File pre-register error:', dbErr.message);
      else fileId = fileRecord?.id ?? uuid;
    }

    return res.json({ uploadUrl, fileId, r2Key });
  } catch (err: any) {
    console.error('[R2] upload-url error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/upload-complete
 * Mark a file record as active after upload confirmation.
 * Body: { fileId }
 */
app.post('/api/files/upload-complete', async (req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const { fileId } = req.body;

    if (!fileId) return res.status(400).json({ error: 'fileId is required.' });

    let downloadUrl = '';
    if (sb) {
      const { data: file, error } = await sb
        .from('files')
        .update({ status: 'active' })
        .eq('id', fileId)
        .select('r2_key, tenant_id')
        .single();

      if (error) return res.status(404).json({ error: 'File record not found.' });

      // Build a signed download URL (expires in 1 hour)
      const r2 = getR2Client();
      if (r2 && file) {
        const getCmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: file.r2_key });
        downloadUrl = await getSignedUrl(r2, getCmd, { expiresIn: 3600 });
      }
    }

    return res.json({ success: true, fileId, downloadUrl });
  } catch (err: any) {
    console.error('[R2] upload-complete error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/download-url
 * Generate a time-limited signed download URL for a stored file.
 * Body: { fileId, expiresInSeconds? }
 */
app.post('/api/files/download-url', async (req, res) => {
  try {
    const r2 = getR2Client();
    const sb = getSupabaseAdmin();
    const { fileId, expiresInSeconds = 3600 } = req.body;

    if (!fileId) return res.status(400).json({ error: 'fileId is required.' });
    if (!r2)    return res.status(503).json({ error: 'R2 not configured.' });

    // Fetch r2_key from DB
    let r2Key = '';
    if (sb) {
      const { data, error } = await sb.from('files').select('r2_key, status').eq('id', fileId).single();
      if (error || !data) return res.status(404).json({ error: 'File not found.' });
      if (data.status === 'deleted') return res.status(410).json({ error: 'File has been deleted.' });
      r2Key = data.r2_key;
    } else {
      return res.status(503).json({ error: 'Supabase not configured — cannot resolve fileId to R2 key.' });
    }

    const getCmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key });
    const url = await getSignedUrl(r2, getCmd, { expiresIn: expiresInSeconds });

    return res.json({ url, expiresInSeconds });
  } catch (err: any) {
    console.error('[R2] download-url error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// AI Endpoint: Generate Patient Counseling Leaflet
app.post('/api/ai/counseling', async (req, res) => {
  try {
    const { drugName, dosage, patientName } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API Key missing' });
    }

    const prompt = `Generate a clear, patient-friendly medication counseling summary for ${patientName || 'the patient'} prescribed ${drugName} (${dosage}).
Explain:
- How and when to take it
- Food & drink considerations (e.g. with meals, avoid alcohol)
- What to do if a dose is missed
- 3 key side effects to monitor
- How to store safely at home.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    return res.json({ success: true, counselingText: response.text });
  } catch (err: any) {
    console.error('Counseling error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Payment Gateway (Flutterwave) Subsystem ─────────────────────────────────

app.post('/api/payments/initiate', async (req, res) => {
  try {
    const {
      gateway,
      phoneNumber,
      amountUgx,
      tierId,
      tierName,
      payerName,
      payerEmail,
      userId
    } = req.body;

    if (!gateway || !amountUgx || !tierId || !payerEmail) {
      return res.status(400).json({ error: 'Missing required payment parameters (gateway, amountUgx, tierId, payerEmail)' });
    }

    const txRef = `ZR-${Date.now().toString().slice(-8)}-${crypto.randomBytes(4).toString('hex')}`;
    const flutterwaveSecret = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!flutterwaveSecret) {
      return res.status(503).json({ error: 'Flutterwave secret key is missing in server environment.' });
    }

    // Insert into our pending DB state
    const sb = getSupabaseAdmin();
    if (sb) {
      await sb.from('subscription_payments').insert({
        user_id: userId || null,
        order_id: tierId,
        provider: 'flutterwave',
        transaction_reference: txRef,
        amount: Number(amountUgx),
        currency: 'UGX',
        payment_method: gateway,
        mobile_network: gateway === 'MTN_MOMO' ? 'MTN' : (gateway === 'AIRTEL_MONEY' ? 'AIRTEL' : null),
        phone_number: phoneNumber,
        status: 'PENDING'
      });
    }

    if (gateway === 'MTN_MOMO' || gateway === 'AIRTEL_MONEY') {
      const network = gateway === 'MTN_MOMO' ? 'MTN' : 'AIRTEL';
      
      const payload = {
        tx_ref: txRef,
        amount: Number(amountUgx),
        currency: 'UGX',
        network: network,
        email: payerEmail,
        phone_number: phoneNumber,
        fullname: payerName || 'Subscriber',
        redirect_url: `${process.env.APP_URL || 'http://localhost:3000'}/subscription/callback`
      };

      const flwRes = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_uganda', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${flutterwaveSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await flwRes.json();
      
      if (data.status === 'success') {
        return res.json({
          success: true,
          referenceId: txRef,
          gateway,
          status: 'PENDING_USER_PIN',
          message: `Please check your phone (${phoneNumber}) to enter your ${network} PIN.`,
          meta: data.meta
        });
      } else {
        return res.status(400).json({ error: data.message || 'Payment initiation failed' });
      }
    } else if (gateway === 'CARD_VISA_MC') {
      // Use Standard Checkout for Cards
      const payload = {
        tx_ref: txRef,
        amount: Number(amountUgx),
        currency: 'UGX',
        redirect_url: `${process.env.APP_URL || 'http://localhost:3000'}`,
        customer: {
          email: payerEmail,
          phonenumber: phoneNumber || '',
          name: payerName || 'Subscriber'
        },
        customizations: {
          title: 'ZenithRx Subscription',
          description: `Payment for ${tierName} plan`,
          logo: 'https://cdn.iconscout.com/icon/premium/png-256-thumb/pharmacy-1-105156.png'
        }
      };

      const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${flutterwaveSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await flwRes.json();
      
      if (data.status === 'success') {
        return res.json({
          success: true,
          referenceId: txRef,
          gateway,
          status: 'REDIRECT_REQUIRED',
          checkoutUrl: data.data.link
        });
      } else {
        return res.status(400).json({ error: data.message || 'Payment initiation failed' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported gateway' });
    }
  } catch (err: any) {
    console.error('Payment initiation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Poll Payment Status
 */
app.get('/api/payments/status/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  const sb = getSupabaseAdmin();
  if (!sb) return res.status(503).json({ error: 'DB not configured' });

  const { data, error } = await sb
    .from('subscription_payments')
    .select('*')
    .eq('transaction_reference', referenceId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Transaction reference not found' });
  }

  return res.json({
    success: true,
    referenceId: data.transaction_reference,
    status: data.status,
    amountUgx: data.amount,
    providerTxId: data.provider_transaction_id,
  });
});

/**
 * Webhook Callback Receiver (Flutterwave)
 */
app.post('/api/payments/webhook/flutterwave', async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers['verif-hash'];

  if (!signature || signature !== secretHash) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const payload = req.body;
  console.log(`[Webhook] Received payment notification from Flutterwave:`, payload);

  const sb = getSupabaseAdmin();
  if (sb) {
    await sb.from('payment_events').insert({
      provider: 'flutterwave',
      event_type: payload.event || 'charge.completed',
      payload: payload
    });

    if (payload.data?.status === 'successful') {
      const txRef = payload.data.tx_ref;
      const amount = payload.data.amount;
      
      // Verify payment with Flutterwave API to ensure it wasn't spoofed
      const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${payload.data.id}/verify`, {
        headers: {
          'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
      });
      const verifyData = await flwRes.json();

      if (verifyData.status === 'success' && 
          verifyData.data.amount >= amount && 
          verifyData.data.currency === 'UGX') {
        
        await sb.from('subscription_payments')
          .update({ 
            status: 'SUCCESSFUL',
            provider_transaction_id: payload.data.id.toString(),
            provider_response: payload
          })
          .eq('transaction_reference', txRef);
          
        console.log(`[Webhook] Payment ${txRef} verified and marked SUCCESSFUL`);
      }
    }
  }

  return res.json({ response: 'OK', acknowledged: true });
});



async function startServer(port = PORT) {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(['/patient', '/patient/*', '/patient.html'], (_req, res) => {
      res.sendFile(path.join(distPath, 'patient.html'));
    });
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, HOST, () => {
    console.log(`Quantum Pharma-Cash PMS running on http://localhost:${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use, trying ${port + 1}...`);
      void startServer(port + 1);
      return;
    }

    throw error;
  });
}

startServer();
