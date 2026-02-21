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
Added `--headless=new` to the Chrome args in `fixtures.ts`. This uses Chrome's new headless mode which has full feature parity with headed Chrome, including extension support.

```typescript
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  args: [
    '--headless=new',
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`,
    '--unsafely-allow-clipboard-read-write',
  ],
  ...
});
```

**Why it works:**
- Chrome's old headless mode was a separate implementation that didn't support extensions
- Chrome's new headless mode (`--headless=new`) is the full browser running without a visible window

**What we tested:** Initially added both `headless: false` and `--headless=new`, but testing confirmed that just `--headless=new` is sufficient — the Chrome arg overrides Playwright's default behavior.

**Verified:** All 4 tests passed in ~36 seconds without opening a visible window.
