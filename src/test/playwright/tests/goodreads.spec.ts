/**
 * E2E tests for Goodreads templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import type { Page } from '@playwright/test';
import { test, runHarClip, assertNote } from '../fixtures';

/** The ISBN/ASIN and friends only exist once the details panel is expanded. Kindle editions have ASIN only. */
const openBookDetails = async (page: Page) => {
  await page.getByRole('button', { name: 'Book details and editions' }).click();
  await page.locator('.DescListItem').filter({ hasText: /ISBN|ASIN/ }).first().waitFor();
};

const CASES = [
  {
    name: 'Ghost in the Cogs',
    file: 'goodreads/Ghost in the Cogs Steam-Powered Ghost Stories',
    vaultPath: 'Books/Ghost in the Cogs: Steam-Powered Ghost Stories - Scott Gable.md',
  },
  {
    name: 'Insula copacilor disparuti',
    file: 'goodreads/Insula copacilor dispăruţi - Elif Shafak',
    vaultPath: 'Books/Insula copacilor dispăruţi - Elif Shafak.md',
  },
  {
    name: 'Dead Star (series volume 1)',
    file: 'goodreads/Dead Star (The Triple Stars, Volume 1) - Simon Kewin',
    vaultPath: 'Books/Dead Star (The Triple Stars, Volume 1) - Simon Kewin.md',
  },
  {
    name: 'Home World (series volume 0)',
    file: 'goodreads/Home World (The Triple Stars, Volume 0) - Simon Kewin',
    vaultPath: 'Books/Home World (The Triple Stars, Volume 0) - Simon Kewin.md',
  },
];

test.describe('Goodreads Templates', () => {
  for (const { name, file, vaultPath } of CASES) {
    test(name, async ({ extensionContext, extensionId }) => {
      const clip = await runHarClip(extensionContext, extensionId, {
        harPath: `${file}.har`,
        templatePath: 'goodreads-clipper.json',
        preparePage: openBookDetails,
      });
      assertNote(clip, `${file}.md`, vaultPath);
    });
  }
});
