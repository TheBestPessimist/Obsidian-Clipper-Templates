/**
 * Playwright fixtures for testing Obsidian Clipper extension.
 *
 * Each worker gets its own browser instance with the extension.
 * Templates are loaded once per worker (worker-scoped).
 * Tests run in parallel across workers (each worker has its own active tab).
 * No active-tab race condition since workers are isolated.
 * See [[Clipper Active Tab Query Prevents True Parallelism]].
 */

import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXTENSION_PATH = path.join(__dirname, '../../Other Sources/obsidian-clipper/dist');
const TEST_RESOURCES_PATH = path.join(__dirname, '../resources');
const TEMPLATES_PATH = path.join(TEST_RESOURCES_PATH, 'templates');
const DOWNLOADS_BASE_PATH = path.join(__dirname, 'downloads');

// Timeout constants
const TIMEOUT_MODAL = 5000;
const TIMEOUT_IMPORT = 10000;
const TIMEOUT_CLIPPER_READY = 10000;
const TIMEOUT_DOWNLOAD = 15000;
const TIMEOUT_TEMPLATE_SWITCH = 1500;
const TIMEOUT_PAGE_LOAD = 1000;
const TIMEOUT_EXTENSION_PROCESS = 1000;
const TIMEOUT_SECONDARY_ACTIONS = 2000;
const TIMEOUT_TAB_ACTIVATE = 100;

export interface ClipperWorkerFixtures {
  extensionContext: BrowserContext;
  extensionId: string;
}

export const MOCK_DATE = '2026-02-20T12:00:00Z';

function generateDateMockCode(mockDateISO: string): string {
  const timestamp = new Date(mockDateISO).getTime();
  return `
(function() {
  if (window.__dateMocked) return;
  window.__dateMocked = true;
  const MOCK_TIMESTAMP = ${timestamp};
  const OriginalDate = Date;
  function MockDate(...args) {
    if (args.length === 0) return new OriginalDate(MOCK_TIMESTAMP);
    if (new.target) return new OriginalDate(...args);
    return OriginalDate(...args);
  }
  MockDate.prototype = OriginalDate.prototype;
  MockDate.now = () => MOCK_TIMESTAMP;
  MockDate.parse = OriginalDate.parse;
  MockDate.UTC = OriginalDate.UTC;
  Object.getOwnPropertyNames(OriginalDate).forEach(prop => {
    if (!(prop in MockDate)) { try { MockDate[prop] = OriginalDate[prop]; } catch {} }
  });
  Date = MockDate;
})();
`;
}

/**
 * Get the extension's service worker, waiting if necessary.
 */
async function getServiceWorker(context: BrowserContext) {
  const [serviceWorker] = context.serviceWorkers();
  return serviceWorker || await context.waitForEvent('serviceworker');
}

export const test = base.extend<{}, ClipperWorkerFixtures>({
  extensionContext: [async ({}, use, workerInfo) => {
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(`Extension not found at ${EXTENSION_PATH}. Run 'npm run build:chrome' first.`);
    }
    const workerDownloadsPath = path.join(DOWNLOADS_BASE_PATH, `worker-${workerInfo.workerIndex}`);
    if (fs.existsSync(workerDownloadsPath)) fs.rmSync(workerDownloadsPath, { recursive: true });
    fs.mkdirSync(workerDownloadsPath, { recursive: true });

    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: workerInfo.project.use.headless ?? true,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
      permissions: ['clipboard-read', 'clipboard-write'],
      acceptDownloads: true,
      downloadsPath: workerDownloadsPath,
    });

    const dateMockCode = generateDateMockCode(MOCK_DATE);
    await context.route('chrome-extension://**/*.js', async (route) => {
      const urlPath = new URL(route.request().url()).pathname;
      const filePath = path.join(EXTENSION_PATH, urlPath);
      try {
        const originalBody = fs.readFileSync(filePath, 'utf-8');
        await route.fulfill({ contentType: 'application/javascript', body: dateMockCode + originalBody });
      } catch { await route.continue(); }
    });

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  extensionId: [async ({ extensionContext }, use) => {
    const serviceWorker = await getServiceWorker(extensionContext);
    const extensionId = serviceWorker.url().split('/')[2];
    await loadAllTemplates(extensionContext, extensionId);
    await use(extensionId);
  }, { scope: 'worker' }],
});

export const expect = test.expect;

export function readExpected(relativePath: string): string {
  return fs.readFileSync(path.join(TEST_RESOURCES_PATH, relativePath), 'utf-8');
}

