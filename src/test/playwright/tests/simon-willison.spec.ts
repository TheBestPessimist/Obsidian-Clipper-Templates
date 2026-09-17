/**
 * E2E tests for Simon Willison templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarClip, assertNote } from '../fixtures';

const CASES = [
  { name: 'Kenton Varda quote', file: 'simon willison/A quote from Kenton Varda — Simon Willison' },
  { name: 'Rewriting Bun in Rust link blog', file: 'simon willison/Rewriting Bun in Rust — Simon Willison' },
];

test.describe('Simon Willison Templates', () => {
  for (const { name, file } of CASES) {
    test(name, async ({ extensionContext, extensionId }) => {
      const clip = await runHarClip(extensionContext, extensionId, {
        harPath: `${file}.har`,
        templatePath: 'simon-willison-clipper.json',
      });
      // The note name is the page title, so it matches the fixture's basename.
      assertNote(clip, `${file}.md`, `Clippings/${file.split('/')[1]}.md`);
    });
  }
});
