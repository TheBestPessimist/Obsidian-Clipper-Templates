/**
 * E2E tests for Bandcamp templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('Bandcamp Templates', () => {
  test('Byron Discography', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'bandcamp/byron.bandcamp.com.har',
      templatePath: 'bandcamp-discography-as-tasks-clipper.json',
    });
    const expected = readExpected('bandcamp/byron - Discography.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Sol Messiah Discography', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'bandcamp/solmessiah.bandcamp.com.har',
      templatePath: 'bandcamp-discography-as-tasks-clipper.json',
    });
    const expected = readExpected('bandcamp/Sol Messiah - Discography.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
