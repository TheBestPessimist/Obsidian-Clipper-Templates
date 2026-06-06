import type { FullConfig } from '@playwright/test';
import { seedProfile } from './fixtures';

/**
 * Runs once per `npm test`, before any worker starts.
 *
 * Performs the REAL click-through property-type + template import into a single
 * clean seed profile (see seedProfile in fixtures.ts). Every worker then
 * launches from a copy of that profile, so the slow import happens once per run
 * instead of once per worker — while still exercising the actual extension
 * import UI, and re-importing fresh on every run so template/formula changes are
 * always picked up. The workflow is identical whether you run 1 test or 50.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const projectUse = config.projects[0]?.use as { headless?: boolean } | undefined;
  await seedProfile(projectUse?.headless ?? true);
}
