import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/** /privacy is the page privacy.html (the server does the same in production, see packages/server/src/index.ts) */
const prettyUrls = (): Plugin => ({
  name: 'pretty-urls',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/privacy' || req.url?.startsWith('/privacy?')) req.url = '/privacy.html'
      next()
    })
  },
})

// In development the game runs on :5173 and the API on :8787; /api is proxied so the browser sees one origin.
export default defineConfig({
  plugins: [prettyUrls()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    // two pages: the game and the privacy page
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), privacy: resolve(__dirname, 'privacy.html') } },
  },
})
