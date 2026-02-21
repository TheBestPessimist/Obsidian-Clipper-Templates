/**
 * E2E tests for IMDB Movie template using HAR files.
 * All IMDB tests run in parallel tabs for faster execution.
 */

import { test, runHarTestsInParallel, expectAllParallelTestsPassed } from '../fixtures';

test.describe('IMDB Templates', () => {
  test('All IMDB tests (parallel)', async ({ context, extensionId }) => {
    const results = await runHarTestsInParallel(context, extensionId, [
      {
        name: 'Another Earth',
        harPath: 'imdb/Another Earth.har',
        templatePath: 'imdb-movie-clipper.json',
        expectedPath: 'imdb/Another Earth (2011).md',
      },
      {
        name: 'Andromeda',
        harPath: 'imdb/Andromeda.har',
        templatePath: 'imdb-series-clipper.json',
        expectedPath: 'imdb/Andromeda (2000).md',
      },
      {
        name: 'Shogun 1980',
        harPath: 'imdb/Shogun 1980.har',
        templatePath: 'imdb-series-clipper.json',
        expectedPath: 'imdb/Shogun 1980.md',
      },
    ]);

    expectAllParallelTestsPassed(results);
  });
});
