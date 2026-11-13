import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], base: '/nmr-from-zero/', build: { rollupOptions: { output: { manualChunks: { math: ['katex'], react: ['react','react-dom'] } } } } });
