/**
 * E2E tests for IMDB templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('IMDB Templates', () => {
  test('Another Earth', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'imdb/Another Earth.har',
      templatePath: 'imdb-clipper.json',
    });
    const expected = readExpected('imdb/Another Earth (2011).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

	  test('Ponyo', async ({ extensionContext, extensionId }) => {
	    const actual = await runHarTest(extensionContext, extensionId, {
	      harPath: 'imdb/Ponyo.har',
	      templatePath: 'imdb-clipper.json',
	    });
	    const expected = readExpected('imdb/Ponyo.md');
	    expectEqualsIgnoringNewlines(actual, expected);
	  });

  test('Andromeda', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'imdb/Andromeda.har',
	      templatePath: 'imdb-clipper.json',
    });
    const expected = readExpected('imdb/Andromeda (2000).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Shogun 1980', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'imdb/Shogun 1980.har',
	      templatePath: 'imdb-clipper.json',
    });
    const expected = readExpected('imdb/Shogun 1980.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Brooklyn Nine-Nine', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'imdb/Brooklyn Nine-Nine.har',
	      templatePath: 'imdb-clipper.json',
    });
    const expected = readExpected('imdb/Brooklyn Nine-Nine.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
