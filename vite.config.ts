import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'check-env-vars',
      configResolved(config) {
        const env = config.env;
        const missing = [];
        if (!env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
        if (!env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');

        if (missing.length > 0) {
          console.warn(
            '\n\x1b[33m%s\x1b[0m',
            '⚠️  WARNING: Missing Supabase environment variables:'
          );
          console.warn('\x1b[33m%s\x1b[0m', `   ${missing.join(', ')}`);
          console.warn(
            '\x1b[33m%s\x1b[0m',
            '   The app will fail to start if these are not provided at runtime.\n'
          );
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@project-types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
});
