import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/**
 * Custom resolver plugin ensuring any bare imports in ../src resolve to patient/node_modules
 */
function resolvePatientDepsPlugin(): Plugin {
  const patientNodeModules = path.resolve(__dirname, 'node_modules');
  return {
    name: 'resolve-patient-deps',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'react/jsx-runtime') {
        return path.resolve(patientNodeModules, 'react/jsx-runtime.js');
      }
      if (source === 'react/jsx-dev-runtime') {
        return path.resolve(patientNodeModules, 'react/jsx-dev-runtime.js');
      }
      if (!source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@/')) {
        try {
          return require.resolve(source, { paths: [patientNodeModules] });
        } catch {
          return null;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [resolvePatientDepsPlugin(), react(), tailwindcss()],
  envPrefix: 'VITE_',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js'),
      'motion': path.resolve(__dirname, 'node_modules/motion'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 3001,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
