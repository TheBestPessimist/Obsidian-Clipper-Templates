---
created: 2026-02-21
related:
  - "[[gotchas]]"
  - "[[Playwright]]"
  - "[[patterns/Date Mocking via Playwright Route Interception]]"
---

[[Playwright]]'s `route.fetch()` does not support `chrome-extension://` protocol:

```typescript
await context.route('chrome-extension://**/*.js', async (route) => {
  const response = await route.fetch();  // FAILS
});
```

Error: `TypeError: route.fetch: Protocol "chrome-extension:" not supported. Expected "http:"`

**Workaround:** Read the extension files directly from disk using the known extension path:

```typescript
const filePath = path.join(EXTENSION_PATH, new URL(route.request().url()).pathname);
const body = fs.readFileSync(filePath, 'utf-8');
await route.fulfill({ contentType: 'application/javascript', body });
```

This works because the extension is loaded from a known directory (`EXTENSION_PATH`), so we can map the URL pathname to the actual file on disk.

