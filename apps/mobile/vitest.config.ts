import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/api/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    globals: true,
  },
});
