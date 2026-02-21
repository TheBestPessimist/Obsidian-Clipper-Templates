---
created: 2026-02-21
related:
  - "[[gotchas]]"
  - "[[Playwright]]"
  - "[[Playwright Worker Fixtures]]"
---

[[Playwright]] has several built-in fixtures including `page`, `context`, `browser`, and `request`. These are registered at test scope.

When creating custom worker-scoped fixtures, you **cannot** use these names:

```typescript
// This will FAIL:
export const test = base.extend<{}, { context: BrowserContext }>({
  context: [async ({}, use) => { ... }, { scope: 'worker' }],
});
// Error: Fixture "context" has already been registered as a { scope: 'test' } fixture
```

Worker fixtures cannot shadow test-scoped built-in fixtures. The inverse is also problematic: a test fixture depending on a worker fixture of the same name causes confusion.

**Solution:** Use unique names for custom fixtures:
- `extensionContext` instead of `context`
- `browserInstance` instead of `browser`

This also improves readability by making it clear these are custom fixtures for extension testing.

