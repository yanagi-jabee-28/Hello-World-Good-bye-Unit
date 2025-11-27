import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to generate manifest.json and sw.js with dynamic base URL
function generatePWAAssets(base: string): Plugin {
  return {
    name: 'generate-pwa-assets',
    generateBundle() {
      // Generate manifest.json
      const manifestPath = path.resolve(__dirname, 'manifest.template.json');
      const manifestTemplate = fs.readFileSync(manifestPath, 'utf-8');
      const manifestContent = manifestTemplate.replace(/__BASE_URL__/g, base);
      
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: manifestContent
      });

      // Generate sw.js
      const swPath = path.resolve(__dirname, 'sw.template.js');
      const swTemplate = fs.readFileSync(swPath, 'utf-8');
      const swContent = swTemplate.replace(/__BASE_URL__/g, base);
      
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: swContent
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const base = mode === 'production' ? '/Hello-World-Good-bye-Unit/' : '/';
    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        generatePWAAssets(base)
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});