import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Where the dev server forwards `/api` requests; override when the backend runs elsewhere. */
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin `/api` in development, so no CORS round-trips are needed.
    proxy: { '/api': { target: apiProxyTarget, changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: apiProxyTarget, changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts'],
    },
  },
});
