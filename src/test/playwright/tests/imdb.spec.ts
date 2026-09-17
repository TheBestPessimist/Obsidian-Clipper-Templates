/**
 * E2E tests for IMDB templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import { test, runHarClip, assertNote } from '../fixtures';

const CASES = [
    { name: 'Another Earth', har: 'Another Earth.har', expected: 'Another Earth.md', vaultPath: 'Film/Another Earth (2011).md' },
    { name: 'Ponyo', har: 'Ponyo.har', expected: 'Ponyo.md', vaultPath: 'Film/Gake no ue no Ponyo (2009).md' },
    { name: 'Kokuhô', har: 'kokuho.har', expected: 'Kokuhô.md', vaultPath: 'Film/Kokuhô (2025).md' },
    { name: 'Andromeda', har: 'Andromeda.har', expected: 'Andromeda.md', vaultPath: 'Film/Andromeda (2000).md' },
    { name: 'Shogun 1980', har: 'Shogun 1980.har', expected: 'Shogun 1980.md', vaultPath: 'Film/Shogun (1980).md' },
    { name: 'Brooklyn Nine-Nine', har: 'Brooklyn Nine-Nine.har', expected: 'Brooklyn Nine-Nine.md', vaultPath: 'Film/Brooklyn Nine-Nine (2013).md' },
];

test.describe('IMDB Templates', () => {
    for (const { name, har, expected, vaultPath } of CASES) {
        test(name, async ({ extensionContext, extensionId }) => {
            const clip = await runHarClip(extensionContext, extensionId, {
                harPath: `imdb/${har}`,
                templatePath: 'imdb-clipper.json',
            });
            assertNote(clip, `imdb/${expected}`, vaultPath);
        });
    }
});
