/**
 * Playwright fixtures for testing Obsidian Clipper extension.
 *
 * These fixtures handle:
 * - Loading the extension into Chromium
 * - Providing the extension ID
 * - Serving HTML fixture files
 * - Downloading clipped notes (parallel-safe, no clipboard)
 * - Loading ALL templates once at startup
 */

import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to built extension (must run npm run build:chrome in obsidian-clipper first)
const EXTENSION_PATH = path.join(__dirname, '../../Other Sources/obsidian-clipper/dist');

// Path to test resources
const TEST_RESOURCES_PATH = path.join(__dirname, '../resources');

// Path to templates directory
const TEMPLATES_PATH = path.join(TEST_RESOURCES_PATH, 'templates');

// Base path for downloads directory (for capturing downloads from extension iframes)
const DOWNLOADS_BASE_PATH = path.join(__dirname, 'downloads');

// Worker-scoped fixtures (shared across all tests in a worker)
export interface ClipperWorkerFixtures {
  sharedContext: BrowserContext;
  sharedExtensionId: string;
}

// Test-scoped fixtures (per-test)
export interface ClipperFixtures {
  context: BrowserContext;
  extensionId: string;
}

/** Track whether templates have been loaded for this worker */
let templatesLoaded = false;

/**
 * The mock date used for all tests.
 * This date is injected into the extension's JavaScript to ensure consistent test results.
 */
export const MOCK_DATE = '2026-02-20T12:00:00Z';

/**
 * Generate JavaScript code that mocks the Date object.
 * When injected at the start of a JS file, all calls to `new Date()` or `Date.now()`
 * will return the mock date instead of the real current date.
 */
function generateDateMockCode(mockDateISO: string): string {
  return `
(function() {
  if (window.__dateMocked) return;
  window.__dateMocked = true;

  const MOCK_TIMESTAMP = ${new Date(mockDateISO).getTime()};
  const OriginalDate = Date;

  function MockDate(...args) {
    if (args.length === 0) {
      return new OriginalDate(MOCK_TIMESTAMP);
    }
    if (new.target) {
      return new OriginalDate(...args);
    }
    return OriginalDate(...args);
  }

  MockDate.prototype = OriginalDate.prototype;
  MockDate.now = function() { return MOCK_TIMESTAMP; };
  MockDate.parse = OriginalDate.parse;
  MockDate.UTC = OriginalDate.UTC;

  // Copy all static properties
  Object.getOwnPropertyNames(OriginalDate).forEach(prop => {
    if (!(prop in MockDate)) {
      try {
        MockDate[prop] = OriginalDate[prop];
      } catch (e) {}
    }
  });

  Date = MockDate;
})();
`;
}

