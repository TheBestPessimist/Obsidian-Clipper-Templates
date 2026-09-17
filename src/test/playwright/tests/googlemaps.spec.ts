/**
 * E2E tests for Google Maps templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarClip, assertNote } from '../fixtures';

test.describe('Google Maps Templates', () => {
    test('Waterfall Of The Good Travel Mountains', async ({ extensionContext, extensionId }) => {
        const clip = await runHarClip(extensionContext, extensionId, {
            harPath: 'googlemaps/google maps - waterfall of the good travel mountains - portugal.har',
            templatePath: 'google-maps-clipper.json',
        });
        assertNote(
            clip,
            'googlemaps/Waterfall Of The Good Travel Mountains - Cascata de Quiaios.md',
            'Places/Waterfall Of The Good Travel Mountains - Cascata de Quiaios — Quiaios.md',
        );
    });
});
