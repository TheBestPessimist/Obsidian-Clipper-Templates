/**
 * E2E test for IMDB Series template.
 *
 * This test:
 * 1. Opens browser with Obsidian Clipper extension installed
 * 2. Pre-loads the IMDB template into extension storage
 * 3. Serves the HTML fixture via local HTTP server
 * 4. Navigates to the fixture page
 * 5. Opens the clipper in EMBEDDED mode (iframe injected into page)
 * 6. Triggers "Copy to clipboard" in the embedded clipper
 * 7. Reads clipboard and compares with expected markdown
 *
 * NOTE: We use embedded mode because Playwright can interact with iframes
 * but cannot easily interact with browser extension popups.
 */

import { test, expect, readExpected, normalizeMarkdown, readTemplateJson, importTemplateViaUI } from '../fixtures';

test.describe('IMDB Series Template', () => {
  test('should clip Andromeda correctly', async ({ context, extensionId, fixtureServer }) => {
    // 0. Import the IMDB template using the extension's actual import UI
    // This properly sets up property types via the extension's own logic
    const templateJson = readTemplateJson('imdb-series-clipper.json');
    await importTemplateViaUI(context, extensionId, templateJson);

    // 1. Navigate to the HTML fixture in a new page
    const fixturePage = await context.newPage();
    const fixtureUrl = `${fixtureServer.url}/imdb/Andromeda (TV Series 2000–2005) - IMDb.html`;
    await fixturePage.goto(fixtureUrl);
    await fixturePage.waitForLoadState('domcontentloaded');

    // 2. Wait for content script to be ready
    await fixturePage.waitForTimeout(1000);

    // 3. Get service worker and trigger embedded mode
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

    // 4. Wait for the iframe to appear in the page
    await fixturePage.waitForSelector('#obsidian-clipper-container', { timeout: 10000 });

    // Get the iframe element
    const clipperFrame = fixturePage.frameLocator('#obsidian-clipper-iframe');

    // 5. Wait for the clipper UI to load inside the iframe
    await clipperFrame.locator('#clip-btn').waitFor({ timeout: 10000 });

    // Give it time to extract content, match template, and render
    await fixturePage.waitForTimeout(3000);

    // Check for errors
    const errorMessage = clipperFrame.locator('.error-message:visible');
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent();
      console.log('Clipper error:', errorText);
    }

    // 6. Find and click "Copy to clipboard"
    // Default behavior is "Add to Obsidian", so Copy is in the dropdown menu
    const moreBtn = clipperFrame.locator('#more-btn');
    await moreBtn.click();

    // Wait for dropdown to appear and click Copy option
    await clipperFrame.locator('.secondary-actions').waitFor({ timeout: 2000 });
    const copyOption = clipperFrame.locator('.secondary-actions').getByText('Copy', { exact: false });
    await copyOption.click();

    // 7. Wait for clipboard operation to complete
    await fixturePage.waitForTimeout(500);

    // 8. Read clipboard content
    const clipboardContent = await fixturePage.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // 9. Compare with expected output (newline-insensitive)
    // Expected file has placeholders for dynamic values:
    // - {{TEST_URL}} = the fixture URL
    // - {{DATE}} = today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const encodedFixtureUrl = `${fixtureServer.url}/imdb/Andromeda%20(TV%20Series%202000%E2%80%932005)%20-%20IMDb.html`;
    const expected = readExpected('Andromeda (2000).md')
      .replace('{{TEST_URL}}', encodedFixtureUrl)
      .replace('{{DATE}}', today);

    expect(normalizeMarkdown(clipboardContent)).toBe(normalizeMarkdown(expected));

    // Cleanup
    await fixturePage.close();
  });
});
