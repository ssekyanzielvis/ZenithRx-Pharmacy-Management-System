import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';

/**
 * Custom plugin to emit patient.html as index.html in the standalone patient distribution folder
 */
function standalonePatientHtmlPlugin(): Plugin {
  return {
    name: 'standalone-patient-html',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist-patient');
      const patientFile = path.resolve(outDir, 'patient.html');
      const indexFile = path.resolve(outDir, 'index.html');
      if (fs.existsSync(patientFile) && !fs.existsSync(indexFile)) {
        fs.copyFileSync(patientFile, indexFile);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  void env;

  return {
    plugins: [react(), tailwindcss(), standalonePatientHtmlPlugin()],
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3001,
      open: '/patient.html',
    },
    build: {
      outDir: 'dist-patient',
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'patient.html'),
        },
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
