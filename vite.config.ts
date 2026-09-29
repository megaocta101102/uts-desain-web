import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-config-middleware',
        configureServer(server) {
          server.middlewares.use('/api/config', (req, res) => {
            const configData = {
              SUPABASE_URL: env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || 'https://ctcjauwqpfnvmcujvzoc.supabase.co',
              SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              CAFE_NAME: env.CAFE_NAME || 'Meo Cafe',
              CAFE_TAGLINE: env.CAFE_TAGLINE || 'Aesthetic & Modern Coffee House',
              CAFE_ADDRESS: env.CAFE_ADDRESS || 'Jl. Pelabuhan Tanjuk Priok No.10, Bakalan Krajan, Sukun, Malang',
              CAFE_MAPS_URL: 'https://maps.app.goo.gl/834Rms4rBLfc3tZu7',
              OWNER_NAME: env.OWNER_NAME || 'Mega Octa',
              CAFE_CURRENCY: env.CAFE_CURRENCY || 'Rp',
              CAFE_TAX_PERCENT: Number(env.CAFE_TAX_PERCENT) || 10,
              CAFE_SERVICE_PERCENT: Number(env.CAFE_SERVICE_PERCENT) || 0,
              PAGE_SIZE: 8,
            };
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(configData));
          });
        },
      },
    ],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  };
});
