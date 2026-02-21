---
created: 2026-02-21
related:
  - "[[decisions]]"
  - "[[Playwright]]"
  - "[[Clipper Active Tab Query Prevents True Parallelism]]"
  - "[[Running Tests]]"
  - "[[Playwright Worker Fixtures]]"
  - "[[2026-02-21 15-52 - Parallel Test Execution Approaches]]"
---

After exploring multiple approaches to parallel test execution (see [[2026-02-21 15-52 - Parallel Test Execution Approaches]]), we settled on the **multi-worker approach**.

The test suite in `src/test-playwright/` uses:
- [[Playwright]] config with multiple workers (tests distributed automatically)
- Each worker spawns its own browser with the extension loaded
- Templates loaded once per worker via [[Playwright Worker Fixtures|worker-scoped fixtures]]
- Each test is a separate test case (allows distribution across workers)
- Downloads go to per-worker directories (using `workerInfo.workerIndex`) to avoid conflicts

This approach is necessary because [[Obsidian Clipper]] uses `chrome.tabs.query({active: true})` to determine which tab to clip. True parallelism within a single browser would cause cross-pollination. See [[Clipper Active Tab Query Prevents True Parallelism]].

The fixtures use two worker-scoped fixtures: `extensionContext` (browser with extension) and `extensionId` (extracted after service worker loads). Tests destructure these directly: `test('...', async ({ extensionContext, extensionId }) => { ... })`.

Previously, a "hybrid" approach existed that loaded pages in parallel but ran clipper operations sequentially. This was removed in favor of the simpler multi-worker approach which provides better test isolation and comparable speed.
