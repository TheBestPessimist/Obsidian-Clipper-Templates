/**
 * Utility script to open a HAR file in a browser with DevTools for inspection.
 * 
 * Usage:
 *   npx tsx inspect-har.ts <har-path> [url]
 * 
 * Examples:
 *   npx tsx inspect-har.ts bandcamp/byron.bandcamp.com.har
 *   npx tsx inspect-har.ts bandcamp/byron.bandcamp.com.har https://byron.bandcamp.com/
 * 
 * The browser will stay open until you close it manually.
 * Use DevTools to inspect the DOM and create selectors for your template.
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_RESOURCES_PATH = path.join(__dirname, '../resources');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx tsx inspect-har.ts <har-path> [url]');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx inspect-har.ts bandcamp/byron.bandcamp.com.har');
    console.log('  npx tsx inspect-har.ts bandcamp/byron.bandcamp.com.har https://byron.bandcamp.com/');
    process.exit(1);
  }

  const harRelativePath = args[0];
  const harFullPath = path.join(TEST_RESOURCES_PATH, harRelativePath);

  if (!fs.existsSync(harFullPath)) {
    console.error(`HAR file not found: ${harFullPath}`);
    process.exit(1);
  }

  // Try to extract URL from HAR file if not provided
  let url = args[1];
  if (!url) {
    const harContent = JSON.parse(fs.readFileSync(harFullPath, 'utf-8'));
    const firstEntry = harContent.log?.entries?.[0];
    if (firstEntry?.request?.url) {
      url = firstEntry.request.url;
      console.log(`Detected URL from HAR: ${url}`);
    } else {
      console.error('Could not detect URL from HAR file. Please provide URL as second argument.');
      process.exit(1);
    }
  }

  console.log(`Opening HAR file: ${harRelativePath}`);
  console.log(`URL: ${url}`);
  console.log('');
  console.log('DevTools will open automatically. Close the browser window when done.');
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Route from HAR file
  await page.routeFromHAR(harFullPath, {
    notFound: 'fallback',
  });

  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');

  console.log('Page loaded. Inspect the DOM in DevTools.');
  console.log('Press Ctrl+C or close the browser to exit.');

  // Keep the script running until browser is closed
  await new Promise<void>((resolve) => {
    browser.on('disconnected', resolve);
  });
}

main().catch(console.error);

