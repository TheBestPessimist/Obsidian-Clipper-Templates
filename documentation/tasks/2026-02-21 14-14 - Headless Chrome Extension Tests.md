---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Playwright]]"
  - "[[Chrome Extension Headless Mode]]"
  - "[[Running Tests]]"
  - "[[2026-02-21 18-20 - Simplify Playwright Fixtures and Move Headless to Config]]"
---

User requested tests to run "in the background" without opening a browser window each time.

**Problem:** [[Playwright]] tests were opening a visible browser window for every test run because Chrome extensions traditionally don't work in headless mode.

**What worked:**
Simply set `headless: true` in the [[Playwright]] launch options. Modern Playwright/Chromium supports extensions in headless mode directly.

**What we tried first:** Adding `--headless=new` Chrome arg, which also worked. But the simpler `headless: true` is sufficient with current Playwright versions.

**Verified:** All 4 tests passed in ~36 seconds without opening a visible window.

**Later improvement:** The headless flag was moved to `playwright.config.ts` for easier access. See [[2026-02-21 18-20 - Simplify Playwright Fixtures and Move Headless to Config]] and [[Chrome Extension Headless Mode]].
