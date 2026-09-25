import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PatientApp } from '@/PatientApp';
import { ThemeProvider } from '@/context/ThemeContext';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PatientApp />
    </ThemeProvider>
  </StrictMode>
);

// Register PWA service worker for Patient App
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Patient PWA Service Worker registration failed:', err);
    });
  });
}
