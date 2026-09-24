import { defineConfig } from 'vitest/config';
import path from 'node:path';

const rootDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');

// Mirrors tsconfig.json's "@/*" -> "./*" path alias so test files can import the same
// way application code does.
export default defineConfig({
  test: {
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': rootDir
    }
  }
});
