/**
 * E2E tests for Bandcamp Discography template using HAR files.
 * All Bandcamp tests run in parallel tabs for faster execution.
 */

import { test, runHarTestsInParallel, expectAllParallelTestsPassed } from '../fixtures';

test.describe('Bandcamp Templates', () => {
  test('All Bandcamp tests (parallel)', async ({ context, extensionId }) => {
    const results = await runHarTestsInParallel(context, extensionId, [
      {
        name: 'byron discography',
        harPath: 'bandcamp/byron.bandcamp.com.har',
        templatePath: 'bandcamp-discography-as-tasks-clipper.json',
        expectedPath: 'bandcamp/byron - Discography.md',
      },
    ]);

    expectAllParallelTestsPassed(results);
  });
});
