---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Playwright]]"
  - "[[Playwright Worker Fixtures]]"
  - "[[Playwright Built-in Fixture Names]]"
  - "[[Chrome Extension Headless Mode]]"
  - "[[Multi-worker Test Execution Strategy]]"
---

User requested two improvements:
1. Move the `headless` flag from fixtures.ts to playwright.config.ts for easier access
2. Simplify the overly complex fixtures

**What worked - Moving headless to config:**

Added a `HEADLESS` constant at the top of `playwright.config.ts` and set it in `use`:

```typescript
const HEADLESS = true;

export default defineConfig({
  use: {
    headless: HEADLESS,
    trace: 'on-first-retry',
  },
});
```

Fixtures read it via `workerInfo.project.use.headless`:

```typescript
extensionContext: [async ({}, use, workerInfo) => {
  const headless = workerInfo.project.use.headless ?? true;
  const context = await chromium.launchPersistentContext('', {
    headless,
    // ...
  });
}, { scope: 'worker' }],
```

**What worked - Simplifying fixtures:**

Before: Four fixtures with indirection pattern:
- `sharedContext` (worker-scoped) → `context` (test-scoped wrapper)
- `sharedExtensionId` (worker-scoped) → `extensionId` (test-scoped wrapper)
- Manual `workerId` counter
- Global `templatesLoaded` flag

After: Two fixtures, direct usage:
- `extensionContext` (worker-scoped)
- `extensionId` (worker-scoped)

Simplifications applied:
1. Removed wrapper fixtures - tests now use worker-scoped fixtures directly
2. Replaced manual `workerId++` counter with `workerInfo.workerIndex`
3. Removed `templatesLoaded` global - [[Playwright]] worker fixtures only run once per worker anyway

**What did NOT work - naming fixture "context":**

Initially tried to rename `sharedContext` to just `context`. [[Playwright]] threw:
```
Fixture "context" has already been registered as a { scope: 'test' } fixture
```

[[Playwright]] has a [[Playwright Built-in Fixture Names|built-in "context" fixture]] at test scope. Worker fixtures cannot shadow test-scoped built-ins. See [[Playwright Built-in Fixture Names]].

**Solution:** Named the fixture `extensionContext` instead. This is actually more descriptive anyway.

**Tests:** All 4 tests passed after changes.

**User feedback:** User questioned whether the file still needs ~200 lines. The date mocking code (22 lines) could be removed if tests don't need fixed dates. The `normalizeMarkdown`/`expectEqualsIgnoringNewlines` helpers could be simplified if strict whitespace comparison isn't needed.

