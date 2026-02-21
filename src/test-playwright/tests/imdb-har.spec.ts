/**
 * E2E tests for IMDB Movie template using HAR files.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('IMDB Movie Template (HAR)', () => {
  test('Another Earth', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Another Earth.har',
      templatePath: 'imdb-movie-clipper.json',
    });

    const expected = readExpected('imdb/Another Earth (2011).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('should clip Andromeda correctly', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Andromeda.har',
      templatePath: 'imdb-series-clipper.json',
    });

    const expected = readExpected('imdb/Andromeda (2000).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('should clip Shogun correctly', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Shogun 1980.har',
      templatePath: 'imdb-series-clipper.json',
    });

    const expected = readExpected('imdb/Shogun 1980.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

});
