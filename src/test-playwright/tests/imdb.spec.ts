/**
 * E2E tests for IMDB templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('IMDB Templates', () => {
  test('Another Earth', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Another Earth.har',
      templatePath: 'imdb-movie-clipper.json',
    });
    const expected = readExpected('imdb/Another Earth (2011).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Andromeda', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Andromeda.har',
      templatePath: 'imdb-series-clipper.json',
    });
    const expected = readExpected('imdb/Andromeda (2000).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Shogun 1980', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Shogun 1980.har',
      templatePath: 'imdb-series-clipper.json',
    });
    const expected = readExpected('imdb/Shogun 1980.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