export const test = base.extend<ClipperFixtures, ClipperWorkerFixtures>({
  // Worker-scoped: Launch browser with extension loaded (shared across all tests)
  sharedContext: [async ({}, use) => {
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(
        `Extension not found at ${EXTENSION_PATH}. ` +
        `Run 'npm run build:chrome' in Other Sources/obsidian-clipper first.`
      );
    }

    // Ensure downloads directory exists and is empty
    if (fs.existsSync(DOWNLOADS_BASE_PATH)) {
      fs.rmSync(DOWNLOADS_BASE_PATH, { recursive: true });
    }
    fs.mkdirSync(DOWNLOADS_BASE_PATH, { recursive: true });

    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: false, // set to 'false' for visual debugging
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
      // Grant clipboard permissions to avoid permission prompts
      permissions: ['clipboard-read', 'clipboard-write'],
      // Set downloads path for capturing extension iframe downloads
      acceptDownloads: true,
      downloadsPath: DOWNLOADS_BASE_PATH,
    });

    // Intercept extension JavaScript files and inject Date mocking code.
    // This allows us to control the date returned by {{date}} in templates
    // without modifying the extension source code.
    //
    // Since route.fetch() doesn't support chrome-extension:// protocol,
    // we read the files directly from disk.
    const dateMockCode = generateDateMockCode(MOCK_DATE);
    await context.route('chrome-extension://**/*.js', async (route) => {
      const url = route.request().url();
      // Extract filename from chrome-extension://extensionId/filename.js
      const urlPath = new URL(url).pathname;
      const filePath = path.join(EXTENSION_PATH, urlPath);

      try {
        const originalBody = fs.readFileSync(filePath, 'utf-8');
        // Inject mock code at the beginning of each JS file
        const modifiedBody = dateMockCode + originalBody;
        await route.fulfill({
          contentType: 'application/javascript',
          body: modifiedBody,
        });
      } catch (error) {
        // File not found - let it pass through
        await route.continue();
      }
    });

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  // Worker-scoped: Get extension ID and load all templates once
  sharedExtensionId: [async ({ sharedContext }, use) => {
    // Wait for service worker (Manifest V3)
    let [serviceWorker] = sharedContext.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await sharedContext.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];

    // Load all templates once per worker
    if (!templatesLoaded) {
      await loadAllTemplates(sharedContext, extensionId);
      templatesLoaded = true;
    }

    await use(extensionId);
  }, { scope: 'worker' }],

  // Test-scoped: Expose shared context as 'context' for each test
  context: async ({ sharedContext }, use) => {
    await use(sharedContext);
  },

  // Test-scoped: Expose shared extension ID as 'extensionId' for each test
  extensionId: async ({ sharedExtensionId }, use) => {
    await use(sharedExtensionId);
  },
});

export const expect = test.expect;

/**
 * Helper to read expected markdown file from test resources.
 */
export function readExpected(relativePath: string): string {
  return fs.readFileSync(path.join(TEST_RESOURCES_PATH, relativePath), 'utf-8');
}

/**
 * Normalize markdown for comparison (newline-insensitive).
 * - Normalizes line endings to \n
 * - Trims trailing whitespace from each line
 * - Trims leading/trailing empty lines
 */
export function normalizeMarkdown(md: string): string {
  return md
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Read a template JSON file from test resources/templates.
 * Returns the raw JSON string for pasting into import UI.
 */
export function readTemplateJson(relativePath: string): string {
  return fs.readFileSync(path.join(TEST_RESOURCES_PATH, 'templates', relativePath), 'utf-8');
}

/**
 * Import a template using the extension's actual import UI.
 * This properly sets up property types via the extension's own logic.
 *
 * @param context - Browser context
 * @param extensionId - Extension ID
 * @param templateJson - Template JSON string to import
 */
export async function importTemplateViaUI(
  context: BrowserContext,
  extensionId: string,
  templateJson: string
): Promise<void> {
  // Open the extension's settings page
  const settingsPage = await context.newPage();
  await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);
  await settingsPage.waitForLoadState('domcontentloaded');

  // Wait for settings to initialize
  await settingsPage.waitForTimeout(1000);

  // Click "New template" button to enter the templates section
  const newTemplateBtn = settingsPage.locator('#new-template-btn');
  await newTemplateBtn.click();
  await settingsPage.waitForTimeout(500);

  // Click the Import button in the template section header (the button, not menu item)
  const importBtn = settingsPage.locator('.settings-section-header button.import-template-btn');
  await importBtn.click();

  // Wait for import modal to appear
  const importModal = settingsPage.locator('#import-modal');
  await importModal.waitFor({ state: 'visible', timeout: 5000 });

  // Paste template JSON into textarea
  const textarea = importModal.locator('.import-json-textarea');
  await textarea.fill(templateJson);

  // Click confirm/import button
  const confirmBtn = importModal.locator('.import-confirm-btn');
  await confirmBtn.click();

  // Wait for import to complete (modal should close)
  await importModal.waitFor({ state: 'hidden', timeout: 5000 });

  // Give it time to save
  await settingsPage.waitForTimeout(500);

  // Close settings page
  await settingsPage.close();
}

