/**
 * E2E tests for Bandcamp templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarClip, assertNote } from '../fixtures';

test.describe('Bandcamp Templates', () => {
  test('Byron Discography', async ({ extensionContext, extensionId }) => {
    const clip = await runHarClip(extensionContext, extensionId, {
      harPath: 'bandcamp/byron.bandcamp.com.har',
      templatePath: 'bandcamp-discography-as-tasks-clipper.json',
    });
    // The template's path is '', so the note lands at the vault root.
    assertNote(clip, 'bandcamp/byron - Discography.md', 'byron - Discography.md');
  });
});
