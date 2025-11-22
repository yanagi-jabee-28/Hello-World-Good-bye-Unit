import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      // GitHub Pages 配信時に正しい相対パスでアセット参照できるよう base を設定
      // リポジトリ名に合わせる: https://yanagi-jabee-28.github.io/Hello-World-Good-bye-Unit/
      // ルート (ユーザ/Org Pages) で運用する場合は '/' に変更すること。
      base: '/Hello-World-Good-bye-Unit/',
      plugins: [react()],
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
