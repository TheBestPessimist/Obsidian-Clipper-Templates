---
created: 2026-02-20
related:
  - "[[tasks]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[patterns/Reusable HAR Test Helper]]"
  - "[[Playwright HAR Test for IMDB Movies]]"
---

Added a second HAR test for "Another Earth" using `imdb - Another Earth.har` and extracted common HAR test logic into reusable helpers.

**Goal:** Make HAR tests as simple as:
```typescript
const actual = await runHarTest(context, extensionId, config);
const expected = getExpectedMarkdown(path, url);
expectEqualsIgnoringNewlines(actual, expected);
```

**What worked:**
- Extracted `runHarTest()`, `getExpectedMarkdown()`, and `expectEqualsIgnoringNewlines()` to `fixtures.ts`
- Created `HarTestConfig` interface with `harPath`, `templatePath`, `expectedPath`, `url`
- All paths are relative to `test resources/` — no need for `path.join()` boilerplate in tests
- Refactored existing test and added new test — both pass

**Files changed:**
- `src/test-playwright/fixtures.ts` — added helper functions
- `src/test-playwright/tests/imdb-har.spec.ts` — refactored to use helpers, added second test

**Result:** Test file reduced from 112 lines to 47 lines. Adding a new HAR test is now ~10 lines of code.

