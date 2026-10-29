import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unit tests only: pure utils, schemas and reducers. No DOM rendering —
 * `happy-dom` exists for the few modules touching `localStorage`.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'happy-dom',
  },
});
