
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
      if (fs.existsSync(manifestPath)) {
        const manifestTemplate = fs.readFileSync(manifestPath, 'utf-8');
        const manifestContent = manifestTemplate.replace(/__BASE_URL__/g, base);
        
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: manifestContent
        });
      }

      // Generate sw.js
      const swPath = path.resolve(__dirname, 'sw.template.js');
      if (fs.existsSync(swPath)) {
        const swTemplate = fs.readFileSync(swPath, 'utf-8');
        const swContent = swTemplate.replace(/__BASE_URL__/g, base);
        
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: swContent
        });
      }
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Configurable base URL
    // Priority: VITE_BASE_URL (from env) > default './' (relative for Tauri/Local)
    // For GitHub Pages, VITE_BASE_URL should be set to '/repo-name/' in CI environment
    const base = env.VITE_BASE_URL || './';
    
    console.log(`Building with base path: ${base}`);

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