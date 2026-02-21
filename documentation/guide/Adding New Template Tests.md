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

**Create the expected output** — Clip the page with your template normally, copy the output from the clipper preview, and save it to `src/resources/<category>/<expected-name>.md`. Dates use a fixed mock date (`2026-02-20`) — see [[patterns/Date Mocking via Playwright Route Interception]]. Make sure the file ends with exactly one newline.

**Write the test** — Use the `runHarTest()` helper in `src/test-playwright/tests/`:

```typescript
import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test('should clip page correctly', async ({ extensionContext, extensionId }) => {
  const actual = await runHarTest(extensionContext, extensionId, {
    harPath: 'category/example.har',
    templatePath: 'example-clipper.json',
  });

  const expected = readExpected('category/Expected Output.md');
  expectEqualsIgnoringNewlines(actual, expected);
});
```

**Run** — `npm test` from project root.

Always use the real URL that matches how the page was originally clipped. See [[guide/Playwright Tests With HAR Files]] for details.

**For quick filter iteration** — If you just want to test filter expressions without full templates, see [[patterns/Filter Testing Pattern]].
