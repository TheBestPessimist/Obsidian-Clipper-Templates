---
created: 2026-02-20
related:
  - "[[patterns]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[patterns/Single Assertion Against Expected File]]"
---

Use `runHarTest()` to run a complete HAR-based Playwright test with minimal boilerplate:

```typescript
import { test, runHarTest, getExpectedMarkdown, expectEqualsIgnoringNewlines } from '../fixtures';

test('should clip page correctly', async ({ context, extensionId }) => {
  const actual = await runHarTest(context, extensionId, {
    harPath: 'category/example.har',
    templatePath: 'example-clipper.json',
    expectedPath: 'category/Example Page.md',
    url: 'https://www.example.com/page',
  });

  const expected = getExpectedMarkdown('category/Example Page.md', 'https://www.example.com/page');
  expectEqualsIgnoringNewlines(actual, expected);
});
```

The helper handles:
- Loading and importing the template via UI
- Setting up HAR routing (no URL filter — see [[gotchas/HAR URL Pattern Must Include All Domains]])
- Navigating to the URL
- Triggering embedded clipper mode
- Clicking "Copy to clipboard"
- Reading clipboard content
- Closing the page

All paths are relative to `src/resources/` (HAR and expected) or `src/resources/templates/` (template JSON).

`getExpectedMarkdown()` replaces `{{TEST_URL}}` and `{{DATE}}` placeholders automatically.
