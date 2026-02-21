---
created: 2026-02-20
related:
  - "[[patterns]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[patterns/Single Assertion Against Expected File]]"
  - "[[patterns/Date Mocking via Playwright Route Interception]]"
  - "[[gotchas/HAR First Entry Is Not Always The Page URL]]"
---

Use `runHarTest()` to run a complete HAR-based Playwright test with minimal boilerplate:

```typescript
import { test, runHarTest, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test('should clip page correctly', async ({ context, extensionId }) => {
  const actual = await runHarTest(context, extensionId, {
    harPath: 'category/example.har',
    templatePath: 'example-clipper.json',
  });

  const expected = readExpected('category/Example Page.md');
  expectEqualsIgnoringNewlines(actual, expected);
});
```

The URL is automatically extracted from the HAR file (first HTML document request). If the HAR file contains the wrong content, you can override it:

```typescript
const actual = await runHarTest(context, extensionId, {
  harPath: 'category/example.har',
  templatePath: 'example-clipper.json',
  url: 'https://www.example.com/different-page',  // optional override
});
```

The helper handles:
- Templates are pre-loaded at startup (no per-test import)
- Setting up HAR routing (no URL filter — see [[gotchas/HAR URL Pattern Must Include All Domains]])
- Navigating to the URL
- Triggering embedded clipper mode
- Selecting the template from the dropdown
- Clicking "Save file..." to download the clipped content
- Reading the downloaded file content
- Closing the page

Uses downloads instead of clipboard for parallel-safe execution. See [[Clipper Active Tab Query Prevents True Parallelism]] for why clipboard doesn't work with parallel tests.

All paths are relative to `src/resources/` (HAR and expected) or `src/resources/templates/` (template JSON).

Expected files use real URLs and real dates (matching `MOCK_DATE` which is `2026-02-20`). No placeholders needed — see [[patterns/Date Mocking via Playwright Route Interception]].