export function normalizeMarkdown(md: string): string {
  return md.replace(/\r\n/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trim();
}

/**
 * Import template files via the settings page import modal.
 * Handles both file paths and JSON strings.
 */
async function importTemplatesViaUI(
  context: BrowserContext,
  extensionId: string,
  templates: Array<string | { json: string; name: string }>
): Promise<void> {
  const settingsPage = await context.newPage();
  await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);
  await settingsPage.waitForLoadState('domcontentloaded');
  await settingsPage.waitForTimeout(TIMEOUT_PAGE_LOAD);

  // Select first template and open import modal
  await settingsPage.locator('#template-list li').first().click();
  await settingsPage.waitForTimeout(500);
  await settingsPage.locator('.settings-section-header button.import-template-btn').click();
  const importModal = settingsPage.locator('#import-modal');
  await importModal.waitFor({ state: 'visible', timeout: TIMEOUT_MODAL });

  const initialCount = await settingsPage.locator('#template-list li').count();

  // Prepare file paths (create temp files for JSON strings)
  const isJsonTemplates = typeof templates[0] !== 'string';
  const filePaths = isJsonTemplates
    ? createTempTemplateFiles(templates as Array<{ json: string; name: string }>)
    : templates as string[];

  try {
    // Upload all templates at once via file chooser
    const fileChooserPromise = settingsPage.waitForEvent('filechooser');
    await importModal.locator('.import-drop-zone').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePaths);

    // Wait for import to complete
    await importModal.waitFor({ state: 'hidden', timeout: TIMEOUT_IMPORT });
    await settingsPage.waitForFunction(
      (expected) => document.querySelectorAll('#template-list li').length >= expected,
      initialCount + templates.length,
      { timeout: TIMEOUT_IMPORT }
    );
  } finally {
    if (isJsonTemplates) {
      cleanupTempTemplateFiles(filePaths);
    }
  }

  await settingsPage.close();
}

function createTempTemplateFiles(templates: Array<{ json: string; name: string }>): string[] {
  const tempDir = path.join(__dirname, 'temp-templates');
  fs.mkdirSync(tempDir, { recursive: true });
  return templates.map((t, i) => {
    const tempFile = path.join(tempDir, `temp-${i}-${Date.now()}.json`);
    fs.writeFileSync(tempFile, t.json, 'utf-8');
    return tempFile;
  });
}

function cleanupTempTemplateFiles(filePaths: string[]): void {
  // Delete individual files to avoid conflicts with parallel test execution
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

async function loadAllTemplates(context: BrowserContext, extensionId: string): Promise<void> {
  const templateFiles = fs.readdirSync(TEMPLATES_PATH)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(TEMPLATES_PATH, f));

  if (templateFiles.length > 0) {
    await importTemplatesViaUI(context, extensionId, templateFiles);
  }
}

function getTemplateNameFromPath(templatePath: string): string {
  return JSON.parse(fs.readFileSync(path.join(TEMPLATES_PATH, templatePath), 'utf-8')).name;
}

function extractUrlFromHar(harPath: string): string {
  const har = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  const htmlEntry = har.log?.entries?.find((e: any) =>
    e.response?.content?.mimeType?.includes('text/html')
  );
  if (!htmlEntry?.request?.url) throw new Error(`No HTML entry in HAR: ${harPath}`);
  return htmlEntry.request.url;
}

async function getTabIdForPage(context: BrowserContext, page: Page): Promise<number> {
  const serviceWorker = await getServiceWorker(context);
  const tabId = await serviceWorker.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    return tabs.find(t => t.url === url)?.id;
  }, page.url());
  if (!tabId) throw new Error(`No tab ID for: ${page.url()}`);
  return tabId;
}

/**
 * Open a page with HAR replay and activate the clipper iframe.
 * Returns the page and clipper frame locator.
 */
async function setupClipperPage(
  context: BrowserContext,
  harPath: string
): Promise<{ page: Page; clipperFrame: ReturnType<Page['frameLocator']> }> {
  const harFullPath = path.join(TEST_RESOURCES_PATH, harPath);
  const url = extractUrlFromHar(harFullPath);

  const page = await context.newPage();
  await page.routeFromHAR(harFullPath, { notFound: 'fallback' });
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(TIMEOUT_PAGE_LOAD);

  // Activate tab and toggle clipper iframe
  const tabId = await getTabIdForPage(context, page);
  const serviceWorker = await getServiceWorker(context);

  await serviceWorker.evaluate(async (tid) => { await chrome.tabs.update(tid, { active: true }); }, tabId);
  await page.waitForTimeout(TIMEOUT_TAB_ACTIVATE);
  await serviceWorker.evaluate(async (tid) => { await chrome.tabs.sendMessage(tid, { action: 'toggle-iframe' }); }, tabId);

  // Wait for clipper to be ready
  await page.waitForSelector('#obsidian-clipper-container', { timeout: TIMEOUT_CLIPPER_READY });
  const clipperFrame = page.frameLocator('#obsidian-clipper-iframe');
  await clipperFrame.locator('#clip-btn').waitFor({ timeout: TIMEOUT_CLIPPER_READY });
  await page.waitForTimeout(TIMEOUT_SECONDARY_ACTIONS);

  return { page, clipperFrame };
}

