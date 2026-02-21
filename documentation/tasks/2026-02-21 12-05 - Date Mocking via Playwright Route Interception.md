---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[patterns/Date Mocking via Playwright Route Interception]]"
  - "[[gotchas/Date Must Be Fixed for Reproducible Tests]]"
  - "[[patterns/Reusable HAR Test Helper]]"
  - "[[Obsidian Web Clipper]]"
  - "[[Playwright]]"
---

Tests using templates with `{{date}}` were failing because the expected files had hardcoded dates from yesterday (`2026-02-20`) but the clipper produced today's date (`2026-02-21`).

Goal: Mock the `Date` object at runtime so the extension always produces a fixed date, without modifying the extension source code at all.

**What we tried that did NOT work:**

Using `route.fetch()` to intercept and modify extension JS files:
```typescript
await context.route('chrome-extension://**/*.js', async (route) => {
  const response = await route.fetch();  // ERROR HERE
  const body = await response.text();
  // inject mock code...
});
```
This failed with: `TypeError: route.fetch: Protocol "chrome-extension:" not supported. Expected "http:"`

[[Playwright]] cannot fetch `chrome-extension://` URLs via the standard `route.fetch()` mechanism.

**What we tried that DID work:**

Reading the extension JS files directly from disk instead of fetching them:
```typescript
await context.route('chrome-extension://**/*.js', async (route) => {
  const url = route.request().url();
  const urlPath = new URL(url).pathname;
  const filePath = path.join(EXTENSION_PATH, urlPath);
  
  const originalBody = fs.readFileSync(filePath, 'utf-8');
  const modifiedBody = dateMockCode + originalBody;
  
  await route.fulfill({
    contentType: 'application/javascript',
    body: modifiedBody,
  });
});
```

Since we know the extension path on disk (`EXTENSION_PATH`), we can read the original JS file and prepend the Date mocking code before fulfilling the route.

The Date mock code replaces `new Date()` (no args) and `Date.now()` to return a fixed timestamp, while preserving `new Date(args)` for parsing specific dates.

**Cleanup performed:**

After implementing Date mocking, we removed the placeholder system entirely:
- Removed `getExpectedMarkdown()` function from fixtures
- Expected files now use real dates (`2026-02-20`) and real URLs
- Tests use `readExpected()` directly
- No more `{{DATE}}` or `{{TEST_URL}}` placeholders

**Things I liked:**
- The solution doesn't modify the extension source code at all
- Expected files look exactly like real clipper output - no placeholders
- The Date mock is injected at runtime, so we test the actual extension logic
- Standard testing practice (mocking external dependencies like system time)

**Things I disliked:**
- We ARE injecting code into the extension at runtime, so it's not 100% "unmodified"
- However, we only mock the Date object - all extension logic runs as designed

**Key insight:**
The extension uses `dayjs()` which internally calls `new Date()`. By mocking `Date`, we automatically mock dayjs as well.

**Relevant files:**
- `src/test-playwright/fixtures.ts` — contains `MOCK_DATE` constant and Date mocking via route interception
- `src/resources/` — expected files now use real dates (`2026-02-20`) matching `MOCK_DATE`

