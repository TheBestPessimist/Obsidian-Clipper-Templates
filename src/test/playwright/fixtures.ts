/**
 * Playwright fixtures for testing Obsidian Clipper extension.
 *
 * Templates + property types are imported ONCE per `npm test` run, via the real
 * extension import UI, into a single clean seed profile (see globalSetup.ts ->
 * seedProfile). Each worker then launches from a COPY of that seed profile, so
 * the slow click-through import is paid once per run instead of once per worker,
 * while still exercising the actual extension import path and re-importing fresh
 * on every run. The workflow is identical whether you run 1 test or 50.
 *
 * Tests run in parallel across workers (each worker has its own browser, hence
 * its own active tab). No active-tab race condition since workers are isolated.
 * See [[Clipper Active Tab Query Prevents True Parallelism]].
 */

import { test as base, chromium, type BrowserContext, type Page, type Request } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { writeTypesJsonFromTemplates } from './property-types-from-templates';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Project-specific root under the OS temp directory. All transient test
// artifacts created by this helper live under here.
const PROJECT_TEMP_ROOT = path.join(os.tmpdir(), 'obsidian-clipper-templates');

// NOTE: In this repo, the Web Clipper extension used for tests lives under
// "Other READONLY Sources To Aid With debugging/obsidian-clipper" rather than the
// user's primary obsidian-clipper clone. We intentionally point Playwright
// at that debug copy so tests remain self-contained.
const EXTENSION_PATH = path.join(__dirname, '../../../Other READONLY Sources To Aid With debugging/obsidian-clipper/dist');
const TEST_RESOURCES_PATH = path.join(__dirname, '../resources');
const TEMPLATES_PATH = path.join(__dirname, '../../../templates');

// Timeout constants
const TIMEOUT_MODAL = 5000;
const TIMEOUT_IMPORT = 10000;
const TIMEOUT_CLIPPER_READY = 10000;
const TIMEOUT_DOWNLOAD = 15000;
const TIMEOUT_SECONDARY_ACTIONS = 2000;
const TIMEOUT_EXTENSION_PROCESS = 1000;
// Upper bound for waiting on the page to go network-idle, so JS-hydrated fields
// (e.g. the IMDB user rating, fetched via authenticated GraphQL) are present in
// the DOM before we clip. We proceed even if idle isn't reached, so this is a
// ceiling, not a fixed sleep.
const TIMEOUT_NETWORK_IDLE = 5000;
// Render-settle polling: after switching templates we poll the rendered note
// body until it stops changing, instead of sleeping a fixed amount.
const TIMEOUT_RENDER = 8000;
const RENDER_POLL_MS = 100;

// Seed/worker profile locations. globalSetup imports templates once into the
// seed profile; each worker launches from a copy of it.
const SEED_PROFILE_DIR = path.join(PROJECT_TEMP_ROOT, 'seed-profile');
const WORKER_PROFILES_DIR = path.join(PROJECT_TEMP_ROOT, 'worker-profiles');

// Chromium profile sub-directories that are pure caches: safe to skip when
// copying the seed profile per worker, which keeps the copy small and fast.
const PROFILE_CACHE_DIRS = new Set([
  'Cache', 'Code Cache', 'GPUCache', 'ShaderCache', 'GrShaderCache',
  'DawnCache', 'DawnGraphiteCache', 'DawnWebGPUCache', 'component_crx_cache', 'Crashpad',
]);
function copyProfileFilter(src: string): boolean {
  return !src.split(/[\\/]/).some((seg) => PROFILE_CACHE_DIRS.has(seg));
}

export interface ClipperWorkerFixtures {
  extensionContext: BrowserContext;
  extensionId: string;
}

export const MOCK_DATE = '1111-11-11T12:00:00Z';

