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

import { test as base, chromium, type BrowserContext, type Page, type Worker } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import LZString from 'lz-string';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to built extension (must run npm run build:chrome in obsidian-clipper first)
const EXTENSION_PATH = path.join(__dirname, '../../Other Sources/obsidian-clipper/dist');

// Path to test resources
const TEST_RESOURCES_PATH = path.join(__dirname, '../../test resources');

export interface ClipperFixtures {
  context: BrowserContext;
  extensionId: string;
  fixtureServer: { url: string; close: () => void };
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
 */
export function readTemplate(relativePath: string): Record<string, unknown> {
  const content = fs.readFileSync(path.join(TEST_RESOURCES_PATH, 'templates', relativePath), 'utf-8');
  return JSON.parse(content);
}

/**
 * Load a template into the extension's storage via the service worker.
 * This mimics what the extension does when importing a template.
 * Also stores property types so frontmatter generation uses correct types.
 */
export async function loadTemplateIntoExtension(serviceWorker: Worker, template: Record<string, unknown>): Promise<void> {
  // Generate a unique ID for the template
  const templateId = Date.now().toString() + Math.random().toString(36).slice(2, 9);
  const templateWithId = { ...template, id: templateId };

  // Extract property types from template properties
  const properties = template.properties as Array<{ name: string; type?: string }> | undefined;
  const propertyTypes = properties?.map(p => ({
    name: p.name,
    type: p.type || 'text'
  })) || [];

  // Compress the template (same as extension does)
  const compressedData = LZString.compressToUTF16(JSON.stringify(templateWithId));

  // Split into chunks (extension uses 8000 char chunks)
  const CHUNK_SIZE = 8000;
  const chunks: string[] = [];
  for (let i = 0; i < compressedData.length; i += CHUNK_SIZE) {
    chunks.push(compressedData.slice(i, i + CHUNK_SIZE));
  }

  // Store in extension's sync storage
  await serviceWorker.evaluate(async ({ templateId, chunks, propertyTypes }) => {
    // Get existing template list
    const data = await chrome.storage.sync.get(['template_list']);
    const templateList = (data.template_list as string[]) || [];

    // Add new template ID to list (at the beginning so it takes priority)
    templateList.unshift(templateId);

    // Save template, template list, and property types
    await chrome.storage.sync.set({
      [`template_${templateId}`]: chunks,
      template_list: templateList,
      property_types: propertyTypes,
    });
  }, { templateId, chunks, propertyTypes });
}
