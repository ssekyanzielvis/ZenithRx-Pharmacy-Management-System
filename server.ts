import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
  res.json({ status: 'ok', service: 'Pharma-Cash Quantum PMS' });
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

    const prompt = `You are an expert AI clinical pharmacist operating inside the Pharma-Cash Pharmacy Management System (PMS) by Quantum Networks Ltd.
Analyze the provided prescription (image or handwritten/typed text notes) and extract structured medication information accurately.
Return JSON with patient info, doctor info, prescribed medications list, dosage, duration, refills, and safety check notes.`;

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
      model: 'gemini-3.6-flash',
      contents: parts.length === 1 ? parts[0].text : { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING },
            patientAge: { type: Type.STRING },
            doctorName: { type: Type.STRING },
            doctorLicence: { type: Type.STRING },
            diagnosis: { type: Type.STRING },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  drugName: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  quantity: { type: Type.INTEGER },
                  instructions: { type: Type.STRING },
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
      model: 'gemini-3.6-flash',
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

async function startServer() {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quantum Pharma-Cash PMS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