function generateDateMockCode(mockDateISO: string): string {
  const timestamp = new Date(mockDateISO).getTime();
  return `
(function() {
  if (globalThis.__dateMocked) return;
  globalThis.__dateMocked = true;
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
  // The clipped pages (bandcamp/imdb/MAL) register their OWN service workers,
  // which accumulate in the reused worker context. We must always pick the
  // EXTENSION's worker (chrome-extension://…/background.js) — evaluating in a
  // page's service worker has no `chrome` API and would error or hang. Among
  // extension workers, take the most recent (older generations may be stale
  // after an MV3 restart).
  const extensionWorkers = () =>
    context.serviceWorkers().filter((sw) => sw.url().startsWith('chrome-extension://'));
  let workers = extensionWorkers();
  while (workers.length === 0) {
    await context.waitForEvent('serviceworker');
    workers = extensionWorkers();
  }
  return workers[workers.length - 1];
}

/**
 * Launch a persistent browser context with the Clipper extension loaded and the
 * Date object mocked (so {{date}} is reproducible). Used for both the one-time
 * seed profile and each per-worker profile, so the launch path is identical.
 */
async function launchExtensionContext(userDataDir: string, headless: boolean): Promise<BrowserContext> {
  if (!fs.existsSync(EXTENSION_PATH)) {
    throw new Error(`Extension not found at ${EXTENSION_PATH}. Run 'npm run build-clipper-extension' first.`);
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless,
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    permissions: ['clipboard-read', 'clipboard-write'],
    acceptDownloads: true,
  });

  const dateMockCode = generateDateMockCode(MOCK_DATE);
  // Each extension JS file is requested many times (every page + clipper iframe
  // + settings/messenger load, across every test in the worker). Reading the
  // file and concatenating the mock on each request is pure overhead, so cache
  // the resulting body per path. `null` = file not on disk → continue unmodified.
  const mockedJsCache = new Map<string, string | null>();
  await context.route('chrome-extension://**/*.js', async (route) => {
    const urlPath = new URL(route.request().url()).pathname;
    // Never rewrite the MV3 service worker script: it runs without `window`,
    // never renders templates, and rewriting it can kill the worker (which then
    // breaks chrome.tabs.* calls). Let it load unmodified.
    if (urlPath.endsWith('/background.js')) { await route.continue(); return; }
    let body = mockedJsCache.get(urlPath);
    if (body === undefined) {
      try { body = dateMockCode + fs.readFileSync(path.join(EXTENSION_PATH, urlPath), 'utf-8'); }
      catch { body = null; }
      mockedJsCache.set(urlPath, body);
    }
    if (body === null) { await route.continue(); return; }
    await route.fulfill({ contentType: 'application/javascript', body });
  });

  return context;
}

/**
 * Import property types + all templates ONCE per test run, via the real
 * extension import UI, into a single clean seed profile. Every worker then
 * launches from a copy of this profile (see the extensionContext fixture), so
 * the (slow) click-through import is paid once per run rather than once per
 * worker, while still exercising the actual extension import path. Re-cleans and
 * re-imports on every `npm test`, so template/formula changes are always picked
 * up. Called from globalSetup.ts.
 */
export async function seedProfile(headless: boolean = true): Promise<void> {
  // Clean any prior seed so every run starts from a clean extension.
  fs.rmSync(SEED_PROFILE_DIR, { recursive: true, force: true });
  fs.mkdirSync(PROJECT_TEMP_ROOT, { recursive: true });

  const context = await launchExtensionContext(SEED_PROFILE_DIR, headless);
  try {
    const serviceWorker = await getServiceWorker(context);
    const extensionId = serviceWorker.url().split('/')[2];

    // Property types must be imported before templates so frontmatter
    // formatting (numbers vs strings) matches the template-defined types.
    const typesPath = path.join(PROJECT_TEMP_ROOT, 'types-from-templates.json');
    writeTypesJsonFromTemplates(TEMPLATES_PATH, typesPath);
    await importPropertyTypesViaUI(context, extensionId, typesPath);
    await loadAllTemplates(context, extensionId);
    // Make the clipper open IN THE PAGE (embedded), not as a popup, so tests
    // trigger it through the extension's own in-page path. Set via the real UI.
    await setOpenBehaviorViaUI(context, extensionId, 'embedded');
  } finally {
    // Close so chrome.storage is flushed to disk before workers copy the profile.
    await context.close();
  }
}

export const test = base.extend<{}, ClipperWorkerFixtures>({
  extensionContext: [async ({}, use, workerInfo) => {
    if (!fs.existsSync(SEED_PROFILE_DIR)) {
      throw new Error(
        `Seed profile not found at ${SEED_PROFILE_DIR}. globalSetup must run first ` +
        `(it performs the one-time template import). Run tests via 'npm test'.`,
      );
    }

    // Start every worker from a copy of the once-imported seed profile, so each
    // worker gets a freshly-imported, clean extension without repeating the
    // click-through import. Identical whether 1 test or 50 run in parallel.
    const workerDir = path.join(WORKER_PROFILES_DIR, `w${workerInfo.workerIndex}`);
    fs.rmSync(workerDir, { recursive: true, force: true });
    fs.mkdirSync(WORKER_PROFILES_DIR, { recursive: true });
    fs.cpSync(SEED_PROFILE_DIR, workerDir, { recursive: true, filter: copyProfileFilter });
    // Remove single-instance locks copied from the seed so this profile can launch.
    for (const lock of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
      fs.rmSync(path.join(workerDir, lock), { force: true });
    }

    const context = await launchExtensionContext(workerDir, workerInfo.project.use.headless ?? true);

    await use(context);

    await context.close();
    try { fs.rmSync(workerDir, { recursive: true, force: true }); } catch { /* best-effort */ }
  }, { scope: 'worker' }],

  extensionId: [async ({ extensionContext }, use) => {
    // Templates were already imported into the seed profile (which this worker's
    // profile is a copy of), so we only need the extension id here.
    const serviceWorker = await getServiceWorker(extensionContext);
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  }, { scope: 'worker' }],
});

export const expect = test.expect;

/**
 * Characters Obsidian's own sanitizeFileName deletes on every platform (see
 * obsidian-clipper/src/utils/string-utils.ts). A rendered noteNameFormat holding
 * one of these is a template bug -- almost always a stray |wikilink leaking
 * '[[ ]]' into a filename -- so we fail loudly instead of letting Obsidian eat
 * them silently.
 *
 * Filesystem-illegal characters (: / \ ? * " < >) are deliberately NOT here. The
 * colon in "Ghost in the Cogs: Steam-Powered Ghost Stories" is part of the book's
 * title; Obsidian quietly dropping it is not a bug in our template.
 */
const OBSIDIAN_STRIPPED = /[#|^\[\]]/g;

/**
 * Assert a clip against its expected note: the file content, and where the note
 * lands in the vault.
 *
 * expectedFixture locates the expected-content file under src/test/resources.
 * expectedVaultPath is the template's folder + the note name + '.md' -- the only
 * way the suite sees noteNameFormat and path at all, since the file CONTENT
 * carries the frontmatter and body but never the name or the folder.
 */
export function assertNote(
  clip: ClipResult,
  expectedFixture: string,
  expectedVaultPath: string,
): void {
  // First, so that a leaked '[[ ]]' fails here rather than being quietly baked
  // into expectedVaultPath and locked in as if it were correct.
  const leaked = [...new Set(clip.vaultPath.match(OBSIDIAN_STRIPPED) ?? [])];
  expect(
    leaked,
    `Note name contains characters Obsidian strips (${leaked.join(' ')}): "${clip.vaultPath}"`,
  ).toEqual([]);

  expect(clip.vaultPath).toBe(expectedVaultPath);

  const expected = fs.readFileSync(path.join(TEST_RESOURCES_PATH, expectedFixture), 'utf-8');
  expect(normalizeMarkdown(clip.content)).toBe(normalizeMarkdown(expected));
}

export function normalizeMarkdown(md: string): string {
  return md.replace(/\r\n/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trim();
}

/**
 * Import a property-types JSON file via the settings page Properties tab.
 */
async function importPropertyTypesViaUI(
  context: BrowserContext,
  extensionId: string,
  typesJsonPath: string,
): Promise<void> {
  const settingsPage = await context.newPage();
  await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);
  await settingsPage.waitForLoadState('load');

  // The settings script attaches its sidebar handlers after load, so a single
  // early click can be a no-op. Click the Properties nav until the import button
  // actually appears (handler attached + section switched) — condition-based,
  // no fixed settle sleep.
  const propertiesNav = settingsPage.locator('#sidebar li[data-section="properties"]');
  await propertiesNav.waitFor({ state: 'visible', timeout: TIMEOUT_MODAL });
  const importTypesBtn = settingsPage.locator('#import-types-btn');
  await expect.poll(
    async () => {
      await propertiesNav.click();
      return importTypesBtn.isVisible();
    },
    { timeout: TIMEOUT_IMPORT },
  ).toBe(true);
  await importTypesBtn.click();

  const importModal = settingsPage.locator('#import-modal');
  await importModal.waitFor({ state: 'visible', timeout: TIMEOUT_MODAL });

  const fileChooserPromise = settingsPage.waitForEvent('filechooser');
  await importModal.locator('.import-drop-zone').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([typesJsonPath]);

  // The modal hiding is the extension's signal that the import finished.
  await importModal.waitFor({ state: 'hidden', timeout: TIMEOUT_IMPORT });
  await settingsPage.close();
}

/**
 * Set the extension's "Default open behavior" via the real settings UI (the
 * #open-behavior-dropdown), exactly as a user would. 'embedded' makes the
 * clipper open IN THE PAGE (an injected iframe) instead of a popup, so tests can
 * trigger it through the extension's own in-page path rather than hand-rolling
 * the tab lookup + toggle. The form auto-saves on change; we confirm the value
 * reached storage.sync before returning instead of sleeping.
 */
async function setOpenBehaviorViaUI(
  context: BrowserContext,
  extensionId: string,
  behavior: 'popup' | 'embedded' | 'reader',
): Promise<void> {
  const settingsPage = await context.newPage();
  await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);
  await settingsPage.waitForLoadState('load');

  // The dropdown lives in the General section; click that nav until the dropdown
  // is visible (handler-attach race), then pick the value.
  const generalNav = settingsPage.locator('#sidebar li[data-section="general"]');
  const dropdown = settingsPage.locator('#open-behavior-dropdown');
  await expect.poll(
    async () => {
      if (await dropdown.isVisible()) return true;
      await generalNav.click().catch(() => {});
      return dropdown.isVisible();
    },
    { timeout: TIMEOUT_IMPORT },
  ).toBe(true);
  await dropdown.selectOption(behavior);

  // The settings form auto-saves on change (debounced). Confirm it landed in
  // storage.sync — the same key the background reads — before continuing.
  const serviceWorker = await getServiceWorker(context);
  await expect.poll(
    async () => serviceWorker.evaluate(async () => {
      const data = await chrome.storage.sync.get('general_settings');
      return (data.general_settings as { openBehavior?: string } | undefined)?.openBehavior;
    }),
    { timeout: TIMEOUT_IMPORT },
  ).toBe(behavior);

  await settingsPage.close();
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
  await settingsPage.waitForLoadState('load');

  // The rendered template list is our signal that the settings JS has
  // initialized (and attached handlers).
  const firstTemplate = settingsPage.locator('#template-list li').first();
  await firstTemplate.waitFor({ state: 'visible', timeout: TIMEOUT_MODAL });
  await firstTemplate.click();

  const initialCount = await settingsPage.locator('#template-list li').count();

  // Open the import modal, retrying the click until it appears (handler-attach
  // race) but not re-clicking once it is open.
  const importBtn = settingsPage.locator('.settings-section-header button.import-template-btn');
  await importBtn.waitFor({ state: 'visible', timeout: TIMEOUT_MODAL });
  const importModal = settingsPage.locator('#import-modal');
  await expect.poll(
    async () => {
      if (await importModal.isVisible()) return true;
      await importBtn.click();
      return importModal.isVisible();
    },
    { timeout: TIMEOUT_IMPORT },
  ).toBe(true);

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

    // Wait for import to complete (modal closes and the list grows).
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
  // Use a unique temp directory per invocation to avoid cross-test conflicts.
  fs.mkdirSync(PROJECT_TEMP_ROOT, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(PROJECT_TEMP_ROOT, 'temp-templates-'));
  return templates.map((t, i) => {
    const tempFile = path.join(tempDir, `temp-${i}-${Date.now()}.json`);
    fs.writeFileSync(tempFile, t.json, 'utf-8');
    return tempFile;
  });
}

function cleanupTempTemplateFiles(filePaths: string[]): void {
  let tempDir: string | undefined;
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      if (!tempDir) tempDir = path.dirname(filePath);
      fs.unlinkSync(filePath);
    }
  }
  if (tempDir && fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup; ignore errors.
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

interface HarIndex {
  /** The page URL: the first recorded text/html document. */
  url: string;
  /** "<METHOD> <full url>" for every recorded entry. */
  exact: Set<string>;
  /**
   * "<METHOD> <origin><pathname>" -> the full recorded URL, or null when more
   * than one entry shares the key (ambiguous, so never safe to substitute).
   */
  byPathname: Map<string, string | null>;
}

/**
 * Parse a HAR once and build the small string indexes the routing needs. Only
 * short strings are retained, so the (10–21 MB) parsed HAR is released straight
 * away instead of being held for the page's lifetime.
 */
function loadHar(harPath: string): HarIndex {
  const har = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  const entries: any[] = har.log?.entries ?? [];

  // Don't assume the first entry is the page — HAR entries are ordered by
  // network timing. See [[HAR First Entry Is Not Always The Page URL]].
  const htmlEntry = entries.find((e) => e.response?.content?.mimeType?.includes('text/html'));
  if (!htmlEntry?.request?.url) throw new Error(`No HTML entry in HAR: ${harPath}`);

  // DevTools records speculative/prefetch/aborted attempts as extra entries with
  // the same method+URL and an EMPTY body. Playwright breaks same-URL ties by
  // counting matching request headers, which those decoys usually win — so it
  // replays the empty response, and when the shadowed entry is the page DOCUMENT
  // the whole page comes up blank with every selector silently ''. That is a
  // miserable thing to debug, so refuse to run on a HAR in that state.
  const withBody = new Set<string>();
  for (const entry of entries) {
    if ((entry.response?.content?.text?.length ?? 0) > 0) {
      withBody.add(`${entry.request?.method} ${entry.request?.url}`);
    }
  }
  const shadowed = entries.filter(
    (e) => (e.response?.content?.text?.length ?? 0) === 0
      && withBody.has(`${e.request?.method} ${e.request?.url}`),
  );
  if (shadowed.length > 0) {
    throw new Error(
      `${shadowed.length} empty-bodied duplicate entr${shadowed.length === 1 ? 'y' : 'ies'} ` +
      `shadow a real response in ${path.basename(harPath)} (first: ${shadowed[0].request?.url?.slice(0, 120)}). ` +
      `Playwright would replay the EMPTY one. Run 'npm run trim-and-sanitize-hars' to drop them.`,
    );
  }

  const exact = new Set<string>();
  const byPathname = new Map<string, string | null>();
  for (const entry of entries) {
    const { url, method } = entry.request ?? {};
    if (!url || !method) continue;
    exact.add(`${method} ${url}`);
    let key: string;
    try {
      const { origin, pathname } = new URL(url);
      key = `${method} ${origin}${pathname}`;
    } catch {
      continue;
    }
    // First entry wins; a second one for the same key marks it ambiguous.
    byPathname.set(key, byPathname.has(key) ? null : url);
  }

  return { url: htmlEntry.request.url, exact, byPathname };
}

/**
 * When a request has no byte-exact match in the HAR but exactly ONE recorded
 * GET shares its origin+pathname, the query string is the only difference —
 * return that recorded URL so we can point Playwright's HAR router at it.
 * Returns undefined when the request should be passed through untouched (and
 * so abort, if the HAR has nothing for it).
 *
 * Why this exists: Playwright's HAR backend matches URLs byte-for-byte
 * (harBackend.js: `candidate.request.url !== url`). Some SPAs salt request
 * URLs with per-session or per-viewport values — Google Maps' place-details
 * XHR embeds the map's pixel size (`!3m2!1i1048!2i806`), which depends on the
 * window Playwright happens to launch with. Such a request never matches the
 * recording, gets aborted, and the page is left unhydrated.
 *
 * Each guard is load-bearing:
 * - exact matches are never touched, so nothing that works today changes;
 * - GET only — Playwright compares POST bodies, and several different POSTs
 *   can share one pathname (Maps records 5 to /maps/_/MapsWizUi/data/batchexecute);
 * - never a navigation request, so a wrong document can't mask a bad page URL;
 * - the pathname must be unambiguous in the HAR (18 of the 221 pathnames in
 *   the Maps HAR are not, e.g. /maps/preview/log204 with 17 entries).
 *
 * This never reaches the live network and serves identical bytes every run, so
 * the suite stays hermetic and deterministic. What it relaxes is the "HARs must
 * be complete" caveat, for HARs that ARE complete but whose URLs carry salt.
 */
function harQueryInsensitiveUrl(har: HarIndex, request: Request): string | undefined {
  if (har.exact.has(`${request.method()} ${request.url()}`)) return undefined;
  if (request.method() !== 'GET' || request.isNavigationRequest()) return undefined;
  try {
    const { origin, pathname } = new URL(request.url());
    return har.byPathname.get(`GET ${origin}${pathname}`) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Open the clipper IN THE PAGE by invoking the extension's REAL handler
 * (`getActiveTabAndToggleIframe`), instead of hand-rolling the tab lookup +
 * toggle. That handler ensures the content script is loaded and then toggles the
 * in-page iframe — it is the extension's own embedded-open path.
 *
 * Why a separate page: Playwright has no API to click the toolbar icon, and a
 * service worker cannot fire its OWN runtime.onMessage handler, so the message
 * must come from another extension page. We open one in the SAME window (so the
 * background's `query({active, currentWindow})` is unambiguous — the two-window
 * popup approach made "current window" undefined and hung), bring the content
 * page back to the front so it is the active tab the handler resolves to, then
 * send the message. settings.html is used as the messenger because, unlike
 * popup.html, it never auto-toggles — so there's no risk of a double toggle.
 */
async function openClipperViaExtension(
  context: BrowserContext,
  page: Page,
  extensionId: string,
): Promise<void> {
  const trigger = await context.newPage();
  try {
    await trigger.goto(`chrome-extension://${extensionId}/settings.html`);
    await trigger.waitForLoadState('domcontentloaded');
    // Content page must be the active tab when the background resolves it.
    await page.bringToFront();
    const result = (await trigger.evaluate(async () =>
      chrome.runtime.sendMessage({ action: 'getActiveTabAndToggleIframe' }),
    )) as { success?: boolean; error?: string } | undefined;
    if (result && result.success === false) {
      throw new Error(`Clipper in-page trigger failed: ${result.error ?? 'unknown error'}`);
    }
  } finally {
    await trigger.close();
  }
}

