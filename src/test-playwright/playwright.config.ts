import { defineConfig } from '@playwright/test';

// Set to true to open HTML report automatically after test run
const OPEN_HTML_REPORT = false;

// Useer configures these at any time. Do not remove!
const HEADLESS = true;
// const HEADLESS = false;
const workers = 2;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: workers,
  timeout: 60000,
  // Use 'list' for console output, 'html' for full report
  reporter: OPEN_HTML_REPORT ? 'html' : 'list',
  use: {
    headless: HEADLESS,
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
