/**
 * E2E tests for IMDB Movie template using HAR files.
 *
 * These tests:
 * 1. Open browser with Obsidian Clipper extension installed
 * 2. Pre-load the IMDB Movie template into extension storage
 * 3. Use HAR file to replay network responses for the IMDB page
 * 4. Navigate to the IMDB URL (served from HAR)
 * 5. Open the clipper in EMBEDDED mode (iframe injected into page)
 * 6. Trigger "Copy to clipboard" in the embedded clipper
 * 7. Read clipboard and compare with expected markdown
 *
 * This differs from the HTML fixture test by using HAR recording instead
 * of a static HTML file. This allows testing with real page state including
 * user-specific data like ratings.
 */

import { test, runHarTest, getExpectedMarkdown, expectEqualsIgnoringNewlines } from '../fixtures';

const IMDB_URL = 'https://www.imdb.com/title/tt1549572/';

test.describe('IMDB Movie Template (HAR)', () => {
  test('should clip Another Earth', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/imdb - Another Earth.har',
      templatePath: 'imdb-movie-clipper.json',
      expectedPath: 'imdb/Another Earth (2011).md',
      url: IMDB_URL,
    });

    const expected = getExpectedMarkdown('imdb/Another Earth (2011).md', IMDB_URL);
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
