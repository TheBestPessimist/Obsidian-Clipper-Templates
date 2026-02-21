/**
 * E2E tests for Bandcamp Discography template using HAR files.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

const BANDCAMP_URL = 'https://byron.bandcamp.com/';

test.describe('Bandcamp Discography Template (HAR)', () => {
  test('should clip byron discography', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'bandcamp/byron.bandcamp.com.har',
      templatePath: 'bandcamp-discography-as-tasks-clipper.json',
      expectedPath: 'bandcamp/byron - Discography.md',
      url: BANDCAMP_URL,
    });

    const expected = readExpected('bandcamp/byron - Discography.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
