import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        app: 'index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html',
      },
    },
  },
});
