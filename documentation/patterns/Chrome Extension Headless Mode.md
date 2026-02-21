---
created: 2026-02-21
related:
  - "[[patterns]]"
  - "[[Playwright]]"
  - "[[Running Tests]]"
  - "[[Playwright Worker Fixtures]]"
---

Modern [[Playwright]] with Chromium supports extensions in headless mode directly.

The `HEADLESS` flag lives at the top of `playwright.config.ts`:
```typescript
const HEADLESS = true;

export default defineConfig({
  use: {
    headless: HEADLESS,
  },
});
```

Set `HEADLESS = false` when you need to see what's happening in the browser for debugging.

Fixtures read this via `workerInfo.project.use.headless`. See [[Playwright Worker Fixtures]].
