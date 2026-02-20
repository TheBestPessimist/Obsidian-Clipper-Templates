import { defineConfig } from '@playwright/test';

// Set to true to open HTML report automatically after test run
const OPEN_HTML_REPORT = false;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Extensions need sequential runs with persistent context
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for extension testing
  // Use 'list' for console output, 'html' for full report
  reporter: OPEN_HTML_REPORT ? 'html' : 'list',
  timeout: 30000,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-extension',
      use: {
        // We use custom launch in fixtures, not the default browser
      },
    },
  ],
});
