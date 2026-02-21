---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Playwright]]"
  - "[[Chrome Extension Headless Mode]]"
  - "[[Running Tests]]"
---

User requested tests to run "in the background" without opening a browser window each time.

**Problem:** [[Playwright]] tests were opening a visible browser window for every test run because Chrome extensions traditionally don't work in headless mode.

**What worked:**
Simply set `headless: true` in the [[Playwright]] launch options. Modern Playwright/Chromium supports extensions in headless mode directly.

```typescript
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true, // set to 'false' for visual debugging
  args: [
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`,
  ],
});
```

**What we tried first:** Adding `--headless=new` Chrome arg, which also worked. But the simpler `headless: true` is sufficient with current Playwright versions.

**Verified:** All 4 tests passed in ~36 seconds without opening a visible window.
