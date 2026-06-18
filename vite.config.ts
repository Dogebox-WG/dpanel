import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// Avoid Node.js-specific globals/types (e.g. __dirname) so this file stays portable
// without requiring @types/node in the project.
const abs = (p: string) => new URL(p, import.meta.url).pathname;

const shoelaceVersion = '2.20.1';
const shoelacePublicPath = `/vendor/@shoelace/cdn@${shoelaceVersion}`;
const shoelaceCdnRoot = join(
  fileURLToPath(new URL('.', import.meta.url)),
  'node_modules/@shoelace-style/shoelace/cdn',
);

function shoelaceAssetsPlugin(): Plugin {
  return {
    name: 'shoelace-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (!url?.startsWith(shoelacePublicPath)) {
          next();
          return;
        }

        const relativePath = normalize(url.slice(shoelacePublicPath.length));
        if (relativePath.startsWith('..')) {
          next();
          return;
        }

        const filePath = join(shoelaceCdnRoot, relativePath);
        if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
          next();
          return;
        }

        res.statusCode = 200;
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root: 'src',
  // Static files are served at /static/* (copied into dist/ on build).
  publicDir: 'static',
  plugins: [shoelaceAssetsPlugin()],
  server: {
    port: 9090,
    host: 'localhost',
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // dogeboxd can serve either the normal UI or a recovery UI.
    // Build both HTML entrypoints into dist/ so either can be served as a SPA shell.
    rollupOptions: {
      input: {
        main: abs('./src/index.html'),
        recovery: abs('./src/index_recovery.html'),
      },
    },
  },
  // Handle absolute imports like /state/store.js
  resolve: {
    alias: {
      '/state': abs('./src/state'),
      '/components': abs('./src/components'),
      '/pages': abs('./src/pages'),
      '/router': abs('./src/router'),
      '/utils': abs('./src/utils'),
      '/api': abs('./src/api'),
      '/controllers': abs('./src/controllers'),
      '/styles': abs('./src/styles'),
      '/lib': abs('./src/lib'),
      '/bootstrap': abs('./src/bootstrap'),
    },
  },
});
