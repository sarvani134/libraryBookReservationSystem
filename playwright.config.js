import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5010',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node server/demo.js',
    url: 'http://127.0.0.1:5010/api/health',
    env: { PORT: '5010' },
    reuseExistingServer: false,
    timeout: 120000,
  },
  reporter: 'list',
});
