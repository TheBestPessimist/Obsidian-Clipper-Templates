---
created: 2026-02-21
related:
  - "[[patterns]]"
  - "[[Playwright]]"
  - "[[Running Tests]]"
---

Chrome's old headless mode didn't support extensions. Chrome's new headless mode (`--headless=new`) does.

To run [[Playwright]] tests with Chrome extensions in headless mode, add `--headless=new` to the args:

```typescript
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  args: [
    '--headless=new', // Chrome's new headless mode (supports extensions)
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`,
  ],
});
```

The `--headless=new` Chrome arg runs the browser completely in the background with no visible window, while still loading and executing extensions normally. No need to set `headless: false` in Playwright options — the Chrome arg is sufficient.
