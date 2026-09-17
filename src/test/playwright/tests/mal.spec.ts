/**
 * E2E tests for MAL (MyAnimeList) templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarClip, assertNote } from '../fixtures';

test.describe('MAL Templates', () => {
    test('Shangri-La', async ({ extensionContext, extensionId }) => {
        const clip = await runHarClip(extensionContext, extensionId, {
            harPath: 'mal/Shangri-La.har',
            templatePath: 'mal-myanimelist-clipper.json',
        });
        // The doubled space is real: the template's middle {{selector:...}} (the
        // English title) is empty for this anime, leaving a dangling " - ".
        assertNote(clip, 'mal/Shangri-La.md', 'Shangri-La -  (2009)');
    });
});
