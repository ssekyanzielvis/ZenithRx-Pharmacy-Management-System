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
  res.json({ status: 'ok', service: 'ZenithRx Pharmacy Management System', version: 'v3.2' });
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
    return res.json({ counselingText: text });
  } catch (err: any) {
    console.error('Counseling error:', err);
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