/**
 * Load ALL templates from the templates directory at startup.
 * This is called once per browser context to avoid loading templates per-test.
 */
async function loadAllTemplates(
  context: BrowserContext,
  extensionId: string
): Promise<void> {
  const templateFiles = fs.readdirSync(TEMPLATES_PATH).filter(f => f.endsWith('.json'));

  if (templateFiles.length === 0) {
    console.warn('No template files found in', TEMPLATES_PATH);
    return;
  }

  console.log(`Loading ${templateFiles.length} templates...`);

  // Open settings page once
  const settingsPage = await context.newPage();
  await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);
  await settingsPage.waitForLoadState('domcontentloaded');
  await settingsPage.waitForTimeout(1000);

  for (const templateFile of templateFiles) {
    const templateJson = fs.readFileSync(path.join(TEMPLATES_PATH, templateFile), 'utf-8');
    const templateData = JSON.parse(templateJson);
    console.log(`  Importing template: ${templateData.name}`);

    // Click "New template" button to enter the templates section
    const newTemplateBtn = settingsPage.locator('#new-template-btn');
    await newTemplateBtn.click();
    await settingsPage.waitForTimeout(500);

    // Click the Import button
    const importBtn = settingsPage.locator('.settings-section-header button.import-template-btn');
    await importBtn.click();

    // Wait for import modal
    const importModal = settingsPage.locator('#import-modal');
    await importModal.waitFor({ state: 'visible', timeout: 5000 });

    // Paste template JSON
    const textarea = importModal.locator('.import-json-textarea');
    await textarea.fill(templateJson);

    // Click confirm
    const confirmBtn = importModal.locator('.import-confirm-btn');
    await confirmBtn.click();

    // Wait for import to complete
    await importModal.waitFor({ state: 'hidden', timeout: 5000 });
    await settingsPage.waitForTimeout(300);
  }

  console.log('All templates loaded.');
  await settingsPage.close();
}

/**
 * Get template name from a template JSON file.
 */
function getTemplateNameFromPath(templatePath: string): string {
  const templateJson = fs.readFileSync(path.join(TEMPLATES_PATH, templatePath), 'utf-8');
  const templateData = JSON.parse(templateJson);
  return templateData.name;
}

/**
 * Configuration for a HAR-based test.
 */
export interface HarTestConfig {
  /** Path to HAR file (relative to test resources) */
  harPath: string;
  /** Path to template JSON file (relative to test resources/templates) */
  templatePath: string;
}

/**
 * Extract the page URL from a HAR file.
 * Finds the first HTML document request (not API calls, images, etc).
 */
function extractUrlFromHar(harPath: string): string {
  const harContent = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  const entries = harContent.log?.entries;
  if (!entries?.length) {
    throw new Error(`No entries found in HAR file: ${harPath}`);
  }

  // Find the first HTML document request
  const htmlEntry = entries.find((entry: { response?: { content?: { mimeType?: string } } }) => {
    const mimeType = entry.response?.content?.mimeType || '';
    return mimeType.includes('text/html');
  });

  if (!htmlEntry?.request?.url) {
    throw new Error(`Could not find HTML document in HAR file: ${harPath}`);
  }
  return htmlEntry.request.url;
}

/**
 * Get the tab ID for a page by evaluating in the service worker.
 */
async function getTabIdForPage(context: BrowserContext, page: Page): Promise<number> {
  const serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    throw new Error('No service worker found');
  }

  const pageUrl = page.url();
  const tabId = await serviceWorker.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find(t => t.url === url);
    return tab?.id;
  }, pageUrl);

  if (!tabId) {
    throw new Error(`Could not find tab ID for page: ${pageUrl}`);
  }
  return tabId;
}

/**
 * Run a HAR-based clipper test with a pre-created page.
 * Used internally by runHarTestsInParallel for parallel execution.
 */
