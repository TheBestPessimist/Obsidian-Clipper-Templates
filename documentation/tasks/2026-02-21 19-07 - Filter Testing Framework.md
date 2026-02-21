---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Clipper Template Test Harness]]"
  - "[[Filter Testing Pattern]]"
  - "[[Playwright]]"
---

**Goal:** Make it easier to test individual Clipper filter expressions without creating full template files.

**What we built:**
- `runFilterTest()` - test a single filter against a HAR file
- `runFilterTests()` - test multiple filters, returns results for custom assertions
- `runFilterTestsAndAssert()` - test multiple filters with automatic assertion

**What worked:**
- Creating minimal templates on-the-fly with just the filter as `noteContentFormat`
- Importing multiple templates in one settings page session (efficiency)
- Switching between templates in the clipper iframe without reloading the page
- Extracting body content by finding the frontmatter closing `---`

**Key efficiency insight:** Loading the page once and switching templates is ~3x faster than running each filter as a separate test. Three filters in ~18s vs ~11s each.

**Files changed:**
- `src/test-playwright/fixtures.ts` - Added filter testing functions
- `src/test-playwright/tests/filters.spec.ts` - New file for filter tests

**Example usage:**
```typescript
await runFilterTestsAndAssert(extensionContext, extensionId, {
  harPath: 'imdb/Shogun 1980.har',
  filters: [
    {
      filter: `{{schema:@TVSeries:name}}`,
      expected: `Shogun`,
    },
    {
      filter: `{{schema:actor[*].name|slice:0,3|join:", "}}`,
      expected: `Richard Chamberlain, Toshirô Mifune, Yôko Shimada`,
    },
  ],
});
```

**Design decision:** Removed optional `name` field from `FilterTestCase` - the filter itself (first 60 chars) is shown in error messages, which is sufficient.

