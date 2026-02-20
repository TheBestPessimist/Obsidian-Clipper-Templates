---
created: 2026-02-20
related:
  - "[[tasks]]"
  - "[[guide/Running Tests]]"
  - "[[Project Structure]]"
  - "[[Root package.json for Monorepo-style Projects]]"
---

Reorganized test resources from `test resources/` to `src/resources/` and added root `package.json` to enable running `npm test` from project root.

**Context:** User deleted some tests and moved test resources. Paths in test code were broken. Running tests required `cd src/test-playwright && npm test` which is inconvenient.

**What worked:**

1. Updated `TEST_RESOURCES_PATH` in `fixtures.ts` from `../../test resources` to `../resources`
2. Updated all test file paths to include category prefix (e.g., `imdb/Another Earth (2011).md` instead of just `Another Earth (2011).md`)
3. Created root `package.json` that delegates to `src/test-playwright`:
```json
{
  "scripts": {
    "test": "npm test --prefix src/test-playwright"
  }
}
```
4. Converted the series test from HTML fixture approach to HAR approach (HTML file no longer exists)

**HAR file naming gotcha:**
The tests referenced `2www.imdb.com.har` which didn't exist. The actual file was `imdb - Another Earth.har`. Always verify HAR file names match what tests reference.

**Consolidating duplicate tests:**
Two tests referenced the same HAR content (HAR 1 and HAR 2 with slightly different file names). Consolidated to one test using the actual file that exists.

**Files changed:**
- `src/test-playwright/fixtures.ts` — updated resource path
- `src/test-playwright/tests/imdb-har.spec.ts` — fixed HAR and expected paths
- `src/test-playwright/tests/imdb.spec.ts` — converted from HTML fixture to HAR approach
- `package.json` (new) — root package.json for npm test delegation

**Documentation updated:**
- [[guide/Running Tests]] — updated to show both root and subdirectory commands
- [[guide/Adding New Template Tests]] — updated paths and test pattern
- [[guide/Playwright Tests With HAR Files]] — updated resource paths

**Result:** `npm test` from root now works. Both tests pass (2 passed, 21.6s).