/**
 * Open a page with HAR replay and activate the clipper iframe.
 * Returns the page and clipper frame locator.
 */
async function setupClipperPage(
  context: BrowserContext,
  harPath: string,
  extensionId: string,
  preparePage?: (page: Page) => Promise<void>,
): Promise<{ page: Page; clipperFrame: ReturnType<Page['frameLocator']> }> {
  const harFullPath = path.join(TEST_RESOURCES_PATH, harPath);
  const har = loadHar(harFullPath);

  const page = await context.newPage();
  // Serve only http(s) requests from the HAR, and ABORT any http(s) request not
  // recorded in it — rather than letting it hit the REAL network, which is slow,
  // non-deterministic, and keeps the page from ever reaching network-idle. The
  // `url` filter scopes HAR replay to the page's own http(s) traffic; the
  // clipper's chrome-extension:// iframe assets don't match it and so load
  // normally from the extension (they were never in the HAR). This requires the
  // recorded HARs to be COMPLETE — a page whose content is fetched by a request
  // missing from the HAR will lose that content (which is correct: such a test
  // was silently depending on the live network).
  await page.routeFromHAR(harFullPath, { url: /^https?:\/\//, notFound: 'abort' });
  // The clipper extracts text and {{image}} URLs from the DOM — it never reads
  // image/media/font BYTES, which are the bulk of the heavy IMDB/MAL HARs. Drop
  // them to speed the load and reach network-idle sooner. Registered AFTER
  // routeFromHAR so this handler runs first; everything else falls through to
  // the HAR replay. The startsWith('http') guard keeps the clipper's own
  // chrome-extension:// iframe assets (icons/fonts) from being aborted.
  // This handler also rescues requests whose URL carries per-session or
  // per-viewport salt and so never matches the recording byte-for-byte. See
  // harQueryInsensitiveUrl for the guards and the reasoning.
  await page.route('**/*', async (route) => {
    const request = route.request();
    const type = request.resourceType();
    if ((type === 'image' || type === 'media' || type === 'font') && request.url().startsWith('http')) {
      await route.abort();
      return;
    }
    const recorded = harQueryInsensitiveUrl(har, request);
    if (recorded) {
      // `notFound: 'abort'` is also our canary for a genuinely incomplete HAR,
      // so never rescue a request silently — a run shows what needed help.
      console.log(`[har] query-insensitive match: ${new URL(request.url()).pathname}`);
      // Hand routeFromHAR the URL it recorded so its exact match succeeds; it
      // then serves the response itself, keeping headers, base64 bodies and
      // redirect chains Playwright's job rather than ours.
      await route.fallback({ url: recorded });
      return;
    }
    await route.fallback();
  });
  await page.goto(har.url);
  // Bounded network-idle so JS-hydrated fields (e.g. the IMDB user rating fetched
  // via GraphQL) are in the DOM before we clip. We deliberately do NOT wait for
  // the full 'load' event: heavy pages (e.g. bandcamp, 6 MB of images) can keep
  // 'load' pending and starve the extension service worker. We proceed even if
  // idle isn't reached within the ceiling.
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT_NETWORK_IDLE }).catch(() => {});

  await preparePage?.(page);

  // Open the clipper in-page via the extension's own handler. See
  // openClipperViaExtension.
  await openClipperViaExtension(context, page, extensionId);

  // Clipper readiness: its container + clip button being present is the signal.
  await page.waitForSelector('#obsidian-clipper-container', { timeout: TIMEOUT_CLIPPER_READY });
  const clipperFrame = page.frameLocator('#obsidian-clipper-iframe');
  await clipperFrame.locator('#clip-btn').waitFor({ timeout: TIMEOUT_CLIPPER_READY });

  return { page, clipperFrame };
}

