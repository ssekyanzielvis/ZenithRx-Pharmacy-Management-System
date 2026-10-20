import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PatientApp } from './PatientApp';
import { ThemeProvider } from './context/ThemeContext';
import { startSyncBridge } from './services/syncBridge';
import { installAuthFetch } from './services/authSession';
import './index.css';

// Initialize network bridge without blocking main thread render
installAuthFetch();
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => startSyncBridge());
  } else {
    setTimeout(startSyncBridge, 60);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PatientApp />
    </ThemeProvider>
  </StrictMode>
);

// Register PWA service worker for Patient App safely in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Patient PWA Service Worker registration failed:', err);
    });
  });
}
