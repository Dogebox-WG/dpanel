import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwrightLauncher } from '@web/test-runner-playwright';

const configDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(configDir, '../..');
const rootNodeModules = join(repoRoot, 'node_modules');
const shoelaceVersion = '2.20.1';
const shoelacePublicPath = `/vendor/@shoelace/cdn@${shoelaceVersion}`;
const shoelaceCdnRoot = join(rootNodeModules, '@shoelace-style/shoelace/cdn');

export default {
  rootDir: '../src/',
  files: ['../src/components/**/*.test.*'],
  concurrentBrowsers: 1,
  concurrency: 2,
  nodeResolve: {
    exportConditions: ['production', 'default', 'import'],
    moduleDirs: [rootNodeModules, join(configDir, '../node_modules')],
  },
  middleware: [
    function shoelaceAssetsMiddleware(context, next) {
      const url = context.url.split('?')[0];
      if (!url.startsWith(shoelacePublicPath)) {
        return next();
      }

      const relativePath = normalize(url.slice(shoelacePublicPath.length));
      if (relativePath.startsWith('..')) {
        return next();
      }

      const filePath = join(shoelaceCdnRoot, relativePath);
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        return next();
      }

      context.status = 200;
      context.body = createReadStream(filePath);
    },
  ],
  testFramework: {
    config: {
      timeout: 3000,
      retries: 1,
    },
  },
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    // playwrightLauncher({ product: 'firefox' }),
    // playwrightLauncher({ product: 'webkit' })
  ],
  testRunnerHtml: testFramework => `
    <html lang="en-US" class="sl-theme-dark">
      <head></head>
      <body>
        <script>
          window.process = {env: { NODE_ENV: "production" }}
        </script>
        <script type="module" src="${testFramework}"></script>
        <script type="module">
          import '/bootstrap/deform.js';
        </script>
      </body>
    </html>
  `,
};
