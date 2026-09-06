import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        app: 'index.html',
        demo: 'demo/index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html',
        notFound: '404.html',
      },
    },
  },
});
