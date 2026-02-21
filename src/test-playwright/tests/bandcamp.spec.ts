/**
 * E2E tests for Bandcamp Discography template using HAR files.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('Bandcamp Discography Template (HAR)', () => {
  test('byron discography', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'bandcamp/byron.bandcamp.com.har',
      templatePath: 'bandcamp-discography-as-tasks-clipper.json',
    });

    const expected = readExpected('bandcamp/byron - Discography.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
