/**
 * E2E tests for Goodreads templates using HAR files.
 * Each test runs in a separate Playwright worker.
 */

import type { Page } from '@playwright/test';
import { test, runHarClip, assertNote } from '../fixtures';

/** The ISBN and friends only exist once the details panel is expanded. */
const openBookDetails = async (page: Page) => {
  await page.getByRole('button', { name: 'Book details and editions' }).click();
  await page.locator('.DescListItem').filter({ hasText: 'ISBN' }).waitFor();
};

const CASES = [
  {
    name: 'Ghost in the Cogs',
    file: 'goodreads/Ghost in the Cogs Steam-Powered Ghost Stories',
    noteName: 'Ghost in the Cogs_ Steam-Powered Ghost Stories - [[Scott Gable]]',
  },
  {
    name: 'Insula copacilor disparuti',
    file: 'goodreads/Insula copacilor dispăruţi - Elif Shafak',
    noteName: 'Insula copacilor dispăruţi - [[Elif Shafak]]',
  },
];

test.describe('Goodreads Templates', () => {
  for (const { name, file, noteName } of CASES) {
    test(name, async ({ extensionContext, extensionId }) => {
      const clip = await runHarClip(extensionContext, extensionId, {
        harPath: `${file}.har`,
        templatePath: 'goodreads-clipper.json',
        preparePage: openBookDetails,
      });
      assertNote(clip, `${file}.md`, noteName);
    });
  }
});
