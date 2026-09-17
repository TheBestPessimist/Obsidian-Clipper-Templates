/**
 * E2E tests for IMDB templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarClip, assertNote } from '../fixtures';

const CASES = [
    { name: 'Another Earth', har: 'Another Earth.har', expected: 'Another Earth.md', noteName: 'Another Earth (2011)' },
    { name: 'Ponyo', har: 'Ponyo.har', expected: 'Ponyo.md', noteName: 'Gake no ue no Ponyo (2009)' },
    { name: 'Kokuhô', har: 'kokuho.har', expected: 'Kokuhô.md', noteName: 'Kokuhô (2025)' },
    { name: 'Andromeda', har: 'Andromeda.har', expected: 'Andromeda.md', noteName: 'Andromeda (2000)' },
    { name: 'Shogun 1980', har: 'Shogun 1980.har', expected: 'Shogun 1980.md', noteName: 'Shogun (1980)' },
    { name: 'Brooklyn Nine-Nine', har: 'Brooklyn Nine-Nine.har', expected: 'Brooklyn Nine-Nine.md', noteName: 'Brooklyn Nine-Nine (2013)' },
];

test.describe('IMDB Templates', () => {
    for (const { name, har, expected, noteName } of CASES) {
        test(name, async ({ extensionContext, extensionId }) => {
            const clip = await runHarClip(extensionContext, extensionId, {
                harPath: `imdb/${har}`,
                templatePath: 'imdb-clipper.json',
            });
            assertNote(clip, `imdb/${expected}`, noteName);
        });
    }
});
