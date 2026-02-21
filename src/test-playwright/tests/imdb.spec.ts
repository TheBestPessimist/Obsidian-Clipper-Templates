/**
 * E2E test for IMDB Series template using HAR recording.
 *
 * This test:
 * 1. Opens browser with Obsidian Clipper extension installed
 * 2. Pre-loads the IMDB Series template into extension storage
 * 3. Uses HAR file to replay network responses for the IMDB page
 * 4. Navigates to the IMDB URL (served from HAR)
 * 5. Opens the clipper in EMBEDDED mode (iframe injected into page)
 * 6. Triggers "Copy to clipboard" in the embedded clipper
 * 7. Reads clipboard and compares with expected markdown
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

const IMDB_URL = 'https://www.imdb.com/title/tt0213327/';

test.describe('IMDB Series Template (HAR)', () => {
  test('should clip Andromeda correctly', async ({ context, extensionId }) => {
    const actual = await runHarTest(context, extensionId, {
      harPath: 'imdb/Andromeda.har',
      templatePath: 'imdb-series-clipper.json',
      expectedPath: 'imdb/Andromeda (2000).md',
      url: IMDB_URL,
    });

    const expected = readExpected('imdb/Andromeda (2000).md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
