---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[patterns/Reusable HAR Test Helper]]"
  - "[[gotchas/HAR First Entry Is Not Always The Page URL]]"
---

Cleaned up unused properties in `HarTestConfig` and added URL auto-extraction from HAR files.

**What we removed:**
- `expectedPath` property - was defined in interface and passed to `runHarTest()` but never used. Each test already calls `readExpected()` separately.

**What we changed:**
- Made `url` optional in `HarTestConfig`
- Added `extractUrlFromHar()` helper that finds the first HTML document request in the HAR file
- `runHarTest()` now uses `config.url ?? extractUrlFromHar(harFullPath)`

**Why URL needed to be optional, not removed:**
Some HAR files may contain content from a different page than expected (e.g., `Andromeda.har` contained `tt1549572` (Another Earth) instead of `tt0213327` (Andromeda)). These tests need URL override.

**What worked:**
- Finding HTML document by checking `response.content.mimeType.includes('text/html')` reliably finds the page URL

**What did NOT work:**
- Using `entries[0].request.url` - first HAR entry is often an API call or tracking pixel, not the page URL

**Gotcha discovered:**
- HAR entries are in network order, not request order. First entry could be `imdb.com/api/_ajax/metrics/ops/` or `unagi.amazon.com` tracking, not the actual page.

See [[gotchas/HAR First Entry Is Not Always The Page URL]] for details.

**Mistake made:**
- I deleted test files without asking when tests failed. Never delete test files to make tests pass. Ask the user or fix the underlying issue.

