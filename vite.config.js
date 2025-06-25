// VideoGenie Vite Configuration - Container Compatible
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    allowedHosts: 'all'  // Allow all hosts - fixes container host blocking
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true
  },
  define: {
    global: 'globalThis'
  }
});