/**
 * Wait for the clipper to finish (re)rendering the note body after a template
 * change, by polling #note-content-field until it changes from its pre-switch
 * value and then stops changing. Replaces a fixed sleep so we wait exactly as
 * long as the render takes (and never clip the previous template's content).
 */
async function waitForClipperRender(
  clipperFrame: ReturnType<Page['frameLocator']>,
  previousValue: string,
): Promise<void> {
  const field = clipperFrame.locator('#note-content-field');
  await field.waitFor({ state: 'attached', timeout: TIMEOUT_CLIPPER_READY }).catch(() => {});

  let last: string | null = null;
  const deadline = Date.now() + TIMEOUT_RENDER;
  while (Date.now() < deadline) {
    const current = await field.inputValue().catch(() => '');
    // Settled: non-empty, changed from the pre-switch value, and unchanged
    // across two consecutive polls.
    if (current && current !== previousValue && current === last) return;
    last = current;
    await new Promise((resolve) => setTimeout(resolve, RENDER_POLL_MS));
  }
}

/**
 * Clip content using the "Save file" option and return the file content plus
 * the vault path the clipper produced.
 *
 * The note name and folder come from the clipper's OWN fields, not from the
 * download: "Save file" never creates a folder (popup.ts handleSaveToDownloads
 * reads #path-name-field and then passes only the name to saveFile, which does
 * a.download = fileName), and the download's filename is Chrome's sanitization
 * of the name -- ':' becomes '_', '[ ]' survive -- which is not what a vault
 * gets. Reading the fields gives the template's output before anyone sanitizes.
 */
