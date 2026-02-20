---
created: 2026-02-20
related:
  - "[[guide]]"
  - "[[Clipper Template Test Harness]]"
  - "[[guide/Adding New Template Tests]]"
  - "[[gotchas/HAR Files May Not Capture Dynamic Content]]"
  - "[[patterns/HAR Routing vs HTML Fixtures]]"
---

Playwright tests can use HAR files instead of static HTML fixtures. This replays actual network responses recorded from the browser.

**Record a HAR file** — In Chrome DevTools, open Network tab, browse the page, then right-click and "Save all as HAR with content". Save to `test resources/<domain>.har`.

**Create the test** — Use `page.routeFromHAR()` to intercept network requests:

```typescript
import { test, expect, readExpected, normalizeMarkdown, readTemplateJson, importTemplateViaUI } from '../fixtures';
import path from 'path';

const HAR_PATH = path.join(__dirname, '../../../test resources/www.example.com.har');

test('should clip page correctly', async ({ context, extensionId }) => {
  const templateJson = readTemplateJson('my-template-clipper.json');
  await importTemplateViaUI(context, extensionId, templateJson);

  const page = await context.newPage();

  // Route ALL requests from HAR - no URL filter!
  // This ensures API calls to subdomains are also replayed
  await page.routeFromHAR(HAR_PATH, {
    notFound: 'fallback',
  });

  await page.goto('https://www.example.com/page');
  // ... rest of test same as HTML fixture tests
});
```

See [[gotchas/HAR URL Pattern Must Include All Domains]] for why the URL filter should be omitted.

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
