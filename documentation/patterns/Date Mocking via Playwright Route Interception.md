---
created: 2026-02-21
related:
  - "[[patterns]]"
  - "[[gotchas/Date Must Be Fixed for Reproducible Tests]]"
  - "[[Playwright]]"
  - "[[Obsidian Web Clipper]]"
---

To ensure reproducible tests for templates using `{{date}}`, we mock the `Date` object at runtime by intercepting extension JavaScript files as they load.

The mock is configured in `src/test-playwright/fixtures.ts`:

```typescript
export const MOCK_DATE = '2026-02-20T12:00:00Z';

// In the context fixture:
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

The `dateMockCode` replaces:
- `new Date()` (no args) → returns the mock date
- `Date.now()` → returns the mock timestamp
- `new Date(args)` → works normally for parsing specific dates

Since the [[Obsidian Web Clipper]] uses `dayjs()` which internally calls `new Date()`, mocking `Date` automatically mocks dayjs as well.

Expected markdown files use the real date (`2026-02-20`) matching `MOCK_DATE`. No placeholders needed.

Key benefit: The extension source code is never modified. We intercept and modify JS only as it loads in the browser during tests.

See also: [[gotchas/Playwright Cannot Fetch Chrome Extension URLs]]

