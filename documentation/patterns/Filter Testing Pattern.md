---
created: 2026-02-21
related:
  - "[[patterns]]"
  - "[[Clipper Template Test Harness]]"
  - "[[Reusable HAR Test Helper]]"
  - "[[Playwright]]"
---

Test individual Clipper filter expressions without creating full template JSON files.

**Use case:** Iterating on a complex filter like `{% for i in selector:span.ipc-chip__text %}...{% endfor %}` without editing template files.

**API:**

```typescript
import { test, runFilterTestsAndAssert } from '../fixtures';

test('my filters', async ({ extensionContext, extensionId }) => {
  await runFilterTestsAndAssert(extensionContext, extensionId, {
    harPath: 'imdb/Shogun 1980.har',
    filters: [
      { filter: `{{schema:@TVSeries:name}}`, expected: `Shogun` },
      { filter: `{{schema:actor[*].name|slice:0,3|join:", "}}`, expected: `Richard Chamberlain, Toshirô Mifune, Yôko Shimada` },
    ],
  });
});
```

**How it works:**
1. Creates minimal templates on-the-fly (filter becomes `noteContentFormat`)
2. Imports all templates in one settings page session
3. Navigates to page once, opens clipper once
4. Switches between templates, downloads each result
5. Extracts body content (strips frontmatter)
6. Compares against expected values

**Efficiency:** Testing 3 filters takes ~18s vs ~33s if run separately (page loads once instead of three times).

**Filter tests live in:** `src/test-playwright/tests/filters.spec.ts`

**Related functions:**
- `runFilterTest()` - single filter, returns body string
- `runFilterTests()` - multiple filters, returns `FilterTestResult[]` for custom assertions
- `runFilterTestsAndAssert()` - multiple filters with automatic assertion

