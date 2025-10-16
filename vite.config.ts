import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  publicDir: './static',
  server: {
    port: 9090,
    host: 'localhost'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  // Handle absolute imports like /state/store.js
  resolve: {
    alias: {
      '/state': path.resolve(__dirname, 'src/state'),
      '/vendor': path.resolve(__dirname, 'src/vendor'),
      '/components': path.resolve(__dirname, 'src/components'),
      '/pages': path.resolve(__dirname, 'src/pages'),
      '/router': path.resolve(__dirname, 'src/router'),
      '/utils': path.resolve(__dirname, 'src/utils'),
      '/api': path.resolve(__dirname, 'src/api'),
      '/controllers': path.resolve(__dirname, 'src/controllers'),
      '/styles': path.resolve(__dirname, 'src/styles')
    }
  }
});
