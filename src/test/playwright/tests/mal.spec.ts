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
        // No English title for this anime, so the template's {% if %} guard drops
        // the " - " separator entirely rather than leaving it dangling.
        assertNote(clip, 'mal/Shangri-La.md', 'Anime/Shangri-La (2009).md');
    });
});