async function runHarTestWithPage(
  context: BrowserContext,
  extensionId: string,
  config: HarTestConfig,
  page: Page
): Promise<string> {
  const harFullPath = path.join(TEST_RESOURCES_PATH, config.harPath);
  const url = extractUrlFromHar(harFullPath);
  const templateName = getTemplateNameFromPath(config.templatePath);

  // Navigate to the URL (HAR routing already set up)
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');

  // Continue with the rest of the test (shared code below)
  return runClipperOnPage(context, page, templateName);
}

/**
 * Run a HAR-based clipper test.
 *
 * Usage:
 *   const actual = await runHarTest(context, extensionId, {
 *     harPath: 'www.example.com.har',
 *     templatePath: 'example-clipper.json',
 *   });
 *   expectEqualsIgnoringNewlines(actual, expected);
 *
 * Templates are pre-loaded at startup, so this only selects the right template.
 * Uses download instead of clipboard for parallel-safe execution.
 *
 * @returns The downloaded file content after clipping
 */
export async function runHarTest(
  context: BrowserContext,
  extensionId: string,
  config: HarTestConfig
): Promise<string> {
  const harFullPath = path.join(TEST_RESOURCES_PATH, config.harPath);
  const url = extractUrlFromHar(harFullPath);
  const templateName = getTemplateNameFromPath(config.templatePath);

  // Create page and set up HAR routing
  const page = await context.newPage();
  await page.routeFromHAR(harFullPath, {
    notFound: 'fallback',
  });

  // Navigate to the URL (extracted from HAR)
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');

  return runClipperOnPage(context, page, templateName);
}

/**
 * Shared logic: activate tab, trigger clipper, select template, download result.
 */
async function runClipperOnPage(
  context: BrowserContext,
  page: Page,
  templateName: string
): Promise<string> {

  // Wait for content script to be ready
  await page.waitForTimeout(1000);

  // Get the tab ID for this specific page
  const tabId = await getTabIdForPage(context, page);

  // Get service worker and trigger embedded mode on the specific tab
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }

  // Activate this tab before triggering the clipper
  // The clipper queries chrome.tabs.query({active: true}) to determine which tab to clip
  await serviceWorker.evaluate(async (tid) => {
    await chrome.tabs.update(tid, { active: true });
  }, tabId);
  await page.waitForTimeout(100);

  // Trigger the clipper iframe
  await serviceWorker.evaluate(async (tid) => {
    await chrome.tabs.sendMessage(tid, { action: 'toggle-iframe' });
  }, tabId);

  // Wait for the iframe and clipper UI to load
  await page.waitForSelector('#obsidian-clipper-container', { timeout: 10000 });
  const clipperFrame = page.frameLocator('#obsidian-clipper-iframe');
  await clipperFrame.locator('#clip-btn').waitFor({ timeout: 10000 });

  // Wait for clipper to fully initialize and capture the page content
  await page.waitForTimeout(2000);

  // Select the correct template from dropdown
  const templateDropdown = clipperFrame.locator('#template-select');
  await templateDropdown.selectOption({ label: templateName });
  // Wait for template to apply
  await page.waitForTimeout(1500);

  // Check for errors
  const errorMessage = clipperFrame.locator('.error-message:visible');
  if (await errorMessage.count() > 0) {
    const errorText = await errorMessage.textContent();
    console.log('Clipper error:', errorText);
  }

  // Click "Save file..." option
  const moreBtn = clipperFrame.locator('#more-btn');
  await moreBtn.click();
  await clipperFrame.locator('.secondary-actions').waitFor({ state: 'visible', timeout: 2000 });
  const saveOption = clipperFrame.locator('.secondary-actions').getByText('Save file', { exact: false });

  // Set up download listener before clicking
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await saveOption.click();

  // Wait for download and read content
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error('Download failed - no file path');
  }
  const fileContent = fs.readFileSync(downloadPath, 'utf-8');

  // Cleanup page
  await page.close();

  return fileContent;
}

/**
 * Assert that two markdown strings are equal, ignoring whitespace differences.
 */
