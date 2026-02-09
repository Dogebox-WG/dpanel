import { defineConfig } from 'vite';

// Avoid Node.js-specific globals/types (e.g. __dirname) so this file stays portable
// without requiring @types/node in the project.
const abs = (p: string) => new URL(p, import.meta.url).pathname;

export default defineConfig({
  root: 'src',
  // Static files are served at /static/* (copied into dist/ on build).
  publicDir: 'static',
  server: {
    port: 9090,
    host: 'localhost'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // dogeboxd can serve either the normal UI or a recovery UI.
    // Build both HTML entrypoints into dist/ so either can be served as a SPA shell.
    rollupOptions: {
      input: {
        main: abs('./src/index.html'),
        recovery: abs('./src/index_recovery.html')
      }
    }
  },
  // Handle absolute imports like /state/store.js
  resolve: {
    alias: {
      '/state': abs('./src/state'),
      '/vendor': abs('./src/vendor'),
      '/components': abs('./src/components'),
      '/pages': abs('./src/pages'),
      '/router': abs('./src/router'),
      '/utils': abs('./src/utils'),
      '/api': abs('./src/api'),
      '/controllers': abs('./src/controllers'),
      '/styles': abs('./src/styles')
    }
  }
});
