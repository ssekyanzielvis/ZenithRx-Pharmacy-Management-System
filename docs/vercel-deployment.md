# Vercel Deployment Guide: Pharmacy PMS & Patient Web App

ZenithRx is architected with **two independent applications** in a single repository (monorepo):

| Application | Directory | Purpose |
| :--- | :--- | :--- |
| **Pharmacy Management System** (PMS) | Root (`./`) | Staff login, dispensing, POS, stock, admin, owner dashboards |
| **Patient Web App** (PWA) | `patient/` | Patient-facing portal — drug search, Rx upload, refills, telehealth |

Each deploys as a **separate Vercel project** pointing to a **different root directory**.

---

## 🩺 1. Deploying the Patient Web App

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **"Add New..."** → **"Project"**.
2. Select your `ZenithRx-Pharmacy-Management-System` repository.
3. In the **Configure Project** screen:
   - **Project Name**: `zenithrx-patient` (or any name you prefer)
   - **Framework Preset**: `Vite`
   - ⭐ **Root Directory**: `patient`  ← **This is the key setting**
   - Leave Build Command as default (`npm run build`) — it uses `patient/package.json`
   - Leave Output Directory as default (`dist`) — it outputs to `patient/dist/`
4. Add your **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_FLUTTERWAVE_PUBLIC_KEY`
5. Click **Deploy**.

> ✅ **Result**: Vercel installs deps from `patient/package.json`, runs `vite build` in `patient/`, and serves `patient/dist/` at the root domain. The PWA manifest, service worker, and "Install App" prompt all work at `/`.

---

## 🏥 2. Deploying the Pharmacy Management System (PMS)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **"Add New..."** → **"Project"**.
2. Select the **same** `ZenithRx-Pharmacy-Management-System` repository.
3. In the **Configure Project** screen:
   - **Project Name**: `zenithrx-pms`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave as default — uses root `package.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add your Environment Variables and click **Deploy**.

---

## 📁 Repository Structure

```
ZenithRx-Pharmacy-Management-System/
├── index.html              ← PMS entry
├── package.json            ← PMS dependencies & scripts
├── vite.config.ts          ← PMS Vite config
├── vercel.json             ← PMS SPA rewrites
├── src/                    ← Shared source code
│   ├── App.tsx             ← PMS main app
│   ├── PatientApp.tsx      ← Patient app component (shared)
│   ├── services/           ← Shared clinical services
│   └── ...
├── patient/                ← ⭐ INDEPENDENT Patient Web App
│   ├── index.html          ← Patient entry
│   ├── package.json        ← Patient-only dependencies
│   ├── vite.config.ts      ← Patient Vite config (imports from ../src/)
│   ├── vercel.json         ← Patient SPA rewrites
│   ├── tsconfig.json       ← Patient TypeScript config
│   ├── public/
│   │   ├── icon.png
│   │   ├── manifest.json   ← PWA manifest (start_url: "/")
│   │   └── sw.js           ← PWA service worker
│   └── src/
│       └── main.tsx        ← Patient mount point
└── ...
```

---

## 💻 Local Development Commands

| Command | Where to Run | Purpose | Local URL |
| :--- | :--- | :--- | :--- |
| `npm run dev` | Root `/` | Full PMS + Express server | `http://localhost:3000` |
| `npm run dev` | `patient/` | **Only** the Patient Web App | `http://localhost:3001` |
| `npm run build` | Root `/` | Production build for PMS | `dist/` |
| `npm run build` | `patient/` | Production build for Patient App | `patient/dist/` |

---

## 🔑 Why This Architecture?

- **No conflicts**: Each Vercel project points to its own root directory — completely separate builds, dependencies, and deploy URLs.
- **Shared source**: The `patient/` app imports components and services from `../src/` via the `@` alias, so clinical logic (drug safety, ADR reporting, teleconsultation) stays DRY.
- **Independent scaling**: The Patient PWA is a lightweight ~290 KB bundle vs the full PMS ~1.4 MB bundle — patients get a fast, focused experience.
- **Custom domains**: Assign `patient.zenithrx.ug` to the patient project and `app.zenithrx.ug` to the PMS project on Vercel.
