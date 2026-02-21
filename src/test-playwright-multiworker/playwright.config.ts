import { defineConfig } from '@playwright/test';

// Set to true to open HTML report automatically after test run
const OPEN_HTML_REPORT = false;

export default defineConfig({
  testDir: './tests',
  // Each test file runs in its own worker
  // Tests within a file run sequentially (one active tab at a time)
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // MULTIPLE WORKERS = each worker gets its own browser instance
  // This avoids the active-tab race condition since each browser has its own active tab
  workers: 4,
  // Use 'list' for console output, 'html' for full report
  reporter: OPEN_HTML_REPORT ? 'html' : 'list',
  timeout: 60000,
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

