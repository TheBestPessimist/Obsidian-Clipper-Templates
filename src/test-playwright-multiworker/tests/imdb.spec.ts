/**
 * E2E tests for IMDB templates using HAR files.
 * 
 * MULTIWORKER APPROACH:
 * Each test runs in a separate Playwright worker (separate browser instance).
 * Tests are distributed across workers automatically by Playwright.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';
import {randomUUID} from "node:crypto";

test.describe('IMDB Templates', () => {
  test('Another - Earth (Movie)', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Another Earth.har',
      templatePath: 'imdb-movie-clipper.json',
    });
    const expected = readExpected('imdb/Another Earth (2011).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Andromeda (Series)', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Andromeda.har',
      templatePath: 'imdb-series-clipper.json',
    });
    const expected = readExpected('imdb/Andromeda (2000).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });

  test('Shogun 1980 (Series)', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Shogun 1980.har',
      templatePath: 'imdb-series-clipper.json',
    });
    const expected = readExpected('imdb/Shogun 1980.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
