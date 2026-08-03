import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.VITE_PARABA_API_PROXY_TARGET || 'https://apiparaba.maxfoot.com.br').replace(
    /\/+$/,
    ''
  );

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': `${process.cwd()}/src`,
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
