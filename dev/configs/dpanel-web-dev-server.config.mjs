import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  port: 9090,
  rootDir: '../src',
  appIndex: '../src/index.html',
  watch: true,
  // Resolve bare imports like "lit" from node_modules.
  nodeResolve: {
    exportConditions: ['development']
  },
  plugins: [
    // Serve TypeScript as real JS modules (fixes ".ts" being served as video/mp2t).
    // Point at dpanel's tsconfig so decorators compile correctly.
    esbuildPlugin({ ts: true, tsx: true, target: 'auto', tsconfig: '../tsconfig.json' })
  ],
  middleware: [
    function corsMiddleware(ctx, next) {
      // Check if the incoming request is for the static dir stuff
      if (ctx.url.includes('/static/')) {
        // Set CORS headers
        ctx.response.set('Access-Control-Allow-Origin', '*');
        ctx.response.set('Access-Control-Allow-Methods', 'OPTIONS');
        ctx.response.set('Access-Control-Allow-Methods', 'GET');
        ctx.response.set('Access-Control-Allow-Headers', 'Content-Type');
      }
      // TODO: review appropriateness, limit to pups.
      // Below, we are allowing all origins to fetch resources
      ctx.response.set('Access-Control-Allow-Origin', '*');
      ctx.response.set('Access-Control-Allow-Methods', 'OPTIONS');
      ctx.response.set('Access-Control-Allow-Methods', 'GET');
      ctx.response.set('Access-Control-Allow-Headers', 'Content-Type');

      return next();
    }
  ]
};