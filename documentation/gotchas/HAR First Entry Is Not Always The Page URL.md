---
created: 2026-02-21
related:
  - "[[gotchas]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[patterns/Reusable HAR Test Helper]]"
---

When extracting the URL from a HAR file, don't assume the first entry is the page URL. HAR entries are ordered by network activity timing, not by request initiation.

**The first entry is often:**
- API calls like `https://www.imdb.com/api/_ajax/metrics/ops/`
- Tracking pixels like `https://unagi.amazon.com/1/events/...`
- Analytics endpoints like `https://fls-na.amazon.com/1/batch/...`

**To find the actual page URL:**
Find the first entry with `response.content.mimeType` containing `text/html`:

```typescript
const htmlEntry = entries.find((entry) => {
  const mimeType = entry.response?.content?.mimeType || '';
  return mimeType.includes('text/html');
});
```

This is implemented in `extractUrlFromHar()` in `fixtures.ts`.

