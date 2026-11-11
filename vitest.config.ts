import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // The new Step 5 tests live under src/, but the existing pure-logic suite
    // lives under tests/. Keep both so npm test never silently drops coverage.
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