export function expectEqualsIgnoringNewlines(
  actual: string,
  expected: string
): void {
  expect(normalizeMarkdown(actual)).toBe(normalizeMarkdown(expected));
}

/**
 * Configuration for a single HAR test with expected result.
 */
export interface HarTestWithExpected extends HarTestConfig {
  /** Name for identifying this test in results */
  name: string;
  /** Path to expected markdown file (relative to test resources) */
  expectedPath: string;
}

/**
 * Result of a parallel HAR test run.
 */
export interface ParallelTestResult {
  name: string;
  actual: string;
  expected: string;
  passed: boolean;
  error?: string;
}

/**
 * Run multiple HAR-based clipper tests.
 *
 * Due to the Clipper's architecture (it queries chrome.tabs.query({active: true, currentWindow: true})
 * to determine which tab to clip), true parallel execution within a single browser isn't possible.
 * The clipper always clips from the "active" tab, causing race conditions.
 *
 * This function optimizes by:
 * 1. Pre-loading all pages in parallel (navigation is parallelized)
 * 2. Running clipper operations sequentially (one tab active at a time)
 *
 * @param context Browser context
 * @param extensionId Extension ID
 * @param tests Array of test configurations
 * @returns Array of test results
 */
export async function runHarTestsInParallel(
  context: BrowserContext,
  extensionId: string,
  tests: HarTestWithExpected[]
): Promise<ParallelTestResult[]> {
  console.log(`Running ${tests.length} tests: ${tests.map(t => t.name).join(', ')}`);

  // PHASE 1: Create all pages and start navigation in parallel
  // This is the expensive network part that benefits from parallelism
  const sourcePage = context.pages()[0];
  const testSetups: Array<{ config: HarTestWithExpected; page: Page; url: string }> = [];

  // Create pages sequentially (window.open can't be parallelized safely)
  for (const testConfig of tests) {
    const harFullPath = path.join(TEST_RESOURCES_PATH, testConfig.harPath);
    const url = extractUrlFromHar(harFullPath);

    // Open new tab (simpler than window, and we'll activate it when needed)
    const page = await context.newPage();
    await page.routeFromHAR(harFullPath, {
      notFound: 'fallback',
    });

    testSetups.push({ config: testConfig, page, url });
  }

  // Navigate all pages in parallel (the slow part - network I/O)
  console.log(`  Loading ${testSetups.length} pages in parallel...`);
  await Promise.all(testSetups.map(async ({ page, url, config }) => {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    console.log(`  Loaded: ${config.name}`);
  }));

  // PHASE 2: Run clipper on each page SEQUENTIALLY
  // The clipper uses chrome.tabs.query({active: true}) so we must serialize this
  console.log(`  Running clipper on each page sequentially...`);
  const results: ParallelTestResult[] = [];

  for (const { config, page } of testSetups) {
    try {
      const templateName = getTemplateNameFromPath(config.templatePath);
      const actual = await runClipperOnPage(context, page, templateName);
      const expected = readExpected(config.expectedPath);
      const passed = normalizeMarkdown(actual) === normalizeMarkdown(expected);

      results.push({
        name: config.name,
        actual,
        expected,
        passed,
      });
      console.log(`  Clipped: ${config.name} - ${passed ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      results.push({
        name: config.name,
        actual: '',
        expected: '',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  Clipped: ${config.name} - ERROR: ${error}`);
    }
  }

  return results;
}

/**
 * Assert all parallel test results passed.
 */
export function expectAllParallelTestsPassed(results: ParallelTestResult[]): void {
  const failures = results.filter(r => !r.passed);

  if (failures.length > 0) {
    const failureMessages = failures.map(f => {
      if (f.error) {
        return `${f.name}: ${f.error}`;
      }
      return `${f.name}: Content mismatch\nExpected:\n${f.expected.slice(0, 500)}...\nActual:\n${f.actual.slice(0, 500)}...`;
    });

    throw new Error(`${failures.length} test(s) failed:\n\n${failureMessages.join('\n\n')}`);
  }
}
