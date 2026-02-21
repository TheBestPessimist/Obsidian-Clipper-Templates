/**
 * Playwright fixtures for testing Obsidian Clipper extension.
 *
 * These fixtures handle:
 * - Loading the extension into Chromium
 * - Providing the extension ID
 * - Serving HTML fixture files
 * - Reading clipboard after clipping
 * - Loading templates into extension storage
 */

import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to built extension (must run npm run build:chrome in obsidian-clipper first)
const EXTENSION_PATH = path.join(__dirname, '../../Other Sources/obsidian-clipper/dist');

// Path to test resources
const TEST_RESOURCES_PATH = path.join(__dirname, '../resources');

export interface ClipperFixtures {
  context: BrowserContext;
  extensionId: string;
  fixtureServer: { url: string; close: () => void };
}

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

export const test = base.extend<ClipperFixtures>({
  // Launch browser with extension loaded
  context: async ({}, use) => {
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(
        `Extension not found at ${EXTENSION_PATH}. ` +
        `Run 'npm run build:chrome' in Other Sources/obsidian-clipper first.`
      );
    }

    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: false, // Extensions don't work well in headless mode
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        // Allow clipboard access without user gesture
        '--unsafely-allow-clipboard-read-write',
      ],
      // Grant clipboard permissions to avoid permission prompts
      permissions: ['clipboard-read', 'clipboard-write'],
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
  },

  // Get extension ID from service worker
  extensionId: async ({ context }, use) => {
    // Wait for service worker (Manifest V3)
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },

  // Serve HTML fixtures via local HTTP server
  fixtureServer: async ({}, use) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url || '/');
      const filePath = path.join(TEST_RESOURCES_PATH, urlPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const url = `http://127.0.0.1:${port}`;

    await use({
      url,
      close: () => server.close(),
    });

    server.close();
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
 * Configuration for a HAR-based test.
 */
export interface HarTestConfig {
  /** Path to HAR file (relative to test resources) */
  harPath: string;
  /** Path to template JSON file (relative to test resources/templates) */
  templatePath: string;
  /** The URL to navigate to (will be served from HAR) */
  url: string;
}

/**
 * Run a HAR-based clipper test.
 *
 * Usage:
 *   const actual = await runHarTest(context, extensionId, {
 *     harPath: 'www.example.com.har',
 *     templatePath: 'example-clipper.json',
 *     url: 'https://www.example.com/page',
 *   });
 *   expectEqualsIgnoringNewlines(actual, expected);
 *
 * @returns The clipboard content after clipping
 */
export async function runHarTest(
  context: BrowserContext,
  extensionId: string,
  config: HarTestConfig
): Promise<string> {
  const harFullPath = path.join(TEST_RESOURCES_PATH, config.harPath);
  const templateJson = readTemplateJson(config.templatePath);

  // Import the template
  await importTemplateViaUI(context, extensionId, templateJson);

  // Create page and set up HAR routing
  const page = await context.newPage();
  await page.routeFromHAR(harFullPath, {
    notFound: 'fallback',
  });

  // Navigate to the URL (served from HAR)
  await page.goto(config.url);
  await page.waitForLoadState('domcontentloaded');

  // Wait for content script to be ready
  await page.waitForTimeout(1000);

  // Get service worker and trigger embedded mode
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }

  await serviceWorker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-iframe' });
    }
  });

  // Wait for the iframe to appear
  await page.waitForSelector('#obsidian-clipper-container', { timeout: 10000 });
  const clipperFrame = page.frameLocator('#obsidian-clipper-iframe');

  // Wait for clipper UI to load
  await clipperFrame.locator('#clip-btn').waitFor({ timeout: 10000 });
  await page.waitForTimeout(3000);

  // Check for errors
  const errorMessage = clipperFrame.locator('.error-message:visible');
  if (await errorMessage.count() > 0) {
    const errorText = await errorMessage.textContent();
    console.log('Clipper error:', errorText);
  }

  // Click "Copy to clipboard"
  const moreBtn = clipperFrame.locator('#more-btn');
  await moreBtn.click();
  await clipperFrame.locator('.secondary-actions').waitFor({ timeout: 2000 });
  const copyOption = clipperFrame.locator('.secondary-actions').getByText('Copy', { exact: false });
  await copyOption.click();

  // Wait for clipboard operation
  await page.waitForTimeout(500);

  // Read clipboard content
  const clipboardContent = await page.evaluate(async () => {
    return await navigator.clipboard.readText();
  });

  // Cleanup
  await page.close();

  return clipboardContent;
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
