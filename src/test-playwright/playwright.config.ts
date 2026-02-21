import { defineConfig } from '@playwright/test';

// Set to true to open HTML report automatically after test run
const OPEN_HTML_REPORT = false;

// Set to false to see the browser window during tests
const HEADLESS = true;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 10,
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
