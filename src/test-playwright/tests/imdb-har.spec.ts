/**
 * E2E test for IMDB Movie template using HAR file.
 *
 * This test:
 * 1. Opens browser with Obsidian Clipper extension installed
 * 2. Pre-loads the IMDB Movie template into extension storage
 * 3. Uses HAR file to replay network responses for the IMDB page
 * 4. Navigates to the IMDB URL (served from HAR)
 * 5. Opens the clipper in EMBEDDED mode (iframe injected into page)
 * 6. Triggers "Copy to clipboard" in the embedded clipper
 * 7. Reads clipboard and compares with expected markdown
 *
 * This differs from the HTML fixture test by using HAR recording instead
 * of a static HTML file. This allows testing with real page state including
 * user-specific data like ratings.
 */

import { test, expect, readExpected, normalizeMarkdown, readTemplateJson, importTemplateViaUI } from '../fixtures';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HAR_PATH = path.join(__dirname, '../../../test resources/2www.imdb.com.har');

test.describe('IMDB Movie Template (HAR)', () => {
  test('should clip Another Earth correctly with user rating', async ({ context, extensionId }) => {
    // 0. Import the IMDB Movie template using the extension's actual import UI
    const templateJson = readTemplateJson('imdb-movie-clipper.json');
    await importTemplateViaUI(context, extensionId, templateJson);

    // 1. Create a new page and set up HAR routing
    const fixturePage = await context.newPage();

    // Route requests using the HAR file
    // Route ALL requests from HAR - no URL filter so that API calls (api.graphql.imdb.com) are also served
    await fixturePage.routeFromHAR(HAR_PATH, {
      notFound: 'fallback', // Fall back to network for unmatched requests
    });

    // 2. Navigate to the IMDB URL (responses served from HAR)
    const imdbUrl = 'https://www.imdb.com/title/tt1549572/';
    await fixturePage.goto(imdbUrl);
    await fixturePage.waitForLoadState('domcontentloaded');

    // 3. Wait for content script to be ready
    await fixturePage.waitForTimeout(1000);

    // 4. Get service worker and trigger embedded mode
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

    // 5. Wait for the iframe to appear in the page
    await fixturePage.waitForSelector('#obsidian-clipper-container', { timeout: 10000 });

    // Get the iframe element
    const clipperFrame = fixturePage.frameLocator('#obsidian-clipper-iframe');

    // 6. Wait for the clipper UI to load inside the iframe
    await clipperFrame.locator('#clip-btn').waitFor({ timeout: 10000 });

    // Give it time to extract content, match template, and render
    await fixturePage.waitForTimeout(3000);

    // Check for errors
    const errorMessage = clipperFrame.locator('.error-message:visible');
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent();
      console.log('Clipper error:', errorText);
    }

    // 7. Find and click "Copy to clipboard"
    const moreBtn = clipperFrame.locator('#more-btn');
    await moreBtn.click();

    // Wait for dropdown to appear and click Copy option
    await clipperFrame.locator('.secondary-actions').waitFor({ timeout: 2000 });
    const copyOption = clipperFrame.locator('.secondary-actions').getByText('Copy', { exact: false });
    await copyOption.click();

    // 8. Wait for clipboard operation to complete
    await fixturePage.waitForTimeout(500);

    // 9. Read clipboard content
    const clipboardContent = await fixturePage.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // 10. Compare with expected output
    // Expected file has placeholders for dynamic values:
    // - {{TEST_URL}} = the actual IMDB URL
    // - {{DATE}} = today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const expected = readExpected('Another Earth (2011).md')
      .replace('{{TEST_URL}}', imdbUrl)
      .replace('{{DATE}}', today);

    expect(normalizeMarkdown(clipboardContent)).toBe(normalizeMarkdown(expected));

    // Cleanup
    await fixturePage.close();
  });
});
