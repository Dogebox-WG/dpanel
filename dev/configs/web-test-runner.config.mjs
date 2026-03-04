import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  rootDir: '../src/',
  files: ['../src/components/**/*.test.*'],
  concurrentBrowsers: 1,
  concurrency: 2,
  nodeResolve: {
    exportConditions: ['production', 'default']
  },
  testFramework: {
    config: {
      timeout: 3000,
      retries: 1
    }
  },
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    // playwrightLauncher({ product: 'firefox' }),
    // playwrightLauncher({ product: 'webkit' })
  ],
  testRunnerHtml: testFramework => `
    <html lang="en-US" class="sl-theme-dark">
      <head>
        <link rel="stylesheet" type="text/css" href="/vendor/@shoelace/cdn@2.14.0/themes/dark.css">
      </head>
      <body>
        <script>
          window.process = {env: { NODE_ENV: "production" }};

          // Suppress benign ResizeObserver loop warnings that mocha surfaces as test failures.
          // Uses a property trap so the filter persists regardless of when onerror is reassigned.
          let _onerror = null;
          Object.defineProperty(window, 'onerror', {
            set(fn) {
              _onerror = fn;
            },
            get() {
              if (!_onerror) return null;
              return function(msg, ...args) {
                if (typeof msg === 'string' && msg.includes('ResizeObserver loop')) return true;
                return _onerror.call(this, msg, ...args);
              };
            },
            configurable: true,
          });
        </script>
        <script type="module" src="${testFramework}"></script>
        <script type="module">
          import { setBasePath } from '/vendor/@shoelace/cdn@2.14.0/utilities/base-path.js';
          import '/vendor/@shoelace/cdn@2.14.0/shoelace.js';
          setBasePath('/vendor/@shoelace/cdn@2.14.0/');
        </script>
      </body>
    </html>
  `,
};
