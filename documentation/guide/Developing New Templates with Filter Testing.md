---
created: 2026-02-21
related:
  - "[[guide]]"
  - "[[patterns/Filter Testing Pattern]]"
  - "[[Clipper Template Test Harness]]"
  - "[[Adding New Template Tests]]"
---

When creating a new template for a site, use [[patterns/Filter Testing Pattern|filter testing]] to try multiple approaches simultaneously.

**The workflow:**

1. Record a HAR file for the page you want to clip
2. Add a test with multiple filter variations targeting the same data:

```typescript
test('trying genre selectors', async ({ extensionContext, extensionId }) => {
  await runFilterTestsAndAssert(extensionContext, extensionId, {
    harPath: 'mysite/example-page.har',
    filters: [
      // Approach 1: CSS selector
      { filter: `{{selector:.genre-list span}}`, expected: `???` },
      // Approach 2: Schema.org data
      { filter: `{{schema:genre}}`, expected: `???` },
      // Approach 3: Meta tags
      { filter: `{{meta:keywords}}`, expected: `???` },
      // Approach 4: Different CSS path
      { filter: `{{selectorHtml:.sidebar .tags|split:","|wikilink}}`, expected: `???` },
    ],
  });
});
```

3. Run the test — it will fail but show you what each filter actually returns
4. Compare the outputs, pick the best approach
5. Update `expected` values for the filters you want to keep
6. Copy the winning filter to your actual template

**Why this helps:** Instead of editing a template JSON, clipping, checking output, editing again — you see all approaches at once. One test run (~18 seconds) shows you 4+ different filter results.

This is especially useful when a site has multiple ways to get the same data (CSS selectors vs schema vs meta tags) and you want to find the most reliable one.

