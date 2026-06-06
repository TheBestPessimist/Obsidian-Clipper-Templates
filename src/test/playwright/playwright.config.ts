import { defineConfig } from '@playwright/test';
import os from 'os';
import path from 'path';

// Set to true to open HTML report automatically after test run
const OPEN_HTML_REPORT = false;

// User configures these at any time. Do not remove!
const HEADLESS = true;
// const HEADLESS = false;
const workers = 2; // changed by user: i'm doing some intensive work, using 10 threads slows my laptop to a crawl

// Project-specific root under the OS temp directory. All Playwright-level
// artifacts (test-results, traces, etc.) should live under here.
const PROJECT_TEMP_ROOT = path.join(os.tmpdir(), 'obsidian-clipper-templates');
const OUTPUT_DIR = path.join(PROJECT_TEMP_ROOT, 'playwright-test-results');

export default defineConfig({
  testDir: './tests',
  // Imports templates + property types ONCE per run (via the real extension UI)
  // into a clean seed profile that every worker copies. See globalSetup.ts.
  globalSetup: './globalSetup.ts',
  outputDir: OUTPUT_DIR,
  preserveOutput: 'failures-only',
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
