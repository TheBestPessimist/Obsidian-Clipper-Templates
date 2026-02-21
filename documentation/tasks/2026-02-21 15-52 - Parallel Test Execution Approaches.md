---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Playwright]]"
  - "[[Clipper Active Tab Query Prevents True Parallelism]]"
  - "[[Two Test Execution Strategies]]"
  - "[[Running Tests]]"
---

User wanted tests to run in parallel to speed up execution. The vision was: single browser, templates preloaded once, multiple tabs running tests simultaneously.

**What we tried and did NOT work:**

1. **Parallel tabs with clipboard** — Clipboard is a shared resource. Multiple tabs writing to clipboard simultaneously causes tests to read each other's data.

2. **Parallel tabs with downloads** — Switched to "Save file" feature instead of clipboard. Downloaded files have unique names based on template formula. However, all tests were getting the same content (cross-pollination).

3. **Root cause discovered:** The [[Obsidian Clipper]] uses `chrome.tabs.query({active: true, currentWindow: true})` in background.ts to determine which tab to clip. When multiple tabs exist, the clipper always clips from whichever tab happens to be "active" at that moment. See [[Clipper Active Tab Query Prevents True Parallelism]].

4. **Separate windows instead of tabs** — Tried using `window.open()` to create separate browser windows. Got `net::ERR_ABORTED` errors for some pages. HAR routing didn't work reliably with windows created via JavaScript.

5. **Mutex for critical section** — Added a mutex to serialize the clipper activation phase. Still had race conditions because the clipper's async initialization couldn't be reliably serialized.

**What worked:**

**Option A: Multi-worker** (`src/test-playwright-multiworker/`)
- Each [[Playwright]] worker gets its own browser instance
- Templates loaded once per worker (worker-scoped fixtures)
- Tests distributed across workers automatically
- No active-tab conflict because each browser has its own active tab
- Config: `workers: 4` (Playwright uses up to this many, but may use fewer based on test count/CPU)

**Option B: Hybrid** (`src/test-playwright/`)
- Single browser instance (`workers: 1`)
- Phase 1: Load all pages in parallel (network I/O parallelized)
- Phase 2: Run clipper operations sequentially (one tab active at a time)
- Avoids active-tab race condition while still parallelizing the slow part

**Performance comparison (4 tests):**
- Multi-worker: 27.7s
- Hybrid: 30.9s

Both pass all tests. Multi-worker is slightly faster and provides better test isolation. Hybrid uses less memory (single browser).

**What I liked:**
- Discovering the root cause via reading background.ts source code
- Clean separation of concerns with Phase 1/Phase 2 in hybrid approach
- Both approaches now exist side-by-side for comparison

**What I disliked:**
- Had to try many approaches before finding what works
- Multi-worker loads templates multiple times (once per worker)
- Can't truly parallelize within a single browser due to Clipper's architecture

**Key learning:** The Clipper's use of `chrome.tabs.query({active: true})` is fundamental to its design. True parallelism within a single browser would require modifying the extension to accept a tab ID parameter instead of querying for the active tab.
