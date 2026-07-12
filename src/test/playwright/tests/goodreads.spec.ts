/**
 * E2E tests for Goodreads templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('Goodreads Templates', () => {
  test('Ghost in the Cogs', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'goodreads/Ghost in the Cogs Steam-Powered Ghost Stories.har',
      templatePath: 'goodreads-clipper.json',
      preparePage: async (page) => {
        await page.getByRole('button', { name: 'Book details and editions' }).click();
        await page.locator('.DescListItem').filter({ hasText: 'ISBN' }).waitFor();
      },
    });
    const expected = readExpected('goodreads/Ghost in the Cogs Steam-Powered Ghost Stories.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Insula copacilor disparuti', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'goodreads/Insula copacilor dispăruţi - Elif Shafak.har',
      templatePath: 'goodreads-clipper.json',
      preparePage: async (page) => {
        await page.getByRole('button', { name: 'Book details and editions' }).click();
        await page.locator('.DescListItem').filter({ hasText: 'ISBN' }).waitFor();
      },
    });
    const expected = readExpected('goodreads/Insula copacilor dispăruţi - Elif Shafak.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
