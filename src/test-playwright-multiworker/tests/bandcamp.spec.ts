/**
 * E2E tests for Bandcamp templates using HAR files.
 * 
 * MULTIWORKER APPROACH:
 * Each test runs in a separate Playwright worker (separate browser instance).
 * Tests are distributed across workers automatically by Playwright.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('Bandcamp Templates', () => {
  test('Byron Discography', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'bandcamp/byron.bandcamp.com.har',
      templatePath: 'bandcamp-discography-as-tasks-clipper.json',
    });
    const expected = readExpected('bandcamp/byron - Discography.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});

