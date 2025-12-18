import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  port: 9091,
  rootDir: '../src',
  appIndex: '../src/index_recovery.html',
  watch: true,
  nodeResolve: {
    exportConditions: ['development']
  },
  plugins: [
    esbuildPlugin({ ts: true, tsx: true, target: 'auto', tsconfig: '../tsconfig.json' })
  ],
  middleware: []
};
