/**
 * E2E tests for Simon Willison templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('Simon Willison Templates', () => {
  test('Kenton Varda quote', async ({ extensionContext, extensionId }) => {
    const actual = await runHarTest(extensionContext, extensionId, {
      harPath: 'simon willison/A quote from Kenton Varda — Simon Willison.har',
      templatePath: 'simon-willison-clipper.json',
    });
    const expected = readExpected('simon willison/A quote from Kenton Varda — Simon Willison.md');
    expectEqualsIgnoringNewlines(actual, expected);
  });
});
