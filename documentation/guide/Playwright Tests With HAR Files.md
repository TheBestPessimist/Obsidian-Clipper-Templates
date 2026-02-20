---
created: 2026-02-20
related:
  - "[[guide]]"
  - "[[Clipper Template Test Harness]]"
  - "[[guide/Adding New Template Tests]]"
  - "[[gotchas/HAR Files May Not Capture Dynamic Content]]"
  - "[[patterns/HAR Routing vs HTML Fixtures]]"
  - "[[patterns/Reusable HAR Test Helper]]"
---

Playwright tests can use HAR files instead of static HTML fixtures. This replays actual network responses recorded from the browser.

**Record a HAR file** — In Chrome DevTools, open Network tab, browse the page, then right-click and "Save all as HAR with content". Save to `test resources/<domain>.har`.

**Create the test** — Use the `runHarTest()` helper from `fixtures.ts`:

```typescript
import { test, runHarTest, getExpectedMarkdown, expectEqualsIgnoringNewlines } from '../fixtures';

test('should clip page correctly', async ({ context, extensionId }) => {
  const actual = await runHarTest(context, extensionId, {
    harPath: 'www.example.com.har',
    templatePath: 'example-clipper.json',
    expectedPath: 'Example Page.md',
    url: 'https://www.example.com/page',
  });

  const expected = getExpectedMarkdown('Example Page.md', 'https://www.example.com/page');
  expectEqualsIgnoringNewlines(actual, expected);
});
```

See [[patterns/Reusable HAR Test Helper]] for details on what the helper does.

**Create expected output** — The expected markdown file uses placeholders for dynamic values:
- `{{TEST_URL}}` — replaced with the actual URL at test time
- `{{DATE}}` — replaced with today's date

**When to use HAR vs HTML fixtures:**
- Use HAR when you need authenticated/personalized content
- Use HAR when the page makes many requests that affect content
- Use HTML fixtures when the page is simple and static
- See [[patterns/HAR Routing vs HTML Fixtures]]

**Gotchas:**
- If API data isn't appearing, check that you're not filtering by URL pattern. See [[gotchas/HAR URL Pattern Must Include All Domains]].
- If data shows as "loading", the HAR may have been recorded too early. See [[gotchas/HAR Files May Not Capture Dynamic Content]].
