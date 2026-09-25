import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';

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

// CORS Whitelist Handler
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.APP_URL || '',
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.zenithrx.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Id, X-MFA-Code');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Global Rate Limiting & 30-Failed-Login Quarantine Trigger
app.use((req, res, next) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 Minute window
  const maxRequests = req.path.startsWith('/api/auth') ? 15 : 200;

  let bucket = ipBuckets.get(clientIp);
  if (!bucket) {
    bucket = { count: 0, firstRequestTime: now, failedAuthCount: 0 };
    ipBuckets.set(clientIp, bucket);
  }

  // Check if IP is in quarantine (e.g. from 30 failed attempts)
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

// ─── Patient Portal REST Endpoints ───────────────────────────────────────────

// Create new patient order from PWA
app.post('/api/patient/orders', async (req, res) => {
  try {
    const { patientId, pharmacyId, items, deliveryAddress, paymentMethod, totalUgx } = req.body;
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
    const { patientId } = req.params;
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
    const { patientId, pharmacyId, chiefComplaint, urgency, scheduledAt } = req.body;
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
    const { scheduleId, patientId, status, notes } = req.body;
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
