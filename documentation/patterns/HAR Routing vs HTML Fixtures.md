---
created: 2026-02-20
related:
  - "[[patterns]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[guide/Adding New Template Tests]]"
---

Two approaches for providing page content in Playwright tests:

**HTML Fixtures** (existing approach)
- Save complete HTML via browser "Save As"
- Serve via local HTTP server in test
- Simple, predictable, easy to inspect
- Does not replay AJAX/fetch requests
- Good for: static pages, simple clipping scenarios

**HAR Routing** (new approach)
- Record all network traffic via DevTools
- Playwright replays responses via `page.routeFromHAR()`
- Captures the full browsing session including API calls
- Can include authenticated responses if recorded while logged in
- Good for: pages with dynamic content, authenticated sessions, testing realistic network conditions

**Key differences in test code:**

HTML fixture:
```typescript
const fixtureUrl = `${fixtureServer.url}/path/to/page.html`;
await page.goto(fixtureUrl);
```

HAR routing:
```typescript
await page.routeFromHAR(HAR_PATH, {
  url: '**/domain.com/**',
  notFound: 'fallback',
});
await page.goto('https://domain.com/actual/page');
```

HAR uses the real URL (important for URL-based template matching) while HTML fixtures use a local server URL that may need adjustment in expected output.

