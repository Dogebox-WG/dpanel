import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// Avoid Node.js-specific globals/types (e.g. __dirname) so this file stays portable
// without requiring @types/node in the project.
const abs = (p: string) => new URL(p, import.meta.url).pathname;

const shoelacePublicPath = '/shoelace';
const shoelaceCdnRoot = join(
  fileURLToPath(new URL('.', import.meta.url)),
  'node_modules/@shoelace-style/shoelace/cdn',
);

// Project convention: modules import with .js extensions (Node ESM style)
// while the sources are authored in .ts. Resolve a .js specifier to its
// .ts sibling when only the .ts file exists.
function tsSourceFallbackPlugin(): Plugin {
  return {
    name: 'ts-source-fallback',
    async resolveId(source, importer, options) {
      if (!source.endsWith('.js')) return null;
      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });
      if (resolved) return resolved;
      return this.resolve(source.slice(0, -3) + '.ts', importer, {
        ...options,
        skipSelf: true,
      });
    },
  };
}

// Dev only: serve the recovery/AP-mode entrypoint (index_recovery.html) at the
// root path so a dedicated dev server (port 9091) mirrors how dogeboxd serves the
// recovery UI. Rewriting to it internally keeps the browser URL at "/", so the
// inline "redirect unless at root" guard in index_recovery.html does not fire.
function recoveryIndexPlugin(): Plugin {
  return {
    name: 'recovery-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/' || url === '/index.html') {
          req.url = '/index_recovery.html';
        }
        next();
      });
    },
  };
}

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

// Dev server selection (env-driven so a single config can back both dev servers):
// - default: the main dpanel UI on port 9090
// - DPANEL_RECOVERY=1: the recovery/AP-mode UI on port 9091
// The build below is unaffected and always emits both HTML entrypoints.
const isRecovery = process.env.DPANEL_RECOVERY === '1';
const devPort = Number(process.env.DPANEL_PORT ?? (isRecovery ? 9091 : 9090));

export default defineConfig({
  root: 'src',
  // Static files are served at /static/* (copied into dist/ on build).
  publicDir: 'static',
  plugins: [
    tsSourceFallbackPlugin(),
    shoelaceAssetsPlugin(),
    ...(isRecovery ? [recoveryIndexPlugin()] : []),
  ],
  server: {
    port: devPort,
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
      '/gen': abs('./src/gen'),
      '/types': abs('./src/types'),
    },
  },
});
