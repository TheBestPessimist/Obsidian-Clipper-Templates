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

export interface ClipperWorkerFixtures {
  extensionContext: BrowserContext;
  extensionId: string;
}

export const MOCK_DATE = '2026-02-20T12:00:00Z';

function generateDateMockCode(mockDateISO: string): string {
  return `
(function() {
  if (window.__dateMocked) return;
  window.__dateMocked = true;
  const MOCK_TIMESTAMP = ${new Date(mockDateISO).getTime()};
  const OriginalDate = Date;
  function MockDate(...args) {
    if (args.length === 0) return new OriginalDate(MOCK_TIMESTAMP);
    if (new.target) return new OriginalDate(...args);
    return OriginalDate(...args);
  }
  MockDate.prototype = OriginalDate.prototype;
  MockDate.now = function() { return MOCK_TIMESTAMP; };
  MockDate.parse = OriginalDate.parse;
  MockDate.UTC = OriginalDate.UTC;
  Object.getOwnPropertyNames(OriginalDate).forEach(prop => {
    if (!(prop in MockDate)) { try { MockDate[prop] = OriginalDate[prop]; } catch (e) {} }
  });
  Date = MockDate;
})();
`;
}

export const test = base.extend<{}, ClipperWorkerFixtures>({
  extensionContext: [async ({}, use, workerInfo) => {
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(`Extension not found at ${EXTENSION_PATH}. Run 'npm run build:chrome' first.`);
    }
    const workerDownloadsPath = path.join(DOWNLOADS_BASE_PATH, `worker-${workerInfo.workerIndex}`);
    if (fs.existsSync(workerDownloadsPath)) fs.rmSync(workerDownloadsPath, { recursive: true });
    fs.mkdirSync(workerDownloadsPath, { recursive: true });

    const headless = workerInfo.project.use.headless ?? true;
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
      permissions: ['clipboard-read', 'clipboard-write'],
      acceptDownloads: true,
      downloadsPath: workerDownloadsPath,
    });

    const dateMockCode = generateDateMockCode(MOCK_DATE);
    await context.route('chrome-extension://**/*.js', async (route) => {
      const url = route.request().url();
      const urlPath = new URL(url).pathname;
      const filePath = path.join(EXTENSION_PATH, urlPath);
      try {
        const originalBody = fs.readFileSync(filePath, 'utf-8');
        await route.fulfill({ contentType: 'application/javascript', body: dateMockCode + originalBody });
      } catch (error) { await route.continue(); }
    });

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  extensionId: [async ({ extensionContext }, use) => {
    let [serviceWorker] = extensionContext.serviceWorkers();
    if (!serviceWorker) serviceWorker = await extensionContext.waitForEvent('serviceworker');
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

async function loadAllTemplates(context: BrowserContext, extensionId: string): Promise<void> {
  const templateFiles = fs.readdirSync(TEMPLATES_PATH).filter(f => f.endsWith('.json'));
  if (templateFiles.length === 0) return;
  console.log(`[Worker] Loading ${templateFiles.length} templates...`);
  const settingsPage = await context.newPage();
  await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);
  await settingsPage.waitForLoadState('domcontentloaded');
  await settingsPage.waitForTimeout(1000);

  for (const templateFile of templateFiles) {
    const templateJson = fs.readFileSync(path.join(TEMPLATES_PATH, templateFile), 'utf-8');
    const templateData = JSON.parse(templateJson);
    console.log(`  Importing: ${templateData.name}`);
    await settingsPage.locator('#new-template-btn').click();
    await settingsPage.waitForTimeout(500);
    await settingsPage.locator('.settings-section-header button.import-template-btn').click();
    const importModal = settingsPage.locator('#import-modal');
    await importModal.waitFor({ state: 'visible', timeout: 5000 });
    await importModal.locator('.import-json-textarea').fill(templateJson);
    await importModal.locator('.import-confirm-btn').click();
    await importModal.waitFor({ state: 'hidden', timeout: 5000 });
    await settingsPage.waitForTimeout(300);
  }
  console.log('[Worker] Templates loaded.');
  await settingsPage.close();
}

function getTemplateNameFromPath(templatePath: string): string {
  const templateJson = fs.readFileSync(path.join(TEMPLATES_PATH, templatePath), 'utf-8');
  return JSON.parse(templateJson).name;
}

function extractUrlFromHar(harPath: string): string {
  const harContent = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  const entries = harContent.log?.entries;
  if (!entries?.length) throw new Error(`No entries in HAR: ${harPath}`);
  const htmlEntry = entries.find((e: any) => e.response?.content?.mimeType?.includes('text/html'));
  if (!htmlEntry?.request?.url) throw new Error(`No HTML in HAR: ${harPath}`);
  return htmlEntry.request.url;
}

async function getTabIdForPage(context: BrowserContext, page: Page): Promise<number> {
  const serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) throw new Error('No service worker');
  const pageUrl = page.url();
  const tabId = await serviceWorker.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    return tabs.find(t => t.url === url)?.id;
  }, pageUrl);
  if (!tabId) throw new Error(`No tab ID for: ${pageUrl}`);
  return tabId;
}

/**
 * Run a HAR-based clipper test. Each test runs in isolation within its worker.
 */
export async function runHarTest(
  context: BrowserContext,
  extensionId: string,
  config: HarTestConfig
): Promise<string> {
  const harFullPath = path.join(TEST_RESOURCES_PATH, config.harPath);
  const url = extractUrlFromHar(harFullPath);
  const templateName = getTemplateNameFromPath(config.templatePath);

  const page = await context.newPage();
  await page.routeFromHAR(harFullPath, { notFound: 'fallback' });
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const tabId = await getTabIdForPage(context, page);
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) serviceWorker = await context.waitForEvent('serviceworker');

  await serviceWorker.evaluate(async (tid) => { await chrome.tabs.update(tid, { active: true }); }, tabId);
  await page.waitForTimeout(100);
  await serviceWorker.evaluate(async (tid) => { await chrome.tabs.sendMessage(tid, { action: 'toggle-iframe' }); }, tabId);

  await page.waitForSelector('#obsidian-clipper-container', { timeout: 10000 });
  const clipperFrame = page.frameLocator('#obsidian-clipper-iframe');
  await clipperFrame.locator('#clip-btn').waitFor({ timeout: 10000 });
  await page.waitForTimeout(2000);

  await clipperFrame.locator('#template-select').selectOption({ label: templateName });
  await page.waitForTimeout(1500);

  await clipperFrame.locator('#more-btn').click();
  await clipperFrame.locator('.secondary-actions').waitFor({ state: 'visible', timeout: 2000 });
  const saveOption = clipperFrame.locator('.secondary-actions').getByText('Save file', { exact: false });

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await saveOption.click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Download failed');
  const fileContent = fs.readFileSync(downloadPath, 'utf-8');

  await page.close();
  return fileContent;
}

export function expectEqualsIgnoringNewlines(actual: string, expected: string): void {
  expect(normalizeMarkdown(actual)).toBe(normalizeMarkdown(expected));
}
