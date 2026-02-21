---
created: 2026-02-21
related:
  - "[[gotchas]]"
  - "[[Obsidian Clipper]]"
  - "[[Two Test Execution Strategies]]"
  - "[[Clipper Source Code Key Files]]"
---

The [[Obsidian Clipper]] extension uses `chrome.tabs.query({active: true, currentWindow: true})` to determine which tab to clip. This is in `background.ts` line ~250:

```typescript
if (typedRequest.action === "getActiveTab") {
  browser.tabs.query({active: true, currentWindow: true}).then(async (tabs) => {
    // clips from whatever tab is "active"
  });
}
```

This means when running parallel tests in multiple tabs:
- All clipper iframes query for the "active" tab simultaneously
- Whichever tab happens to be active at that moment is what gets clipped
- Multiple tests receive the same content (cross-pollination)

**Workarounds:**

1. **Sequential execution** — Only one tab is active at a time. Slower but reliable.

2. **Multi-worker** — Each [[Playwright]] worker has its own browser, so each browser has its own "active tab". Tests run in parallel across workers without conflict.

3. **Hybrid approach** — Parallelize page loading (the slow network part), then run clipper operations sequentially.

**Cannot fix without extension changes:** True parallelism within a single browser would require modifying the extension to pass a specific tab ID rather than querying for the active tab. This would be a significant change to the Clipper architecture.