/**
 * Clip content using the "Save file" option and return the file content.
 */
async function clipAndDownload(
  page: Page,
  clipperFrame: ReturnType<Page['frameLocator']>
): Promise<string> {
  await clipperFrame.locator('#more-btn').click();
  await clipperFrame.locator('.secondary-actions').waitFor({ state: 'visible', timeout: TIMEOUT_SECONDARY_ACTIONS });

  const downloadPromise = page.waitForEvent('download', { timeout: TIMEOUT_DOWNLOAD });
  await clipperFrame.locator('.secondary-actions').getByText('Save file', { exact: false }).click();

  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Download failed');
  return fs.readFileSync(downloadPath, 'utf-8');
}

/**
 * Run a HAR-based clipper test. Each test runs in isolation within its worker.
 */
export async function runHarTest(
  context: BrowserContext,
  extensionId: string,
  config: HarTestConfig
): Promise<string> {
  const templateName = getTemplateNameFromPath(config.templatePath);
  const { page, clipperFrame } = await setupClipperPage(context, config.harPath);

  await clipperFrame.locator('#template-select').selectOption({ label: templateName });
  await page.waitForTimeout(TIMEOUT_TEMPLATE_SWITCH);

  const fileContent = await clipAndDownload(page, clipperFrame);
  await page.close();
  return fileContent;
}

export function expectEqualsIgnoringNewlines(actual: string, expected: string): void {
  expect(normalizeMarkdown(actual)).toBe(normalizeMarkdown(expected));
}

// Test configuration interfaces

export interface HarTestConfig {
  harPath: string;
  templatePath: string;
}

// Filter Testing utilities

export interface FilterTestCase {
  filter: string;
  expected: string;
}

export interface MultiFilterTestConfig {
  harPath: string;
  filters: FilterTestCase[];
}

/**
 * Create a minimal template JSON from a filter expression.
 * The filter becomes the noteContentFormat (body), no properties.
 */
function createFilterTemplate(filter: string, index: number): { json: string; name: string } {
  const name = `Filter Test ${index} ${Date.now()}`;
  return {
    json: JSON.stringify({
      schemaVersion: '0.1.0',
      name,
      behavior: 'create',
      noteContentFormat: filter,
      properties: [],
      triggers: [],
      noteNameFormat: 'FilterTest',
      path: '',
    }),
    name
  };
}



/**
 * Extract body content (after frontmatter) from clipped markdown.
 */
function extractBody(content: string): string {
  const lines = content.split('\n');
  const secondDashIndex = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  return secondDashIndex > 0 ? lines.slice(secondDashIndex + 1).join('\n') : content;
}

export interface FilterTestResult {
  filter: string;
  expected: string;
  actual: string;
}

/**
 * Run multiple filter tests against a single HAR file.
 * Loads the page once and switches between templates for efficiency.
 * Returns array of results for custom assertion handling.
 */
export async function runFilterTests(
  context: BrowserContext,
  extensionId: string,
  config: MultiFilterTestConfig
): Promise<FilterTestResult[]> {
  // Create and import all filter templates
  const templates = config.filters.map((f, i) => createFilterTemplate(f.filter, i));
  await importTemplatesViaUI(context, extensionId, templates);
  await new Promise(resolve => setTimeout(resolve, TIMEOUT_EXTENSION_PROCESS));

  // Setup clipper page
  const { page, clipperFrame } = await setupClipperPage(context, config.harPath);

  // Test each filter template
  const results: FilterTestResult[] = [];
  for (let i = 0; i < templates.length; i++) {
    await clipperFrame.locator('#template-select').selectOption({ label: templates[i].name });
    await page.waitForTimeout(TIMEOUT_TEMPLATE_SWITCH);

    const fileContent = await clipAndDownload(page, clipperFrame);
    results.push({
      filter: config.filters[i].filter,
      expected: config.filters[i].expected,
      actual: extractBody(fileContent),
    });
  }

  await page.close();
  return results;
}

/**
 * Run multiple filter tests and assert all results match expected values.
 * Throws on first mismatch with descriptive error.
 */
export async function runFilterTestsAndAssert(
  context: BrowserContext,
  extensionId: string,
  config: MultiFilterTestConfig
): Promise<void> {
  const results = await runFilterTests(context, extensionId, config);

  for (const result of results) {
    const actualNorm = normalizeMarkdown(result.actual);
    const expectedNorm = normalizeMarkdown(result.expected);
    if (actualNorm !== expectedNorm) {
      throw new Error(
        `Filter test failed: ${result.filter.substring(0, 60)}...\n` +
        `Expected:\n${expectedNorm}\n\n` +
        `Actual:\n${actualNorm}`
      );
    }
  }
}
