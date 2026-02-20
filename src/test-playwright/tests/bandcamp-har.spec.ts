/**
 * E2E tests for Bandcamp Discography template using HAR files.
 */

import { test, runHarTest, getExpectedMarkdown, expectEqualsIgnoringNewlines } from '../fixtures';

const BANDCAMP_URL = 'https://byron.bandcamp.com/';

test.describe('Bandcamp Discography Template (HAR)', () => {
  test('should clip byron discography', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'bandcamp/byron.bandcamp.com.har',
      templatePath: 'bandcamp-discography-clipper.json',
      expectedPath: 'bandcamp/byron - Discography.md',
      url: BANDCAMP_URL,
    });

    const expected = getExpectedMarkdown('bandcamp/byron - Discography.md', BANDCAMP_URL);
    expectEqualsIgnoringNewlines(actual, expected);
  });
});

