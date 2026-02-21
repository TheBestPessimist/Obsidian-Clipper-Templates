---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Playwright]]"
  - "[[Clipper Active Tab Query Prevents True Parallelism]]"
  - "[[Multi-worker Test Execution Strategy]]"
  - "[[Running Tests]]"
---

User wanted tests to run in parallel to speed up execution. The vision was: single browser, templates preloaded once, multiple tabs running tests simultaneously.

**What we tried and did NOT work:**

1. **Parallel tabs with clipboard** — Clipboard is a shared resource. Multiple tabs writing to clipboard simultaneously causes tests to read each other's data.

2. **Parallel tabs with downloads** — Switched to "Save file" feature instead of clipboard. Downloaded files have unique names based on template formula. However, all tests were getting the same content (cross-pollination).

3. **Root cause discovered:** The [[Obsidian Clipper]] uses `chrome.tabs.query({active: true, currentWindow: true})` in background.ts to determine which tab to clip. When multiple tabs exist, the clipper always clips from whichever tab happens to be "active" at that moment. See [[Clipper Active Tab Query Prevents True Parallelism]].

4. **Separate windows instead of tabs** — Tried using `window.open()` to create separate browser windows. Got `net::ERR_ABORTED` errors for some pages. HAR routing didn't work reliably with windows created via JavaScript.

5. **Mutex for critical section** — Added a mutex to serialize the clipper activation phase. Still had race conditions because the clipper's async initialization couldn't be reliably serialized.

6. **Hybrid approach** — Single browser, parallel page loading (Phase 1), sequential clipper operations (Phase 2). Worked but was more complex and slightly slower than multi-worker.

**What worked best: Multi-worker approach**

Each [[Playwright]] worker gets its own browser instance with templates pre-loaded. Tests distributed across workers automatically. No active-tab conflict because each browser has its own active tab. This became the only test approach kept. See [[Multi-worker Test Execution Strategy]].

**What I liked:**
- Discovering the root cause via reading background.ts source code
- Multi-worker provides clean test isolation

**What I disliked:**
- Had to try many approaches before finding what works
- Multi-worker loads templates multiple times (once per worker)
- Can't truly parallelize within a single browser due to Clipper's architecture

**Key learning:** The Clipper's use of `chrome.tabs.query({active: true})` is fundamental to its design. True parallelism within a single browser would require modifying the extension to accept a tab ID parameter instead of querying for the active tab.
