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

    test('Psycho-Pass: Sinners of the System Case.2 - First Guardian', async ({ extensionContext, extensionId }) => {
        const clip = await runHarClip(extensionContext, extensionId, {
            harPath: 'mal/Psycho-Pass Sinners of the System Case.2 - First Guardian.har',
            templatePath: 'mal-myanimelist-clipper.json',
        });
        // Defuddle's {{title}} treats " - First Guardian" as a site-name suffix and strips it, so the template reads og:title instead.
        assertNote(clip, 'mal/Psycho-Pass Sinners of the System Case.2 - First Guardian (2019).md', 'Anime/Psycho-Pass: Sinners of the System Case.2 - First Guardian (2019).md');
    });
});
