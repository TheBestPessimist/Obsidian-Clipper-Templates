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
    });
    const expected = readExpected('goodreads/Ghost in the Cogs Steam-Powered Ghost Stories.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
