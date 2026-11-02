import { defineConfig } from 'vite'

// In development the game runs on :5173 and the API on :8787; /api is proxied so the browser sees one origin.
export default defineConfig({
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 800 },
})
