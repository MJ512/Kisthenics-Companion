import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri environment variables provided by Vite/Node build runner
declare const process: {
  env: {
    TAURI_ENV_PLATFORM?: string;
    TAURI_ENV_DEBUG?: string;
    [key: string]: string | undefined;
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: false,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
