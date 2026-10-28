import { defineConfig } from '@playwright/test';

// An explicit IPv4 loopback address: "localhost" can resolve to ::1 in Node and Chromium,
// which have to agree with the address the preview server binds to.
const localURL = 'http://127.0.0.1:4173';
const baseURL = process.env.BASE_URL || localURL;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    browserName: 'chromium',
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'phone',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
        url: localURL,
        // Surface a preview crash in the report instead of a later ERR_CONNECTION_REFUSED.
        stdout: 'pipe',
        stderr: 'pipe',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
