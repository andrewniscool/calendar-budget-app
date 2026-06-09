import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    testTimeout: 15_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      TEST_DATABASE_URL: 'postgres://calendar_test_user:calendar_test_password@127.0.0.1:5433/calendar_test_db',
    },
  },
});
