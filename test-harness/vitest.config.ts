import { defineConfig } from 'vitest/config';
import path from 'path';

const clipperRoot = path.resolve(__dirname, '../Other Sources/obsidian-clipper');

export default defineConfig({
  define: {
    // Required by clipper's debug.ts
    DEBUG_MODE: false,
  },
  resolve: {
    alias: {
      // Path to clipper source
      'clipper': path.resolve(clipperRoot, 'src'),
      // Use clipper's existing mock for browser extension APIs
      'webextension-polyfill': path.resolve(clipperRoot, 'src/utils/__mocks__/webextension-polyfill.ts'),
    },
  },
  server: {
    // Allow serving files from clipper directory
    fs: {
      allow: ['.', clipperRoot],
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
    testTimeout: 10000,
    // Use jsdom environment for DOM APIs
    environment: 'jsdom',
    // Look for dependencies in clipper's node_modules too
    deps: {
      moduleDirectories: [
        'node_modules',
        path.resolve(clipperRoot, 'node_modules'),
      ],
    },
  },
});