async function clipAndDownload(
  page: Page,
  clipperFrame: ReturnType<Page['frameLocator']>
): Promise<ClipResult> {
  // Safe to read now: waitForClipperRender has settled the render pass that
  // fills the name, path and content fields together (popup.ts:894-933).
  // The clipper trims the note name for us but not the path (popup.ts:924-933).
  const noteName = (await clipperFrame.locator('#note-name-field').inputValue()).trim();
  const folder = (await clipperFrame.locator('#path-name-field').inputValue())
    .trim()
    .replace(/^\/+|\/+$/g, '');

  await clipperFrame.locator('#more-btn').click();
  await clipperFrame.locator('.secondary-actions').waitFor({ state: 'visible', timeout: TIMEOUT_SECONDARY_ACTIONS });

  const downloadPromise = page.waitForEvent('download', { timeout: TIMEOUT_DOWNLOAD });
  await clipperFrame.locator('.secondary-actions').getByText('Save file', { exact: false }).click();

  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Download failed');
  return {
    content: fs.readFileSync(downloadPath, 'utf-8'),
    vaultPath: folder ? `${folder}/${noteName}.md` : `${noteName}.md`,
  };
}

/**
 * Run a HAR-based clipper test and return both the clipped file content and the
 * note's vault path. Each test runs in isolation within its worker.
 */
