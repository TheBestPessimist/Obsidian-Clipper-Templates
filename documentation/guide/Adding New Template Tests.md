---
created: 2026-02-20
related:
  - "[[guide]]"
  - "[[Clipper Template Test Harness]]"
  - "[[patterns/Single Assertion Against Expected File]]"
  - "[[gotchas/Date Must Be Fixed for Reproducible Tests]]"
  - "[[gotchas/URL Affects Domain and Link Resolution]]"
  - "[[gotchas/Expected Files Must End With One Newline]]"
  - "[[patterns/Reusable HAR Test Helper]]"
  - "[[guide/Playwright Tests With HAR Files]]"
---

**Record a HAR file** — In Chrome DevTools, open Network tab, browse the page fully, then right-click and "Save all as HAR with content". Save to `src/resources/<category>/<domain>.har`. For example: `src/resources/imdb/imdb - Another Earth.har`.

**Export your template** — In [[Obsidian Clipper]] settings, export the template to `src/resources/templates/<name>-clipper.json`.

**Create the expected output** — Clip the page with your template normally, copy the output from the clipper preview, and save it to `src/resources/<category>/<expected-name>.md`. Use `{{TEST_URL}}` and `{{DATE}}` placeholders for dynamic values. Make sure the file ends with exactly one newline.

**Write the test** — Use the `runHarTest()` helper in `src/test-playwright/tests/`:

```typescript
import { test, runHarTest, getExpectedMarkdown, expectEqualsIgnoringNewlines } from '../fixtures';

test('should clip page correctly', async ({ context, extensionId }) => {
  const actual = await runHarTest(context, extensionId, {
    harPath: 'category/example.har',
    templatePath: 'example-clipper.json',
    expectedPath: 'category/Expected Output.md',
    url: 'https://original-url.com/page',
  });

  const expected = getExpectedMarkdown('category/Expected Output.md', 'https://original-url.com/page');
  expectEqualsIgnoringNewlines(actual, expected);
});
```

**Run** — `npm test` from project root.

Always use the real URL that matches how the page was originally clipped. See [[guide/Playwright Tests With HAR Files]] for details.
