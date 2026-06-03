import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'cdk/test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.ts', 'lib/multiplayer-game-logic.ts', 'lib/multiplayer-protocol.ts'],
      exclude: ['node_modules', 'dist', 'cdk'],
    },
  },
});