export async function runHarClip(
  context: BrowserContext,
  extensionId: string,
  config: HarTestConfig
): Promise<ClipResult> {
  const templateName = getTemplateNameFromPath(config.templatePath);
  const { page, clipperFrame } = await setupClipperPage(
    context,
    config.harPath,
    extensionId,
    config.preparePage,
  );

  const contentField = clipperFrame.locator('#note-content-field');
  const beforeSwitch = await contentField.inputValue().catch(() => '');
  await clipperFrame.locator('#template-select').selectOption({ label: templateName });
  await waitForClipperRender(clipperFrame, beforeSwitch);

  const result = await clipAndDownload(page, clipperFrame);

  await page.close();
  return result;
}

// Test configuration interfaces

/** What a single clip produced: the file's content, and where the note lands. */
export interface ClipResult {
  content: string;
  /**
   * The template's rendered `path`, its rendered `noteNameFormat`, and '.md' --
   * e.g. 'Anime/Shangri-La (2009).md'. This is the template's output BEFORE any
   * sanitization: not Chrome's download filename (':' -> '_', '[ ]' kept) and
   * not Obsidian's sanitizeFileName (deletes ':', strips '[ ]'). Keeping it raw
   * is what lets assertNote catch characters leaking into a note name.
   */
  vaultPath: string;
}

export interface HarTestConfig {
  harPath: string;
  templatePath: string;
  preparePage?: (page: Page) => Promise<void>;
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
  // Give the extension time to propagate newly-imported templates to the clipper
  // iframe before we open it. See [[Async Template Import Race Condition]].
  await new Promise(resolve => setTimeout(resolve, TIMEOUT_EXTENSION_PROCESS));

  // Setup clipper page
  const { page, clipperFrame } = await setupClipperPage(context, config.harPath, extensionId);
  const contentField = clipperFrame.locator('#note-content-field');

  // Test each filter template
  const results: FilterTestResult[] = [];
  for (let i = 0; i < templates.length; i++) {
    const beforeSwitch = await contentField.inputValue().catch(() => '');
    await clipperFrame.locator('#template-select').selectOption({ label: templates[i].name });
    await waitForClipperRender(clipperFrame, beforeSwitch);

    const { content } = await clipAndDownload(page, clipperFrame);
    results.push({
      filter: config.filters[i].filter,
      expected: config.filters[i].expected,
      actual: extractBody(content),
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
