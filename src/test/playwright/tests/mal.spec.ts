/**
 * E2E tests for MAL (MyAnimeList) templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import {test, runHarTest, readExpected, expectEqualsIgnoringNewlines} from '../fixtures';

test.describe('MAL Templates', () => {
    test('Shangri-La', async ({extensionContext, extensionId}) => {
        const actual = await runHarTest(extensionContext, extensionId, {
            harPath: 'mal/Shangri-la.har',
            templatePath: 'mal-myanimelist-clipper.json',
        });
        const expected = readExpected('mal/Shangri-La —  (2009).md');
        expectEqualsIgnoringNewlines(actual, expected);
    });
});

